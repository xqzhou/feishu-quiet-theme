const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const attrs = new Map();
const root = { setAttribute: (k, v) => attrs.set(k, v), removeAttribute: k => attrs.delete(k) };
class Canvas {
  constructor(board = true) { this.board = board; this.isConnected = true; this.attrs = new Map(); }
  matches() { return this.board; }
  setAttribute(k, v) { this.attrs.set(k, v); }
  removeAttribute(k) { this.attrs.delete(k); }
}
class Context {
  constructor(canvas = new Canvas()) {
    this.canvas = canvas;
    this.font = '600 14px LarkHackSafariFont, LarkEmojiFont, "Segoe UI Symbol"';
    this.transform = [1, 1, 0, 0];
    this.stack = [];
    this.draws = [];
  }
  measureText() { return { width: this.font.includes('Cascadia Code') ? 40 : 20 }; }
  save() { this.stack.push({ font: this.font, transform: [...this.transform] }); }
  restore() { Object.assign(this, this.stack.pop()); }
  translate(x, y) { this.transform[2] += x; this.transform[3] += y; }
  scale(x, y) { this.transform[0] *= x; this.transform[1] *= y; }
  fillText(...args) {
    if (this.fail) throw Error('native draw error');
    this.draws.push({ args, font: this.font, transform: [...this.transform], method: 'fill' });
  }
  strokeText(...args) {
    this.draws.push({ args, font: this.font, transform: [...this.transform], method: 'stroke' });
  }
}
const originalFill = Context.prototype.fillText;
const originalMeasure = Context.prototype.measureText;
const win = {};
vm.runInNewContext(fs.readFileSync(__dirname + '/grid-font.js', 'utf8'), {
  location: { pathname: '/wiki/example' }, window: win, document: {
    documentElement: root, querySelectorAll: () => [],
  }, HTMLCanvasElement: Canvas, CanvasRenderingContext2D: Context,
});

// Regression: emoji/symbol FALLBACKS must not prevent ordinary grid text mapping.
const ctx = new Context();
const oldFont = ctx.font;
ctx.fillText('iiii', 31, 41, 10);
assert.equal(ctx.draws.length, 1);
assert.match(ctx.draws[0].font, /^600 14px "Cascadia Code"/);
assert.deepEqual(ctx.draws[0].args, ['iiii', 0, 0, 20]);
assert.deepEqual(ctx.draws[0].transform, [0.5, 1, 31, 41]);
assert.equal(ctx.font, oldFont);
assert.deepEqual(ctx.transform, [1, 1, 0, 0]);
assert.equal(Context.prototype.measureText, originalMeasure);
assert.equal(attrs.get('data-lqb-grid-font'), 'Cascadia Code');

// Native stroke, non-grid charts and actual icon runs preserve their behavior.
ctx.strokeText('iiii', 4, 5);
assert.equal(ctx.draws[1].method, 'stroke');
const chart = new Context(new Canvas(false));
chart.fillText('chart', 4, 5);
assert.equal(chart.draws[0].font, oldFont);
assert.deepEqual(chart.draws[0].args, ['chart', 4, 5]);
const icon = new Context();
icon.font = '14px LarkEmojiFont, Inter';
icon.fillText('icon', 4, 5);
assert.equal(icon.draws[0].font, icon.font);
const privateUse = new Context();
privateUse.fillText('\uE000', 4, 5);
assert.equal(privateUse.draws[0].font, oldFont);

// Failed native drawing must not leak font or transformation into the next draw.
ctx.fail = true;
assert.throws(() => ctx.fillText('iiii', 31, 41), /native draw error/);
assert.equal(ctx.font, oldFont);
assert.deepEqual(ctx.transform, [1, 1, 0, 0]);
assert.equal(ctx.stack.length, 0);
win[Symbol.for('feishu.quiet.base-font.v1')].restore();
assert.equal(Context.prototype.fillText, originalFill);
assert.equal(attrs.has('data-lqb-grid-adapter'), false);
console.log('Base grid font: regression, geometry, scope, state restoration and rollback passed.');
