/* Feishu Quiet Base — local display-only font adapter for Canvas 2D Base grids, kanban and Gantt views.
 * Does not access document models, make requests, change text, or patch measureText.
 * Must execute in the page's MAIN world; reload the page after enabling/disabling.
 */
(() => {
  'use strict';
  if (!/^\/(?:base|wiki)\//.test(location.pathname)) return;
  if (typeof CanvasRenderingContext2D === 'undefined') return;

  const KEY = Symbol.for('feishu.quiet.base-font.v1');
  if (window[KEY]) return;
  document.documentElement?.setAttribute('data-lqb-grid-adapter', 'installed');
  const FAMILY = '"Cascadia Code", "PingFang SC", sans-serif';
  const SELECTOR = '.garr-container-bitable .faster-dom-wrapper > .faster-view canvas, body.suite-bitable > canvas[faster="1"]';
  const installations = [];
  const painted = new WeakSet();
  let markedDocument = false;
  let enabled = true;

  function isGridContext(ctx) {
    // Native view renderer and its tagged, body-mounted tile canvases.
    // Kanban paints text into these tiles before compositing into the viewport.
    // Untagged caches, detached/export canvases, dashboards and AI stay native.
    return ctx.canvas instanceof HTMLCanvasElement && ctx.canvas.matches(SELECTOR);
  }

  function adapt(original, native) {
    return function (text, x, y, maxWidth) {
      const canvas = this.canvas;
      if (!enabled || !isGridContext(this)
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
          canvas.setAttribute('data-lqb-grid-font', 'Cascadia Code');
        }
        if (!markedDocument && document.documentElement) {
          markedDocument = true;
          document.documentElement.setAttribute('data-lqb-grid-adapter', 'installed');
          document.documentElement.setAttribute('data-lqb-grid-font', 'Cascadia Code');
          document.documentElement.setAttribute('data-lqb-grid-original-font', oldFont);
          document.documentElement.setAttribute('data-lqb-grid-rendered-font', this.font);
        }
        return result;
      } finally {
        native.restore.call(this);
      }
    };
  }

  const prototypes = [CanvasRenderingContext2D.prototype];
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
        document.querySelectorAll('[data-lqb-grid-font]').forEach(c => c.removeAttribute('data-lqb-grid-font'));
        document.documentElement?.removeAttribute('data-lqb-grid-original-font');
        document.documentElement?.removeAttribute('data-lqb-grid-rendered-font');
        document.documentElement?.removeAttribute('data-lqb-grid-adapter');
        delete window[KEY];
      },
    },
  });
})();
