/*
 * Lundiyani (Modern Lundian) verb engine, prototype v0.1.
 * Built strictly from the Lundiyani Grammar Reference (Oct 14, 2026) and Alex's Oct 18 corrections
 * (talei = HAB, habitual; the command particle is ov). Lundiyani verbs never change form: tense, aspect,
 * mood and negation are separate particles, in the slot order the grammar gives:
 *   Subject · Aspect (tefri, talei, mai, kiena) · Negation (lan) · Tense or mood (lo, na, lei) · lai/dei · Verb
 * Exceptions stated by the grammar: ta (to have) comes before its subject; commands are ov (+ lan) + verb + person.
 * Anything the grammar does not cover is returned as not covered, never guessed.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); } else { root.Lundiyani = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var PERSONS = [
    { id: '1s', w: 'i', g: '1SG', en: 'I' },
    { id: '2s', w: 'o', g: '2SG', en: 'you' },
    { id: '3s.a', w: 'a', g: '3SG', en: 'he, she (animate)' },
    { id: '3s.i', w: 'ne', g: '3SG.INAN', en: 'it (inanimate)' },
    { id: '1p', w: 'ilie', g: '1PL', en: 'we' },
    { id: '2p', w: 'ole', g: '2PL', en: 'you (plural)' },
    { id: '3p.a', w: 'ale', g: '3PL', en: 'they (animate)' },
    { id: '3p.i', w: 'nilie', g: '3PL.INAN', en: 'they (inanimate)' }
  ];
  // Particles with the grammar's glosses (Abbreviations line, with Alex's HAB correction) and meanings (particle table).
  var P = {
    tefri: { g: 'PRF', m: 'perfect' }, talei: { g: 'HAB', m: 'habitual, "used to"' }, mai: { g: 'REC', m: 'just now' },
    kiena: { g: 'YET', m: 'not yet (with lan)' }, lan: { g: 'NEG', m: 'negation' },
    lo: { g: 'PST', m: 'past' }, na: { g: 'FUT', m: 'future' }, lei: { g: 'COND', m: 'conditional' },
    lai: { g: 'be', m: 'progressive (lai + verb)' }, dei: { g: 'PASS', m: 'passive (dei + verb)' }, ov: { g: 'IMP', m: 'command' }
  };
  var ASPECTS = ['', 'tefri', 'talei', 'mai', 'kiena'], TENSES = ['', 'lo', 'na', 'lei'], VOICES = ['', 'lai', 'dei'];
  // Commands the grammar shows: ov lua (o), ov lua ilie, ov lua a, ov lua ale.
  var COMMAND_PERSONS = ['2s', '1p', '3s.a', '3p.a'];

  // Particle sequences that occur in the grammar's worked examples (any subject, any verb).
  var ATTESTED = {
    statement: ['', 'lo', 'na', 'lei', 'lai', 'lo lai', 'lo dei', 'tefri lo', 'tefri lo lai', 'talei lo', 'mai lo', 'kiena lan lo',
                'lan', 'lan lo', 'lan lo lai'],
    ta: ['', 'lo', 'lan'],
    command: ['', 'lan']
  };

  function verbGloss(meaning) {
    var m = String(meaning || '').split(/[;,(]/)[0].trim().replace(/^to\s+/, '');
    return m.split(/\s+/)[0] || '?';
  }
  function person(id) { for (var i = 0; i < PERSONS.length; i++) { if (PERSONS[i].id === id) { return PERSONS[i]; } } return null; }

  /**
   * Build one verb phrase.
   * opts: { person: '1s'..., subject: {w, g} (instead of a person), aspect, neg, tense, voice, command, formal }
   * Returns { covered, words: [{w, g, role}], text, attested, sig, why, label, open }
   */
  function build(verb, opts) {
    opts = opts || {};
    var v = typeof verb === 'string' ? { w: verb, g: verbGloss('') } : verb;
    var vw = { w: v.w, g: v.g || verbGloss(v.meaning), role: 'verb' };
    var subj = opts.subject || person(opts.person || '1s');
    var asp = opts.aspect || '', neg = !!opts.neg, tns = opts.tense || '', voi = opts.voice || '';
    var out = { covered: true, words: [], open: [] };
    function nc(why) { return { covered: false, words: [], text: '', why: why, attested: false, sig: null, open: [] }; }

    if (opts.command) {
      if (asp || tns || voi) { return nc('The grammar describes commands only as ov (+ lan) + verb + person; it gives no command with a tense, aspect or lai/dei particle.'); }
      if (v.w === 'ta') { return nc('The grammar gives no command form of ta (to have).'); }
      var cp = person(opts.person || '2s');
      out.words.push({ w: 'ov', g: P.ov.g, role: 'particle' });
      if (neg) { out.words.push({ w: 'lan', g: P.lan.g, role: 'particle' }); }
      out.words.push(vw);
      // "With singular you it has fallen out of use (ov eden, eat!), but formal writing keeps it (ov eden o)."
      if (cp.id !== '2s' || opts.formal) { out.words.push({ w: cp.w, g: cp.g, role: 'subject' }); }
      out.sig = neg ? 'lan' : '';
      out.attested = ATTESTED.command.indexOf(out.sig) !== -1 && (COMMAND_PERSONS.indexOf(cp.id) !== -1 || (neg && cp.id === '1p'));
      if (neg && cp.id !== '1p') { out.attested = false; }
      out.why = out.attested ? 'In the grammar\'s examples.' : 'Built by the command rule (ov + verb + person); the grammar shows ' +
        (COMMAND_PERSONS.indexOf(cp.id) === -1 ? 'no command for this person.' : 'no example of this combination.');
      if (COMMAND_PERSONS.indexOf(cp.id) === -1) { out.open.push('Commands for ' + cp.w + ' (' + cp.en + ') are not shown in the grammar.'); }
      out.label = 'command' + (neg ? ', negative' : '');
      out.text = out.words.map(function (x) { return x.w; }).join(' ');
      return out;
    }
    if (asp === 'kiena' && !neg) { return nc('kiena means "not yet" and is used with lan (ale kiena lan lo eden); the grammar gives no kiena without lan.'); }
    if (v.w === 'ta' && voi) { return nc('ta (to have) puts the verb before the subject; the grammar gives no ta with lai or dei.'); }
    if (v.w === 'lai' && voi) { return nc('lai is itself the copula; the grammar gives no progressive or passive of lai.'); }

    var parts = [];
    if (asp) { parts.push({ w: asp, g: P[asp].g, role: 'particle' }); }
    if (neg) { parts.push({ w: 'lan', g: P.lan.g, role: 'particle' }); }
    if (tns) { parts.push({ w: tns, g: P[tns].g, role: 'particle' }); }
    if (voi) { parts.push({ w: voi, g: P[voi].g, role: 'particle' }); }
    var sw = { w: subj.w, g: subj.g, role: 'subject' };
    if (v.w === 'ta') {   // "ta is the one verb that comes before its subject; particles and the object follow in the normal order."
      out.words = [vw, sw].concat(parts);
    } else {
      out.words = [sw].concat(parts, [vw]);
    }
    out.sig = parts.map(function (x) { return x.w; }).join(' ');
    var set = v.w === 'ta' ? ATTESTED.ta : ATTESTED.statement;
    out.attested = set.indexOf(out.sig) !== -1;
    out.why = out.attested ? 'This particle sequence is in the grammar\'s examples.' :
      'Built by the grammar\'s slot order (particles "combine freely"); no worked example has this sequence.';
    // Names, from the particle table.
    var name = [];
    if (asp === 'tefri' && tns === 'lo' && voi === 'lai') { name.push('past perfect'); out.open.push('Is tefri lo lai "had eaten" or "had been eating"? (open question in the grammar)'); }
    else {
      name.push(tns ? P[tns].m : 'present');
      if (voi === 'lai') { name.push('progressive'); }
      if (voi === 'dei') { name.push('passive'); }
      if (asp) { name.push(P[asp].m); }
    }
    if (neg && asp !== 'kiena') { name.push('negative'); }
    if (neg && asp && asp !== 'kiena' && asp !== 'tefri') { out.open.push('The grammar places lan after kiena and tefri; with ' + asp + ' the order follows the slot table.'); }
    out.label = name.join(', ');
    out.text = out.words.map(function (x) { return x.w; }).join(' ');
    return out;
  }

  /* Self-check: the verb phrase of every worked example in the grammar that uses a verb.
     [source, expected, verb, opts]. Subjects that are nouns are given as subject words. */
  function S(w, g) { return { w: w, g: g }; }
  var CHECKS = [
    ['Particles: i vera ne', 'i vera', 'vera', { person: '1s' }],
    ['Particles: i lo lau o', 'i lo lau', 'lau', { person: '1s', tense: 'lo' }],
    ['Particles: i na lau o', 'i na lau', 'lau', { person: '1s', tense: 'na' }],
    ['Particles: i lo lai vera ne', 'i lo lai vera', 'vera', { person: '1s', tense: 'lo', voice: 'lai' }],
    ['Particles: ci pay lo dei raxavi', 'ci pay lo dei raxavi', 'raxavi', { subject: S('ci pay', 'DEF.INAN village'), tense: 'lo', voice: 'dei' }],
    ['Particles: i tefri lo eden', 'i tefri lo eden', 'eden', { person: '1s', aspect: 'tefri', tense: 'lo' }],
    ['Particles: i tefri lo lai eden', 'i tefri lo lai eden', 'eden', { person: '1s', aspect: 'tefri', tense: 'lo', voice: 'lai' }],
    ['Particles: i talei lo yada', 'i talei lo yada', 'yada', { person: '1s', aspect: 'talei', tense: 'lo' }],
    ['Particles: ilie mai lo eden', 'ilie mai lo eden', 'eden', { person: '1p', aspect: 'mai', tense: 'lo' }],
    ['Particles: ale kiena lan lo eden', 'ale kiena lan lo eden', 'eden', { person: '3p.a', aspect: 'kiena', neg: true, tense: 'lo' }],
    ['Particles: as o lei luran', 'o lei luran', 'luran', { person: '2s', tense: 'lei' }],
    ['Particles: i lei lai kuali', 'i lei lai', 'lai', { person: '1s', tense: 'lei' }],
    ['Particles: i lan lo lai valia', 'i lan lo lai valia', 'valia', { person: '1s', neg: true, tense: 'lo', voice: 'lai' }],
    ['Copula: i lo lai kili', 'i lo lai', 'lai', { person: '1s', tense: 'lo' }],
    ['Modal: i lan sa valia', 'i lan sa', 'sa', { person: '1s', neg: true }],
    ['Modal: ilie mail kapa', 'ilie mail', 'mail', { person: '1p' }],
    ['Passive: i lo dei fastixi', 'i lo dei fastixi', 'fastixi', { person: '1s', tense: 'lo', voice: 'dei' }],
    ['ta: ta i kora', 'ta i', 'ta', { person: '1s' }],
    ['ta: ta i lo kora', 'ta i lo', 'ta', { person: '1s', tense: 'lo' }],
    ['ta: ta i lan kora', 'ta i lan', 'ta', { person: '1s', neg: true }],
    ['ta: ta o kora me?', 'ta o', 'ta', { person: '2s' }],
    ['ta: ta nei kawe on re kiwuri', 'ta nei kawe on', 'ta', { subject: S('nei kawe on', 'this tall person') }],
    ['Commands: ov lua', 'ov lua', 'lua', { command: true, person: '2s' }],
    ['Commands: ov lua o (formal)', 'ov lua o', 'lua', { command: true, person: '2s', formal: true }],
    ['Commands: ov lua ilie', 'ov lua ilie', 'lua', { command: true, person: '1p' }],
    ['Commands: ov lua a', 'ov lua a', 'lua', { command: true, person: '3s.a' }],
    ['Commands: ov lua ale', 'ov lua ale', 'lua', { command: true, person: '3p.a' }],
    ['Commands: ov eden', 'ov eden', 'eden', { command: true, person: '2s' }],
    ['Commands: ov eden o', 'ov eden o', 'eden', { command: true, person: '2s', formal: true }],
    ['Commands: ov lan lua ilie', 'ov lan lua ilie', 'lua', { command: true, person: '1p', neg: true }],
    ['Clauses: a lo lai yada xanarya o lo luran', 'a lo lai yada', 'yada', { person: '3s.a', tense: 'lo', voice: 'lai' }],
    ['Clauses: … xanarya o lo luran', 'o lo luran', 'luran', { person: '2s', tense: 'lo' }],
    ['Clauses: i so xa o na luran', 'i so', 'so', { person: '1s' }],
    ['Clauses: … xa o na luran', 'o na luran', 'luran', { person: '2s', tense: 'na' }],
    ['Clauses: ci skin sa o lo sila', 'o lo sila', 'sila', { person: '2s', tense: 'lo' }],
    ['Word formation: o lo nia i drese', 'o lo nia', 'nia', { person: '2s', tense: 'lo' }],
    ['Round 1, 4: a lo lai yada', 'a lo lai yada', 'yada', { person: '3s.a', tense: 'lo', voice: 'lai' }],
    ['Round 1, 9: ta o lo ia kiwuru', 'ta o lo', 'ta', { person: '2s', tense: 'lo' }],
    ['Round 1, 13: i lo kana ia kora', 'i lo kana', 'kana', { person: '1s', tense: 'lo' }],
    ['Round 1, 13: i kora lo kana i', 'i kora lo kana', 'kana', { subject: S('i kora', 'DEF cat'), tense: 'lo' }],
    ['Round 1, 14: xaon lau o', 'xaon lau', 'lau', { subject: S('xaon', 'who') }],
    ['Round 1, 15: o lai vera xa', 'o lai vera', 'vera', { person: '2s', voice: 'lai' }],
    ['Round 1, 16: i on xaon lo lai yada', 'xaon lo lai yada', 'yada', { subject: S('xaon', 'who'), tense: 'lo', voice: 'lai' }],
    ['Round 1, 17: ov eden ilie', 'ov eden ilie', 'eden', { command: true, person: '1p' }],
    ['Round 2, 2: na oni lo luran', 'na oni lo luran', 'luran', { subject: S('na oni', 'INDF.PL person-PL'), tense: 'lo' }],
    ['Round 2, 3: i lo luran', 'i lo luran', 'luran', { person: '1s', tense: 'lo' }],
    ['Round 2, 6: ale lo raxavi', 'ale lo raxavi', 'raxavi', { person: '3p.a', tense: 'lo' }],
    ['Round 2, 7: i lo iloarikai a', 'i lo iloarikai', 'iloarikai', { person: '1s', tense: 'lo' }],
    ['Round 2, 8: i lan lo kanxi a', 'i lan lo kanxi', 'kanxi', { person: '1s', neg: true, tense: 'lo' }],
    ['Round 2, 9: o nivya maxa', 'o nivya', 'nivya', { person: '2s' }],
    ['Round 2, 10: o lan lo luran anxa', 'o lan lo luran', 'luran', { person: '2s', neg: true, tense: 'lo' }],
    ['Round 2, 11: ta o xataw kori', 'ta o', 'ta', { person: '2s' }],
    ['Round 2, 12: … ema i lai drese', 'i lai', 'lai', { person: '1s' }],
    ['Round 2, 16: ale lau on-a-oni', 'ale lau', 'lau', { person: '3p.a' }],
    ['Round 2, 17: ta i resion-na kiwuri', 'ta i', 'ta', { person: '1s' }],
    ['Round 3, 3: i lo dail', 'i lo dail', 'dail', { person: '1s', tense: 'lo' }],
    ['Round 3, 7: ov kiaw ci louba', 'ov kiaw', 'kiaw', { command: true, person: '2s' }],
    ['Round 3, 10: anta o lo luran, i lo lai drese', 'i lo lai', 'lai', { person: '1s', tense: 'lo' }],
    ['Round 3, 11: i lo vera ne on o', 'i lo vera', 'vera', { person: '1s', tense: 'lo' }],
    ['Round 3, 12: ilie lo kapa ewa o', 'ilie lo kapa', 'kapa', { person: '1p', tense: 'lo' }],
    ['Round 3, 13: i na dalod nes o luran', 'i na dalod', 'dalod', { person: '1s', tense: 'na' }],
    ['Round 3, 13: … nes o luran', 'o luran', 'luran', { person: '2s' }],
    ['Round 3, 14: a lo kanxi amon', 'a lo kanxi', 'kanxi', { person: '3s.a', tense: 'lo' }]
  ];
  function runChecks() {
    var res = CHECKS.map(function (c) {
      var r = build({ w: c[2], g: c[2] }, c[3]);
      return { source: c[0], expected: c[1], got: r.covered ? r.text : '(not covered)', ok: r.covered && r.text === c[1], attested: r.attested };
    });
    return { results: res, passed: res.filter(function (r) { return r.ok; }).length, total: res.length };
  }

  return { version: '0.1', PERSONS: PERSONS, PARTICLES: P, ASPECTS: ASPECTS, TENSES: TENSES, VOICES: VOICES,
           COMMAND_PERSONS: COMMAND_PERSONS, ATTESTED: ATTESTED, build: build, verbGloss: verbGloss, CHECKS: CHECKS, runChecks: runChecks };
}));
