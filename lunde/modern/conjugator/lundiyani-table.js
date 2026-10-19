/*
 * Lundiyani conjugation tables, laid out like the Lunde verb conjugator: one card per particle group,
 * persons down the side, tense or mood across the top. Every cell comes from Lundiyani.build() (the engine
 * built from the grammar PDF); a cell the grammar does not specify is shown as a dash, never guessed.
 * Shared by the page and the Node check (every lexicon verb must render).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); } else { root.LundiyaniTable = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var NS = 'not specified in the grammar';
  // Columns: the tense or mood slot. No particle = present (i vera ne, "I do it").
  var COLS = [['', 'present', ''], ['lo', 'past', 'lo'], ['na', 'future', 'na'], ['lei', 'conditional', 'lei']];
  // Cards: the other slots, as the grammar's particle table lists them. talei = habitual (never "imperfective").
  var CARDS = [
    { id: 'plain', name: 'plain', parts: '', gist: 'no particle before the tense', o: {} },
    { id: 'neg', name: 'negative', parts: 'lan', gist: 'lan, negation', o: { neg: true } },
    { id: 'prog', name: 'progressive', parts: 'lai', gist: 'lai + verb', o: { voice: 'lai' } },
    { id: 'pass', name: 'passive', parts: 'dei', gist: 'dei + verb', o: { voice: 'dei' } },
    { id: 'prf', name: 'perfect', parts: 'tefri', gist: 'tefri, perfect', o: { aspect: 'tefri' } },
    { id: 'hab', name: 'habitual', parts: 'talei', gist: 'talei, habitual, "used to"', o: { aspect: 'talei' } },
    { id: 'rec', name: 'just now', parts: 'mai', gist: 'mai, just now', o: { aspect: 'mai' } },
    { id: 'yet', name: 'not yet', parts: 'kiena lan', gist: 'kiena, not yet, with lan', o: { aspect: 'kiena', neg: true } }
  ];
  // Commands: the grammar shows ov lua (o), ov lua ilie, ov lua a, ov lua ale, and ov lan lua ilie.
  var CMD_SHOWN = ['2s', '1p', '3s.a', '3p.a'];

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nsCell(why) { return { covered: false, text: '', why: why || NS, words: [], attested: false }; }

  function cells(L, verb) {
    var out = { cards: [], cmd: [] };
    CARDS.forEach(function (c) {
      var rows = L.PERSONS.map(function (p) {
        return COLS.map(function (col) {
          var o = { person: p.id, tense: col[0] }; for (var k in c.o) { o[k] = c.o[k]; }
          var r = L.build(verb, o);
          return r.covered ? r : nsCell(r.why);
        });
      });
      out.cards.push({ card: c, rows: rows });
    });
    out.cmd = L.PERSONS.map(function (p) {
      if (CMD_SHOWN.indexOf(p.id) === -1) {
        var why = 'The grammar shows commands only for o, ilie, a and ale.';
        return [nsCell(why), nsCell(why)];
      }
      var pos = L.build(verb, { command: true, person: p.id }), neg = L.build(verb, { command: true, person: p.id, neg: true });
      if (pos.covered && p.id === '2s') { pos.formal = L.build(verb, { command: true, person: p.id, formal: true }); }
      if (neg.covered && p.id === '2s') { neg.formal = L.build(verb, { command: true, person: p.id, neg: true, formal: true }); }
      if (neg.covered && !neg.attested) { neg.why = 'Built by the rule "negation follows ov"; the grammar\'s only example is ov lan lua ilie.'; }
      return [pos.covered ? pos : nsCell(pos.why), neg.covered ? neg : nsCell(neg.why)];
    });
    return out;
  }

  function cellHTML(r, key) {
    if (!r.covered) { return '<span class="fm-none ns" title="' + esc(r.why) + '"><span aria-hidden="true">—</span> <small>' + NS + '</small></span>'; }
    var mark = r.attested ? '<span class="mk mk-a" title="In the grammar\'s examples">●</span>' : '<span class="mk mk-r" title="Built by the grammar\'s rules; no worked example">○</span>';
    return '<button type="button" class="fm" data-key="' + esc(key) + '" aria-label="' + esc(r.text) + '"><span class="fm-t">' + esc(r.text) + '</span>' + mark + '</button>' +
      (r.formal ? '<span class="fv">formal: <span class="lx">' + esc(r.formal.text) + '</span></span>' : '');
  }

  function render(L, verb) {
    var C = cells(L, verb), flat = {};
    var h = '<section class="blk" id="conj" aria-labelledby="conj-h"><div class="blk-head"><h3 id="conj-h">Conjugation</h3>' +
      '<span class="blk-note">The verb never changes; the particles before it do.</span></div><div class="modes">';
    C.cards.forEach(function (x) {
      h += '<div class="mode lm lm-' + x.card.id + '"><div class="mode-head"><span class="mode-name">' + esc(x.card.name) + '</span>' +
        (x.card.parts ? '<span class="mode-base">' + esc(x.card.parts) + '</span>' : '') + '<span class="mode-gist">' + esc(x.card.gist) + '</span></div>' +
        '<div class="tw"><table class="par"><thead><tr><th scope="col"><span class="sr">Person</span></th>' +
        COLS.map(function (c) { return '<th scope="col">' + c[1] + (c[2] ? ' <span class="lx">' + c[2] + '</span>' : '') + '</th>'; }).join('') + '</tr></thead><tbody>';
      L.PERSONS.forEach(function (p, i) {
        h += '<tr><th scope="row" title="' + esc(p.en) + '"><span class="pn">' + esc(p.w) + '</span> <span class="pp">' + esc(p.en) + '</span></th>';
        x.rows[i].forEach(function (r, j) { var key = x.card.id + '.' + i + '.' + j; flat[key] = r; h += '<td>' + cellHTML(r, key) + '</td>'; });
        h += '</tr>';
      });
      h += '</tbody></table></div></div>';
    });
    h += '</div></section>';
    h += '<section class="blk" id="imp" aria-labelledby="imp-h"><div class="blk-head"><h3 id="imp-h">Commands</h3>' +
      '<span class="blk-note"><span class="lx">ov</span> + verb + person; negation follows <span class="lx">ov</span>.</span></div>' +
      '<div class="tw lm"><table class="par imp"><thead><tr><th scope="col"><span class="sr">Person</span></th><th scope="col">command <span class="lx">ov</span></th><th scope="col">negative <span class="lx">ov lan</span></th></tr></thead><tbody>';
    L.PERSONS.forEach(function (p, i) {
      h += '<tr><th scope="row"><span class="pn">' + esc(p.w) + '</span> <span class="pp">' + esc(p.en) + '</span></th>';
      C.cmd[i].forEach(function (r, j) { var key = 'cmd.' + i + '.' + j; flat[key] = r; h += '<td>' + cellHTML(r, key) + '</td>'; });
      h += '</tr>';
    });
    h += '</tbody></table></div>' +
      '<p class="legend"><span><span class="mk mk-a">●</span> in the grammar\'s examples</span><span><span class="mk mk-r">○</span> built by the grammar\'s rules, no example yet</span>' +
      '<span>— ' + NS + '</span><span>Click a form to see how it is built</span></p></section>';
    return { html: h, cells: flat };
  }

  function detailHTML(r) {
    return '<div class="gl">' + r.words.map(function (x) { return '<span class="gw"><span>' + esc(x.w) + '</span><span class="g2">' + esc(x.g) + '</span></span>'; }).join('') + '</div>' +
      '<p class="why">' + esc(r.why) + '</p>' + (r.open && r.open.length ? '<ul class="oq">' + r.open.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul>' : '');
  }

  /* Check: every lexicon verb renders a full table (8 cards × 8 persons × 4 columns + 8 × 2 commands) without errors. */
  function checkAll(L, verbs) {
    var bad = [], per = CARDS.length * L.PERSONS.length * COLS.length + L.PERSONS.length * 2;
    verbs.forEach(function (v) {
      try {
        var r = render(L, v), n = Object.keys(r.cells).length;
        if (n !== per) { bad.push(v.w + ': ' + n + ' cells, expected ' + per); }
        else if (/undefined|NaN|\[object/.test(r.html)) { bad.push(v.w + ': bad text in the table'); }
        else if (!Object.keys(r.cells).some(function (k) { return r.cells[k].covered; })) { bad.push(v.w + ': no form at all'); }
      } catch (e) { bad.push(v.w + ': ' + e.message); }
    });
    return { total: verbs.length, ok: verbs.length - bad.length, bad: bad, cellsPerVerb: per };
  }

  return { COLS: COLS, CARDS: CARDS, NS: NS, cells: cells, render: render, detailHTML: detailHTML, checkAll: checkAll };
}));
