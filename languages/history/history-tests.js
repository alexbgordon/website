/*
 * Checks for the Languages history page. Run from the repo root:
 *   node languages/history/history-tests.js
 */
'use strict';
var fs = require('fs');
var path = require('path');
var root = path.join(__dirname, '..', '..');
var failed = 0;
function ok(name, cond) {
  if (!cond) { failed++; console.error('FAIL ' + name); }
}
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }

var page = read('languages/history/index.html');
ok('title', page.indexOf('From Lunde to Lundiyani') !== -1);
ok('full alphabet', page.indexOf('The Lundiyani script is a full alphabet.') !== -1);
ok('medial a unwritten', page.indexOf('Medial <i>a</i> is unwritten') !== -1);
ok('independent vowels', page.indexOf('independent letters for <i>a</i>, <i>e</i>, <i>i</i>, <i>o</i> and <i>u</i>') !== -1);
ok('angular is present-day', page.indexOf('present-day treatment of Lunde') !== -1 && page.indexOf('not a historical stage') !== -1);
ok('no intermediate alphabet claim', page.indexOf('not an intermediate alphabet') !== -1);
ok('final i is not universal', page.indexOf('not as a universal rule') !== -1);
ok('inherited i', page.indexOf('Some i’s were already there') !== -1 || page.indexOf('Some i\'s were already there') !== -1);
ok('plural i', page.indexOf('Some mark a plural') !== -1);
ok('derivational i', page.indexOf('larger suffix') !== -1);
ok('lexical i', page.indexOf('individual lexical changes') !== -1);
ok('h loss', page.indexOf('hara</a></td>') !== -1 && page.indexOf('Loss of <i>h</i> in the word for three.') !== -1);
ok('x stays separate', page.indexOf('<i>h</i> does not become <i>x</i>') !== -1);
ok('no word-order reversal', page.indexOf('no reversal of order from Lunde to Lundiyani') !== -1);
ok('many words lack an older counterpart', page.indexOf('stand without a Lunde counterpart') !== -1);
ok('no editorial source brackets', page.indexOf('[Sources') === -1 && page.indexOf('[Preview') === -1 && page.indexOf('[For exact') === -1);
ok('no confidence badges', page.indexOf('Hypothesis') === -1 && page.indexOf('<strong>Confirmed:</strong>') === -1 && page.indexOf('author-confirmed') === -1);
ok('no out-of-world framing', page.indexOf('constructed') === -1 && page.indexOf('invented language') === -1 && page.indexOf('draft comparison') === -1);
ok('narrow b:w', page.indexOf('The correspondence <i>b</i> : <i>w</i> is visible in') !== -1 && page.indexOf('alba') !== -1 && page.indexOf('every <i>b</i>') === -1);
ok('no glyph pedigree', page.indexOf('does not trace the development of one glyph into another') !== -1);
ok('no unattested stages', page.indexOf('no unattested intermediate stage') !== -1);
ok('gallery asset linked', page.indexOf('../../gallery/img/alphabet-sheet-2.jpg') !== -1);
ok('gallery asset exists', fs.existsSync(path.join(root, 'gallery/img/alphabet-sheet-2.jpg')));
ok('gallery section link', page.indexOf('../../gallery/#lundiyani') !== -1);
ok('script anchor kept as a link', page.indexOf('../conjugator/lexicon.html#script') !== -1);
ok('old sounds link', page.indexOf('../conjugator/grammar.html#sounds') !== -1);
ok('modern sounds link', page.indexOf('../modern/#sounds') !== -1);
ok('modern nouns link', page.indexOf('../modern/#nouns') !== -1);
ok('pdf link', page.indexOf('../modern/lundiyani-grammar-reference.pdf') !== -1);
ok('pdf exists', fs.existsSync(path.join(root, 'languages/modern/lundiyani-grammar-reference.pdf')));
ok('history nav current', page.indexOf('aria-current="page">History</a>') !== -1);
ok('no tool row items', page.indexOf('lunde-tool') !== -1 && page.indexOf('aria-hidden="true"') !== -1);

['hara', 'ara', 'heneu', 'eneu', 'ilus', 'ilusi', 'kana', 'li', 'osil', 'on', 'tesi', 'tesseasa'].forEach(function (w) {
  ok('table has ' + w, page.indexOf('>' + w + '</a>') !== -1);
});

var navs = [
  ['languages/index.html', 'href="history/">History'],
  ['languages/conjugator/lexicon.html', 'href="../../languages/history/">History'],
  ['languages/conjugator/grammar.html', 'href="../../languages/history/">History'],
  ['languages/conjugator/index.html', 'href="../../languages/history/">History'],
  ['languages/conjugator/cases.html', 'href="../../languages/history/">History'],
  ['languages/conjugator/numbers.html', 'href="../../languages/history/">History'],
  ['languages/modern/index.html', 'href="../../languages/history/">History'],
  ['languages/modern/numbers.html', 'href="../../languages/history/">History'],
  ['languages/modern/lexicon/index.html', 'href="../../../languages/history/">History'],
  ['languages/modern/conjugator/index.html', 'href="../../../languages/history/">History']
];
navs.forEach(function (pair) {
  var html = read(pair[0]);
  ok(pair[0] + ' history link', html.indexOf(pair[1]) !== -1);
  ok(pair[0] + ' pager has no History', html.indexOf('lunde-pager') === -1 || html.split('lunde-pager')[1].indexOf('History') === -1);
});
var lexPage = read('languages/conjugator/lexicon.html');
if (lexPage.indexOf('>Script<') !== -1) {
  ok('script anchor remains', lexPage.indexOf('href="#script">Script</a>') !== -1);
} else {
  ok('history does not invent a Script item', lexPage.indexOf('Script') === -1);
}
ok('about untouched expectation', read('about/index.html').indexOf('History') === -1);

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('history tests passed');
