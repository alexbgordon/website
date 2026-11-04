/*
 * Lunde verb conjugator: page logic.
 * Needs window.Lunde, window.LundeUI, window.LundeTests, window.LundeRunner and window.LUNDE_LEXICON.
 */
(function () {
  'use strict';

  var L = window.Lunde;
  var UI = window.LundeUI;
  var LEX = window.LUNDE_LEXICON;
  var VERBS = LEX.verbs;
  var KNOWN = LEX.knownDerived || {};
  var IRREG = LEX.irregular || {};
  var FORMS = L.FORMS, TENSES = L.TENSES, PERSONS = L.PERSONS, PRON = L.PRONOUNS;
  var WIDE = window.matchMedia('(min-width: 1180px)');
  var CALM = window.matchMedia('(prefers-reduced-motion: reduce)');
  var esc = UI.esc, norm = UI.norm, plural = UI.plural, GLYPH = UI.GLYPH;

  function $(id) { return document.getElementById(id); }
  function scrollOpts() { return CALM.matches ? { block: 'start' } : { behavior: 'smooth', block: 'start' }; }

  /* ------------------------------------------------------------------ */
  /* Vocabulary                                                          */
  /* ------------------------------------------------------------------ */

  var TENSE_NAME = { present: 'Present', future: 'Future', past: 'Past' };
  var PERSON_GLOSS = { '1s': 'I', '2s': 'you', '3s.a': 'he, she (animate)', '3s.i': 'it (inanimate)', '1p': 'we', '2p': 'you (plural)', '3p': 'they' };
  var IMP_ROWS = [
    { code: '2s', gloss: 'you' },
    { code: '2p', gloss: 'you (plural)' },
    { code: '1p', gloss: 'let us' },
    { code: '3', gloss: 'let him, her, them' }
  ];
  var GERUND_SUFFIX = { samon: '-ior', namon: '-inve', exmon: '-anga' };
  var NUM_LABEL = { sg: 'Singular', an: 'Plural, animate', 'in': 'Plural, inanimate' };

  /* ------------------------------------------------------------------ */
  /* Precomputed data                                                    */
  /* ------------------------------------------------------------------ */

  function conjugateEntry(e) { return e.irregular ? L.conjugate(e.samon, IRREG[e.root]) : L.conjugate(e.samon); }

  /** Calls fn(form, key) for every form of a conjugation (declension excluded). */
  function eachForm(res, fn) {
    FORMS.forEach(function (f) {
      TENSES.forEach(function (t) { res.finite[f][t].forEach(function (x, i) { fn(x, 'f.' + f + '.' + t + '.' + i); }); });
      res.imperative[f].forEach(function (x, i) { fn(x, 'i.' + f + '.' + i); });
    });
    if (res.gerund) { FORMS.forEach(function (f) { fn(res.gerund[f], 'g.' + f); }); }
    if (res.dictionary) { fn(res.dictionary, 'v'); }
    (res.derivations || []).forEach(function (d, i) { fn(d, 'd.' + i); });
  }

  var ALL = VERBS.map(conjugateEntry);
  var ROOT_INDEX = {};
  VERBS.forEach(function (v, i) { ROOT_INDEX[v.root] = i; });

  var RULE_VERBS = {};
  ALL.forEach(function (res, vi) {
    var seen = {};
    function mark(id) { if (!seen[id]) { seen[id] = true; (RULE_VERBS[id] = RULE_VERBS[id] || []).push(vi); } }
    eachForm(res, function (x, key) {
      (x.rules || []).forEach(mark);
      if (key.charAt(0) === 'f' && x.imon) { mark(x.imon.rule); }
    });
  });

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */

  var state = { idx: null, custom: null, entry: null, res: null, sel: null, imon: false, hl: null, num: 'sg', decl: {} };

  function isUnusedMode(e, f) { return !!(e.unused && e.unused.indexOf(f) !== -1); }
  function isUnusedCell(e, f, personIndex) {
    if (isUnusedMode(e, f)) { return true; }
    return !!(e.juosvuos && personIndex === 3 && f !== 'exmon');
  }

  /** The finite form with the longest derivation: a good first thing to look at. */
  function defaultSel(e, res) {
    var best = null, bestN = 0;
    FORMS.forEach(function (f) {
      TENSES.forEach(function (t) {
        res.finite[f][t].forEach(function (x, i) {
          if (isUnusedCell(e, f, i)) { return; }
          var n = (x.steps || []).length;
          if (n > bestN) { bestN = n; best = 'f.' + f + '.' + t + '.' + i; }
        });
      });
    });
    if (best) { return best; }
    for (var k = 0; k < FORMS.length; k++) { if (!isUnusedMode(e, FORMS[k])) { return 'f.' + FORMS[k] + '.present.0'; } }
    return 'f.samon.present.0';
  }

  function declensionOf(i) {
    if (!state.decl[i]) {
      var d = state.res.derivations[i];
      state.decl[i] = L.decline(d.form, d.oblique && d.oblique !== d.form ? { oblique: d.oblique, obliqueRule: 'ox_obl' } : {});
    }
    return state.decl[i];
  }

  function itemFor(res, key) {
    if (!res || !key) { return null; }
    var p = key.split('.');
    if (p[0] === 'f') { return { kind: 'finite', mode: p[1], tense: p[2], person: +p[3], x: res.finite[p[1]][p[2]][+p[3]] }; }
    if (p[0] === 'i') { return { kind: 'imperative', mode: p[1], person: +p[2], x: res.imperative[p[1]][+p[2]] }; }
    if (p[0] === 'g') { return res.gerund ? { kind: 'gerund', mode: p[1], x: res.gerund[p[1]] } : null; }
    if (p[0] === 'v') { return { kind: 'dictionary', x: res.dictionary }; }
    if (p[0] === 'd') { var d = res.derivations[+p[1]]; return d ? { kind: 'derived', index: +p[1], x: d } : null; }
    if (p[0] === 'c') {
      var dv = res.derivations[+p[1]];
      if (!dv) { return null; }
      var row = declensionOf(+p[1]).cases.filter(function (c) { return c.id === p[2]; })[0];
      return row ? { kind: 'case', index: +p[1], word: dv.form, caseId: p[2], caseName: row.name, num: p[3], x: row[p[3]] } : null;
    }
    return null;
  }

  function rulesOf(it) {
    var r = (it.x && it.x.rules) ? it.x.rules.slice() : [];
    if (it.kind === 'finite' && state.imon && it.x.imon) { r.push(it.x.imon.rule); }
    return r;
  }

  function knownMeanings(e) {
    var map = {};
    (KNOWN[e.root] || []).forEach(function (k) { map[k[0]] = k[1]; });
    return map;
  }

  /** True when a sound rule (vowel contact, glides, length rule, dissimilation) changed the form. */
  function soundChanged(x) {
    return (x.rules || []).some(function (id) { return L.RULES[id] && /^Sound rules/.test(L.RULES[id].section); });
  }

  /* ------------------------------------------------------------------ */
  /* Verb index                                                          */
  /* ------------------------------------------------------------------ */

  function matchVerb(v, q) {
    if (norm(v.samon).indexOf(q) !== -1 || norm(v.root).indexOf(q) === 0) { return true; }
    var m = v.meanings || {};
    return [m.samon, m.namon, m.exmon].some(function (s) { return s && norm(s).indexOf(q) !== -1; });
  }

  function renderIndex() {
    var raw = $('q').value.trim().toLowerCase();
    var q = norm(raw);
    var hits = [];
    VERBS.forEach(function (v, i) { if (!q || matchVerb(v, q)) { hits.push(i); } });
    if (q) {
      // exact base first, then bases and roots that start with the query, then meanings
      var rank = function (v) {
        var s = norm(v.samon);
        if (s === q) { return 0; }
        if (s.indexOf(q) === 0 || norm(v.root).indexOf(q) === 0) { return 1; }
        return s.indexOf(q) !== -1 ? 2 : 3;
      };
      hits.sort(function (a, b) { return rank(VERBS[a]) - rank(VERBS[b]) || a - b; });
    }
    var h = [];
    if (raw && !VERBS.some(function (v) { return v.samon === raw; })) {
      if (/asa$/.test(raw)) {
        try {
          L.analyze(raw);
          h.push('<li><button type="button" class="vi vi-new" data-custom="' + esc(raw) + '"><span class="vi-base">' + esc(raw) +
            '</span><span class="vi-gloss">Conjugate this new verb</span></button></li>');
        } catch (err) {
          h.push('<li class="vi-err" role="status">' + esc(err.message) + '</li>');
        }
      } else if (!hits.length) {
        h.push('<li class="vi-err" role="status">No verb matches. To try a new verb, type its samon base, ending in -asa (like labasa).</li>');
      }
    }
    hits.forEach(function (i) {
      var v = VERBS[i];
      var gloss = (v.meanings && v.meanings.samon) || '';
      var extra = v.irregular ? ' · irregular' : (v.status === 'proposal' ? ' · proposal' : '');
      h.push('<li><button type="button" class="vi" data-verb="' + i + '" aria-current="' + (state.idx === i) + '">' +
        '<span class="vi-base">' + esc(v.samon) + '</span><span class="vi-gloss">' + esc(gloss + extra) + '</span></button></li>');
    });
    $('vlist').innerHTML = h.join('');
    $('icount').textContent = q ? hits.length + ' of ' + VERBS.length + ' verbs' : VERBS.length + ' verbs in the lexicon';
  }

  function revealCurrentInIndex() {
    var cur = $('vlist').querySelector('[aria-current="true"]');
    if (!cur) { return; }
    var list = $('vlist');
    if (list.scrollWidth > list.clientWidth + 4 && window.innerWidth < 820) {
      list.scrollLeft = cur.offsetLeft - (list.clientWidth - cur.offsetWidth) / 2;
    } else {
      var top = cur.offsetTop, bottom = top + cur.offsetHeight;
      if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) { list.scrollTop = top - list.clientHeight / 2; }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Verb sheet                                                          */
  /* ------------------------------------------------------------------ */

  function classDetail(info) {
    if (info.cls === 'irregular') { return 'Irregular verb'; }
    if (info.cls === 'short') { return 'Short stem · one consonant + a'; }
    if (info.cls === 'u') { return 'u-stem'; }
    if (info.cls === 'e') { return 'e-stem'; }
    var bits = ['Consonant stem'];
    if (info.cluster) { bits.push('ends in two consonants'); }
    if (info.rl) { bits.push('ends in ' + info.stem.slice(-1)); }
    if (info.yFinal) { bits.push('ends in y'); }
    if (info.issues && info.issues.indexOf('noVowel') !== -1) { bits.push('no vowel in the root'); }
    return bits.join(' · ');
  }

  function formBtn(key, x, o) {
    o = o || {};
    if (!x || !x.form) {
      var note = (x && x.note) || 'Not defined yet';
      return '<span class="fm-none" title="' + esc(note) + '">—</span>';
    }
    var showImon = o.finite && state.imon && x.imon;
    var text = showImon ? x.imon.form : x.form;
    var cls = 'fm';
    if (soundChanged(x)) { cls += ' ch'; }
    if (o.unused) { cls += ' unused'; }
    var label = o.label ? ' aria-label="' + esc(text + ', ' + o.label) + '"' : '';
    return '<button type="button" class="' + cls + '" data-key="' + key + '"' + label + '><span class="fm-t">' + esc(text) + '</span></button>';
  }

  function headHTML(e, res) {
    var info = res.info;
    var m = e.meanings || {};
    var chips = [];
    if (e.custom) { chips.push('<span class="chip">Not in the lexicon</span>'); }
    if (e.transitivity) { chips.push('<span class="chip">' + esc(e.transitivity) + '</span>'); }
    if (e.juosvuos) { chips.push('<span class="chip" title="Blood-verb: only an animate being can do the thinking or existing.">jūosvuos · animate only</span>'); }
    if (e.status === 'proposal') { chips.push('<span class="chip" title="Proposed in chat, not yet confirmed.">Proposal</span>'); }
    if (e.irregular) { chips.push('<span class="chip">Forms from the table</span>'); }

    var dictFormula = e.irregular ? 'irregular' : (info.vowelStem ? info.stem + ' + vuos' : info.stem + ' + evuos');
    var h = '<header class="vhead">' +
      '<p class="eyebrow">' + esc(classDetail(info)) + '</p>' +
      '<div class="hw-row"><h2 class="headword"><button type="button" class="hw-btn" data-key="v" title="How the dictionary form is built">' + esc(res.dictionary.form) + '</button></h2>' +
      '<span class="hw-ipa">' + esc(res.dictionary.ipa) + '</span></div>' +
      '<p class="hw-sub">Dictionary form (vuos) · <span class="lx">' + esc(dictFormula) + '</span> · root <span class="lx">' + esc(info.stem) + '-</span></p>' +
      (chips.length ? '<div class="chips">' + chips.join('') + '</div>' : '') +
      '<ul class="bases">';
    FORMS.forEach(function (f) {
      var mean = m[f];
      h += '<li class="m-' + f + '">' + GLYPH[f] + '<span class="b-name">' + f + '</span><span class="b-form">' + esc(info.bases[f]) + '</span>' +
        '<span class="b-mean' + (mean ? '' : ' none') + '">' + (mean ? esc(mean) : 'meaning not defined yet') +
        (isUnusedMode(e, f) ? ' <span class="b-tag">exists, but not used</span>' : '') + '</span></li>';
    });
    h += '</ul>';
    if (e.notes) { h += '<p class="vnotes">' + esc(e.notes) + '</p>'; }
    if (e.irregular && IRREG[e.root] && IRREG[e.root].notes) { h += '<p class="vnotes">' + esc(IRREG[e.root].notes) + '</p>'; }
    if (e.custom) { h += '<p class="vnotes">This verb is not in the lexicon. Every form below is built by the same rules as the 47 known verbs.</p>'; }
    return h + '</header>';
  }

  function conjHTML(e, res) {
    var h = '<section class="blk" id="conj" aria-labelledby="conj-h">' +
      '<div class="blk-head"><h3 id="conj-h">Conjugation</h3>' +
      '<label class="tog" for="imon-toggle"><input type="checkbox" id="imon-toggle"' + (state.imon ? ' checked' : '') + '>' +
      '<span>Show the <span class="lx">īmon</span> <small>(conditional)</small></span></label></div>';
    if (state.imon) {
      h += '<p class="blk-note">īmon adds ī- before a consonant and y- before a vowel. The prefix is exempt from the length rule.</p>';
    }
    h += '<div class="modes">';
    FORMS.forEach(function (f) {
      var unusedMode = isUnusedMode(e, f);
      h += '<div class="mode m-' + f + (unusedMode ? ' is-unused' : '') + '">' +
        '<div class="mode-head">' + GLYPH[f] + '<span class="mode-name">' + f + '</span><span class="mode-base">' + esc(res.info.bases[f]) + '</span>' +
        '<span class="mode-gist">' + (unusedMode ? 'not used' : UI.MODE_GIST[f]) + '</span></div>' +
        '<div class="tw"><table class="par"><thead><tr><th scope="col"><span class="sr">Person</span></th>' +
        TENSES.map(function (t) { return '<th scope="col">' + TENSE_NAME[t] + '</th>'; }).join('') +
        '</tr></thead><tbody>';
      PERSONS.forEach(function (p, i) {
        var rowUnused = !unusedMode && isUnusedCell(e, f, i);
        h += '<tr' + (rowUnused ? ' class="row-unused" title="Animate subjects only: the thinker must be animate."' : '') + '>' +
          '<th scope="row" title="' + esc(PERSON_GLOSS[p]) + '"><span class="pn">' + p + '</span> <span class="pp">' + esc(PRON[i]) + '</span></th>';
        TENSES.forEach(function (t) {
          h += '<td>' + formBtn('f.' + f + '.' + t + '.' + i, res.finite[f][t][i],
            { finite: true, unused: unusedMode || rowUnused, label: f + ' ' + t + ' ' + p }) + '</td>';
        });
        h += '</tr>';
      });
      h += '</tbody></table></div></div>';
    });
    return h + '</div>' +
      '<p class="legend"><span><i class="lg-dot"></i>a sound rule changed the form</span>' +
      '<span><i class="lg-fade">abc</i>exists, but not used</span>' +
      '<span>Click a form to see how it is built</span></p>' +
      '</section>';
  }

  function impHTML(e, res) {
    var h = '<section class="blk" id="imp" aria-labelledby="imp-h"><div class="blk-head"><h3 id="imp-h">Imperatives</h3></div>' +
      '<div class="tw"><table class="par imp"><thead><tr><th scope="col"><span class="sr">Person</span></th>';
    FORMS.forEach(function (f) { h += '<th scope="col" class="m-' + f + '"><span class="th-mode">' + GLYPH[f] + f + '</span></th>'; });
    h += '</tr></thead><tbody>';
    IMP_ROWS.forEach(function (r, i) {
      h += '<tr><th scope="row"><span class="pn">' + r.code + '</span> <span class="pg">' + esc(r.gloss) + '</span></th>';
      FORMS.forEach(function (f) {
        h += '<td class="m-' + f + '">' + formBtn('i.' + f + '.' + i, res.imperative[f][i], { unused: isUnusedMode(e, f), label: f + ' imperative ' + r.code }) + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table></div></section>';
  }

  function nonfiniteHTML(e, res) {
    var h = '<section class="blk" id="nonfinite" aria-labelledby="nf-h"><div class="blk-head"><h3 id="nf-h">Dictionary form and gerunds</h3></div>';
    h += '<dl class="nf"><div><dt>Dictionary form <span class="suf">vuos</span></dt><dd>' + formBtn('v', res.dictionary, { label: 'dictionary form' }) + '</dd></div>';
    FORMS.forEach(function (f) {
      h += '<div class="m-' + f + '"><dt>' + GLYPH[f] + f + ' gerund <span class="suf">' + GERUND_SUFFIX[f] + '</span></dt><dd>' +
        (res.gerund ? formBtn('g.' + f, res.gerund[f], { unused: isUnusedMode(e, f), label: f + ' gerund' }) : '<span class="fm-none">not in the table yet</span>') + '</dd></div>';
    });
    return h + '</dl></section>';
  }

  /** The four adjectives of the verb, declined: rows are cases, columns the adjectives. */
  function declHTML(e, res) {
    var h = '<section class="blk m-case" id="decl" aria-labelledby="decl-h"><div class="blk-head"><h3 id="decl-h">Declension</h3>' +
      '<div class="seg" role="group" aria-label="Number">' +
      ['sg', 'an', 'in'].map(function (n) { return '<button type="button" data-num="' + n + '" aria-pressed="' + (state.num === n) + '">' + NUM_LABEL[n] + '</button>'; }).join('') +
      '</div></div>';
    if (!res.derivations.length) {
      return h + '<p class="blk-note">lasa is irregular, and the doc does not list its participles yet.</p></section>';
    }
    var adj = [];
    res.derivations.forEach(function (d, i) { if (d.kind === 'adjective') { adj.push(i); } });
    h += '<p class="blk-note">Adjectives are participles, and they take the noun endings exactly. In the plural they follow the animacy of the noun they describe.</p>' +
      '<div class="tw"><table class="par decl"><thead><tr><th scope="col"><span class="sr">Case</span></th>';
    adj.forEach(function (i) {
      var d = res.derivations[i];
      h += '<th scope="col">' + esc(d.label) + '<span class="th-word">' + esc(d.form) + '</span></th>';
    });
    h += '</tr></thead><tbody>';
    L.CASES.forEach(function (c) {
      h += '<tr><th scope="row"><span class="pn">' + c.id + '</span> <span class="pg">' + esc(c.name) + '</span></th>';
      adj.forEach(function (i) {
        var row = declensionOf(i).cases.filter(function (r) { return r.id === c.id; })[0];
        h += '<td>' + formBtn('c.' + i + '.' + c.id + '.' + state.num, row[state.num], { label: res.derivations[i].label + ', ' + c.name + ', ' + NUM_LABEL[state.num] }) + '</td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table></div>' +
      '<p class="legend"><span>Click a form to see the ending and the case rules</span>' +
      '<span>Every declension rule is on the <a href="grammar.html#cases">grammar page</a></span></p></section>';
    return h;
  }

  function familyHTML(e, res) {
    var h = '<section class="blk" id="family" aria-labelledby="fam-h"><div class="blk-head"><h3 id="fam-h">Word family</h3>' +
      '<p class="blk-note">Regular derivations. Meanings come from the lexicon where it has them.</p></div>';
    if (!res.derivations.length) {
      return h + '<p class="blk-note">lasa is irregular, and the doc does not list its derived words yet.</p></section>';
    }
    var known = knownMeanings(e);
    var groups = [['adjective', 'Adjectives'], ['noun', 'Nouns'], ['person', 'People']];
    h += '<div class="fam">';
    groups.forEach(function (g) {
      h += '<div class="fam-g"><h4>' + g[1] + '</h4><ul>';
      res.derivations.forEach(function (d, i) {
        if (d.kind !== g[0]) { return; }
        var mean = d.form && known[d.form];
        h += '<li><span class="fam-f">' + formBtn('d.' + i, d, { label: d.label }) + '</span>' +
          '<span class="fam-t"><span class="fam-l">' + esc(d.label) + '</span>' +
          (mean ? '<span class="fam-m">‘' + esc(mean) + '’</span>' : '') + '</span></li>';
      });
      h += '</ul></div>';
    });
    h += '</div>';

    var generated = {};
    eachForm(res, function (x) { if (x && x.form) { generated[x.form] = true; } });
    var others = (KNOWN[e.root] || []).filter(function (k) { return !generated[k[0]]; });
    if (others.length) {
      h += '<p class="attested"><span class="att-h">Also in the lexicon, not built by these rules:</span> ' + others.map(function (k) {
        return '<span class="att"><span class="lx">' + esc(k[0]) + '</span> ‘' + esc(k[1]) + '’</span>';
      }).join(' ') + '</p>';
    }
    return h + '</section>';
  }

  function usedHTML(res) {
    var counts = {};
    eachForm(res, function (x, key) {
      (x.rules || []).forEach(function (id) { counts[id] = (counts[id] || 0) + 1; });
      if (state.imon && key.charAt(0) === 'f' && x.imon) { counts[x.imon.rule] = (counts[x.imon.rule] || 0) + 1; }
    });
    var bySec = {};
    Object.keys(counts).forEach(function (id) {
      var r = L.RULES[id]; if (!r) { return; }
      (bySec[r.section] = bySec[r.section] || []).push(id);
    });
    var h = '<section class="blk" id="used" aria-labelledby="used-h"><div class="blk-head"><h3 id="used-h">Rules this verb uses</h3>' +
      '<p class="blk-note">Click a rule to light up every form it shaped.</p></div><div class="used">';
    UI.SECTION_ORDER.forEach(function (sec) {
      if (!bySec[sec]) { return; }
      h += '<div class="used-g"><h4>' + esc(sec) + '</h4>';
      bySec[sec].forEach(function (id) {
        h += '<button type="button" class="ru" data-rule="' + id + '" aria-pressed="false"><span>' + esc(L.RULES[id].text) + '</span>' +
          '<span class="ru-n">' + plural(counts[id], 'form', 'forms') + '</span></button>';
      });
      h += '</div>';
    });
    return h + '</div></section>';
  }

  function renderSheet() {
    var e = state.entry, res = state.res;
    $('sheet').innerHTML =
      headHTML(e, res) +
      '<div class="hlbar" id="hlbar" role="status" hidden></div>' +
      conjHTML(e, res) +
      impHTML(e, res) +
      nonfiniteHTML(e, res) +
      declHTML(e, res) +
      familyHTML(e, res) +
      usedHTML(res);
    applySelection();
    applyHighlight();
  }

  function renderDeclOnly() {
    var old = $('decl');
    if (!old) { return; }
    var tmp = document.createElement('div');
    tmp.innerHTML = declHTML(state.entry, state.res);
    old.parentNode.replaceChild(tmp.firstChild, old);
    applySelection();
    applyHighlight();
  }

  function applySelection() {
    var nodes = document.querySelectorAll('#sheet [data-key]');
    for (var k = 0; k < nodes.length; k++) {
      var on = nodes[k].getAttribute('data-key') === state.sel;
      nodes[k].classList.toggle('sel', on);
      if (nodes[k].tagName === 'BUTTON') { nodes[k].setAttribute('aria-pressed', on ? 'true' : 'false'); }
    }
  }

  function applyHighlight() {
    var id = state.hl;
    var n = 0;
    var nodes = document.querySelectorAll('#sheet [data-key]');
    for (var k = 0; k < nodes.length; k++) {
      var it = itemFor(state.res, nodes[k].getAttribute('data-key'));
      var on = !!(id && it && it.x && rulesOf(it).indexOf(id) !== -1);
      nodes[k].classList.toggle('hit', on);
      nodes[k].classList.toggle('dim', !!id && !on);
      if (on) { n++; }
    }
    var rules = document.querySelectorAll('[data-rule]');
    for (var j = 0; j < rules.length; j++) { rules[j].setAttribute('aria-pressed', rules[j].getAttribute('data-rule') === id ? 'true' : 'false'); }
    var bar = $('hlbar');
    if (!bar) { return; }
    if (id && L.RULES[id]) {
      bar.hidden = false;
      bar.innerHTML = '<span>Lit up: the ' + plural(n, 'form', 'forms') + ' shaped by <b>' + esc(L.RULES[id].text) + '</b></span>' +
        '<button type="button" data-clear-hl>Show all forms</button>';
    } else {
      bar.hidden = true;
      bar.innerHTML = '';
    }
  }

  /* ------------------------------------------------------------------ */
  /* Derivation panel                                                    */
  /* ------------------------------------------------------------------ */

  function startCaption(it) {
    if (it.kind === 'finite') { return 'stem + ending'; }
    if (it.kind === 'imperative') { return 'stem + imperative ending'; }
    if (it.kind === 'gerund') { return 'stem + gerund suffix'; }
    if (it.kind === 'dictionary') { return 'stem + dictionary ending'; }
    if (it.kind === 'case') { return 'word + case ending'; }
    if (/^-on/.test(it.x.label || '')) { return 'adjective + -on'; }
    if (it.x.underlying && it.x.underlying.indexOf('+') === -1) { return 'the bare stem'; }
    return 'stem + suffix';
  }

  function metaHTML(it, e) {
    var x = it.x;
    var m = e.meanings || {};
    if (it.kind === 'finite') {
      var p = PERSONS[it.person];
      return GLYPH[it.mode] + '<b>' + it.mode + '</b><span>' + TENSE_NAME[it.tense] + ' · ' + p + '</span>' +
        '<span class="lx">' + esc(PRON[it.person]) + '</span><span>‘' + esc(PERSON_GLOSS[p]) + '’</span>' +
        (m[it.mode] ? '<span class="d-gloss"><span class="lx">' + esc(state.res.info.bases[it.mode]) + '</span> ‘' + esc(m[it.mode]) + '’</span>' : '');
    }
    if (it.kind === 'imperative') {
      var r = IMP_ROWS[it.person];
      return GLYPH[it.mode] + '<b>' + it.mode + '</b><span>imperative · ' + r.code + ' ‘' + esc(r.gloss) + '’</span>';
    }
    if (it.kind === 'gerund') { return GLYPH[it.mode] + '<b>' + it.mode + '</b><span>gerund (' + GERUND_SUFFIX[it.mode] + ')</span>'; }
    if (it.kind === 'dictionary') { return '<span>dictionary form (vuos)</span>'; }
    if (it.kind === 'case') {
      var d = state.res.derivations[it.index];
      return '<b class="case-b">' + it.caseId + '</b><span>' + esc(it.caseName) + ' · ' + NUM_LABEL[it.num].toLowerCase() + '</span>' +
        '<span class="d-gloss">of <span class="lx">' + esc(d.form) + '</span>, ' + esc(d.label) + '</span>';
    }
    var known = knownMeanings(e)[x.form];
    return '<span>' + esc(x.label) + '</span>' + (known ? '<span class="d-gloss">‘' + esc(known) + '’</span>' : '');
  }

  function extrasHTML(it, imonOn) {
    var x = it.x;
    var parts = [];
    if (it.kind === 'finite' && x.imon && !imonOn) {
      parts.push('<p><span class="d-k">īmon (conditional)</span> <span class="lx">' + esc(x.imon.form) + '</span> <span class="d-ipa2">' + esc(x.imonIpa) + '</span></p>');
    }
    if (it.kind === 'derived' && x.note) { parts.push('<p>' + esc(UI.cap(x.note)) + '.</p>'); }
    if (it.kind === 'finite' && isUnusedCell(state.entry, it.mode, it.person)) {
      parts.push('<p class="d-note">This form exists but is not used' + (state.entry.juosvuos && it.person === 3 ? ': the thinker must be animate.' : '.') + '</p>');
    }
    if (it.kind === 'case') {
      parts.push('<p class="d-note">Stress stays where the bare word has it: case endings never count.</p>');
    }
    if (it.kind === 'derived' && x.form) {
      var dec = declensionOf(it.index);
      var person = it.x.kind === 'person' || /^-(ver|fuar)/.test(it.x.label);
      parts.push('<div class="d-decl"><p class="d-k">Declension</p>' + UI.miniDeclension(dec, person ? 'animate' : null) +
        (person ? '<p class="d-hint">A person is animate, so the plural takes the animate endings.</p>' :
          (it.x.kind === 'noun' ? '<p class="d-hint">The plural depends on the noun\'s animacy, which the lexicon does not give for derived nouns yet.</p>' :
            '<p class="d-hint">An adjective takes the plural of the noun it describes.</p>')) + '</div>');
    }
    parts.push('<p class="d-hint">Click a rule above to light up every form of this verb that it shaped.</p>');
    return '<div class="d-extra">' + parts.join('') + '</div>';
  }

  function renderDeriv() {
    var el = $('deriv');
    var it = itemFor(state.res, state.sel);
    if (!it || !it.x || !it.x.form) {
      var note = it && it.x && it.x.note;
      el.innerHTML = '<div class="d-top">' +
        '<button type="button" class="d-close" data-close-sheet aria-label="Close">×</button>' +
        '<p class="eyebrow">How a form is built</p>' +
        (it && it.x && it.x.underlying ? '<p class="d-under-only"><span class="c-under">' + esc(it.x.underlying) + '</span></p>' : '') +
        '<p class="d-empty">' + (note ? esc(note) : 'Click any form in the tables to see the stem, the ending and each sound rule that shaped it.') + '</p></div>';
      return;
    }
    var x = it.x;
    var imonOn = it.kind === 'finite' && state.imon && !!x.imon;
    var shown = imonOn ? x.imon.form : x.form;
    var ipa = imonOn ? x.imonIpa : (x.ipa || L.toIPA(x.form));
    var modeCls = it.kind === 'case' ? ' m-case' : (it.mode ? ' m-' + it.mode : '');
    el.innerHTML = '<div class="d-top' + modeCls + '">' +
      '<button type="button" class="d-close" data-close-sheet aria-label="Close">×</button>' +
      '<p class="eyebrow">How this form is built</p>' +
      '<p class="d-form">' + esc(shown) + '</p>' +
      '<p class="d-ipa">' + esc(ipa) + '</p>' +
      '<p class="d-meta">' + metaHTML(it, state.entry) + '</p>' +
      UI.chain(x, {
        caption: startCaption(it), buttons: true, pressed: state.hl, shown: shown,
        extraSteps: imonOn ? [{ rules: [x.imon.rule], form: x.imon.form }] : null,
        irregularNote: 'Irregular: this form comes from the table in the doc (To be). No rule builds it.' + (imonOn ? ' The īmon prefix is added by rule.' : '')
      }) +
      extrasHTML(it, imonOn) +
      '</div>';
  }

  function openSheet() {
    var el = $('deriv');
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
  }
  function closeSheet() {
    var el = $('deriv');
    el.classList.remove('open');
    if (!WIDE.matches) { el.setAttribute('aria-hidden', 'true'); }
  }
  function syncSheetMode() {
    var el = $('deriv');
    if (WIDE.matches) { el.classList.remove('open'); el.removeAttribute('aria-hidden'); }
    else if (!el.classList.contains('open')) { el.setAttribute('aria-hidden', 'true'); }
  }

  /* ------------------------------------------------------------------ */
  /* Selection                                                           */
  /* ------------------------------------------------------------------ */

  function setHash(h) {
    try { window.history.replaceState(null, '', h ? '#' + h : window.location.pathname + window.location.search); } catch (e) { /* not allowed here */ }
  }

  function selectVerb(i, opts) {
    opts = opts || {};
    var e = VERBS[i];
    state.idx = i; state.custom = null; state.entry = e; state.res = ALL[i]; state.decl = {};
    state.hl = null;
    if (opts.imon !== undefined) { state.imon = opts.imon; }
    if (opts.sel && opts.sel.charAt(0) === 'c') { state.num = opts.sel.split('.')[3] || state.num; }
    state.sel = opts.sel && itemFor(state.res, opts.sel) ? opts.sel : defaultSel(e, state.res);
    renderIndex(); renderSheet(); renderDeriv();
    revealCurrentInIndex();
    UI.store('lunde.verb', e.samon);
    if (opts.hash !== false) { setHash(UI.slugOf(e.samon)); }
  }

  function selectCustom(base, opts) {
    opts = opts || {};
    var res;
    try { res = L.conjugate(base); } catch (err) { renderIndex(); return false; }
    state.idx = null; state.custom = base; state.decl = {};
    state.entry = { root: res.info.stem, samon: base, meanings: { samon: null, namon: null, exmon: null }, custom: true };
    state.res = res; state.hl = null;
    if (opts.imon !== undefined) { state.imon = opts.imon; }
    state.sel = opts.sel && itemFor(res, opts.sel) ? opts.sel : defaultSel(state.entry, res);
    renderIndex(); renderSheet(); renderDeriv();
    UI.store('lunde.verb', base);
    setHash(/^[a-z]+$/.test(base) ? base : '');
    return true;
  }

  function selectForm(key, fromUser) {
    state.sel = key;
    applySelection();
    renderDeriv();
    if (fromUser && !WIDE.matches) { openSheet(); }
  }

  function toggleRule(id) {
    state.hl = state.hl === id ? null : id;
    applyHighlight();
    var rb = document.querySelectorAll('#deriv [data-rule]');
    for (var k = 0; k < rb.length; k++) { rb[k].setAttribute('aria-pressed', rb[k].getAttribute('data-rule') === state.hl ? 'true' : 'false'); }
  }

  /* ------------------------------------------------------------------ */
  /* Reference sections                                                  */
  /* ------------------------------------------------------------------ */

  /** A chip that opens a verb (a lexicon root, or any samon base) at a form. */
  function verbChip(target, key, imon) {
    var i = ROOT_INDEX[target];
    var attrs = (key ? ' data-sel="' + key + '"' : '') + (imon ? ' data-imon="1"' : '');
    if (i !== undefined) { return '<button type="button" class="vchip" data-verb="' + i + '"' + attrs + '>' + esc(VERBS[i].samon) + '</button>'; }
    return '<button type="button" class="vchip" data-custom="' + esc(target) + '"' + attrs + '>' + esc(target) + '</button>';
  }

  function renderRules() {
    var xi = ROOT_INDEX.xa;
    var chip = '<button type="button" class="vchip" data-verb="' + xi + '" data-sel="f.samon.past.5">xavunōs</button>';
    var h = '<div class="rule-blk"><h3>How a form is built</h3>' + UI.pipelineHTML(ALL[xi].finite.samon.past[5], chip, 'xa- with the samon past 2p ending') + '</div>';
    h += '<div class="rule-blk"><h3>Vowel contact</h3><p class="blk-note">What happens when the stem ends in a vowel and the ending starts with one. Built from the engine itself, so it shows exactly what the tables do.</p>' + UI.matrixHTML() + '</div>';
    h += '<div class="rule-blk"><h3>Every verb rule, and the verbs it touches</h3><div class="rgroups">';
    var bySec = {};
    Object.keys(L.RULES).forEach(function (id) { (bySec[L.RULES[id].section] = bySec[L.RULES[id].section] || []).push(id); });
    UI.SECTION_ORDER.forEach(function (sec) {
      if (!bySec[sec] || sec === 'Cases' || sec === 'Pronouns' || sec === 'Adverbs') { return; }
      h += '<div class="rg"><h4>' + esc(sec) + '</h4><ul>';
      bySec[sec].forEach(function (id) {
        var vs = RULE_VERBS[id] || [];
        var chips = vs.slice(0, 14).map(function (vi) { return '<button type="button" class="vchip" data-verb="' + vi + '" data-hl="' + id + '">' + esc(VERBS[vi].samon) + '</button>'; }).join('');
        var more = vs.length > 14 ? '<span class="rv-n">and ' + (vs.length - 14) + ' more</span>' : '';
        h += '<li><span class="rt">' + esc(L.RULES[id].text) + '</span>' +
          (vs.length ? '<span class="rv"><span class="rv-n">' + plural(vs.length, 'verb', 'verbs') + ':</span>' + chips + more + '</span>' : '<span class="rv"><span class="rv-n">no verb in the lexicon uses it yet</span></span>') + '</li>';
      });
      h += '</ul></div>';
    });
    h += '</div><p class="blk-note">Stress, IPA, cases, pronouns and numbers are on the <a href="grammar.html">grammar page</a>.</p></div>';
    $('rules-body').innerHTML = h;
  }


  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-key], [data-verb], [data-custom], [data-rule], [data-num], [data-clear-hl], [data-close-sheet]');
    if (!t) { return; }
    if (t.hasAttribute('data-close-sheet')) { closeSheet(); return; }
    if (t.hasAttribute('data-clear-hl')) { state.hl = null; applyHighlight(); return; }
    if (t.hasAttribute('data-num')) { state.num = t.getAttribute('data-num'); renderDeclOnly(); return; }
    if (t.hasAttribute('data-key')) { selectForm(t.getAttribute('data-key'), true); return; }
    if (t.hasAttribute('data-rule')) { toggleRule(t.getAttribute('data-rule')); return; }
    var fromRef = !!t.closest('.ref');
    var opts = { sel: t.getAttribute('data-sel') || null, imon: t.hasAttribute('data-imon') ? true : undefined };
    if (t.hasAttribute('data-custom')) { selectCustom(t.getAttribute('data-custom'), opts); }
    else if (t.hasAttribute('data-verb')) {
      selectVerb(+t.getAttribute('data-verb'), opts);
      if (t.hasAttribute('data-hl')) { state.hl = t.getAttribute('data-hl'); applyHighlight(); renderDeriv(); }
    }
    if (fromRef) {
      document.querySelector('.bench').scrollIntoView(scrollOpts());
      if (opts.sel && !WIDE.matches) { openSheet(); }
    }
  });

  document.addEventListener('change', function (ev) {
    if (ev.target && ev.target.id === 'imon-toggle') {
      state.imon = ev.target.checked;
      renderSheet(); renderDeriv();
      var tog = $('imon-toggle');
      if (tog) { tog.focus({ preventScroll: true }); }
    }
  });

  $('q').addEventListener('input', function () { renderIndex(); });
  $('q').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      var first = $('vlist').querySelector('[data-custom], [data-verb]');
      if (first) { first.click(); }
    } else if (ev.key === 'ArrowDown') {
      var btn = $('vlist').querySelector('button');
      if (btn) { ev.preventDefault(); btn.focus(); }
    }
  });
  $('index-form').addEventListener('submit', function (ev) { ev.preventDefault(); });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && $('deriv').classList.contains('open')) { closeSheet(); }
  });

  if (WIDE.addEventListener) { WIDE.addEventListener('change', syncSheetMode); }

  /* ------------------------------------------------------------------ */
  /* Start                                                               */
  /* ------------------------------------------------------------------ */

  function currentVerbKey() { return state.custom ? state.custom : (state.entry ? state.entry.samon : null); }

  /** Deep links: #slug, #slug~imon, #slug~f.samon.present.0 (a lexicon verb or any ASCII samon base). */
  function parseHash() {
    var h = (window.location.hash || '').slice(1);
    if (!h) { return null; }
    var parts = h.split('~');
    var out = { slug: parts[0], imon: parts.indexOf('imon') !== -1, sel: null };
    parts.slice(1).forEach(function (p) { if (/^[fivgdc]\./.test(p) || p === 'v') { out.sel = p; } });
    return out;
  }

  var started = false;
  function start(saved) {
    if (started) { return; }
    started = true;
    saved = saved || {};
    if (saved.imon) { state.imon = true; }
    renderRules();
    syncSheetMode();

    var link = parseHash();
    var idx = null;
    if (link) { for (var i = 0; i < VERBS.length; i++) { if (UI.slugOf(VERBS[i].samon) === link.slug) { idx = i; } } }
    var done = false;
    if (idx !== null) {
      selectVerb(idx, { sel: link.sel || saved.sel || null, imon: link.imon ? true : undefined });
      done = true;
    } else if (link && /asa$/.test(link.slug)) {
      done = selectCustom(link.slug, { sel: link.sel, imon: link.imon ? true : undefined });
    }
    if (!done) {
      var wanted = saved.verb || UI.recall('lunde.verb') || 'nileasa';
      var found = null;
      VERBS.forEach(function (v, k) { if (v.samon === wanted) { found = k; } });
      if (found !== null) { selectVerb(found, { sel: saved.sel || null, hash: false }); }
      else if (!selectCustom(wanted)) { selectVerb(ROOT_INDEX.nile, { hash: false }); }
    }
    if (link && idx === null && !/asa$/.test(link.slug)) {
      var target = document.getElementById(link.slug);
      if (target) { target.scrollIntoView({ block: 'start' }); }
    }
    if (link && link.sel && done && !WIDE.matches) { openSheet(); }

    try {
      var hot = window.claude && window.claude.hot;
      if (hot && hot.snapshot) {
        hot.snapshot(function () { return { verb: currentVerbKey(), sel: state.sel, imon: state.imon }; });
      }
    } catch (e) { /* the viewer's update hook is optional */ }
  }

  var hotApi = window.claude && window.claude.hot;
  if (hotApi && hotApi.ready) {
    try { hotApi.ready(start); } catch (e) { start({}); }
    window.setTimeout(function () { start({}); }, 1500);   // never leave the page empty
  } else {
    start((hotApi && hotApi.data) || {});
  }
}());
