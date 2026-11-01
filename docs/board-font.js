/* Feishu Quiet Theme — local display-only font adapter for Canvas 2D whiteboards.
 * Does not access document models, make requests, change text, or patch measureText.
 * Must execute in the page's MAIN world; reload the page after enabling/disabling.
 */
(() => {
  'use strict';
  if (!/^\/(?:docx|wiki)\//.test(location.pathname)) return;
  if (typeof CanvasRenderingContext2D === 'undefined') return;

  const KEY = Symbol.for('feishu.quiet.board-font.v1');
  if (window[KEY]) return;
  document.documentElement?.setAttribute('data-lqt-board-adapter', 'installed');
  const FAMILY = '"Cascadia Code", "PingFang SC", sans-serif';
  const SELECTOR = '.whiteboard-root-container .whiteboad-x-content-canvas canvas';
  const installations = [];
  const painted = new WeakSet();
  const owners = new WeakMap();
  let markedDocument = false;
  let enabled = true;

  function isBoardContext(ctx) {
    const canvas = ctx.canvas;
    if (canvas instanceof HTMLCanvasElement) {
      if (canvas.matches(SELECTOR)) return true;
      if (canvas.isConnected) return false;
    }
    if (owners.has(ctx)) return owners.get(ctx);
    // Whiteboard caches text in detached/offscreen canvases before compositing.
    // Classify the caller once per context; unrelated charts remain untouched.
    const stack = new Error().stack || '';
    const owned = /\/lark\/whiteboard\//i.test(stack)
      && !/exportToImage|exportToNodesImg|createEmojiCache/i.test(stack);
    owners.set(ctx, owned);
    return owned;
  }

  function adapt(original, native) {
    return function (text, x, y, maxWidth) {
      const canvas = this.canvas;
      if (!enabled || !isBoardContext(this)
          || typeof text !== 'string' || !text || /[\uE000-\uF8FF]/u.test(text)
          || typeof x !== 'number' || typeof y !== 'number'
          || !Number.isFinite(x) || !Number.isFinite(y)) {
        return Reflect.apply(original, this, arguments);
      }
      const oldFont = this.font;
      const prefix = /^(.*?\b\d+(?:\.\d+)?px)\s+(.+)$/i.exec(oldFont);
      if (!prefix) return Reflect.apply(original, this, arguments);
      // Lark appends emoji/symbol fallbacks to ALL text fonts. Only the primary
      // family identifies an icon run; checking the whole list skips every word.
      const primaryFamily = prefix[2].split(',')[0].replace(/["']/g, '').trim();
      if (/icon|emoji|symbol/i.test(primaryFamily)) return Reflect.apply(original, this, arguments);
      const originalWidth = native.measureText.call(this, text).width;
      if (!(originalWidth > 0) || !Number.isFinite(originalWidth)) {
        return Reflect.apply(original, this, arguments);
      }

      native.save.call(this);
      try {
        this.font = `${prefix[1]} ${FAMILY}`;
        const replacementWidth = native.measureText.call(this, text).width;
        if (!(replacementWidth > 0) || !Number.isFinite(replacementWidth)) {
          this.font = oldFont;
          return Reflect.apply(original, this, arguments);
        }
        const ratio = originalWidth / replacementWidth;
        native.translate.call(this, x, y);
        native.scale.call(this, ratio, 1);
        const args = [text, 0, 0];
        if (arguments.length > 3) {
          args.push(typeof maxWidth === 'number' ? maxWidth / ratio : maxWidth);
        }
        const result = Reflect.apply(original, this, args);
        // One non-visual marker per actual canvas; never record document text.
        if (canvas instanceof HTMLCanvasElement && !painted.has(canvas)) {
          painted.add(canvas);
          canvas.setAttribute('data-lqt-board-font', 'Cascadia Code');
        }
        if (!markedDocument && document.documentElement) {
          markedDocument = true;
          document.documentElement.setAttribute('data-lqt-board-adapter', 'installed');
          document.documentElement.setAttribute('data-lqt-board-font', 'Cascadia Code');
          document.documentElement.setAttribute('data-lqt-board-original-font', oldFont);
          document.documentElement.setAttribute('data-lqt-board-rendered-font', this.font);
        }
        return result;
      } finally {
        native.restore.call(this);
      }
    };
  }

  const prototypes = [CanvasRenderingContext2D.prototype];
  if (typeof OffscreenCanvasRenderingContext2D !== 'undefined') {
    prototypes.push(OffscreenCanvasRenderingContext2D.prototype);
  }
  for (const proto of prototypes) {
    const native = {};
    for (const name of ['fillText', 'strokeText', 'measureText', 'save', 'restore', 'translate', 'scale']) {
      native[name] = proto[name];
    }
    for (const name of ['fillText', 'strokeText']) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, name);
      const wrapper = adapt(native[name], native);
      Object.defineProperty(proto, name, { ...descriptor, value: wrapper });
      installations.push({ proto, name, descriptor, wrapper });
    }
  }
  Object.defineProperty(window, KEY, {
    configurable: true,
    value: {
      family: FAMILY,
      restore() {
        enabled = false;
        for (const { proto, name, descriptor, wrapper } of installations) {
          if (proto[name] === wrapper) Object.defineProperty(proto, name, descriptor);
        }
        document.querySelectorAll('[data-lqt-board-font]').forEach(c => c.removeAttribute('data-lqt-board-font'));
        document.documentElement?.removeAttribute('data-lqt-board-original-font');
        document.documentElement?.removeAttribute('data-lqt-board-rendered-font');
        document.documentElement?.removeAttribute('data-lqt-board-adapter');
        delete window[KEY];
      },
    },
  });
})();
