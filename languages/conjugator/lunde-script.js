/*
 * Romanized Lunde drawn in the Lunde script. This is a font, not a translation:
 * the letters you type stay letters; a local font supplies the script shapes.
 * Nothing is requested from another machine.
 *
 * Font files, from the site root (a local worker drops the TTFs here):
 *   assets/fonts/Lunde-Draft.ttf          CSS family "Lunde Regular"
 *   assets/fonts/Lunde-Angular-Draft.ttf  CSS family "Lunde Angular"
 *
 * ng is written ŋ and ny is written ñ, including where a capital starts the pair.
 * à stays à. Combining marks are kept. Letters outside the alphabet stay on screen
 * and are named in a notice; they are not deleted.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.LundeScript = api; }
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var FONTS = {
    regular: { id: 'regular', family: 'Lunde Regular', file: 'assets/fonts/Lunde-Draft.ttf', label: 'Regular' },
    angular: { id: 'angular', family: 'Lunde Angular', file: 'assets/fonts/Lunde-Angular-Draft.ttf', label: 'Angular' }
  };

  /* a–z without q or w, plus the letters the grammar actually uses. */
  var LOWER = 'abcdefghijklmnoprstuvxyzäàāēīōūǟñŋłğ';
  var UPPER = 'ABCDEFGHIJKLMNOPRSTUVXYZÄÀĀĒĪŌŪǞÑŊŁĞ';
  var LETTERS = LOWER + UPPER;
  /* Space, line breaks, and the punctuation of the reference examples. */
  var PUNCT = ' \n\r\t.,;:!?\'"“”‘’()-–—/…';
  var EMPTY_TEXT = 'The script will appear here.';

  /* Attested in the lexicon notes and the grammar tables. Not translated here. */
  var SAMPLES = [
    { id: 'must', label: 'I must leave', text: 'Kim lai ajaloxam adrevuos.' },
    { id: 'red', label: 'It looks red to me', text: 'Nam kaxan kive ilis albadem.' },
    { id: 'sun', label: 'The sun', text: 'i-Rāmam' },
    { id: 'letters', label: 'Letters from the reference', text: 'hekanga ixahekanga, enya xayēñ kayà łasa labeğ.' }
  ];

  function normalize(s) {
    return String(s == null ? '' : s)
      .replace(/ng/gi, function (m) { return m.charAt(0) === 'N' ? 'Ŋ' : 'ŋ'; })
      .replace(/ny/gi, function (m) { return m.charAt(0) === 'N' ? 'Ñ' : 'ñ'; });
  }

  function isMark(cp) { return cp >= 0x0300 && cp <= 0x036F; }

  function isAllowed(cp) {
    if (isMark(cp)) { return true; }
    var ch = String.fromCodePoint(cp);
    return LETTERS.indexOf(ch) !== -1 || PUNCT.indexOf(ch) !== -1;
  }

  function hex(cp) {
    var h = cp.toString(16).toUpperCase();
    while (h.length < 4) { h = '0' + h; }
    return h;
  }

  /**
   * rendered: the spelling to draw (ng/ny rewritten, everything else kept).
   * unsupported: characters that are not Lunde letters, marks, or example punctuation.
   * empty: nothing to draw yet.
   */
  function inspect(s) {
    var rendered = normalize(s);
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
    return 'Not in the Lunde alphabet, and still shown: ' + bits.join(', ') + '.';
  }

  function fontStatus(fontId, state) {
    var font = FONTS[fontId] || FONTS.regular;
    if (state === 'ready') { return ''; }
    if (state === 'missing') {
      return font.label + ' is not on this machine yet (' + font.file + '). The preview stays in the reading face until then.';
    }
    return 'Loading ' + font.label + '.';
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

    function setFont(id) {
      if (!FONTS[id]) { return; }
      fontId = id;
      Array.prototype.forEach.call(fontBtns, function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-script-font') === id ? 'true' : 'false');
      });
      paint();
      watch(id);
    }

    function watch(id) {
      var font = FONTS[id];
      if (!root.document || !root.document.fonts || !root.document.fonts.load) {
        fontState[id] = 'missing';
        paint();
        return;
      }
      fontState[id] = 'loading';
      paint();
      root.document.fonts.load('32px "' + font.family + '"').then(function () {
        fontState[id] = root.document.fonts.check('32px "' + font.family + '"') ? 'ready' : 'missing';
        if (fontId === id) { paint(); }
      }).catch(function () {
        fontState[id] = 'missing';
        if (fontId === id) { paint(); }
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
        var id = btn.getAttribute('data-script-sample');
        var sample = null;
        for (var i = 0; i < SAMPLES.length; i++) { if (SAMPLES[i].id === id) { sample = SAMPLES[i]; } }
        if (!sample) { return; }
        input.value = sample.text;
        paint();
        input.focus();
      });
    });

    setFont('regular');
  }

  function boot() {
    var nodes = root.document.querySelectorAll('[data-lunde-script="preview"]');
    Array.prototype.forEach.call(nodes, mount);
  }

  if (typeof root.document !== 'undefined') {
    if (root.document.readyState === 'loading') { root.document.addEventListener('DOMContentLoaded', boot); }
    else { boot(); }
  }

  return {
    FONTS: FONTS,
    SAMPLES: SAMPLES,
    EMPTY_TEXT: EMPTY_TEXT,
    normalize: normalize,
    inspect: inspect,
    notice: notice,
    fontStatus: fontStatus,
    mount: mount
  };
}));
