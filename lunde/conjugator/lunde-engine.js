/*
 * Old Lundian rule engine, v0.2
 * Implements the rules of the Old Lundian Grammar Reference (sessions 1 to 8, Oct 18 2026).
 *
 * Verbs: every form is stem + ending, then the sound rules apply in order:
 *   1. vowel contact at the stem/ending boundary (and "after y, i -> e")
 *   2. the length rule (two long vowels may not stand in neighboring syllables)
 *   3. y + ēyn -> yēñ
 *   4. dissimilation (v-V-v -> v-V-n, j-V-j -> j-V-n, x-V-x -> x-V-g)
 * Nouns and adjectives: bare word (or its oblique stem) + case ending, with the case rules.
 * Also: pronouns, numbers (base twelve), manner adverbs, stress and IPA.
 * Each rule that fires is logged, so every form can explain itself.
 *
 * Works in the browser (window.Lunde) and in Node (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.Lunde = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Alphabet                                                            */
  /* ------------------------------------------------------------------ */

  var VOWELS = 'aeiouäàāēīōūǟ';
  var LONG = 'āēīōūǟ';
  var LENGTHEN = { a: 'ā', e: 'ē', i: 'ī', o: 'ō', u: 'ū', 'ä': 'ǟ' };
  var SHORTEN = { 'ā': 'a', 'ē': 'e', 'ī': 'i', 'ō': 'o', 'ū': 'u', 'ǟ': 'ä' };
  var LETTERS = /^[a-zäàāēīōūǟñ]+$/;
  // Letter pairs that spell one sound. xl, hy, gy and ng are single consonants; rr is one long consonant.
  var DIGRAPHS = ['xl', 'hy', 'gy', 'ng', 'rr'];

  function isV(c) { return !!c && VOWELS.indexOf(c) !== -1; }
  function isLong(c) { return !!c && LONG.indexOf(c) !== -1; }
  function nuclei(w) {
    var r = [];
    for (var i = 0; i < w.length; i++) { if (isV(w.charAt(i))) { r.push(i); } }
    return r;
  }

  /** Splits a word into sounds: vowels, single consonants, digraphs and geminates. */
  function tokenize(w) {
    var out = [];
    for (var i = 0; i < w.length;) {
      var two = w.substr(i, 2);
      if (DIGRAPHS.indexOf(two) !== -1) { out.push({ t: two, v: false, gem: two === 'rr' }); i += 2; continue; }
      var c = w.charAt(i);
      if (isV(c)) { out.push({ t: c, v: true }); i++; continue; }
      if (w.charAt(i + 1) === c) { out.push({ t: c, v: false, gem: true }); i += 2; continue; }
      out.push({ t: c, v: false }); i++;
    }
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Paradigm data                                                       */
  /* ------------------------------------------------------------------ */

  var PERSONS = ['1s', '2s', '3s.a', '3s.i', '1p', '2p', '3p'];
  var PRONOUNS = ['ki', 'gū', 'da', 'ne', 'īssi', 'gūn', 'dan'];
  var IMP_PERSONS = ['2s', '2p', '1p', '3'];
  var FORMS = ['samon', 'namon', 'exmon'];
  var TENSES = ['present', 'future', 'past'];

  // Endings as they attach to a consonant stem.
  var ENDINGS = {
    samon: {
      present: ['i', 'u', 'a', 'an', 'as', 'ūn', 'ān'],
      future: ['egy', 'eju', 'egy', 'ēyn', 'ejas', 'ūnna', 'ana'],
      past: ['us', 'uōs', 'uōs', 'uīn', 'uves', 'uvōs', 'uōsen']
    },
    namon: {
      present: ['ei', 'eo', 'ea', 'ēn', 'es', 'eon', 'eān'],
      future: ['ià', 'uà', 'à', 'àn', 'iàs', 'uàn', 'àn'],
      past: ['ir', 'ur', 'ar', 'ran', 'ras', 'run', 'ran']
    },
    exmon: {
      present: ['ix', 'ux', 'ax', 'axan', 'ixas', 'ugun', 'axan'],
      future: ['egi', 'egu', 'ega', 'egan', 'egas', 'egun', 'egan'],
      past: ['oxi', 'ogu', 'oxa', 'oxan', 'oxas', 'ogun', 'oxan']
    }
  };
  // Namon past after stems ending in r or l: the person vowel stays.
  var NAMON_PAST_RL = ['ir', 'ur', 'ar', 'aran', 'iras', 'urun', 'aran'];
  // Person vowels inserted by two-consonant stems in imperatives (2s, 2p, 1p, 3).
  var IMP_PV = ['u', 'u', 'i', 'a'];

  // Case endings in their basic shape: a case consonant + -e (singular), -i (plural animate), -en (plural inanimate).
  // After a consonant, a is inserted first (-am, -ase...). The transitive subject is bare in the singular.
  // Comitative and abessive start with ū and have their own rules.
  var CASES = [
    { id: 'A', name: 'transitive subject', endings: { sg: '', an: 'i', 'in': 'en' } },
    { id: 'S', name: 'intransitive subject', endings: { sg: 'm', an: 'mi', 'in': 'men' } },
    { id: 'O', name: 'accusative', endings: { sg: 'se', an: 'si', 'in': 'sen' } },
    { id: 'ALL', name: 'allative / dative', endings: { sg: 've', an: 'vi', 'in': 'ven' } },
    { id: 'GEN', name: 'genitive', endings: { sg: 'de', an: 'di', 'in': 'den' } },
    { id: 'ABL', name: 'ablative', endings: { sg: 'ze', an: 'zi', 'in': 'zen' } },
    { id: 'COM', name: 'comitative-instrumental', endings: { sg: 'ūne', an: 'ūni', 'in': 'ūnen' } },
    { id: 'ABE', name: 'abessive', endings: { sg: 'ūxle', an: 'ūxli', 'in': 'ūxlen' } }
  ];

  /** The ending as it appears after a vowel and after a consonant, for tables: ['m', 'am']. */
  function caseEndingShapes(c, num) {
    var e = c.endings[num];
    if (c.id === 'A') { return num === 'sg' ? ['', ''] : [(num === 'an' ? 'y' : 'n') + e, e]; }
    if (e.charAt(0) === 'ū') { return [e, e]; }
    return [e, 'a' + e];
  }
  var NUMBERS = ['sg', 'an', 'in'];
  var NUMBER_NAMES = { sg: 'singular', an: 'plural, animate', 'in': 'plural, inanimate' };

  /* ------------------------------------------------------------------ */
  /* Rule catalogue: every rule the engine can apply, in plain words      */
  /* ------------------------------------------------------------------ */

  var RULES = {
    aa_end:   { text: 'a + a → ā at the end of a word', section: 'Sound rules: vowel contact' },
    aa_short: { text: 'a + a → short a before a consonant', section: 'Sound rules: vowel contact' },
    a_aa:     { text: 'a + ā → ā', section: 'Sound rules: vowel contact' },
    a_ag:     { text: 'a + à → à', section: 'Sound rules: vowel contact' },
    ae:       { text: 'a + e → ä', section: 'Sound rules: vowel contact' },
    a_ee:     { text: 'a + ē → a-y-ē', section: 'Sound rules: vowel contact' },
    au_v:     { text: 'a + u → av before a vowel', section: 'Sound rules: vowel contact' },
    au_c:     { text: 'a + u → ō before a consonant or at the end of a word', section: 'Sound rules: vowel contact' },
    a_uu:     { text: 'a + ū → ō', section: 'Sound rules: vowel contact' },
    ao:       { text: 'a + o → ō', section: 'Sound rules: vowel contact' },
    glide_ay: { text: 'i between two vowels becomes y after a', section: 'Sound rules: glides' },
    glide_ey: { text: 'i between two vowels becomes y after e', section: 'Sound rules: glides' },
    uu_v:     { text: 'u + u → uv before a vowel', section: 'Sound rules: vowel contact' },
    uu_c:     { text: 'u + u → ū before a consonant or at the end of a word', section: 'Sound rules: vowel contact' },
    ui_j:     { text: 'u + i → uj at the end of a word or before a vowel', section: 'Sound rules: vowel contact' },
    ee:       { text: 'e + e → ē', section: 'Sound rules: vowel contact' },
    e_ee:     { text: 'e + ē → e-y-ē', section: 'Sound rules: vowel contact' },
    eu_v:     { text: 'e + u → ev before a vowel', section: 'Sound rules: vowel contact' },
    ei_samon: { text: 'e + i → ej (samon e-stems)', section: 'Sound rules: vowel contact' },
    no_merge: { text: 'short + long vowel: no merge', section: 'Sound rules: vowel contact' },
    yi:       { text: 'after y, i becomes e', section: 'Sound rules: glides' },
    yeyn:     { text: 'y + ēyn → yēñ', section: 'Sound rules: glides' },
    len_v:    { text: 'length rule: a merge would put two long vowels side by side, so the v form is used instead', section: 'Sound rules: length rule' },
    len_h:    { text: 'length rule: h is inserted and the second vowel shortens', section: 'Sound rules: length rule' },
    len_open: { text: 'two long vowels stand in neighboring syllables, and no repair is defined for this case', section: 'Sound rules: length rule' },
    diss_v:   { text: 'dissimilation: in v + vowel + v, the second v becomes n', section: 'Sound rules: dissimilation' },
    diss_j:   { text: 'dissimilation: in j + vowel + j, the second j becomes n', section: 'Sound rules: dissimilation' },
    diss_x:   { text: 'dissimilation: in x + vowel + x, the second x becomes g', section: 'Sound rules: dissimilation' },
    na_vowel: { text: '3p future: -na after a vowel stem (-ana after a consonant)', section: 'Samon conjugation' },
    rl_keep:  { text: 'the stem ends in r or l, so the person vowel stays in the plural past', section: 'Namon conjugation' },
    imon_i:   { text: 'īmon: ī- before a consonant; the prefix is exempt from the length rule', section: 'Īmon and gerunds' },
    imon_y:   { text: 'īmon: y- before a vowel', section: 'Īmon and gerunds' },
    imon_ende:{ text: 'īmon before ende-: ende- loses its e (ī + ende → īnde-)', section: 'Prefixes' },
    imp_long: { text: 'imperative: the last vowel of the stem is made long', section: 'Imperatives' },
    imp_aya:  { text: 'two-consonant stem: a inserted before -ya', section: 'Imperatives' },
    imp_dbl:  { text: 'namon imperative: the final consonant doubles', section: 'Imperatives' },
    imp_dd:   { text: 'namon imperative: dd after a vowel', section: 'Imperatives' },
    imp_pv:   { text: 'two-consonant stem: the person vowel (u, u, i, a) goes in before dd or g', section: 'Imperatives' },
    imp_bv:   { text: 'b → v before the exmon imperative g', section: 'Imperatives' },
    part_e:   { text: 'consonant stems put e before the namon participle\'s r, like e-stems (daber, iluser); the samon participle is the bare stem (dab, ilus)', section: 'Adjectives from verbs' },
    part_a:   { text: 'a bare stem that would end in a cluster other than -st, -rr or -nt takes a between its last two consonants (adar, amap)', section: 'Adjectives from verbs' },
    act_u:    { text: 'active adjective: a u-stem drops its u before -anga', section: 'Adjectives from verbs' },
    ox_obl:   { text: 'the exmon participle drops its o before an ending (u- and e-stems)', section: 'Adjectives from verbs' },
    os_long:  { text: '-os: a stem-final u lengthens', section: 'Nouns from verbs' },
    case_a:   { text: 'after a consonant, a is inserted before the case ending', section: 'Cases' },
    case_yi:  { text: 'plural transitive subject: y goes in before -i after a vowel (neyi)', section: 'Cases' },
    case_nen: { text: 'plural transitive subject: n goes in before -en after a vowel (nenen)', section: 'Cases' },
    case_u:   { text: 'the ū of -ūne and -ūxle drops after u or ū', section: 'Cases' },
    case_v:   { text: 'a long last vowel adds v before -ūne and -ūxle', section: 'Cases' },
    obl_ne:   { text: 'ney uses the stem ne- before every ending', section: 'Cases' },
    case_keep:{ text: 'dissimilation never changes a case ending (veve, keavave stay)', section: 'Cases' },
    pron_gam: { text: '2s intransitive subject: gam is irregular', section: 'Pronouns' },
    pron_contract: { text: 'īssi + se contracts to īsse (case endings only)', section: 'Pronouns' },
    pron_3p:  { text: '3p daūne and daūxle are the same as 3s.a', section: 'Pronouns' },
    adv_ili:  { text: 'manner adverb: ili- before a consonant', section: 'Adverbs' },
    adv_ilis: { text: 'manner adverb: ilis- before a vowel', section: 'Adverbs' },
    irr:      { text: 'irregular: taken from the table, not built by rule', section: 'To be' },
    unknown:  { text: 'this vowel contact is not covered by the rules yet', section: 'Sound rules: vowel contact' }
  };

  /* ------------------------------------------------------------------ */
  /* Stem analysis                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Analyse a samon base (e.g. "labasa", "xasa", "luasa", "leasa").
   * Consonants are counted as sounds: xl is one consonant, so xlasa is a short stem like xasa.
   * For the two-consonant rules, rr (long) and hy count as two, as the doc says.
   */
  function analyze(samon) {
    var w = String(samon || '').trim().toLowerCase();
    if (!LETTERS.test(w)) { throw new Error('Use Lunde letters only (a–z, ä, à, ā ē ī ō ū ǟ, ñ).'); }
    if (w.length < 4 || w.slice(-3) !== 'asa') { throw new Error('A samon base ends in -asa (like labasa, xasa, luasa).'); }
    var root = w.slice(0, -3);
    if (!root) { throw new Error('A samon base needs a root before -asa.'); }
    var info = { samon: w, root: root, issues: [] };
    var toks = tokenize(root);
    var hasVowel = toks.some(function (t) { return t.v; });
    var last = root.charAt(root.length - 1);

    if (!hasVowel && toks.length === 1 && !toks[0].gem) {
      info.cls = 'short';                 // one consonant sound -> consonant + a (xa-, ka-, xla-)
      info.stem = root + 'a';
    } else if (last === 'u') {
      info.cls = 'u'; info.stem = root;
    } else if (last === 'e') {
      info.cls = 'e'; info.stem = root;
    } else if (isV(last)) {
      throw new Error('Only u- and e-stems exist among vowel stems (no -oasa, -iasa or -aasa verbs).');
    } else {
      info.cls = 'consonant'; info.stem = root;
      var tail = 0;
      for (var i = toks.length - 1; i >= 0 && !toks[i].v; i--) { tail += (toks[i].gem || toks[i].t === 'hy') ? 2 : 1; }
      info.cluster = tail >= 2;           // rr, hy, dr, st, rv... count as two consonants
      var lastTok = toks[toks.length - 1].t;
      info.rl = lastTok === 'r' || lastTok === 'rr' || lastTok === 'l';
      info.yFinal = last === 'y';
      if (!hasVowel) { info.issues.push('noVowel'); }
    }
    info.vowelStem = info.cls !== 'consonant';
    if (info.cls === 'short') {
      info.bases = { samon: info.stem + 'sa', namon: info.stem + 'na', exmon: info.stem + 'xa' };
    } else {
      info.bases = { samon: info.stem + 'asa', namon: info.stem + 'ana', exmon: info.stem + 'axa' };
    }
    return info;
  }

  /* ------------------------------------------------------------------ */
  /* Sound rules                                                         */
  /* ------------------------------------------------------------------ */

  /** Join a stem and an ending, resolving the vowels that meet. */
  function contact(stem, suffix, ctx, log) {
    if (!suffix) { return stem; }
    var v1 = stem.charAt(stem.length - 1);
    var s0 = suffix.charAt(0);
    if (v1 === 'y' && s0 === 'i') { log('yi'); return stem + 'e' + suffix.slice(1); }
    if (!isV(v1) || !isV(s0)) { return stem + suffix; }

    var base = stem.slice(0, -1);
    var rest = suffix.slice(1);
    var atEnd = rest.length === 0;
    var nextV = isV(rest.charAt(0));

    if (v1 === 'a') {
      switch (s0) {
        case 'a': if (atEnd) { log('aa_end'); return base + 'ā'; } log('aa_short'); return base + 'a' + rest;
        case 'ā': log('a_aa'); return base + 'ā' + rest;
        case 'à': log('a_ag'); return base + 'à' + rest;
        case 'e': log('ae'); return base + 'ä' + rest;
        case 'ē': log('a_ee'); return base + 'ayē' + rest;
        case 'u': if (nextV) { log('au_v'); return base + 'av' + rest; } log('au_c'); return base + 'ō' + rest;
        case 'ū': log('a_uu'); return base + 'ō' + rest;
        case 'o': log('ao'); return base + 'ō' + rest;
        case 'i': if (nextV) { log('glide_ay'); return base + 'ay' + rest; } return stem + suffix;
      }
    } else if (v1 === 'u') {
      switch (s0) {
        case 'u': if (nextV) { log('uu_v'); return base + 'uv' + rest; } log('uu_c'); return base + 'ū' + rest;
        case 'ū': log('no_merge'); return stem + suffix;
        case 'i': if (atEnd || nextV) { log('ui_j'); return base + 'uj' + rest; } return stem + suffix;
        case 'a': case 'ā': case 'à': case 'e': case 'ē': case 'o': return stem + suffix;
      }
    } else if (v1 === 'e') {
      switch (s0) {
        case 'e': log('ee'); return base + 'ē' + rest;
        case 'ē': log('e_ee'); return base + 'eyē' + rest;
        case 'u': if (nextV) { log('eu_v'); return base + 'ev' + rest; } return stem + suffix;
        case 'ū': log('no_merge'); return stem + suffix;
        case 'i':
          if (atEnd && ctx.form === 'samon') { log('ei_samon'); return base + 'ej'; }
          if (nextV) { log('glide_ey'); return base + 'ey' + rest; }
          return stem + suffix;
        case 'a': case 'ā': case 'à': case 'o': return stem + suffix;
      }
    }
    log('unknown');
    return stem + suffix;
  }

  /** Two long vowels in neighboring syllables: returns the pair of positions, or null. */
  function lengthClash(w) {
    var n = nuclei(w);
    for (var k = 0; k < n.length - 1; k++) {
      if (isLong(w.charAt(n[k])) && isLong(w.charAt(n[k + 1]))) { return [n[k], n[k + 1]]; }
    }
    return null;
  }

  var DISSIMILATION = [['v', 'n', 'diss_v'], ['j', 'n', 'diss_j'], ['x', 'g', 'diss_x']];

  /**
   * Same consonant on both sides of ONE vowel: the second one changes. A two-vowel sequence blocks it.
   * xl is its own sound (/ɬ/), so the x of xl never counts as an x.
   */
  function dissimilate(w, log) {
    var changed = true;
    while (changed) {
      changed = false;
      for (var i = 0; i + 2 < w.length && !changed; i++) {
        for (var d = 0; d < DISSIMILATION.length; d++) {
          var c = DISSIMILATION[d][0];
          if (w.charAt(i) === c && isV(w.charAt(i + 1)) && w.charAt(i + 2) === c && !(c === 'x' && w.charAt(i + 3) === 'l')) {
            w = w.slice(0, i + 2) + DISSIMILATION[d][1] + w.slice(i + 3);
            log(DISSIMILATION[d][2]);
            changed = true;
            break;
          }
        }
      }
    }
    return w;
  }

  function finish(w, log) {
    if (w.indexOf('yēyn') !== -1) { w = w.replace('yēyn', 'yēñ'); log('yeyn', w); }
    var before = w;
    w = dissimilate(w, function (id) { log(id); });
    if (w !== before) { log.form(w); }
    return w;
  }

  /**
   * Records which rules fired and, for each step, the form it produced:
   * steps = [{ rules: ['au_c'], form: 'xōvōs' }, { rules: ['len_v'], form: 'xavuvōs' }, ...]
   */
  function makeLogger() {
    var list = [];
    var steps = [];
    var pending = [];
    var fn = function (id, form) {
      if (list.indexOf(id) === -1) { list.push(id); }
      pending.push(id);
      if (form !== undefined) { fn.form(form); }
    };
    fn.form = function (form) {
      if (pending.length) { steps.push({ rules: pending.slice(), form: form }); pending.length = 0; }
    };
    fn.list = list;
    fn.steps = steps;
    return fn;
  }

  /* ------------------------------------------------------------------ */
  /* Finite forms                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Stem + ending with every sound rule, in order: vowel contact, the length rule, y + ēyn, dissimilation.
   * `form` is 'samon', 'namon', 'exmon' or anything else (some contacts depend on it).
   */
  function joinWith(stem, ending, form, log) {
    var w = contact(stem, ending, { form: form }, log);
    log.form(w);
    var clash = lengthClash(w);
    if (clash) {
      var v1 = stem.charAt(stem.length - 1);
      if (ending.charAt(0) === 'u' && (v1 === 'a' || v1 === 'u')) {
        // e.g. xa + uvōs: xōvōs would put ō next to ō, so the before-vowel form av / uv is used
        w = stem.slice(0, -1) + (v1 === 'a' ? 'av' : 'uv') + ending;
        log('len_v', w);
      } else if (v1 === 'e') {
        // e.g. le + eān: lēān -> lēhan
        var j = clash[1];
        w = w.slice(0, j) + 'h' + SHORTEN[w.charAt(j)] + w.slice(j + 1);
        log('len_h', w);
      } else {
        log('len_open', w);
      }
    }
    return finish(w, log);
  }

  /** Public: join any stem and ending by the sound rules (for the grammar page's tool). */
  function join(stem, ending, form) {
    var s = String(stem || '').trim().toLowerCase();
    var e = String(ending || '').trim().toLowerCase().replace(/^-/, '');
    if (!LETTERS.test(s) || !LETTERS.test(e)) { throw new Error('Use Lunde letters only (a–z, ä, à, ā ē ī ō ū ǟ, ñ).'); }
    var log = makeLogger();
    var w = joinWith(s, e, form || 'samon', log);
    return { form: w, underlying: s + ' + ' + e, rules: log.list, steps: log.steps, ipa: toIPA(w) };
  }

  function buildFinite(info, form, tense, i) {
    var log = makeLogger();
    var ending = ENDINGS[form][tense][i];
    if (form === 'samon' && tense === 'future' && i === 6 && info.vowelStem) { ending = 'na'; log('na_vowel'); }
    if (form === 'namon' && tense === 'past' && info.rl) {
      ending = NAMON_PAST_RL[i];
      if (i >= 3) { log('rl_keep'); }
    }
    var w = joinWith(info.stem, ending, form, log);
    return { form: w, underlying: info.stem + ' + ' + ending, rules: log.list, steps: log.steps };
  }

  /* ------------------------------------------------------------------ */
  /* Imperatives                                                         */
  /* ------------------------------------------------------------------ */

  function lengthenLast(s) {
    for (var i = s.length - 1; i >= 0; i--) {
      var c = s.charAt(i);
      if (isLong(c)) { return s; }
      if (LENGTHEN[c]) { return s.slice(0, i) + LENGTHEN[c] + s.slice(i + 1); }
    }
    return null;
  }

  function imperative(info, form) {
    var out = [];
    var stem = info.stem;
    var pv = IMP_PV.map(function (v) { return (info.yFinal && v === 'i') ? 'e' : v; });

    for (var i = 0; i < 4; i++) {
      var log = makeLogger();
      var w = null;
      var und;                                   // stem + ending, as shown to the reader
      var b = stem.slice(0, -1);

      if (form === 'samon') {
        und = stem + ' + ' + ['a', 'un', 'as', (info.cluster ? 'aya' : 'ya')][i];
        log('imp_long');
        if (info.cls === 'short') {
          w = [b + 'ā', b + 'ōn', b + 'ās', b + 'āya'][i];
          if (i === 0) { log('aa_end'); } if (i === 1) { log('au_c'); }
        } else if (info.cls === 'u') {
          w = [b + 'ūa', b + 'ūn', b + 'ūas', b + 'ūya'][i];
          if (i === 1) { log('uu_c'); }
        } else if (info.cls === 'e') {
          w = [b + 'ēa', b + 'ēun', b + 'ēas', b + 'ēya'][i];
        } else {
          var L = lengthenLast(stem);
          if (L) {
            w = L + ['a', 'un', 'as', info.cluster ? 'aya' : 'ya'][i];
            if (i === 3 && info.cluster) { log('imp_aya'); }
          }
        }
      } else if (form === 'namon') {
        var end = ['u', 'un', 'us', 'e'][i];
        und = stem + ' + ' + end;
        if (info.vowelStem) { w = stem + 'dd' + end; log('imp_dd'); }
        else if (info.cluster) { w = stem + pv[i] + 'dd' + end; log('imp_pv'); if (pv[i] !== IMP_PV[i]) { log('yi'); } }
        else { w = stem + stem.charAt(stem.length - 1) + end; log('imp_dbl'); }
      } else {
        var endX = ['a', 'un', 'as', 'e'][i];
        und = stem + ' + g' + endX;
        log('imp_long');
        if (info.vowelStem) {
          w = lengthenLast(stem) + 'g' + endX;
        } else {
          var LX = lengthenLast(stem);
          if (LX) {
            if (info.cluster) { w = LX + pv[i] + 'g' + endX; log('imp_pv'); if (pv[i] !== IMP_PV[i]) { log('yi'); } }
            else {
              if (LX.charAt(LX.length - 1) === 'b') { LX = LX.slice(0, -1) + 'v'; log('imp_bv'); }
              w = LX + 'g' + endX;
            }
          }
        }
      }
      if (w) { log.form(w); w = finish(w, log); }
      out.push(w ? { form: w, underlying: und, rules: log.list, steps: log.steps } : { form: null, underlying: und, rules: [], steps: [], note: 'The root has no vowel to lengthen, so this imperative cannot be built by rule.' });
    }
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Non-finite forms and derivations                                    */
  /* ------------------------------------------------------------------ */

  function derive(stem, suffix, form) {
    var log = makeLogger();
    var w = contact(stem, suffix, { form: form || 'none' }, log);
    log.form(w);
    w = finish(w, log);
    return { form: w, underlying: stem + ' + ' + suffix, rules: log.list, steps: log.steps };
  }

  function gerunds(info) {
    return {
      samon: derive(info.stem, 'ior', 'gerund'),
      namon: derive(info.stem, 'inve', 'gerund'),
      exmon: derive(info.stem, 'anga', 'gerund')
    };
  }

  function dictionaryForm(info) {
    var log = makeLogger();
    var w = info.vowelStem ? info.stem + 'vuos' : info.stem + 'evuos';
    w = finish(w, log);
    return { form: w, underlying: info.vowelStem ? info.stem + ' + vuos' : info.stem + ' + evuos', rules: log.list, steps: log.steps };
  }

  /** A rule that adds or removes letters with no sound rule involved. */
  function ruled(underlying, result, ruleId) {
    var log = makeLogger();
    log(ruleId, result);
    var w = finish(result, log);
    return { form: w, underlying: underlying, rules: log.list, steps: log.steps };
  }

  /**
   * Regular derivations (adjectives, nouns, people).
   * Each item says how to decline it: `oblique` is the stem endings attach to.
   */
  function derivations(info) {
    var s = info.stem;
    var out = [];
    var add = function (kind, label, res, note, oblique) {
      out.push({ kind: kind, label: label, form: res.form, underlying: res.underlying, rules: res.rules, steps: res.steps || [], note: note || null, oblique: oblique || res.form });
    };

    var samonP, namonP;
    if (info.vowelStem) {
      samonP = { form: s, underlying: s, rules: [], steps: [] };
      namonP = derive(s, 'r');
    } else {
      // consonant stems: the samon participle is the bare stem (dab, ilus); the namon puts e before r, like e-stems (daber)
      samonP = { form: s, underlying: s, rules: [], steps: [] };
      // a word may end only in -st, -rr or -nt; any other final cluster takes a between its consonants (idr -> idar)
      var tk = tokenize(s), t1 = tk[tk.length - 1], t2 = tk[tk.length - 2];
      if (t1 && t2 && !t1.v && !t2.v && !t1.gem && t1.t.length === 1 && t2.t.length === 1 && ['st', 'nt'].indexOf(t2.t + t1.t) === -1) {
        var cut = s.length - 1;
        samonP = ruled(s, s.slice(0, cut) + 'a' + s.slice(cut), 'part_a');
      }
      namonP = ruled(s + ' + r', s + 'er', 'part_e');
    }
    var exmonP = derive(s, 'ox');
    var active;
    if (info.cls === 'u') { active = ruled(s + ' + anga', s.slice(0, -1) + 'anga', 'act_u'); }
    else { active = derive(s, 'anga'); }
    // The exmon participle drops its o before an ending (fastuox -> fastux-); consonant stems keep it (labox-).
    var exOblique = (info.cls === 'u' || info.cls === 'e') ? s + 'x' : exmonP.form;

    add('adjective', 'samon participle', samonP, 'the subject the event happened to');
    add('adjective', 'namon participle', namonP, 'an inner state; also figurative');
    add('adjective', 'exmon participle', exmonP, 'the target: someone did this to them', exOblique);
    add('adjective', 'active adjective', active, 'what causes the state');

    var os = info.cls === 'u' ? ruled(s + ' + os', s.slice(0, -1) + 'ūos', 'os_long') : derive(s, 'os');
    add('noun', '-os (essence)', os);
    add('noun', '-ver (one who does it)', derive(s, 'ver'));
    add('noun', '-fuar (one who creates it)', derive(s, 'fuar'));
    add('noun', '-li (object)', derive(s, 'li'));
    add('noun', '-diun (animal)', derive(s, 'diun'));
    add('noun', '-del (machine)', derive(s, 'del'));

    add('person', '-on from the samon participle', derive(samonP.form, 'on'));
    add('person', '-on from the namon participle', derive(namonP.form, 'on'));
    if (exOblique !== exmonP.form) {
      add('person', '-on from the exmon participle', ruled(exmonP.form + ' + on', exOblique + 'on', 'ox_obl'));
    } else {
      add('person', '-on from the exmon participle', derive(exmonP.form, 'on'));
    }
    add('person', '-on from the active adjective', derive(active.form, 'on'));
    return out;
  }

  /** The īmon prefix: ī- before a consonant, y- before a vowel; ende- loses its e after ī. */
  function imon(w) {
    if (!w) { return null; }
    if (w.indexOf('ende') === 0) { return { form: 'īnde' + w.slice(4), rule: 'imon_ende' }; }
    return isV(w.charAt(0)) ? { form: 'y' + w, rule: 'imon_y' } : { form: 'ī' + w, rule: 'imon_i' };
  }

  /* ------------------------------------------------------------------ */
  /* Full conjugation                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Conjugate a verb. `irregular` (optional) is a table like lexicon.irregular.la.
   */
  function conjugate(samon, irregular) {
    var info = analyze(samon);
    var res = { info: info, finite: {}, imperative: {}, gerund: null, dictionary: null, derivations: [] };

    FORMS.forEach(function (f) {
      res.finite[f] = {};
      TENSES.forEach(function (t) {
        res.finite[f][t] = PERSONS.map(function (p, i) {
          var r = irregular ? { form: irregular[f][t][i], underlying: 'irregular', rules: ['irr'], steps: [] } : buildFinite(info, f, t, i);
          var im = imon(r.form);
          r.imon = im;
          r.ipa = toIPA(r.form);
          r.imonIpa = im ? toIPA(im.form, { imon: im.rule !== 'imon_y' }) : null;
          return r;
        });
      });
      if (irregular) {
        res.imperative[f] = irregular.imperative[f].map(function (w) { return { form: w, underlying: 'irregular', rules: ['irr'], steps: [], ipa: toIPA(w) }; });
      } else {
        res.imperative[f] = imperative(info, f).map(function (r) { r.ipa = r.form ? toIPA(r.form) : null; return r; });
      }
    });

    if (irregular) {
      res.dictionary = { form: irregular.vuos, underlying: 'irregular', rules: ['irr'], steps: [], ipa: toIPA(irregular.vuos) };
      res.info.bases = irregular.bases;
      res.info.cls = 'irregular';
    } else {
      res.dictionary = dictionaryForm(info);
      res.dictionary.ipa = toIPA(res.dictionary.form);
      res.gerund = gerunds(info);
      FORMS.forEach(function (f) { res.gerund[f].ipa = toIPA(res.gerund[f].form); });
      res.derivations = derivations(info).map(function (d) { if (d.form) { d.ipa = toIPA(d.form); } return d; });
    }
    return res;
  }

  /* ------------------------------------------------------------------ */
  /* Nouns and adjectives: case declension                               */
  /* ------------------------------------------------------------------ */

  /**
   * One case form. `word` is the bare form (also the transitive subject),
   * `oblique` the stem the endings attach to (fastuox -> fastux, ney -> ne).
   */
  function declineOne(word, c, num, opts) {
    opts = opts || {};
    var obl = opts.oblique || word;
    if (c.id === 'A' && num === 'sg') {
      return { form: word, underlying: word, rules: [], steps: [], ipa: toIPA(word, { base: opts.stressBase || word }) };
    }
    var log = makeLogger();
    if (obl !== word && opts.obliqueRule) { log(opts.obliqueRule); }
    var end = c.endings[num];
    var last = obl.charAt(obl.length - 1);
    var und = word + ' + ' + end;
    var w;
    if (end.charAt(0) === 'ū') {
      // comitative and abessive: -ūne, -ūxle and their plurals
      if (last === 'u' || last === 'ū') { w = obl + end.slice(1); log('case_u', w); }
      else if (isLong(last)) { w = obl + 'v' + end; log('case_v', w); }
      else { w = obl + end; log.form(w); }
    } else if (c.id === 'A') {
      // plural transitive subject: -i / -en after a consonant, -yi / -nen after a vowel
      if (isV(last)) { w = obl + (num === 'an' ? 'y' : 'n') + end; log(num === 'an' ? 'case_yi' : 'case_nen', w); }
      else { w = obl + end; log.form(w); }
    } else if (isV(last)) {
      w = obl + end; log.form(w);
    } else {
      w = obl + 'a' + end; log('case_a', w);
    }
    // No sound rules run here: the word is already finished, and dissimilation never changes a
    // case ending. When the ending would have triggered it (ve + ve), the chain says so.
    var d = dissimilate(w, function () {});
    var at = 0;
    while (at < w.length && d.charAt(at) === w.charAt(at)) { at++; }
    if (d !== w && at >= obl.length) { log('case_keep', w); }
    return { form: w, underlying: und, rules: log.list, steps: log.steps, ipa: toIPA(w, { base: opts.stressBase || word }) };
  }

  /** Full declension: { word, oblique, cases: [{ id, name, sg, an, in }] }. */
  function decline(word, opts) {
    opts = opts || {};
    var w = String(word || '').trim().toLowerCase();
    if (!LETTERS.test(w)) { throw new Error('Use Lunde letters only (a–z, ä, à, ā ē ī ō ū ǟ, ñ).'); }
    var o = { oblique: opts.oblique, obliqueRule: opts.obliqueRule, stressBase: opts.stressBase };
    if (!o.oblique && /[ue]ox$/.test(w)) { o.oblique = w.slice(0, -2) + 'x'; o.obliqueRule = 'ox_obl'; }
    if (!o.oblique && w === 'ney') { o.oblique = 'ne'; o.obliqueRule = 'obl_ne'; }
    // A caller-supplied oblique is logged under the rule that explains it, if one does.
    if (o.oblique && !o.obliqueRule) { o.obliqueRule = w === 'ney' ? 'obl_ne' : (/[ue]ox$/.test(w) ? 'ox_obl' : null); }
    return {
      word: w,
      oblique: o.oblique || w,
      cases: CASES.map(function (c) {
        var row = { id: c.id, name: c.name };
        NUMBERS.forEach(function (n) { row[n] = declineOne(w, c, n, o); });
        return row;
      })
    };
  }

  /* ------------------------------------------------------------------ */
  /* Personal pronouns: the noun endings on an oblique stem, plus listed exceptions */
  /* ------------------------------------------------------------------ */

  var PRONOUN_STEMS = [
    { person: '1s', bare: 'ki', oblique: 'ki' },
    { person: '2s', bare: 'gū', oblique: 'gu', optionalG: true },
    { person: '3s.a', bare: 'da', oblique: 'da' },
    { person: '3s.i', bare: 'ne', oblique: 'na' },
    { person: '1p', bare: 'īssi', oblique: 'īssi' },
    { person: '2p', bare: 'gūn', oblique: 'gū' },
    { person: '3p', bare: 'dan', oblique: 'dā' }
  ];
  var PRONOUN_EXCEPTIONS = {
    '2s:S': ['gam', 'pron_gam'],
    '1p:O': ['īsse', 'pron_contract'],
    '3p:COM': ['daūne', 'pron_3p'],
    '3p:ABE': ['daūxle', 'pron_3p']
  };

  function pronounTable() {
    return PRONOUN_STEMS.map(function (p) {
      var row = { person: p.person, bare: p.bare, oblique: p.oblique, optionalG: !!p.optionalG, cases: {} };
      CASES.forEach(function (c) {
        if (c.id === 'A') { row.cases.A = { form: p.bare, underlying: p.bare, rules: [], steps: [], ipa: toIPA(p.bare) }; return; }
        var r = declineOne(p.oblique, c, 'sg', { stressBase: p.bare });
        var exc = PRONOUN_EXCEPTIONS[p.person + ':' + c.id];
        if (exc) {
          r.byRule = r.form;
          r.form = exc[0];
          r.rules = r.rules.concat([exc[1]]);
          r.steps = r.steps.concat([{ rules: [exc[1]], form: exc[0] }]);
          r.ipa = toIPA(exc[0], { base: p.bare });
        }
        r.underlying = p.oblique + '- + ' + c.endings.sg;
        row.cases[c.id] = r;
      });
      return row;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Numbers (base twelve)                                               */
  /* ------------------------------------------------------------------ */

  var DIGITS = ['na', 'ra', 'hara', 'du', 'jayu', 'java', 'isa', 'gvena', 'fisa', 'dion', 'fiū', 'siōn'];
  var POWERS = [['hayatiōn', 20736], ['galatiōn', 1728], ['igyiōn', 144], ['siōn', 12]];
  var NUMBER_MAX = 248831;   // 12^5 - 1: the doc names powers up to hayatiōn (12^4)

  /** A number as a word: biggest power first, multipliers joined, smaller numbers after a dash. */
  function numberWord(n, opts) {
    n = Number(n);
    if (!isFinite(n) || n !== Math.floor(n) || n < 1) { throw new Error('Give a whole number from 1 up.'); }
    if (n > NUMBER_MAX) { throw new Error('The doc names powers of twelve up to hayatiōn (12⁴), so the largest number is 248,831.'); }
    var parts = [];
    var rem = n;
    POWERS.forEach(function (p) {
      var d = Math.floor(rem / p[1]);
      if (d > 0) {
        parts.push({ word: (d > 1 ? DIGITS[d - 1] : '') + p[0], value: d * p[1], digit: d, power: p[0], unit: p[1] });
        rem -= d * p[1];
      }
    });
    if (rem > 0) { parts.push({ word: DIGITS[rem - 1], value: rem, digit: rem, power: null, unit: 1 }); }
    var form = parts.map(function (x) { return x.word; }).join('-');
    if (opts && opts.counting && n <= 12) { form = 'ē-' + DIGITS[n - 1]; }
    return { value: n, form: form, parts: parts };
  }

  /** Ordinals: the number + the genitive, joined with a dash (na-de, ra-de, siōn-ade). */
  function ordinal(n) {
    var w = numberWord(n).form;
    return w + '-' + (isV(w.charAt(w.length - 1)) ? 'de' : 'ade');
  }

  /* ------------------------------------------------------------------ */
  /* Manner adverbs                                                      */
  /* ------------------------------------------------------------------ */

  function adverb(word) {
    var w = String(word || '').trim().toLowerCase();
    if (!w) { return null; }
    var v = isV(w.charAt(0));
    return { form: (v ? 'ilis' : 'ili') + w, underlying: (v ? 'ilis' : 'ili') + '- + ' + w, rules: [v ? 'adv_ilis' : 'adv_ili'] };
  }

  /* ------------------------------------------------------------------ */
  /* Stress and IPA                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Stress (Phonology section): every vowel is its own syllable.
   * 1. case endings never count: with opts.base, stress is set on the bare word;
   * 2. the īmon ī- takes the main stress;
   * 3. otherwise the last long vowel that is not in the final syllable;
   * 4. otherwise the penultimate (up to 3 syllables) or the antepenultimate (4+);
   * other long vowels take a secondary stress.
   */
  function stress(word, opts) {
    var w = String(word).toLowerCase();
    var n = nuclei(w);
    if (!n.length) { return { primary: -1, secondary: [], count: 0, reason: 'none' }; }
    var primary, reason;
    if (opts && opts.base && String(opts.base).toLowerCase() !== w) {
      primary = Math.min(stress(opts.base, { imon: opts.imon }).primary, n.length - 1);
      reason = 'base';
    } else if (opts && opts.imon && w.charAt(0) === 'ī') {
      primary = 0; reason = 'imon';
    } else {
      var cand = -1;
      for (var k = 0; k < n.length - 1; k++) { if (isLong(w.charAt(n[k]))) { cand = k; } }
      if (cand >= 0) { primary = cand; reason = 'long'; }
      else if (n.length === 1) { primary = 0; reason = 'single'; }
      else if (n.length <= 3) { primary = n.length - 2; reason = 'penult'; }
      else { primary = n.length - 3; reason = 'antepenult'; }
    }
    var secondary = [];
    for (var k2 = 0; k2 < n.length; k2++) { if (k2 !== primary && isLong(w.charAt(n[k2]))) { secondary.push(k2); } }
    return { primary: primary, secondary: secondary, count: n.length, reason: reason };
  }

  var VOWEL_IPA = { a: 'a', e: 'ɛ', i: 'i', o: 'ɔ', u: 'u', 'ä': 'æ', 'à': 'ɑ', 'ā': 'aː', 'ē': 'ɛː', 'ī': 'iː', 'ō': 'ɔː', 'ū': 'uː', 'ǟ': 'æː' };
  var CONS_IPA = { p: 'p', b: 'b', t: 't', d: 'd', k: 'k', m: 'm', n: 'n', f: 'f', s: 's', z: 'z', l: 'l', h: 'h',
    c: 't͡s', x: 'x', j: 'ʒ', y: 'j', 'ñ': 'ɲ', r: 'r', v: 'β', g: 'ɣ',
    xl: 'ɬ', hy: 'xʲ', gy: 'ɟ', ng: 'ŋ', rr: 'r' };
  var ONSET_CLUSTERS = { dr: 1, py: 1, gv: 1, xn: 1 };

  function phoneOf(toks, i) {
    var tk = toks[i];
    if (tk.v) { return VOWEL_IPA[tk.t]; }
    var last = i === toks.length - 1;
    var base = tk.gem && tk.t !== 'rr' ? tk.t.charAt(0) : tk.t;
    if (base === 'g') {
      if (i === 0 && toks[1] && toks[1].v && !tk.gem) { return 'g'; }
      if (last) { return 'k'; }
      return 'ɣ';
    }
    if (base === 'v') { return (i > 0 && toks[i - 1].t === 'g') ? 'v' : 'β'; }
    if (last && base === 'd') { return 'ð'; }
    if (last && base === 'b') { return 'β'; }
    return CONS_IPA[base] || base;
  }

  function spelled(tk) { return tk.gem && tk.t.length === 1 ? tk.t + tk.t : tk.t; }
  function halves(tk) { return tk.t === 'rr' ? ['r', 'r'] : [tk.t, tk.t]; }

  /**
   * Syllables with their spelling, IPA and stress: [{ text, ipa, stress: 'primary' | 'secondary' | null }].
   * Every vowel is a nucleus; consonants go to the next syllable, except that a geminate splits
   * and only the clusters dr, py, gv, xn can start a syllable together.
   */
  function syllabify(word, opts) {
    var w = String(word).toLowerCase();
    var toks = tokenize(w);
    var phones = toks.map(function (t, i) { return phoneOf(toks, i); });
    var nuc = [];
    toks.forEach(function (t, i) { if (t.v) { nuc.push(i); } });
    if (!nuc.length) { return [{ text: w, ipa: phones.join(''), stress: null }]; }
    var syl = nuc.map(function () { return { on: '', nu: '', co: '', ton: '', tnu: '', tco: '' }; });

    for (var s = 0; s < nuc.length; s++) {
      var ni = nuc[s];
      syl[s].nu = phones[ni];
      syl[s].tnu = toks[ni].t;
      var start = s === 0 ? 0 : nuc[s - 1] + 1;
      var run = [];
      for (var j = start; j < ni; j++) { run.push(j); }
      if (s === 0) {
        run.forEach(function (x) { syl[0].on += phones[x]; syl[0].ton += spelled(toks[x]); });
        continue;
      }
      if (!run.length) { continue; }
      var onsetFrom = run.length - 1;
      if (run.length >= 2 && ONSET_CLUSTERS[toks[run[run.length - 2]].t + toks[run[run.length - 1]].t]) { onsetFrom = run.length - 2; }
      for (var r = 0; r < run.length; r++) {
        var idx = run[r];
        var ph = phones[idx];
        var tk = toks[idx];
        if (r < onsetFrom) { syl[s - 1].co += tk.gem ? ph + 'ː' : ph; syl[s - 1].tco += spelled(tk); }
        else if (r === onsetFrom && tk.gem) {
          var hv = halves(tk);
          syl[s - 1].co += ph; syl[s].on += ph;
          syl[s - 1].tco += hv[0]; syl[s].ton += hv[1];
        }
        else { syl[s].on += ph; syl[s].ton += spelled(tk); }
      }
    }
    for (var k = nuc[nuc.length - 1] + 1; k < toks.length; k++) {
      syl[syl.length - 1].co += toks[k].gem ? phones[k] + 'ː' : phones[k];
      syl[syl.length - 1].tco += spelled(toks[k]);
    }

    var st = stress(w, opts);
    return syl.map(function (x, i) {
      var mark = null;
      if (syl.length > 1 && i === st.primary) { mark = 'primary'; }
      else if (st.secondary.indexOf(i) !== -1) { mark = 'secondary'; }
      return { text: x.ton + x.tnu + x.tco, ipa: x.on + x.nu + x.co, stress: mark };
    });
  }

  /** Broad IPA with syllable dots and stress marks. */
  function toIPA(word, opts) {
    if (!word) { return null; }
    var syl = syllabify(word, opts);
    return '/' + syl.map(function (x) {
      return (x.stress === 'primary' ? 'ˈ' : (x.stress === 'secondary' ? 'ˌ' : '')) + x.ipa;
    }).join('.') + '/';
  }

  return {
    version: '0.2',
    PERSONS: PERSONS, PRONOUNS: PRONOUNS, IMP_PERSONS: IMP_PERSONS, FORMS: FORMS, TENSES: TENSES,
    RULES: RULES, ENDINGS: ENDINGS, CASES: CASES, NUMBERS: NUMBERS, NUMBER_NAMES: NUMBER_NAMES, caseEndingShapes: caseEndingShapes,
    DIGITS: DIGITS, POWERS: POWERS, NUMBER_MAX: NUMBER_MAX, DIGRAPHS: DIGRAPHS,
    analyze: analyze, conjugate: conjugate, contact: contact, join: join, lengthClash: lengthClash, dissimilate: dissimilate,
    buildFinite: buildFinite, imperative: imperative, gerunds: gerunds, dictionaryForm: dictionaryForm,
    derivations: derivations, imon: imon,
    decline: decline, declineOne: declineOne, pronounTable: pronounTable,
    numberWord: numberWord, ordinal: ordinal, adverb: adverb,
    stress: stress, syllabify: syllabify, toIPA: toIPA, tokenize: tokenize,
    isV: isV, isLong: isLong
  };
}));
