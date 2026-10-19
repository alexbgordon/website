/*
 * Runs the expected-form tests against the engine. Shared by Node and the pages.
 * A test marked `pending` records a value the doc still has but a newer decision contradicts;
 * if the engine disagrees with it, it is reported as waiting on the author, not as a failure.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.LundeRunner = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function run(L, tests, lexicon) {
    var cache = {};
    var irregularRoots = {};
    ((lexicon && lexicon.verbs) || []).forEach(function (v) { if (v.irregular) { irregularRoots[v.samon] = v.root; } });
    function conj(base) {
      if (!cache[base]) {
        var irr = irregularRoots[base] && lexicon.irregular ? lexicon.irregular[irregularRoots[base]] : null;
        cache[base] = irr ? L.conjugate(base, irr) : L.conjugate(base);
      }
      return cache[base];
    }
    function caseRow(word, id, oblique) {
      var d = L.decline(word, oblique ? { oblique: oblique } : {});
      return d.cases.filter(function (c) { return c.id === id; })[0];
    }
    var results = [];
    tests.forEach(function (t) {
      var got, want, ok, label;
      try {
        if (t.kind === 'finite') {
          got = conj(t.base).finite[t.form][t.tense].map(function (r) { return r.form; });
          want = t.expect;
          label = t.base + ' · ' + t.form + ' ' + t.tense;
        } else if (t.kind === 'one') {
          got = [conj(t.base).finite[t.form][t.tense][t.person].form];
          want = [t.expect];
          label = t.base + ' · ' + t.form + ' ' + t.tense + ' ' + L.PERSONS[t.person];
        } else if (t.kind === 'imon') {
          got = [conj(t.base).finite[t.form][t.tense][t.person].imon.form];
          want = [t.expect];
          label = t.base + ' · īmon ' + t.form + ' ' + t.tense + ' ' + L.PERSONS[t.person];
        } else if (t.kind === 'imperative') {
          got = conj(t.base).imperative[t.form].map(function (r) { return r.form; });
          want = t.expect;
          label = t.base + ' · ' + t.form + ' imperative';
        } else if (t.kind === 'gerund') {
          var g = conj(t.base).gerund;
          got = [g.samon.form, g.namon.form, g.exmon.form];
          want = t.expect;
          label = t.base + ' · gerunds';
        } else if (t.kind === 'dictionary') {
          got = [conj(t.base).dictionary.form];
          want = [t.expect];
          label = t.base + ' · dictionary form';
        } else if (t.kind === 'derived') {
          var d = conj(t.base).derivations.filter(function (x) { return x.label === t.label; })[0];
          got = [d && d.form ? d.form : '(none)'];
          want = [t.expect];
          label = t.base + ' · ' + t.label;
        } else if (t.kind === 'decline') {
          var dec = L.decline(t.word, t.oblique ? { oblique: t.oblique } : {});
          got = dec.cases.map(function (c) { return c[t.num].form; });
          want = t.expect;
          label = t.word + ' · ' + L.NUMBER_NAMES[t.num] + ', all cases';
        } else if (t.kind === 'case') {
          got = [caseRow(t.word, t.caseId, t.oblique)[t.num].form];
          want = [t.expect];
          label = t.word + ' · ' + t.caseId + ' ' + (t.num === 'sg' ? 'singular' : L.NUMBER_NAMES[t.num]);
        } else if (t.kind === 'pronoun') {
          var row = L.pronounTable().filter(function (r) { return r.person === t.person; })[0];
          got = ['S', 'O', 'ALL', 'GEN', 'ABL', 'COM', 'ABE'].map(function (id) { return row.cases[id].form; });
          want = t.expect;
          label = 'pronoun ' + t.person + ' (' + row.bare + ')';
        } else if (t.kind === 'number') {
          got = [L.numberWord(t.n, { counting: !!t.counting }).form];
          want = [t.expect];
          label = (t.counting ? 'counting ' : 'number ') + t.n;
        } else if (t.kind === 'ordinal') {
          got = [L.ordinal(t.n)];
          want = [t.expect];
          label = 'ordinal ' + t.n;
        } else if (t.kind === 'adverb') {
          got = [L.adverb(t.word).form];
          want = [t.expect];
          label = 'adverb from ' + t.word;
        } else if (t.kind === 'stress') {
          got = [String(L.stress(t.word, t.opts).primary)];
          want = [String(t.expect)];
          label = 'stress of ' + t.word;
        } else if (t.kind === 'ipa') {
          got = [L.toIPA(t.word, t.opts)];
          want = [t.expect];
          label = 'IPA of ' + t.word;
        } else {
          throw new Error('unknown test kind ' + t.kind);
        }
        ok = got.length === want.length && got.every(function (x, i) { return x === want[i]; });
      } catch (e) {
        ok = false; got = ['ERROR: ' + e.message]; want = [].concat(t.expect);
        label = (t.base || t.word || t.person || t.n) + ' · ' + t.kind;
      }
      var forms = Array.isArray(want) ? want.length : 1;
      var status = ok ? 'pass' : (t.pending ? 'pending' : 'fail');
      results.push({ ok: ok, status: status, label: label, got: got, want: want, src: t.src, forms: forms, pending: t.pending || null, kind: t.kind });
    });
    var count = function (s) { return results.filter(function (r) { return r.status === s; }).length; };
    var formsChecked = results.reduce(function (n, r) { return n + r.forms; }, 0);
    return { results: results, passed: count('pass'), failed: count('fail'), pending: count('pending'), total: results.length, forms: formsChecked };
  }

  return { run: run };
}));
