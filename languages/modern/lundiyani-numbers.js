/*
 * Lundiyani (Modern Lundian) numbers, v0.1.
 * Forms: Alex, Oct 18 2026 ("Rules are all the same; only difference is they have evolved in pronunciation").
 * Rules: the Lunde ones (base twelve; biggest power first; a multiplier is joined in front of its power;
 * a smaller number follows after a dash). The counting prefix é- is from the Lundiyani grammar;
 * the ordinal ending (number + -de / -ade) is assumed unchanged from Lunde.
 * Works in Node and in the browser (window.LundiyaniNumbers).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.LundiyaniNumbers = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var ZERO = 'ułe';
  var DIGITS = ['na', 're', 'ara', 'du', 'jai', 'jau', 'isa', 'wena', 'fisa', 'dion', 'fyu', 'sion'];
  var POWERS = [['ayation', 20736], ['galation', 1728], ['iyion', 144], ['sion', 12]];
  var NUMBER_MAX = 248831;   // 12^5 - 1, as in Lunde: the highest named power is ayation (12^4)
  var COUNTING = 'é-';
  // The Lunde forms, for the comparison table (from the Lunde engine's data).
  var OLD = { zero: 'hūł', digits: ['na', 'ra', 'hara', 'du', 'jayu', 'java', 'isa', 'gvena', 'fisa', 'dion', 'fiū', 'siōn'],
              powers: [['hayatiōn', 20736], ['galatiōn', 1728], ['iğiōn', 144], ['siōn', 12]] };
  // The Lundiyani grammar PDF (Oct 14), before Alex's Oct 18 forms.
  var PDF = { digits: ['na', 'ra', 'ara', 'du', 'jayu', 'java', 'isa', 'gvena', 'fisa', 'dion', 'fiú', 'sión'],
              powers: [['ayatión', 20736], ['galatión', 1728], ['igyión', 144], ['sión', 12]] };

  function isV(c) { return 'aeiouáéíóú'.indexOf(c) !== -1; }

  function numberWord(n, opts) {
    n = Number(n);
    if (!isFinite(n) || n !== Math.floor(n) || n < 0) { throw new Error('Give a whole number from 0 up.'); }
    if (n > NUMBER_MAX) { throw new Error('The highest named power is ayation (12⁴), so the largest number is 248,831.'); }
    if (n === 0) { return { value: 0, form: ZERO, parts: [{ word: ZERO, value: 0, digit: 0, power: null, unit: 1 }] }; }
    var parts = [], rem = n;
    POWERS.forEach(function (p) {
      var d = Math.floor(rem / p[1]);
      if (d > 0) {
        parts.push({ word: (d > 1 ? DIGITS[d - 1] : '') + p[0], value: d * p[1], digit: d, power: p[0], unit: p[1] });
        rem -= d * p[1];
      }
    });
    if (rem > 0) { parts.push({ word: DIGITS[rem - 1], value: rem, digit: rem, power: null, unit: 1 }); }
    var form = parts.map(function (x) { return x.word; }).join('-');
    if (opts && opts.counting && n >= 1 && n <= 12) { form = COUNTING + DIGITS[n - 1]; }
    return { value: n, form: form, parts: parts };
  }

  function ordinal(n) {
    var w = numberWord(n).form;
    return w + '-' + (isV(w.charAt(w.length - 1)) ? 'de' : 'ade');
  }

  // Self-checks. ALEX: the forms Alex gave. GRAM: the Lundiyani grammar's worked examples, in the new forms.
  // RULE: the Lunde worked examples (rasiōn, raiğiōn, galatiōn-raiğiōn-dion...) rebuilt with the modern digits.
  var ALEX = 'Alex, Oct 18', GRAM = 'Lundiyani grammar example, new forms', RULE = 'Lunde worked example, modern digits', ASSUMED = 'Lunde rule, assumed unchanged';
  var CHECKS = [[0, 'ułe', ALEX]].concat(
    DIGITS.map(function (d, i) { return [i + 1, d, ALEX]; }),
    [[144, 'iyion', ALEX], [1728, 'galation', ALEX], [20736, 'ayation', ALEX],
     [24, 'resion', GRAM], [13, 'sion-na', GRAM], [25, 'resion-na', GRAM],
     [36, 'arasion', RULE], [15, 'sion-ara', RULE], [50, 'dusion-re', RULE], [100, 'wenasion-du', RULE], [288, 'reiyion', RULE],
     [2026, 'galation-reiyion-dion', RULE], [145, 'iyion-na', RULE]]
  ).map(function (c) { return { kind: 'number', n: c[0], expect: c[1], src: c[2] }; }).concat(
    [[1, 'é-na', GRAM], [2, 'é-re', GRAM]].map(function (c) { return { kind: 'counting', n: c[0], expect: c[1], src: c[2] }; }),
    [[1, 'na-de', ASSUMED], [2, 're-de', ASSUMED], [12, 'sion-ade', ASSUMED]].map(function (c) { return { kind: 'ordinal', n: c[0], expect: c[1], src: c[2] }; })
  );

  function runChecks() {
    var res = CHECKS.map(function (c) {
      var got = c.kind === 'ordinal' ? ordinal(c.n) : numberWord(c.n, { counting: c.kind === 'counting' }).form;
      return { kind: c.kind, n: c.n, expected: c.expect, got: got, ok: got === c.expect, source: c.src };
    });
    return { results: res, passed: res.filter(function (r) { return r.ok; }).length, total: res.length };
  }

  return { version: '0.1', ZERO: ZERO, DIGITS: DIGITS, POWERS: POWERS, NUMBER_MAX: NUMBER_MAX, COUNTING: COUNTING, OLD: OLD, PDF: PDF,
           numberWord: numberWord, ordinal: ordinal, CHECKS: CHECKS, runChecks: runChecks };
}));
