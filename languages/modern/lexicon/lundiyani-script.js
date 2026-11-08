/*
 * Romanized Lundiyani drawn in the Lundiyani script. A font, not a translation.
 * Nothing is requested from another machine.
 * This is not the Lunde alphabet: ng and ny are not rewritten, and xl is not ł.
 *
 * Font files, from the site root:
 *   assets/fonts/Lundiyani-Modern-Draft.ttf    family "Lundiyani Regular"
 *   assets/fonts/Lundiyani-Angular-Draft.ttf   family "Lundiyani Angular"
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.LundiyaniScript = api; }
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var FONTS = {
    regular: { id: 'regular', family: 'Lundiyani Regular', file: 'assets/fonts/Lundiyani-Modern-Draft.ttf', label: 'Regular' },
    angular: { id: 'angular', family: 'Lundiyani Angular', file: 'assets/fonts/Lundiyani-Angular-Draft.ttf', label: 'Angular' }
  };

  /* a b c d e f i j k l ł m n o p r s t u v w x y z. No g, h, or q. */
  var LOWER = 'abcdefijklmnoprstuvwxyzł';
  var UPPER = 'ABCDEFIJKLMNOPRSTUVWXYZŁ';
  var LETTERS = LOWER + UPPER;
  var PUNCT = ' \n\r\t.,;:!?\'"“”‘’()-–—/…';
  var EMPTY_TEXT = 'The script will appear here.';

  var SAMPLES = [
    { id: 'sleep', label: 'I wasn’t sleeping', text: 'i lan lo lai valia' },
    { id: 'and', label: 'My cat and your dog', text: 'ide kora ad ode kiwuru' },
    { id: 'has', label: 'This tall person has two dogs', text: 'ta nei kawe on re kiwuri' },
    { id: 'words', label: 'Words from the lexicon', text: 'kaxli ułe ara eneu' }
  ];

  function renderText(s) {
    return String(s == null ? '' : s);
  }

  function isMark(cp) { return cp >= 0x0300 && cp <= 0x036F; }

  function isAllowed(cp) {
    if (isMark(cp)) { return true; }
    var ch = String.fromCodePoint(cp);
    if (PUNCT.indexOf(ch) !== -1) { return true; }
    var base = ch.normalize('NFD').charAt(0);
    var lower = base.toLowerCase();
    return LETTERS.indexOf(base) !== -1 || LETTERS.indexOf(lower) !== -1;
  }

  function hex(cp) {
    var h = cp.toString(16).toUpperCase();
    while (h.length < 4) { h = '0' + h; }
    return h;
  }

  function inspect(s) {
    var rendered = renderText(s);
    var unsupported = [];
    var seen = {};
    var i = 0;
    while (i < rendered.length) {
      var cp = rendered.codePointAt(i);
      var ch = String.fromCodePoint(cp);
      i += cp > 0xFFFF ? 2 : 1;
      if (isAllowed(cp) || seen[cp]) { continue; }
      seen[cp] = true;
      unsupported.push({ char: ch, cp: cp, hex: hex(cp) });
    }
    return { rendered: rendered, unsupported: unsupported, empty: rendered.trim() === '' };
  }

  function notice(list) {
    if (!list || !list.length) { return ''; }
    var bits = list.map(function (u) { return u.char + ' (U+' + u.hex + ')'; });
    return 'Not in the Lundiyani alphabet, and still shown: ' + bits.join(', ') + '.';
  }

  function fontStatus(fontId, state) {
    var font = FONTS[fontId] || FONTS.regular;
    if (state === 'ready') { return ''; }
    if (state === 'missing') {
      return font.label + ' is not on this machine yet (' + font.file + '). The preview stays in the reading face until then.';
    }
    return 'Loading ' + font.label + '.';
  }

  function stateAfterLoad(settled) {
    if (!settled || !settled.done) { return 'loading'; }
    return settled.ok ? 'ready' : 'missing';
  }

  function mount(section) {
    var input = section.querySelector('[data-script-input]');
    var preview = section.querySelector('[data-script-preview]');
    var noticeEl = section.querySelector('[data-script-notice]');
    var statusEl = section.querySelector('[data-script-status]');
    var clearBtn = section.querySelector('[data-script-clear]');
    var fontBtns = section.querySelectorAll('[data-script-font]');
    var sampleBtns = section.querySelectorAll('[data-script-sample]');
    var fontId = 'regular';
    var fontState = { regular: 'loading', angular: 'loading' };
    var watched = {};

    function paint() {
      var view = inspect(input.value);
      preview.setAttribute('data-font', fontId);
      if (view.empty) {
        preview.textContent = EMPTY_TEXT;
        preview.classList.add('is-empty');
      } else {
        preview.textContent = view.rendered;
        preview.classList.remove('is-empty');
      }
      var note = notice(view.unsupported);
      noticeEl.textContent = note;
      noticeEl.hidden = !note;
      if (statusEl) { statusEl.textContent = fontStatus(fontId, fontState[fontId]); }
    }

    function applyResult(id, settled) {
      fontState[id] = stateAfterLoad(settled);
      if (fontId === id) { paint(); }
    }

    function watch(id) {
      if (watched[id]) { return; }
      var font = FONTS[id];
      fontState[id] = 'loading';
      paint();
      if (!root.document || typeof root.FontFace !== 'function') { return; }
      watched[id] = true;
      var face;
      try {
        face = new root.FontFace(font.family, 'url("' + section.getAttribute('data-font-base') + font.file + '")');
      } catch (err) {
        applyResult(id, { done: true, ok: false });
        return;
      }
      face.load().then(function (loaded) {
        if (root.document.fonts && root.document.fonts.add) { root.document.fonts.add(loaded); }
        applyResult(id, { done: true, ok: !loaded || loaded.status !== 'error' });
      }).catch(function () {
        applyResult(id, { done: true, ok: false });
      });
    }

    input.addEventListener('input', paint);
    clearBtn.addEventListener('click', function () {
      input.value = '';
      paint();
      input.focus();
    });
    Array.prototype.forEach.call(fontBtns, function (btn) {
      btn.addEventListener('click', function () { setFont(btn.getAttribute('data-script-font')); });
    });
    Array.prototype.forEach.call(sampleBtns, function (btn) {
      btn.addEventListener('click', function () {
        var sid = btn.getAttribute('data-script-sample');
        var sample = null;
        for (var i = 0; i < SAMPLES.length; i++) { if (SAMPLES[i].id === sid) { sample = SAMPLES[i]; } }
        if (!sample) { return; }
        input.value = sample.text;
        paint();
        input.focus();
      });
    });

    function setFont(id) {
      if (!FONTS[id]) { return; }
      fontId = id;
      Array.prototype.forEach.call(fontBtns, function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-script-font') === id ? 'true' : 'false');
      });
      paint();
      watch(id);
    }

    setFont('regular');
  }

  function boot() {
    var nodes = root.document.querySelectorAll('[data-lundiyani-script="preview"]');
    Array.prototype.forEach.call(nodes, mount);
  }

  if (typeof root.document !== 'undefined') {
    if (root.document.readyState === 'loading') { root.document.addEventListener('DOMContentLoaded', boot); }
    else { boot(); }
  }

  return {
    FONTS: FONTS,
    SAMPLES: SAMPLES,
    LETTERS: LETTERS,
    EMPTY_TEXT: EMPTY_TEXT,
    renderText: renderText,
    inspect: inspect,
    notice: notice,
    fontStatus: fontStatus,
    stateAfterLoad: stateAfterLoad,
    mount: mount
  };
}));
