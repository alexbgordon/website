/*
 * Mastheads and the Lundiyani script preview.
 *   node languages/lang-features-tests.js
 */
'use strict';
var fs = require('fs');
var path = require('path');
var root = path.join(__dirname, '..');
var S = require('./modern/lexicon/lundiyani-script.js');
var failed = 0;
function ok(name, cond) {
  if (!cond) { failed++; console.error('FAIL ' + name); }
}
function eq(name, got, want) {
  if (got !== want) {
    failed++;
    console.error('FAIL ' + name + '\n  got  ' + JSON.stringify(got) + '\n  want ' + JSON.stringify(want));
  }
}
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }

eq('kaxli stays x+l', S.renderText('kaxli'), 'kaxli');
eq('kaxli allowed', S.inspect('kaxli').unsupported.length, 0);
eq('ng not rewritten', S.renderText('ng anya'), 'ng anya');
eq('g flagged and kept', S.inspect('ng').rendered === 'ng' && S.inspect('ng').unsupported.map(function (u) { return u.char; }).join('') === 'g', true);
eq('h flagged', S.inspect('heneu').unsupported.map(function (u) { return u.char; }).join(''), 'h');
eq('q flagged', S.inspect('q').unsupported[0].char, 'q');
eq('accent kept', S.renderText('é'), 'é');
eq('accent allowed', S.inspect('é').unsupported.length, 0);
eq('combining mark kept', S.renderText('a\u0300'), 'a\u0300');
eq('combining mark allowed', S.inspect('a\u0300').unsupported.length, 0);
eq('ł allowed', S.inspect('ułe').unsupported.length, 0);
eq('enya not rewritten', S.inspect('enya').rendered, 'enya');
eq('enya allowed', S.inspect('enya').unsupported.length, 0);

var grammar = read('languages/modern/index.html');
var lex = read('languages/modern/lexicon/index.html');
S.SAMPLES.forEach(function (sample) {
  eq('sample ' + sample.id + ' unchanged', S.inspect(sample.text).rendered, sample.text);
  eq('sample ' + sample.id + ' supported', S.inspect(sample.text).unsupported.length, 0);
});
ok('sleep sample attested', grammar.indexOf(S.SAMPLES[0].text) !== -1);
ok('and sample attested', grammar.indexOf(S.SAMPLES[1].text) !== -1);
ok('has sample attested', grammar.indexOf(S.SAMPLES[2].text) !== -1);
ok('kaxli attested', lex.indexOf('data-w="kaxli"') !== -1);
ok('ułe attested', lex.indexOf('data-w="ułe"') !== -1);
ok('ara attested', lex.indexOf('data-w="ara"') !== -1);
ok('eneu attested', lex.indexOf('data-w="eneu"') !== -1);

eq('loading is not absence', S.fontStatus('angular', 'loading').indexOf('not on this machine') === -1, true);
ok('loading text', S.fontStatus('regular', 'loading').indexOf('Loading Regular') === 0);
eq('unsettled stays loading', S.stateAfterLoad(null), 'loading');
eq('unfinished stays loading', S.stateAfterLoad({ done: false }), 'loading');
eq('failed load is missing', S.stateAfterLoad({ done: true, ok: false }), 'missing');
eq('finished load is ready', S.stateAfterLoad({ done: true, ok: true }), 'ready');
ok('missing names angular file', S.fontStatus('angular', 'missing').indexOf('assets/fonts/Lundiyani-Angular-Draft.ttf') !== -1);
ok('no old ng rewrite', read('languages/modern/lexicon/lundiyani-script.js').indexOf('replace(/ng/') === -1);

var css = read('languages/modern/lexicon/lundiyani-script.css');
ok('regular family', css.indexOf('"Lundiyani Regular"') !== -1);
ok('angular family', css.indexOf('"Lundiyani Angular"') !== -1);
ok('regular file', css.indexOf('Lundiyani-Modern-Draft.ttf') !== -1);
ok('angular file', css.indexOf('Lundiyani-Angular-Draft.ttf') !== -1);
var families = css.split('\n').filter(function (line) { return line.indexOf('font-family') !== -1; }).join('\n');
ok('no Lunde face in modern preview', families.indexOf('Lunde') === -1);
ok('section and label', lex.indexOf('id="script"') !== -1 && lex.indexOf('for="ly-script-input"') !== -1);
ok('initial status is loading', lex.indexOf('>Loading Regular.</p>') !== -1);

var chrome = read('assets/chrome.css');
ok('lunde mast face', chrome.indexOf('[data-lang-mast="lunde"] .lang-mast-script') !== -1 && chrome.indexOf('font-family: "Lunde Angular"') !== -1);
ok('lundiyani mast face', chrome.indexOf('[data-lang-mast="lundiyani"] .lang-mast-script') !== -1 && chrome.indexOf('font-family: "Lundiyani Angular"') !== -1);
ok('tall mark line-height', chrome.indexOf('.lang-mast-script') !== -1 && chrome.indexOf('line-height: 1.5') !== -1);

[
  'languages/conjugator/grammar.html',
  'languages/conjugator/index.html',
  'languages/conjugator/lexicon.html',
  'languages/conjugator/cases.html',
  'languages/conjugator/numbers.html'
].forEach(function (rel) {
  var html = read(rel);
  ok(rel + ' lunde mast', html.indexOf('data-lang-mast="lunde"') !== -1 && html.indexOf('aria-hidden="true">Lunde</span>') !== -1 && html.indexOf('(Lunde)') !== -1);
  ok(rel + ' mast above nav', html.indexOf('class="lang-mast"') < html.indexOf('lunde-nav:start'));
});
[
  ['languages/modern/index.html', 'href="../../languages/modern/lexicon/#script"'],
  ['languages/modern/numbers.html', 'href="../../languages/modern/lexicon/#script"'],
  ['languages/modern/conjugator/index.html', 'href="../../../languages/modern/lexicon/#script"'],
  ['languages/modern/lexicon/index.html', 'href="#script"']
].forEach(function (pair) {
  var html = read(pair[0]);
  ok(pair[0] + ' mast', html.indexOf('data-lang-mast="lundiyani"') !== -1 && html.indexOf('(Lundiyani)') !== -1);
  ok(pair[0] + ' script link', html.indexOf(pair[1] + '>Script</a>') !== -1);
  ok(pair[0] + ' mast above nav', html.indexOf('class="lang-mast"') < html.indexOf('lunde-nav:start'));
});
['languages/index.html', 'languages/history/index.html', 'index.html', 'about/index.html', 'gallery/index.html', 'poetry/index.html'].forEach(function (rel) {
  if (!fs.existsSync(path.join(root, rel))) { return; }
  ok(rel + ' no mast', read(rel).indexOf('lang-mast') === -1);
});

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('lang feature tests passed');
