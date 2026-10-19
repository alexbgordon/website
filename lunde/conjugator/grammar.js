/*
 * Lunde grammar: page logic. Fills every [data-build] block from the engine.
 * Needs window.Lunde, window.LundeUI, window.LundeTests, window.LundeRunner and window.LUNDE_LEXICON.
 */
(function () {
  'use strict';

  var L = window.Lunde;
  var UI = window.LundeUI;
  var LEX = window.LUNDE_LEXICON;
  var esc = UI.esc, GLYPH = UI.GLYPH;
  var VERBS = LEX.verbs;
  var IRREG = LEX.irregular || {};
  var BY_ROOT = {}, BY_BASE = {};
  VERBS.forEach(function (v) { BY_ROOT[v.root] = v; BY_BASE[v.samon] = v; });
  var LETTERS = /^[a-zäàāēīōūǟñłğ]+$/;

  function $(id) { return document.getElementById(id); }
  var CACHE = {};
  /** Conjugation of any samon base, lexicon or not (irregular lasa from its table). */
  function C(base) {
    if (!CACHE[base]) {
      var v = BY_BASE[base];
      CACHE[base] = v && v.irregular ? L.conjugate(base, IRREG[v.root]) : L.conjugate(base);
    }
    return CACHE[base];
  }
  function deriv(base, label) { return C(base).derivations.filter(function (d) { return d.label === label; })[0]; }
  function cite(form) { return '<i>' + esc(form) + '</i>'; }
  /** A link that opens the conjugator at a verb, optionally at one form and with the īmon on. */
  function verbHref(target, key, imon) {
    var v = BY_ROOT[target] || BY_BASE[target];
    var base = v ? v.samon : target;
    return 'index.html#' + UI.slugOf(base) + (imon ? '~imon' : '') + (key ? '~' + key : '');
  }
  function formLink(base, key, form, imon) {
    return '<a class="fl" href="' + verbHref(base, key, imon) + '" title="Open in the conjugator">' + esc(form) + '</a>';
  }
  function exampleChips(list, attr) {
    return '<div class="see"><span>Try</span>' + list.map(function (x) {
      return '<button type="button" class="vchip" ' + attr + '="' + esc(JSON.stringify(x)) + '">' + esc(Array.isArray(x) ? x.join(' + ') : x) + '</button>';
    }).join('') + '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Sounds and stress                                                   */
  /* ------------------------------------------------------------------ */

  var REASON = {
    imon: 'The īmon ī- takes the main stress.',
    long: 'The last long vowel outside the final syllable takes the stress.',
    penult: 'No long vowel attracts it, and the word is short (up to three syllables): the second-to-last syllable takes the stress.',
    antepenult: 'No long vowel attracts it, and the word has four or more syllables: the third-to-last syllable takes the stress.',
    single: 'One syllable: nothing to choose.',
    base: 'Case endings don\'t count: the stress stays where the bare word has it.'
  };

  function sylHTML(syl) {
    return '<div class="syl">' + syl.map(function (s) {
      return '<span class="' + (s.stress === 'primary' ? 's1' : (s.stress === 'secondary' ? 's2' : '')) + '"><b>' + esc(s.text) + '</b><small>' + esc(s.ipa) + '</small></span>';
    }).join('') + '</div>';
  }

  function buildIpaTool(el) {
    el.innerHTML = '<div class="tool-h"><h4>Syllables, stress and IPA</h4><p>Type any word in Lunde letters.</p></div>' +
      '<div class="fields"><div class="field w1"><label for="ipa-word">Word</label><input id="ipa-word" type="text" value="nileasa" autocomplete="off" autocapitalize="off" spellcheck="false"></div>' +
      '<label class="check" for="ipa-imon"><input id="ipa-imon" type="checkbox"> starts with the īmon ī-</label></div>' +
      exampleChips(['nileasa', 'fastūos', 'xavunōs', 'ixahekanga', 'hekanga', 'gval', 'eked', 'tēllave'], 'data-ipa') +
      '<div class="out" id="ipa-out" aria-live="polite"></div>';
    function update() {
      var word = $('ipa-word').value.trim().toLowerCase();
      var imon = $('ipa-imon').checked;
      var out = $('ipa-out');
      if (!word) { out.innerHTML = '<p class="why">Type a word to see its syllables.</p>'; return; }
      if (!LETTERS.test(word)) { out.innerHTML = '<p class="out-err">Use Lunde letters only: a to z, ä, à, ā ē ī ō ū ǟ, ñ, ł and ğ.</p>'; return; }
      if (imon && word.charAt(0) !== 'ī') { out.innerHTML = '<p class="out-err">An īmon form starts with ī-. Untick the box or add the ī.</p>'; return; }
      var syl = L.syllabify(word, { imon: imon });
      var st = L.stress(word, { imon: imon });
      var sec = st.secondary.map(function (i) { return syl[i] && syl[i].text; }).filter(Boolean);
      out.innerHTML = sylHTML(syl) +
        '<p class="big ipa">' + esc(L.toIPA(word, { imon: imon })) + '</p>' +
        '<p class="why">' + st.count + ' ' + (st.count === 1 ? 'syllable' : 'syllables') + ', one per vowel. ' + esc(REASON[st.reason] || '') +
        (sec.length ? ' Other long vowels get a secondary stress: ' + sec.map(cite).join(', ') + '.' : '') + '</p>';
    }
    el.addEventListener('input', update);
    el.addEventListener('change', update);
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-ipa]');
      if (!b) { return; }
      $('ipa-word').value = JSON.parse(b.getAttribute('data-ipa'));
      $('ipa-imon').checked = false;
      update();
    });
    update();
  }

  function buildStressTable(el) {
    var words = [
      ['nileasa'], ['tavenuos'], ['menrakeden'], ['ixahekanga'], ['galatiōn'], ['tēllave'], ['labūn'], ['fastūos'],
      ['īlabi', { imon: true }, 'the īmon of labi'], ['īssiūne', { base: 'īssi' }, 'comitative of īssi']
    ];
    var h = '<table class="dt"><thead><tr><th scope="col">Word</th><th scope="col">Syllables</th><th scope="col">IPA</th><th scope="col">Why</th></tr></thead><tbody>';
    words.forEach(function (p) {
      var syl = L.syllabify(p[0], p[1]);
      var st = L.stress(p[0], p[1]);
      var short = { imon: 'īmon ī-', long: 'last long vowel', penult: 'second-to-last', antepenult: 'third-to-last', single: 'one syllable', base: 'set on the bare word' }[st.reason];
      h += '<tr><td class="w">' + esc(p[0]) + (p[2] ? ' <span class="why">(' + esc(p[2]) + ')</span>' : '') + '</td>' +
        '<td class="w">' + syl.map(function (s) { return s.stress === 'primary' ? '<b>' + esc(s.text) + '</b>' : esc(s.text); }).join(' · ') + '</td>' +
        '<td class="ipa">' + esc(L.toIPA(p[0], p[1])) + '</td><td class="why">' + esc(short) + '</td></tr>';
    });
    el.innerHTML = h + '</tbody></table>';
  }

  /* ------------------------------------------------------------------ */
  /* Sound rules                                                         */
  /* ------------------------------------------------------------------ */

  function buildPipeline(el) {
    var chip = '<a class="vchip" href="' + verbHref('xa', 'f.samon.past.5') + '">xavunōs</a>';
    el.innerHTML = '<h3>The order</h3>' + UI.pipelineHTML(C('xasa').finite.samon.past[5], chip, 'xa- with the samon past 2p ending');
  }

  function buildMatrix(el) { el.innerHTML = UI.matrixHTML(); }

  function buildJoinTool(el) {
    el.innerHTML = '<div class="tool-h"><h4>Join a stem and an ending</h4><p>Every sound rule, in order.</p></div>' +
      '<div class="fields">' +
      '<div class="field w2"><label for="join-stem">Stem</label><input id="join-stem" type="text" value="xa" autocomplete="off" autocapitalize="off" spellcheck="false"></div>' +
      '<div class="field w2"><label for="join-end">Ending</label><input id="join-end" type="text" value="uvōs" autocomplete="off" autocapitalize="off" spellcheck="false"></div>' +
      '<div class="field w2"><label for="join-form">Form</label><select id="join-form"><option value="samon">samon</option><option value="namon">namon</option><option value="exmon">exmon</option><option value="none">other</option></select></div>' +
      '</div>' +
      exampleChips([['xa', 'uvōs', 'samon'], ['lu', 'i', 'samon'], ['le', 'eān', 'namon'], ['nile', 'ēyn', 'samon'], ['ju', 'i', 'samon'], ['ix', 'ix', 'exmon'], ['kahy', 'i', 'samon'], ['ve', 'uvōs', 'samon']], 'data-join') +
      '<div class="out" id="join-out" aria-live="polite"></div>';
    function update() {
      var out = $('join-out');
      var stem = $('join-stem').value, end = $('join-end').value;
      if (!stem.trim() || !end.trim()) { out.innerHTML = '<p class="why">Type a stem and an ending.</p>'; return; }
      var r;
      try { r = L.join(stem, end, $('join-form').value); } catch (e) { out.innerHTML = '<p class="out-err">' + esc(e.message) + '</p>'; return; }
      out.innerHTML = '<p class="big">' + esc(r.form) + ' <span class="ipa" style="font-style:normal;font-weight:400;font-size:18px">' + esc(r.ipa) + '</span></p>' +
        UI.chain(r, { caption: 'stem + ending' });
    }
    el.addEventListener('input', update);
    el.addEventListener('change', update);
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-join]');
      if (!b) { return; }
      var p = JSON.parse(b.getAttribute('data-join'));
      $('join-stem').value = p[0]; $('join-end').value = p[1]; $('join-form').value = p[2];
      update();
    });
    update();
  }

  function buildDissTable(el) {
    var rows = [
      ['v + vowel + v', 'the second v → n', [['luasa', 'f.samon.past.5'], ['keavasa', 'f.samon.past.4'], ['veasa', 'f.samon.past.1'], ['veasa', 'v']]],
      ['j + vowel + j', 'the second j → n', [['juasa', 'f.namon.future.0'], ['juasa', 'f.samon.present.0'], ['juasa', 'g.samon']]],
      ['x + vowel + x', 'the second x → g', [['xasa', 'f.exmon.present.1'], ['xasa', 'f.exmon.present.2'], ['ixasa', 'f.exmon.present.0'], ['ixasa', 'd.2']]]
    ];
    var h = '<table class="dt"><thead><tr><th scope="col">Pattern</th><th scope="col">Result</th><th scope="col">Examples</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      h += '<tr><td class="w">' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td class="w wrap">' + r[2].map(function (p) {
        var res = C(p[0]); var k = p[1].split('.'); var x;
        if (k[0] === 'f') { x = res.finite[k[1]][k[2]][+k[3]]; }
        else if (k[0] === 'g') { x = res.gerund[k[1]]; }
        else if (k[0] === 'd') { x = res.derivations[+k[1]]; }
        else { x = res.dictionary; }
        return formLink(p[0], p[1], x.form);
      }).join(', ') + '</td></tr>';
    });
    el.innerHTML = h + '</tbody></table>';
  }

  /* ------------------------------------------------------------------ */
  /* Verbs                                                               */
  /* ------------------------------------------------------------------ */

  function classLine(info) {
    if (info.cls === 'irregular') { return 'Irregular verb: the forms come from the table in the doc.'; }
    if (info.cls === 'short') { return 'Short stem: the root is one consonant sound, so it becomes consonant + a (' + info.stem + '-).'; }
    if (info.cls === 'u') { return 'u-stem: the stem ends in u.'; }
    if (info.cls === 'e') { return 'e-stem: the stem ends in e.'; }
    var bits = [];
    if (info.cluster) { bits.push('it ends in two consonants, so imperatives put the person vowel in first'); }
    if (info.rl) { bits.push('it ends in ' + info.stem.slice(-1) + ', so the namon past plural keeps the person vowel'); }
    if (info.yFinal) { bits.push('it ends in y, so an ending\'s i becomes e'); }
    if (info.issues && info.issues.indexOf('noVowel') !== -1) { bits.push('its root has no vowel, so the imperatives that lengthen a vowel cannot be built'); }
    return 'Consonant stem' + (bits.length ? ': ' + bits.join('; ') + '.' : '.');
  }

  function buildClassifyTool(el) {
    el.innerHTML = '<div class="tool-h"><h4>Which class is this verb?</h4><p>Type any samon base, ending in -asa.</p></div>' +
      '<div class="fields"><div class="field w1"><label for="cls-base">Samon base</label><input id="cls-base" type="text" value="łasa" autocomplete="off" autocapitalize="off" spellcheck="false"></div></div>' +
      exampleChips(['labasa', 'xasa', 'łasa', 'luasa', 'nileasa', 'adrasa', 'kahyasa', 'pyelasa'], 'data-cls') +
      '<div class="out" id="cls-out" aria-live="polite"></div>';
    function update() {
      var base = $('cls-base').value.trim().toLowerCase();
      var out = $('cls-out');
      if (!base) { out.innerHTML = '<p class="why">Type a samon base.</p>'; return; }
      var res;
      try { res = C(base); } catch (e) { out.innerHTML = '<p class="out-err">' + esc(e.message) + '</p>'; return; }
      var info = res.info;
      var known = BY_BASE[base];
      out.innerHTML = '<p class="why">' + esc(classLine(info)) + (known ? '' : ' This verb is not in the lexicon.') + '</p>' +
        '<table class="dt"><tbody>' +
        L.FORMS.map(function (f) {
          return '<tr class="m-' + f + '"><th scope="row"><span class="th-mode">' + GLYPH[f] + f + '</span></th><td class="w">' + esc(info.bases[f]) + '</td><td>' +
            esc((known && known.meanings && known.meanings[f]) || '') + '</td></tr>';
        }).join('') +
        '<tr><th scope="row">dictionary form</th><td class="w">' + esc(res.dictionary.form) + '</td><td class="ipa">' + esc(res.dictionary.ipa) + '</td></tr>' +
        '</tbody></table>' +
        '<p><a class="vchip" href="' + verbHref(base) + '">Open ' + esc(base) + ' in the conjugator</a></p>';
    }
    el.addEventListener('input', update);
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-cls]');
      if (!b) { return; }
      $('cls-base').value = JSON.parse(b.getAttribute('data-cls'));
      update();
    });
    update();
  }

  function buildEndings(el) {
    var notes = {
      samon: '3p future: <i>-ana</i> after a consonant, <i>-na</i> after a vowel.',
      namon: 'Stems in r or l keep the person vowel in the plural past: <i>-aran, -iras, -urun</i>.',
      exmon: 'x → g between o or u and a following u.'
    };
    var h = '';
    L.FORMS.forEach(function (f) {
      h += '<div class="tw m-' + f + '"><table class="dt"><caption>' + notes[f] + '</caption><thead><tr><th scope="col"><span class="th-mode">' + GLYPH[f] + f + '</span></th>' +
        L.TENSES.map(function (t) { return '<th scope="col">' + t + '</th>'; }).join('') + '</tr></thead><tbody>';
      L.PERSONS.forEach(function (p, i) {
        h += '<tr><th scope="row">' + p + '</th>' + L.TENSES.map(function (t) { return '<td class="w">-' + esc(L.ENDINGS[f][t][i]) + '</td>'; }).join('') + '</tr>';
      });
      h += '</tbody></table></div>';
    });
    el.innerHTML = h;
  }

  function buildImperatives(el) {
    var bases = ['labasa', 'adrasa', 'xasa', 'luasa', 'leasa', 'mailasa'];
    var rows = ['2s', '2p', '1p', '3'];
    var h = '<div class="pair">';
    L.FORMS.forEach(function (f) {
      h += '<table class="dt m-' + f + '"><thead><tr><th scope="col"><span class="th-mode">' + GLYPH[f] + f + '</span></th>' +
        bases.map(function (b) { return '<th scope="col">' + esc(b) + '</th>'; }).join('') + '</tr></thead><tbody>';
      rows.forEach(function (p, i) {
        h += '<tr><th scope="row">' + p + '</th>' + bases.map(function (b) {
          var x = C(b).imperative[f][i];
          return '<td class="w">' + (x.form ? formLink(b, 'i.' + f + '.' + i, x.form) : '—') + '</td>';
        }).join('') + '</tr>';
      });
      h += '</tbody></table>';
    });
    el.innerHTML = h + '</div>';
  }

  function buildImon(el) {
    var list = [
      ['labasa', 'samon', 'present', 0, 'I would love'],
      ['labasa', 'namon', 'present', 0, 'namon'],
      ['labasa', 'exmon', 'present', 0, 'exmon'],
      ['enasa', 'samon', 'present', 1, 'you would understand'],
      ['eruasa', 'samon', 'past', 0, 'I would have died'],
      ['irrasa', 'samon', 'present', 0, 'the i → e rule after y does not touch the prefix'],
      ['kasa', 'samon', 'present', 1, 'exempt from the length rule'],
      ['endelabasa', 'samon', 'present', 0, 'ende- loses its e after ī-: īnde-']
    ];
    var h = '<table class="dt"><thead><tr><th scope="col">Form</th><th scope="col">Īmon</th><th scope="col">IPA</th><th scope="col">Note</th></tr></thead><tbody>';
    list.forEach(function (p) {
      var x = C(p[0]).finite[p[1]][p[2]][p[3]];
      var key = 'f.' + p[1] + '.' + p[2] + '.' + p[3];
      h += '<tr><td class="w">' + formLink(p[0], key, x.form) + '</td><td class="w">' + formLink(p[0], key, x.imon.form, true) + '</td>' +
        '<td class="ipa">' + esc(x.imonIpa) + '</td><td class="why">' + esc(p[4]) + '</td></tr>';
    });
    el.innerHTML = h + '</tbody></table>';
  }

  function buildGerunds(el) {
    var bases = ['labasa', 'xasa', 'luasa', 'juasa', 'leasa', 'kahyasa', 'łasa'];
    var h = '<table class="dt"><thead><tr><th scope="col">Dictionary form</th><th scope="col">Class</th><th scope="col">Samon -ior</th><th scope="col">Namon -inve</th><th scope="col">Exmon -anga</th></tr></thead><tbody>';
    bases.forEach(function (b) {
      var r = C(b);
      var cls = { consonant: 'consonant', short: 'short', u: 'u-stem', e: 'e-stem' }[r.info.cls] + (r.info.yFinal ? ', ends in y' : '');
      h += '<tr><td class="w">' + formLink(b, 'v', r.dictionary.form) + '' + '</td><td class="why">' + esc(cls) + '</td>' +
        L.FORMS.map(function (f) { return '<td class="w">' + formLink(b, 'g.' + f, r.gerund[f].form) + '</td>'; }).join('') + '</tr>';
    });
    el.innerHTML = h + '</tbody></table>';
  }

  /* ------------------------------------------------------------------ */
  /* Cases                                                               */
  /* ------------------------------------------------------------------ */

  function shape(c, n) {
    var s = L.caseEndingShapes(c, n);
    if (c.id === 'A' && n === 'sg') { return 'bare'; }
    // consonant first, vowel second, as everywhere in the doc
    return s[0] === s[1] ? '-' + s[0] : '-' + s[1] + ' / -' + s[0];
  }

  function buildCaseEndings(el) {
    var h = '<table class="dt"><thead><tr><th scope="col">Case</th><th scope="col">Singular<br>(after consonant / vowel)</th><th scope="col">Plural, animate</th><th scope="col">Plural, inanimate</th></tr></thead><tbody>';
    L.CASES.forEach(function (c) {
      h += '<tr><th scope="row">' + c.id + ' · ' + esc(c.name) + '</th>' + ['sg', 'an', 'in'].map(function (n) { return '<td class="w">' + esc(shape(c, n)) + '</td>'; }).join('') + '</tr>';
    });
    el.innerHTML = h + '</tbody></table>';
  }

  var NOUN_ANIMACY = {};
  (LEX.nouns || []).forEach(function (n) { if (n.animacy) { NOUN_ANIMACY[n.word.toLowerCase()] = n.animacy; } });

  function buildDeclineTool(el) {
    el.innerHTML = '<div class="tool-h"><h4>Decline any word</h4><p>Nouns and adjectives take the same endings.</p></div>' +
      '<div class="fields">' +
      '<div class="field w1"><label for="decl-word">Word (bare form)</label><input id="decl-word" type="text" value="osil" autocomplete="off" autocapitalize="off" spellcheck="false"></div>' +
      '<div class="field w2"><label for="decl-anim">Animacy</label><select id="decl-anim"><option value="animate">animate</option><option value="inanimate">inanimate</option><option value="">not sure</option></select></div>' +
      '</div>' +
      exampleChips(['osil', 'rāma', 'ixa', 'zen', 'heneu', 'fastuox', 'albade', 'ney', 'maū'], 'data-decl') +
      '<div class="out" id="decl-out" aria-live="polite"></div>';
    var current = null;
    function cellBox(c, n) {
      var x = current.cases.filter(function (r) { return r.id === c; })[0][n];
      $('decl-cell').innerHTML = '<p class="why">' + esc(c) + ', ' + esc(L.NUMBER_NAMES[n]) + ': <i>' + esc(x.form) + '</i> <span class="ipa">' + esc(x.ipa) + '</span></p>' +
        UI.chain(x, { caption: 'word + case ending' });
      var bs = el.querySelectorAll('button.cf');
      for (var k = 0; k < bs.length; k++) { bs[k].setAttribute('aria-pressed', bs[k].getAttribute('data-cell') === c + '.' + n ? 'true' : 'false'); }
    }
    function update(fromWord) {
      var word = $('decl-word').value.trim().toLowerCase();
      var out = $('decl-out');
      if (fromWord && NOUN_ANIMACY[word]) { $('decl-anim').value = NOUN_ANIMACY[word]; }
      if (!word) { out.innerHTML = '<p class="why">Type a word.</p>'; return; }
      try { current = L.decline(word); } catch (e) { out.innerHTML = '<p class="out-err">' + esc(e.message) + '</p>'; return; }
      var anim = $('decl-anim').value;
      var h = (current.oblique !== current.word ? '<p class="why">Endings attach to <i>' + esc(current.oblique) + '-</i>: ' + esc(current.word === 'ney' ? L.RULES.obl_ne.text : L.RULES.ox_obl.text) + '.</p>' : '') +
        '<div class="tw"><table class="dt"><thead><tr><th scope="col">Case</th><th scope="col">Singular</th><th scope="col">Plural, animate</th><th scope="col">Plural, inanimate</th></tr></thead><tbody>';
      current.cases.forEach(function (c) {
        h += '<tr><th scope="row">' + c.id + ' · ' + esc(c.name) + '</th>' + ['sg', 'an', 'in'].map(function (n) {
          var dim = anim && n !== 'sg' && ((anim === 'animate' && n === 'in') || (anim === 'inanimate' && n === 'an'));
          return '<td class="w' + (dim ? ' dim' : '') + '"><button type="button" class="cf" data-cell="' + c.id + '.' + n + '" aria-pressed="false">' + esc(c[n].form) + '</button></td>';
        }).join('') + '</tr>';
      });
      h += '</tbody></table></div><div class="cellbox" id="decl-cell"></div>';
      out.innerHTML = h;
      cellBox('S', 'sg');
    }
    el.addEventListener('input', function (ev) { update(ev.target.id === 'decl-word'); });
    el.addEventListener('change', function (ev) { if (ev.target.id === 'decl-anim') { update(false); } });
    el.addEventListener('click', function (ev) {
      var cell = ev.target.closest('button.cf');
      if (cell) { var p = cell.getAttribute('data-cell').split('.'); cellBox(p[0], p[1]); return; }
      var b = ev.target.closest('[data-decl]');
      if (!b) { return; }
      $('decl-word').value = JSON.parse(b.getAttribute('data-decl'));
      $('decl-anim').value = NOUN_ANIMACY[$('decl-word').value] || '';
      update(false);
    });
    update(true);
  }

  function buildPronouns(el) {
    var table = L.pronounTable();
    var rows = [['A', 'transitive subject (bare)'], ['obl', 'oblique stem'], ['S', 'intransitive subject'], ['O', 'accusative'], ['ALL', 'allative / dative'],
      ['GEN', 'genitive'], ['ABL', 'ablative'], ['COM', 'comitative-instrumental'], ['ABE', 'abessive']];
    function show(p, f) { return p.optionalG && /^gu/.test(f) && f !== 'gū' ? '(g)' + f.slice(1) : f; }
    var h = '<table class="dt"><thead><tr><th scope="col">Case</th>' + table.map(function (p) { return '<th scope="col">' + p.person + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      h += '<tr><th scope="row">' + (r[0] === 'obl' ? '' : r[0] + ' · ') + esc(r[1]) + '</th>' + table.map(function (p) {
        if (r[0] === 'obl') { return '<td class="w">' + esc(show(p, p.oblique)) + '-</td>'; }
        var x = p.cases[r[0]];
        return '<td class="w' + (x.byRule ? ' exc" title="Listed in the doc; the rule alone gives ' + esc(x.byRule) : '') + '">' + esc(show(p, x.form)) + '</td>';
      }).join('') + '</tr>';
    });
    el.innerHTML = h + '</tbody><caption>* The doc lists these as exceptions: <i>gam</i> (the rule gives gum), <i>īsse</i> (īssise, contracted), <i>daūne</i> and <i>daūłe</i> (dāvūne, dāvūłe). Every other form comes from the rules.</caption></table>';
  }

  function buildDemonstratives(el) {
    var words = ['ney', 'nal', 'gval', 'maū'];
    var decs = words.map(function (w) { return L.decline(w); });
    var h = '<table class="dt"><thead><tr><th scope="col">Case</th>' + words.map(function (w) { return '<th scope="col">' + w + '</th>'; }).join('') + '</tr></thead><tbody>';
    L.CASES.forEach(function (c, i) {
      h += '<tr><th scope="row">' + c.id + ' · ' + esc(c.name) + '</th>' + decs.map(function (d) { return '<td class="w">' + esc(d.cases[i].sg.form) + '</td>'; }).join('') + '</tr>';
    });
    h += '<tr><th scope="row">plural animate (bare)</th>' + decs.map(function (d) { return '<td class="w">' + esc(d.cases[0].an.form) + '</td>'; }).join('') + '</tr>';
    h += '<tr><th scope="row">plural inanimate (bare)</th>' + decs.map(function (d) { return '<td class="w">' + esc(d.cases[0]['in'].form) + '</td>'; }).join('') + '</tr>';
    el.innerHTML = h + '</tbody></table>';
  }

  function buildPlaces(el) {
    var groups = [
      ['Place', [['ine', 'here'], ['nale', 'there'], ['gvale', 'yonder'], ['maūi', 'a place you can\'t see']]],
      ['Time', [['nar', 'time: later, earlier'], ['tēlla', 'day: tomorrow, yesterday']]],
      ['Questions', [['xamah', 'where: to where, from where']]],
      ['Space', [['nä', 'in, at, on'], ['men', 'inside: into, out of'], ['ibu', 'on top: onto, off of'], ['bua', 'under'], ['har', 'near: approaching, moving away'], ['eked', 'beside'], ['menrakeden', 'between']]]
    ];
    var h = '<table class="dt"><thead><tr><th scope="col">Word</th><th scope="col">Meaning</th><th scope="col">+ toward (allative)</th><th scope="col">+ from (ablative)</th></tr></thead>';
    groups.forEach(function (g) {
      h += '<tbody><tr><th scope="rowgroup" colspan="4" class="tag">' + g[0] + '</th></tr>';
      g[1].forEach(function (p) {
        var d = L.decline(p[0]);
        h += '<tr><td class="w">' + esc(p[0]) + '</td><td>' + esc(p[1]) + '</td><td class="w">' + esc(d.cases[3].sg.form) + '</td><td class="w">' + esc(d.cases[5].sg.form) + '</td></tr>';
      });
      h += '</tbody>';
    });
    el.innerHTML = h + '<caption>Location words are postpositions, written after the noun with a dash. Through (<i>drav</i>), across (<i>käxed</i>) and around (<i>bas</i>) describe a path and take no direction cases.</caption></table>';
  }

  /* ------------------------------------------------------------------ */
  /* Adjectives                                                          */
  /* ------------------------------------------------------------------ */

  function buildParticiples(el) {
    var bases = [['fastuasa', 'u-stem'], ['miadeasa', 'e-stem'], ['kasa', 'short stem'], ['labasa', 'consonant stem'], ['dabasa', 'consonant stem'], ['łasa', 'short stem (ł)']];
    var types = [['samon participle', 'the subject the event happened to'], ['namon participle', 'an inner state; also figurative'], ['exmon participle', 'the target: someone did this to them'], ['active adjective', 'what causes the state']];
    var h = '<table class="dt"><thead><tr><th scope="col">Verb</th>' + types.map(function (t) { return '<th scope="col" title="' + esc(t[1]) + '">' + esc(t[0]) + '</th>'; }).join('') + '</tr></thead><tbody>';
    bases.forEach(function (b) {
      h += '<tr><td class="w">' + esc(b[0]) + ' <span class="why">' + esc(b[1]) + '</span></td>' + types.map(function (t) {
        var res = C(b[0]);
        var i = -1;
        res.derivations.forEach(function (d, k) { if (d.label === t[0]) { i = k; } });
        var d = res.derivations[i];
        return '<td class="w">' + formLink(b[0], 'd.' + i, d.form) + '</td>';
      }).join('') + '</tr>';
    });
    el.innerHTML = h + '</tbody><caption>Built from: the stem (for consonant stems, the bare stem: no e); stem + r (consonant stems: + er); stem + ox; root + anga. Hover a column for whom it describes.</caption></table>';
  }

  function buildAdjDeclension(el) {
    var words = ['fastu', 'fastur', 'fastuox', 'fastanga'];
    var labels = ['samon participle', 'namon participle', 'exmon participle', 'active adjective'];
    var decs = words.map(function (w) { return L.decline(w); });
    var h = '<table class="dt"><thead><tr><th scope="col">Case</th>' + words.map(function (w, i) { return '<th scope="col">' + esc(labels[i]) + '<span class="th-word">' + esc(w) + '</span></th>'; }).join('') + '</tr></thead><tbody>';
    L.CASES.forEach(function (c, i) {
      h += '<tr><th scope="row">' + c.id + ' · ' + esc(c.name) + '</th>' + decs.map(function (d, j) {
        var f = d.cases[i].sg.form;
        return '<td class="w">' + esc(f) + '</td>';
      }).join('') + '</tr>';
    });
    el.innerHTML = h + '</tbody><caption><i>fastuxūłe</i>: ł is one sound, and dissimilation never changes a case ending (the doc had <i>fastuxūgle</i>).</caption></table>';
  }

  function buildNounAdjectives(el) {
    var d = L.decline('alba');
    var rows = [['GEN', 'of red', 'red by nature; red is what it is'], ['COM', 'with red', 'has red on it: marked, stained, partly red'], ['ABE', 'without red', 'lacking red, faded, pale']];
    var h = '<table class="dt"><thead><tr><th scope="col">Form</th><th scope="col">Literally</th><th scope="col">Sense</th><th scope="col">Declined: S, O</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      var f = d.cases.filter(function (c) { return c.id === r[0]; })[0].sg.form;
      var a = L.decline(f);
      h += '<tr><td class="w">' + esc(f) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td class="w">' + esc(a.cases[1].sg.form) + ', ' + esc(a.cases[2].sg.form) + '</td></tr>';
    });
    el.innerHTML = h + '</tbody></table>';
  }

  function buildAdverbTool(el) {
    el.innerHTML = '<div class="tool-h"><h4>Make a manner adverb</h4><p>From an adjective or a noun.</p></div>' +
      '<div class="fields"><div class="field w1"><label for="adv-word">Adjective or noun</label><input id="adv-word" type="text" value="fastu" autocomplete="off" autocapitalize="off" spellcheck="false"></div></div>' +
      exampleChips(['fastu', 'miade', 'ixahekanga', 'ixa', 'ilus'], 'data-adv') +
      '<div class="out" id="adv-out" aria-live="polite"></div>';
    function update() {
      var w = $('adv-word').value.trim().toLowerCase();
      var out = $('adv-out');
      if (!w) { out.innerHTML = '<p class="why">Type a word.</p>'; return; }
      if (!LETTERS.test(w)) { out.innerHTML = '<p class="out-err">Use Lunde letters only.</p>'; return; }
      var a = L.adverb(w);
      out.innerHTML = '<p class="big">' + esc(a.form) + '</p><p class="why">' + esc(L.RULES[a.rules[0]].text) + '.</p>';
    }
    el.addEventListener('input', update);
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-adv]');
      if (!b) { return; }
      $('adv-word').value = JSON.parse(b.getAttribute('data-adv'));
      update();
    });
    update();
  }

  /* ------------------------------------------------------------------ */
  /* Word formation                                                      */
  /* ------------------------------------------------------------------ */

  function buildSuffixes(el) {
    var rows = [
      ['-on', 'a person, from an adjective or a place', [['fastuasa', '-on from the samon participle'], ['fastuasa', '-on from the namon participle'], ['fastuasa', '-on from the exmon participle'], ['fastuasa', '-on from the active adjective'], ['miadeasa', '-on from the samon participle']]],
      ['-os', 'an essence', [['fastuasa', '-os (essence)'], ['eruasa', '-os (essence)'], ['labasa', '-os (essence)'], ['miadeasa', '-os (essence)'], ['juasa', '-os (essence)']]],
      ['-li', 'an object', [['keavasa', '-li (object)'], ['edeasa', '-li (object)'], ['tesseasa', '-li (object)'], ['kahyasa', '-li (object)']]],
      ['-diun', 'an animal', [['fastuasa', '-diun (animal)'], ['kamuasa', '-diun (animal)'], ['miadeasa', '-diun (animal)']]],
      ['-ver', 'someone who does the verb', [['labasa', '-ver (one who does it)'], ['edeasa', '-ver (one who does it)'], ['gistasa', '-ver (one who does it)'], ['veasa', '-ver (one who does it)'], ['miadeasa', '-ver (one who does it)']]],
      ['-fuar', 'someone who creates the action or thing', [['kamuasa', '-fuar (one who creates it)'], ['pyezasa', '-fuar (one who creates it)'], ['tesseasa', '-fuar (one who creates it)'], ['miadeasa', '-fuar (one who creates it)']]],
      ['-del', 'an object that does the verb, a machine', [['keavasa', '-del (machine)'], ['kamuasa', '-del (machine)'], ['värasa', '-del (machine)']]]
    ];
    var h = '<table class="dt"><thead><tr><th scope="col">Suffix</th><th scope="col">Makes</th><th scope="col">Examples, built by the engine</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      h += '<tr><td class="w">' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td class="w wrap">' + r[2].map(function (p) {
        var res = C(p[0]);
        var i = -1;
        res.derivations.forEach(function (d, k) { if (d.label === p[1]) { i = k; } });
        return formLink(p[0], 'd.' + i, res.derivations[i].form);
      }).join(', ') + '</td></tr>';
    });
    el.innerHTML = h + '</tbody><caption><i>vener</i> (a hater) shows dissimilation: ve + ver. <i>-del</i> comes from <i>delasa</i>, to function.</caption></table>';
  }

  function buildPrefixes(el) {
    var rows = [
      ['endelabasa', 'samon', 'love deeply'], ['endelabasa', 'namon', 'fall in love inside'], ['łendelabasa', 'samon', 'fall out of love'],
      ['łendelabasa', 'namon', 'be heartbroken'], ['łeservasa', 'namon', 'forget'], ['endeservasa', 'exmon', 'indoctrinate'], ['endefastuasa', 'exmon', 'blind by force']
    ];
    var h = '<table class="dt"><thead><tr><th scope="col">Verb</th><th scope="col">Meaning</th><th scope="col">1s present</th><th scope="col">Īmon</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      var res = C(r[0]);
      var x = res.finite[r[1]].present[0];
      var key = 'f.' + r[1] + '.present.0';
      h += '<tr class="m-' + r[1] + '"><td class="w">' + esc(res.info.bases[r[1]]) + '</td><td>' + esc(r[2]) + '</td><td class="w">' + formLink(r[0], key, x.form) + '</td>' +
        '<td class="w">' + formLink(r[0], key, x.imon.form, true) + '</td></tr>';
    });
    el.innerHTML = h + '</tbody><caption>Before ende-, the īmon gives īnde-: ende- loses its e after a vowel-final prefix.</caption></table>';
  }

  /* ------------------------------------------------------------------ */
  /* Numbers                                                             */
  /* ------------------------------------------------------------------ */

  function buildDigits(el) {
    var h = '<table class="dt"><thead><tr><th scope="col">Value</th><th scope="col">Counting</th><th scope="col">Before a noun</th></tr></thead><tbody>';
    if (L.ZERO) { h += '<tr><td>0</td><td class="w">—</td><td class="w">' + esc(L.numberWord(0).form) + '</td></tr>'; }
    L.DIGITS.forEach(function (d, i) {
      h += '<tr><td>' + (i + 1) + '</td><td class="w">' + esc(L.numberWord(i + 1, { counting: true }).form) + '</td><td class="w">' + esc(L.numberWord(i + 1).form) + '</td></tr>';
    });
    el.innerHTML = h + '</tbody></table>';
  }

  function buildPowers(el) {
    var sup = ['', '¹', '²', '³', '⁴'];
    var h = '<table class="dt"><thead><tr><th scope="col">Word</th><th scope="col">Value</th><th scope="col">Power</th></tr></thead><tbody>';
    L.POWERS.slice().reverse().forEach(function (p, i) {
      h += '<tr><td class="w">' + esc(p[0]) + '</td><td style="font-variant-numeric:tabular-nums">' + p[1].toLocaleString('en-US') + '</td><td>12' + sup[i + 1] + '</td></tr>';
    });
    el.innerHTML = h + '</tbody></table>';
  }

  function buildNumberTool(el) {
    el.innerHTML = '<div class="tool-h"><h4>Say a number</h4><p>From 0 to ' + L.NUMBER_MAX.toLocaleString('en-US') + '.</p></div>' +
      '<div class="fields"><div class="field w2"><label for="num-value">Number</label><input id="num-value" type="number" min="0" max="' + L.NUMBER_MAX + '" step="1" value="2026"></div></div>' +
      exampleChips([0, 7, 13, 24, 50, 100, 144, 2026, 20736], 'data-num') +
      '<div class="out" id="num-out" aria-live="polite"></div>';
    function update() {
      var v = $('num-value').value;
      var out = $('num-out');
      var r;
      try { r = L.numberWord(v); } catch (e) { out.innerHTML = '<p class="out-err">' + esc(e.message) + '</p>'; return; }
      if (r.value === 0) { out.innerHTML = '<p class="big">' + esc(r.form) + '</p><p class="why">Zero. Inside a bigger number an empty place is left out.</p>'; return; }
      var digits = r.value.toString(12).split('').map(function (c) { return parseInt(c, 12); });
      out.innerHTML = '<p class="big">' + esc(r.form) + '</p>' +
        '<p class="breakdown">' + r.parts.map(function (p) {
          return p.unit === 1 ? p.value + ' <i>' + esc(p.word) + '</i>' : p.digit + ' × ' + p.unit.toLocaleString('en-US') + ' <i>' + esc(p.word) + '</i>';
        }).join(' + ') + ' = ' + r.value.toLocaleString('en-US') + '</p>' +
        '<p class="why">In base twelve the digits are ' + digits.join(' · ') + '. ' +
        (r.value <= 12 ? 'When counting: <i>' + esc(L.numberWord(r.value, { counting: true }).form) + '</i>. ' : '') +
        'Ordinal: <i>' + esc(L.ordinal(r.value)) + '</i>.</p>';
    }
    el.addEventListener('input', update);
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-num]');
      if (!b) { return; }
      $('num-value').value = JSON.parse(b.getAttribute('data-num'));
      update();
    });
    update();
  }

  /* ------------------------------------------------------------------ */
  /* Start                                                               */
  /* ------------------------------------------------------------------ */

  var BUILD = {
    'tool-ipa': buildIpaTool, 'stress-table': buildStressTable,
    'pipeline': buildPipeline, 'vowel-matrix': buildMatrix, 'tool-join': buildJoinTool, 'diss-table': buildDissTable,
    'tool-classify': buildClassifyTool, 'endings': buildEndings, 'imperatives': buildImperatives, 'imon': buildImon, 'gerunds': buildGerunds,
    'case-endings': buildCaseEndings, 'tool-decline': buildDeclineTool, 'pronouns': buildPronouns, 'demonstratives': buildDemonstratives, 'places': buildPlaces,
    'participles': buildParticiples, 'adj-declension': buildAdjDeclension, 'noun-adjectives': buildNounAdjectives, 'tool-adverb': buildAdverbTool,
    'suffixes': buildSuffixes, 'prefixes': buildPrefixes,
    'digits': buildDigits, 'powers': buildPowers, 'tool-number': buildNumberTool
  };
  var blocks = document.querySelectorAll('[data-build]');
  for (var i = 0; i < blocks.length; i++) {
    var fn = BUILD[blocks[i].getAttribute('data-build')];
    if (!fn) { continue; }
    try { fn(blocks[i]); }
    catch (err) { blocks[i].innerHTML = '<p class="out-err">This part could not be built: ' + esc(err.message) + '</p>'; }
  }


  // Contents: mark the section being read.
  var links = document.querySelectorAll('.toc a');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        for (var k = 0; k < links.length; k++) { links[k].setAttribute('aria-current', links[k].getAttribute('href') === '#' + en.target.id ? 'true' : 'false'); }
      });
    }, { rootMargin: '-15% 0px -75% 0px' });
    document.querySelectorAll('.gsec').forEach(function (s) { io.observe(s); });
  }

  // A deep link to a section works once the blocks are built.
  var hash = (window.location.hash || '').slice(1);
  if (hash) { var target = document.getElementById(hash); if (target) { target.scrollIntoView({ block: 'start' }); } }
}());
