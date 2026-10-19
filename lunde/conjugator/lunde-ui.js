/*
 * Lunde site: shared helpers and data for the conjugator and the grammar page.
 * Needs window.Lunde. Exposes window.LundeUI.
 */
(function (root) {
  'use strict';
  var L = root.Lunde;
  var UI = {};

  /* ---------- text helpers ---------- */
  UI.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  UI.norm = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  UI.slugOf = function (base) { return UI.norm(String(base).replace(/ä/g, 'ae').replace(/à/g, 'ag')).replace(/[^a-z0-9]/g, ''); };
  UI.plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : many); };
  UI.store = function (k, v) { try { root.localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } };
  UI.recall = function (k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } };
  UI.cap = function (s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };

  /* Mode glyphs: samon = the event (a dot), namon = inside (a dot in a ring), exmon = outward (a dot with an arrow). */
  UI.GLYPH = {
    samon: '<svg class="g" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="4.6" fill="currentColor"/></svg>',
    namon: '<svg class="g" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.1" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="8" r="2.5" fill="currentColor"/></svg>',
    exmon: '<svg class="g" viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="8" r="3.6" fill="currentColor"/><path d="M9.6 8h4.6M12 5.6 14.4 8 12 10.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  UI.MODE_GIST = { samon: 'the event', namon: 'experienced inside', exmon: 'directed outward' };
  UI.CASE_ABBR = { A: 'A', S: 'S', O: 'O', ALL: 'ALL', GEN: 'GEN', ABL: 'ABL', COM: 'COM', ABE: 'ABE' };
  UI.SECTION_ORDER = [
    'Sound rules: vowel contact', 'Sound rules: glides', 'Sound rules: length rule', 'Sound rules: dissimilation',
    'Samon conjugation', 'Namon conjugation', 'Imperatives', 'Īmon and gerunds', 'Prefixes',
    'Adjectives from verbs', 'Nouns from verbs', 'Cases', 'Pronouns', 'Adverbs', 'To be'
  ];

  /** Marks what changed between two spellings: new letters underlined, dropped letters struck. */
  UI.diffMark = function (prev, next) {
    var esc = UI.esc;
    if (prev == null) { return esc(next); }
    var a = Array.from(prev), b = Array.from(next);
    var i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) { i++; }
    var j = 0;
    while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) { j++; }
    var head = esc(b.slice(0, i).join(''));
    var tail = esc(b.slice(b.length - j).join(''));
    var added = b.slice(i, b.length - j).join('');
    var dropped = a.slice(i, a.length - j).join('');
    if (added) { return head + '<mark>' + esc(added) + '</mark>' + tail; }
    if (dropped) { return head + '<mark class="gap" title="dropped: ' + esc(dropped) + '"><span class="sr">' + esc(dropped) + ' dropped here</span></mark>' + tail; }
    return esc(next);
  };

  /** A rule in a derivation: a button (to light up the forms it shaped) or a plain note. */
  UI.ruleItem = function (id, opts) {
    var r = L.RULES[id] || { text: id, section: '' };
    if (opts && opts.buttons) {
      return '<button type="button" class="c-rbtn" data-rule="' + id + '" aria-pressed="' + (opts.pressed === id) + '">' +
        '<span>' + UI.esc(r.text) + '</span><small>' + UI.esc(r.section) + '</small></button>';
    }
    return '<span class="c-rnote"><span>' + UI.esc(r.text) + '</span><small>' + UI.esc(r.section) + '</small></span>';
  };

  /**
   * The derivation chain of a form: { underlying, steps: [{ rules, form }], form }.
   * opts: { caption, extraSteps, buttons, pressed, irregularNote }
   */
  UI.chain = function (x, opts) {
    opts = opts || {};
    var esc = UI.esc;
    if (x.rules && x.rules[0] === 'irr') {
      return '<ol class="chain anim"><li class="c-node final" style="--i:0"><span class="c-form">' + esc(opts.shown || x.form) + '</span></li></ol>' +
        '<p class="d-note">' + esc(opts.irregularNote || 'Irregular: this form comes from the table in the doc. No rule builds it.') + '</p>';
    }
    var rows = [];
    var k = 0;
    var prev = null;
    if (x.underlying) {
      rows.push('<li class="c-node c-start" style="--i:' + (k++) + '"><span class="c-under">' + esc(x.underlying) + '</span>' +
        (opts.caption ? '<span class="c-cap">' + esc(opts.caption) + '</span>' : '') + '</li>');
      prev = x.underlying.replace(/-? \+ /g, '');
    }
    var steps = (x.steps || []).concat(opts.extraSteps || []);
    if (!steps.length) {
      rows.push('<li class="c-rule c-none" style="--i:' + (k++) + '"><span>No rule changes anything: the parts join as they are.</span></li>');
      rows.push('<li class="c-node final" style="--i:' + (k++) + '"><span class="c-form">' + esc(x.form) + '</span></li>');
    } else {
      steps.forEach(function (s, n) {
        rows.push('<li class="c-rule" style="--i:' + (k++) + '">' + s.rules.map(function (id) { return UI.ruleItem(id, opts); }).join('') + '</li>');
        rows.push('<li class="c-node' + (n === steps.length - 1 ? ' final' : '') + '" style="--i:' + (k++) + '"><span class="c-form">' + UI.diffMark(prev, s.form) + '</span></li>');
        prev = s.form;
      });
    }
    return '<ol class="chain anim">' + rows.join('') + '</ol>';
  };

  /** A compact declension table (8 cases × singular and both plurals). */
  UI.miniDeclension = function (dec, animacy) {
    var esc = UI.esc;
    var h = '<table class="mini"><thead><tr><th scope="col">Case</th><th scope="col">Singular</th><th scope="col">Plural, an.</th><th scope="col">Plural, inan.</th></tr></thead><tbody>';
    dec.cases.forEach(function (c) {
      h += '<tr><th scope="row" title="' + esc(c.name) + '">' + c.id + '</th>' +
        ['sg', 'an', 'in'].map(function (n) {
          var dim = animacy && n !== 'sg' && ((animacy === 'animate' && n === 'in') || (animacy === 'inanimate' && n === 'an'));
          return '<td' + (dim ? ' class="na" title="not used: the noun is ' + animacy + '"' : '') + '>' + esc(c[n].form) + '</td>';
        }).join('') + '</tr>';
    });
    return h + '</tbody></table>';
  };

  /* ------------------------------------------------------------------ */
  /* Shared rule visuals                                                 */
  /* ------------------------------------------------------------------ */

  /** Vowel contact, built from the endings that really occur: M[stem vowel][ending vowel] = [{ mid, ctx, rule, keep }]. */
  UI.contactMatrix = function () {
    var stems = { a: 'xa', u: 'lu', e: 'le' };
    var cols = ['a', 'ā', 'à', 'e', 'ē', 'i', 'o', 'u', 'ū'];
    var sufs = [];
    L.FORMS.forEach(function (f) { L.TENSES.forEach(function (t) { L.ENDINGS[f][t].forEach(function (s) { sufs.push([s, f]); }); }); });
    [['ior', 'gerund'], ['inve', 'gerund'], ['anga', 'gerund'], ['ox', 'none'], ['os', 'none'], ['on', 'none']].forEach(function (p) { sufs.push(p); });
    var M = {};
    Object.keys(stems).forEach(function (v1) {
      M[v1] = {};
      cols.forEach(function (c) { M[v1][c] = []; });
      sufs.forEach(function (p) {
        var s = p[0], s0 = s.charAt(0);
        if (!M[v1][s0]) { return; }
        var rest = s.slice(1);
        var ctx = rest === '' ? 'end' : (L.isV(rest.charAt(0)) ? 'V' : 'C');
        var fired = [];
        var out = L.contact(stems[v1], s, { form: p[1] }, function (id) { fired.push(id); });
        var base = stems[v1].slice(0, -1);
        var mid = out.slice(base.length, out.length - rest.length);
        var cell = M[v1][s0];
        var hit = null;
        for (var k = 0; k < cell.length; k++) { if (cell[k].mid === mid) { hit = cell[k]; } }
        if (!hit) { hit = { mid: mid, ctx: [], rule: fired[0] || null, keep: !fired.length || fired[0] === 'no_merge' }; cell.push(hit); }
        if (hit.ctx.indexOf(ctx) === -1) { hit.ctx.push(ctx); }
      });
    });
    return { cols: cols, rows: Object.keys(stems), M: M };
  };

  UI.matrixHTML = function () {
    var esc = UI.esc;
    var mx = UI.contactMatrix();
    var CTX = { end: 'end', C: '+C', V: '+V' };
    var ORDER = { end: 0, C: 1, V: 2 };
    var h = '<div class="tw vc-wrap"><table class="vc"><caption class="sr">What happens when a stem vowel meets an ending vowel</caption><thead><tr><th class="corner" scope="col">stem ends in ↓<br>ending starts with →</th>';
    mx.cols.forEach(function (c) { h += '<th scope="col">' + c + '</th>'; });
    h += '</tr></thead><tbody>';
    mx.rows.forEach(function (v1) {
      h += '<tr><th scope="row">' + v1 + '</th>';
      mx.cols.forEach(function (c) {
        var cell = mx.M[v1][c].slice().sort(function (a, b) { return ORDER[a.ctx[0]] - ORDER[b.ctx[0]]; });
        h += '<td>';
        cell.forEach(function (o) {
          var tip = o.rule && L.RULES[o.rule] ? L.RULES[o.rule].text : 'both vowels stay';
          var ctx = cell.length > 1 ? o.ctx.sort(function (a, b) { return ORDER[a] - ORDER[b]; }).map(function (t) { return CTX[t]; }).join(' ') : '';
          if (o.rule === 'ei_samon') { ctx = 'end · samon'; }
          h += '<span class="vc-o' + (o.keep ? ' keep' : '') + '" title="' + esc(tip) + '"><span class="vc-r">' + esc(o.mid) + '</span>' +
            (ctx ? '<span class="vc-c">' + esc(ctx) + '</span>' : '') + '</span>';
        });
        h += '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table></div>' +
      '<p class="legend"><span><b class="vc-c">end</b>at the end of the word</span><span><b class="vc-c">+C</b>before a consonant</span><span><b class="vc-c">+V</b>before a vowel</span><span><i class="vc-keepnote">grey</i>both vowels stay, side by side</span></p>';
  };

  /** The order of the sound rules, shown on one real form. `x` is a finite form, `chip` the HTML that opens it. */
  UI.pipelineHTML = function (x, chip, caption) {
    var esc = UI.esc;
    var stage = {};
    (x.steps || []).forEach(function (s) {
      var id = s.rules[0];
      var k = /^len_/.test(id) ? 'length' : (id === 'yeyn' ? 'yeyn' : (/^diss_/.test(id) ? 'diss' : 'contact'));
      stage[k] = s;
    });
    var cur = x.underlying.replace(/ \+ /g, '');
    var h = '<ol class="pipe m-samon">';
    h += '<li class="on"><span class="p-name">Stem + ending</span><span class="p-form">' + esc(x.underlying) + '</span><span class="p-rule">' + esc(caption || '') + '</span></li>';
    [['contact', 'Vowel contact'], ['length', 'Length rule'], ['yeyn', 'y + ēyn → yēñ'], ['diss', 'Dissimilation']].forEach(function (p) {
      var s = stage[p[0]];
      if (s) {
        h += '<li class="on"><span class="p-name">' + p[1] + '</span><span class="p-form">' + UI.diffMark(cur, s.form) + '</span><span class="p-rule">' + esc(L.RULES[s.rules[0]].text) + '</span></li>';
        cur = s.form;
      } else {
        h += '<li><span class="p-name">' + p[1] + '</span><span class="p-form">' + esc(cur) + '</span><span class="p-rule">nothing to do in this form</span></li>';
      }
    });
    return h + '</ol><p class="blk-note">Every verb form goes through these steps in this order. The example is ' + chip + ', ‘you (plural) wanted’.</p>';
  };

  /* ------------------------------------------------------------------ */
  /* Questions: this round, what was settled, what the doc still lists   */
  /* `see` items: [root or samon base, form key, turn īmon on]          */
  /* ------------------------------------------------------------------ */

  UI.QUESTIONS = [];

  UI.SETTLED = [
    'The īmon ī- is exempt from the length rule: <i>īkō, īlūs, īxā</i> stand as they are.',
    'Before ende-, the īmon gives īnde-: <i>īndelabi, īndenilēi</i>.',
    '"After y, i becomes e" applies to every ending: <i>kahye</i>, <i>kahyeor</i>, <i>kahyenve</i>. Stems in hy are rare; kahyasa may end up irregular.',
    'Participles of consonant stems: the samon participle is the bare stem (<i>dab, ilus, lab</i>); the namon puts e before r (<i>daber, iluser</i>).',
    'xl is always one sound. xlasa conjugates like xasa, with the dictionary form <i>xlavuos</i>. <i>xlos</i> and <i>xlon</i> (bare root) and <i>xlōs, xlōn</i> are different words.',
    'Dissimilation never changes a case ending: <i>fastuxūxle, veve, keavave</i>.',
    'Every u-stem drops its u before -anga: <i>janga, langa, eranga, kamanga</i>.',
    'Imperatives lengthen the last vowel letter: <i>maīla, maīlga</i>.',
    'ixasa takes x-dissimilation: <i>ixig, ixug, ixag</i>; participle <i>ixog</i>.',
    'Colliding forms stay: <i>xōg, kōn, tavunōs</i>, and -anga for both the exmon gerund and the active adjective.',
    'lasa\'s samon imperative 2p is <i>xālun</i>.',
    'Case endings are written consonant first, vowel second: <i>-am / -m</i>, <i>-i / -yi</i>.',
    'One letter per sound: <i>ł</i> for xl, <i>ŋ</i> for ng, <i>ǵ</i> for gy (hy and rr stay). Existing words are still to be respelled.',
    'A word may end only in -st, -rr or -nt; any other final cluster takes a between its consonants: <i>idar, amap, adar, alad</i>.',
    '<i>xlōs</i> and <i>xlōn</i> exist as nouns too; context tells them from <i>xlos</i> and <i>xlon</i>.',
    'Lunde is probably built from a genitive construction; left open.',
    'The verb lexicon is right: <i>kasa</i> look, <i>kana</i> see, <i>kaxa</i> show.'
  ];

  UI.DOC_OPEN = [
    'Other exmon versions: how kamuaraxi is formed, and what -axi and -ar- mean.',
    'Finalize to be (lasa, lana, laxa); confirm the exmon past loxi against the original luxi.',
    'Which mutations the noun case endings cause.',
    'Phonology: do z, gy, j and v also change at the end of a word, as g, d and b do?',
    'Īmon: the exact range of meaning (conditional, subjunctive, or both).',
    'Consonant changes before the exmon imperative g, beyond b → v.',
    'The exmon base xaxa is assumed to escape x-dissimilation (not xaga).',
    'The meaning of namon ixana.',
    'Confirm the proposals: the deres- verbs, labosmiadeos, taxa.'
  ];

  /* ------------------------------------------------------------------ */
  /* Checks                                                              */
  /* ------------------------------------------------------------------ */

  UI.runChecks = function (lexicon) {
    try { return root.LundeRunner.run(L, root.LundeTests, lexicon); }
    catch (err) { return { error: err.message }; }
  };

  UI.badgeHTML = function (test) {
    if (!test || test.error) { return '<span class="dot"></span>The checks could not run'; }
    if (test.failed) { return '<span class="dot"></span>' + UI.plural(test.failed, 'check fails', 'checks fail'); }
    return '<span class="dot"></span>All ' + test.passed + ' checks pass' +
      (test.pending ? ' · <span class="pend">' + test.pending + ' wait on you</span>' : '');
  };

  /** The full check report, grouped by source. */
  UI.checksHTML = function (test) {
    var esc = UI.esc;
    if (!test || test.error) { return '<p class="ck-bad">The checks could not run: ' + esc(test && test.error) + '</p>'; }
    var groups = {}, order = [];
    test.results.forEach(function (r) { if (!groups[r.src]) { groups[r.src] = []; order.push(r.src); } groups[r.src].push(r); });
    var h = '';
    order.forEach(function (src) {
      var g = groups[src];
      var ok = g.filter(function (r) { return r.status === 'pass'; }).length;
      var pend = g.filter(function (r) { return r.status === 'pending'; }).length;
      var fail = g.filter(function (r) { return r.status === 'fail'; }).length;
      var vals = g.reduce(function (n, r) { return n + r.forms; }, 0);
      h += '<details class="ck-g"' + (fail || pend ? ' open' : '') + '><summary><span class="ck-src">' + esc(src) + '</span><span class="ck-c">' +
        ok + ' of ' + g.length + ' pass' + (pend ? ', ' + pend + ' wait on a decision' : '') + (fail ? ', ' + fail + ' fail' : '') + ' · ' + UI.plural(vals, 'value', 'values') + '</span></summary><ul class="ck-list">';
      g.forEach(function (r) {
        var want = [].concat(r.want);
        var shown = /^stress of /.test(r.label) ? 'syllable ' + (Number(want[0]) + 1) : want.join(' ');
        var mark = r.status === 'pass' ? '<span class="ck-ok" aria-label="passes">✓</span>' :
          (r.status === 'pending' ? '<span class="ck-pend" aria-label="waits on a decision">?</span>' : '<span class="ck-bad" aria-label="fails">✗</span>');
        h += '<li>' + mark + '<span><span class="ck-l">' + esc(r.label) + '</span> <span class="ck-forms">' + esc(shown) + '</span>' +
          (r.status === 'fail' ? '<span class="ck-got">engine gives: ' + esc([].concat(r.got).join(' ')) + '</span>' : '') +
          (r.status === 'pending' ? '<span class="ck-got pend">engine gives ' + esc([].concat(r.got).join(' ')) + ' · ' + esc(r.pending) + '</span>' : '') +
          '</span></li>';
      });
      h += '</ul></details>';
    });
    return h;
  };

  root.LundeUI = UI;
}(typeof self !== 'undefined' ? self : this));
