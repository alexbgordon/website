/*
 * Node checks for the Lunde script preview and the two gallery spelling fixes.
 * Run: node languages/conjugator/lunde-script-tests.js
 */
'use strict';
var fs = require('fs');
var path = require('path');
var S = require('./lunde-script.js');

var failed = 0;
function eq(name, got, want) {
  var ok = got === want;
  if (!ok) { failed++; console.error('FAIL ' + name + '\n  got  ' + JSON.stringify(got) + '\n  want ' + JSON.stringify(want)); }
}
function ok(name, cond) {
  if (!cond) { failed++; console.error('FAIL ' + name); }
}

eq('ng lower', S.normalize('hekanga'), 'hekaŋa');
eq('ng inside a compound', S.normalize('ixahekanga'), 'ixahekaŋa');
eq('ny lower', S.normalize('enya'), 'eña');
eq('NG capital pair', S.normalize('NG'), 'Ŋ');
eq('ny after a capital', S.normalize('Enya'), 'Eña');
eq('NY both capitals', S.normalize('ENYA'), 'EÑA');
eq('idempotent ŋ', S.normalize('hekaŋa'), 'hekaŋa');
eq('idempotent ñ', S.normalize('eña'), 'eña');
eq('à precomposed stays', S.normalize('kayà'), 'kayà');
eq('à combining stays', S.normalize('kaya\u0300'), 'kaya\u0300');
eq('macron combining stays', S.normalize('ra\u0304ma'), 'ra\u0304ma');
eq('yn is not ny', S.normalize('yēyn'), 'yēyn');
eq('xayēñ stays', S.normalize('xayēñ'), 'xayēñ');
eq('hy stays', S.normalize('kahyasa'), 'kahyasa');
eq('rr stays', S.normalize('irrasa'), 'irrasa');
eq('ł and ğ stay', S.normalize('łasa labeğ'), 'łasa labeğ');
eq('sentence case kept', S.normalize('Kim lai ajaloxam adrevuos.'), 'Kim lai ajaloxam adrevuos.');

var mixed = S.inspect('hekanga q enya');
eq('preview rewrites and keeps q', mixed.rendered, 'hekaŋa q eña');
eq('q is named', mixed.unsupported.map(function (u) { return u.char; }).join(''), 'q');
eq('notice keeps the letter', S.notice(mixed.unsupported), 'Not in the Lunde alphabet, and still shown: q (U+0071).');
ok('q not dropped', mixed.rendered.indexOf('q') !== -1);

var marks = S.inspect('kaya\u0300 w');
eq('combining grave kept beside w', marks.rendered, 'kaya\u0300 w');
eq('w named, grave not', marks.unsupported.length === 1 && marks.unsupported[0].char === 'w', true);

eq('empty', S.inspect('').empty, true);
eq('blank lines are the empty state', S.inspect('  \n').empty, true);
eq('a letter is not empty', S.inspect('a').empty, false);

function rewritePairs(s) {
  return String(s)
    .replace(/NG/g, 'Ŋ').replace(/Ng/g, 'Ŋ').replace(/nG/g, 'ŋ').replace(/ng/g, 'ŋ')
    .replace(/NY/g, 'Ñ').replace(/Ny/g, 'Ñ').replace(/nY/g, 'ñ').replace(/ny/g, 'ñ');
}
S.SAMPLES.forEach(function (sample) {
  var view = S.inspect(sample.text);
  eq('sample ' + sample.id + ' only rewrites ng and ny', view.rendered, rewritePairs(sample.text));
  eq('sample ' + sample.id + ' unsupported', view.unsupported.length, 0);
});
eq('marks and a stray letter are not dropped', S.normalize('q kaya\u0300 hekanga'), rewritePairs('q kaya\u0300 hekanga'));
eq('ñ is not treated as ny', S.normalize('xayēñ'), 'xayēñ');
eq('letters sample shows ŋ and ñ', S.normalize(S.SAMPLES[3].text), 'hekaŋa ixahekaŋa, eña xayēñ kayà łasa labeğ.');

eq('regular file', S.FONTS.regular.file, 'assets/fonts/Lunde-Draft.ttf');
eq('angular file', S.FONTS.angular.file, 'assets/fonts/Lunde-Angular-Draft.ttf');
eq('families differ', S.FONTS.regular.family !== S.FONTS.angular.family, true);
eq('missing font tells the path', S.fontStatus('angular', 'missing').indexOf('assets/fonts/Lunde-Angular-Draft.ttf') !== -1, true);

var root = path.join(__dirname, '..', '..');
var css = fs.readFileSync(path.join(__dirname, 'lunde-script.css'), 'utf8');
var lex = fs.readFileSync(path.join(__dirname, 'lexicon.html'), 'utf8');
var gallery = fs.readFileSync(path.join(root, 'gallery', 'index.html'), 'utf8');
var tree = fs.readFileSync(path.join(root, 'languages', 'index.html'), 'utf8');

ok('css regular family', css.indexOf('font-family: "Lunde Regular"') !== -1);
ok('css angular family', css.indexOf('font-family: "Lunde Angular"') !== -1);
ok('css regular file', css.indexOf('../../assets/fonts/Lunde-Draft.ttf') !== -1);
ok('css angular file', css.indexOf('../../assets/fonts/Lunde-Angular-Draft.ttf') !== -1);
ok('css has no remote url', !/https?:|\/\//.test(css));
ok('css keeps mark features', css.indexOf('"mark"') !== -1 && css.indexOf('line-height: 2.2') !== -1);

ok('page anchor', lex.indexOf('id="script"') !== -1);
ok('page links the stylesheet', lex.indexOf('lunde-script.css') !== -1);
ok('page links the script', lex.indexOf('lunde-script.js') !== -1);
ok('input label', lex.indexOf('for="lunde-script-input"') !== -1);
ok('font group label', lex.indexOf('aria-label="Lunde font"') !== -1);
ok('clear control', lex.indexOf('data-script-clear') !== -1);
ok('live preview', lex.indexOf('aria-live="polite"') !== -1);
ok('nav points at the anchor', lex.indexOf('href="#script"') !== -1);
['grammar.html', 'index.html', 'cases.html', 'numbers.html'].forEach(function (name) {
  var page = fs.readFileSync(path.join(__dirname, name), 'utf8');
  ok(name + ' links to the script', page.indexOf('lexicon.html#script') !== -1);
});

ok('sister-language sentence gone', gallery.indexOf('A sister language to Lundiyani (Modern Lundian).') === -1);
ok('Néyak\'aj heading remains', gallery.indexOf('id="neyakaj-h"') !== -1);
ok('list spelling Snoqwił', gallery.indexOf('href="#snoqwit">Snoqwił</a>') !== -1);
ok('heading spelling Snoqwił', gallery.indexOf('>Snoqwił</h2>') !== -1);
ok('caption spelling Snoqwił', gallery.indexOf('Snoqwił writing system') !== -1);
ok('anchor id kept', gallery.indexOf('id="snoqwit"') !== -1);
ok('old list spelling gone', gallery.indexOf('>Snoqwit<') === -1);
ok('family-tree Snoqwilian untouched', tree.indexOf('Snoqwilian') !== -1);
ok('family tree has no Snoqwił rename', tree.indexOf('Snoqwił') === -1);

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('lunde-script tests passed');
