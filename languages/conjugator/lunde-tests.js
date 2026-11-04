/*
 * Expected forms for the Lunde engine, transcribed from the Lunde
 * Grammar Reference (tables and examples) and from forms confirmed in chat, in the
 * macron spelling. Works in Node and in the browser (window.LundeTests).
 * A test with `pending` holds a value the doc still has but a newer decision contradicts.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.LundeTests = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var T = [];
  function fin(base, form, tense, forms, src) { T.push({ kind: 'finite', base: base, form: form, tense: tense, expect: forms.split(' '), src: src }); }
  function one(base, form, tense, person, expect, src) { T.push({ kind: 'one', base: base, form: form, tense: tense, person: person, expect: expect, src: src }); }
  function imp(base, form, forms, src) { T.push({ kind: 'imperative', base: base, form: form, expect: forms.split(' '), src: src }); }
  function ger(base, forms, src) { T.push({ kind: 'gerund', base: base, expect: forms.split(' '), src: src }); }
  function dict(base, expect, src, pending) { T.push({ kind: 'dictionary', base: base, expect: expect, src: src, pending: pending }); }
  function der(base, label, expect, src) { T.push({ kind: 'derived', base: base, label: label, expect: expect, src: src }); }
  function str(word, index, opts, src) { T.push({ kind: 'stress', word: word, expect: index, opts: opts || null, src: src }); }
  function ipa(word, expect, src) { T.push({ kind: 'ipa', word: word, expect: expect, src: src }); }
  function imo(base, form, tense, person, expect, src) { T.push({ kind: 'imon', base: base, form: form, tense: tense, person: person, expect: expect, src: src }); }
  function decl(word, num, forms, src, oblique) { T.push({ kind: 'decline', word: word, num: num, expect: forms.split(' '), src: src, oblique: oblique }); }
  function cas(word, caseId, num, expect, src, pending) { T.push({ kind: 'case', word: word, caseId: caseId, num: num, expect: expect, src: src, pending: pending }); }
  function pron(person, forms, src) { T.push({ kind: 'pronoun', person: person, expect: forms.split(' '), src: src }); }
  function num(n, expect, src, counting) { T.push({ kind: 'number', n: n, expect: expect, src: src, counting: counting }); }
  function ord(n, expect, src) { T.push({ kind: 'ordinal', n: n, expect: expect, src: src }); }
  function adv(word, expect, src) { T.push({ kind: 'adverb', word: word, expect: expect, src: src }); }

  var DOC = 'Reference doc';
  var CHAT = 'Confirmed in chat';
  var ANS = 'Your answers, Oct 18';
  var ANS2 = 'Your answers, Oct 18 (second round)';
  var ANS3 = 'Your answers, Oct 18 (third round)';
  var ANS4 = 'Your answers, Oct 18 (spelling: ł, ğ, zero)';

  /* ---- Samon (doc tables) ---- */
  fin('labasa', 'samon', 'present', 'labi labu laba laban labas labūn labān', DOC);
  fin('labasa', 'samon', 'future', 'labeğ labeju labeğ labēyn labejas labūnna labana', DOC);
  fin('labasa', 'samon', 'past', 'labus labuōs labuōs labuīn labuves labuvōs labuōsen', DOC);
  fin('xasa', 'samon', 'present', 'xai xō xā xan xas xōn xān', DOC);
  fin('xasa', 'samon', 'future', 'xäğ xäju xäğ xayēñ xäjas xōnna xana', DOC);
  fin('xasa', 'samon', 'past', 'xōs xavōs xavōs xavīn xōves xavunōs xavōsen', DOC);
  fin('luasa', 'samon', 'present', 'luj lū lua luan luas luūn luān', DOC);
  fin('luasa', 'samon', 'future', 'lueğ lueju lueğ luēyn luejas luūnna luna', DOC);
  fin('luasa', 'samon', 'past', 'lūs luvōs luvōs luvīn lūves luvunōs luvōsen', DOC);
  fin('leasa', 'samon', 'present', 'lej leu lea lean leas leūn leān', DOC);
  fin('leasa', 'samon', 'future', 'lēğ lēju lēğ leyēñ lējas leūnna lena', DOC);
  fin('leasa', 'samon', 'past', 'leus levōs levōs levīn leuves leuvōs levōsen', DOC);
  one('juasa', 'samon', 'present', 0, 'jun', DOC);
  one('keavasa', 'samon', 'past', 4, 'keavunes', DOC);
  one('keavasa', 'samon', 'past', 5, 'keavunōs', DOC);
  fin('veasa', 'samon', 'past', 'veus venōs venōs venīn veuves veuvōs venōsen', DOC);
  one('kahyasa', 'samon', 'future', 3, 'kahyēñ', DOC);

  /* ---- Namon (doc tables) ---- */
  fin('labasa', 'namon', 'present', 'labei labeo labea labēn labes labeon labeān', DOC);
  fin('labasa', 'namon', 'future', 'labià labuà labà labàn labiàs labuàn labàn', DOC);
  fin('labasa', 'namon', 'past', 'labir labur labar labran labras labrun labran', DOC);
  fin('xasa', 'namon', 'present', 'xäi xäo xäa xayēn xäs xäon xäān', DOC);
  fin('xasa', 'namon', 'future', 'xayà xavà xà xàn xayàs xavàn xàn', DOC);
  fin('xasa', 'namon', 'past', 'xair xōr xar xaran xaras xarun xaran', DOC);
  fin('luasa', 'namon', 'present', 'luei lueo luea luēn lues lueon lueān', DOC);
  fin('luasa', 'namon', 'future', 'lujà luvà luà luàn lujàs luvàn luàn', DOC);
  fin('luasa', 'namon', 'past', 'luir lūr luar luran luras lurun luran', DOC);
  fin('leasa', 'namon', 'present', 'lēi lēo lēa leyēn lēs lēon lēhan', DOC);
  fin('leasa', 'namon', 'future', 'leyà levà leà leàn leyàs levàn leàn', DOC);
  fin('leasa', 'namon', 'past', 'leir leur lear leran leras lerun leran', DOC);
  fin('irrasa', 'namon', 'past', 'irrir irrur irrar irraran irriras irrurun irraran', DOC);
  fin('idrasa', 'namon', 'past', 'idrir idrur idrar idraran idriras idrurun idraran', DOC);
  fin('adrasa', 'namon', 'past', 'adrir adrur adrar adraran adriras adrurun adraran', DOC);
  fin('värasa', 'namon', 'past', 'värir värur värar väraran väriras värurun väraran', DOC);
  one('kahyasa', 'namon', 'future', 0, 'kahyeà', DOC);
  one('kahyasa', 'namon', 'future', 4, 'kahyeàs', DOC);
  one('kahyasa', 'namon', 'past', 0, 'kahyer', DOC);
  one('veasa', 'namon', 'future', 1, 'venà', DOC);
  one('veasa', 'namon', 'future', 5, 'venàn', DOC);
  one('juasa', 'namon', 'future', 0, 'junà', DOC);
  one('juasa', 'namon', 'future', 4, 'junàs', DOC);

  /* ---- Exmon (doc tables) ---- */
  fin('labasa', 'exmon', 'present', 'labix labux labax labaxan labixas labugun labaxan', DOC);
  fin('labasa', 'exmon', 'future', 'labegi labegu labega labegan labegas labegun labegan', DOC);
  fin('labasa', 'exmon', 'past', 'laboxi labogu laboxa laboxan laboxas labogun laboxan', DOC);
  fin('xasa', 'exmon', 'present', 'xaix xōg xag xagan xaixas xōgun xagan', DOC);
  fin('xasa', 'exmon', 'future', 'xägi xägu xäga xägan xägas xägun xägan', DOC);
  fin('xasa', 'exmon', 'past', 'xōgi xōgu xōga xōgan xōgas xōgun xōgan', DOC);
  fin('luasa', 'exmon', 'present', 'luix lūx luax luaxan luixas lūgun luaxan', DOC);
  fin('luasa', 'exmon', 'future', 'luegi luegu luega luegan luegas luegun luegan', DOC);
  fin('luasa', 'exmon', 'past', 'luoxi luogu luoxa luoxan luoxas luogun luoxan', DOC);
  fin('leasa', 'exmon', 'present', 'leix leux leax leaxan leixas leugun leaxan', DOC);
  fin('leasa', 'exmon', 'future', 'lēgi lēgu lēga lēgan lēgas lēgun lēgan', DOC);
  fin('leasa', 'exmon', 'past', 'leoxi leogu leoxa leoxan leoxas leogun leoxan', DOC);
  fin('kasa', 'exmon', 'present', 'kaix kōx kax kaxan kaixas kōgun kaxan', DOC);
  fin('kasa', 'exmon', 'past', 'kōxi kōgu kōxa kōxan kōxas kōgun kōxan', DOC);
  one('kahyasa', 'exmon', 'present', 0, 'kahyex', DOC);
  one('kahyasa', 'exmon', 'present', 4, 'kahyexas', DOC);

  /* ---- Full paradigms confirmed in chat ---- */
  fin('sasa', 'samon', 'present', 'sai sō sā san sas sōn sān', CHAT);
  fin('sasa', 'samon', 'future', 'säğ säju säğ sayēñ säjas sōnna sana', CHAT);
  fin('sasa', 'samon', 'past', 'sōs savōs savōs savīn sōves savunōs savōsen', CHAT);
  fin('sasa', 'namon', 'present', 'säi säo säa sayēn säs säon säān', CHAT);
  fin('sasa', 'namon', 'future', 'sayà savà sà sàn sayàs savàn sàn', CHAT);
  fin('sasa', 'namon', 'past', 'sair sōr sar saran saras sarun saran', CHAT);
  fin('sasa', 'exmon', 'present', 'saix sōx sax saxan saixas sōgun saxan', CHAT);
  fin('sasa', 'exmon', 'future', 'sägi sägu säga sägan sägas sägun sägan', CHAT);
  fin('sasa', 'exmon', 'past', 'sōxi sōgu sōxa sōxan sōxas sōgun sōxan', CHAT);
  fin('enasa', 'samon', 'present', 'eni enu ena enan enas enūn enān', CHAT);
  fin('enasa', 'samon', 'future', 'eneğ eneju eneğ enēyn enejas enūnna enana', CHAT);
  fin('enasa', 'samon', 'past', 'enus enuōs enuōs enuīn enuves enuvōs enuōsen', CHAT);
  fin('enasa', 'namon', 'present', 'enei eneo enea enēn enes eneon eneān', CHAT);
  fin('enasa', 'namon', 'future', 'enià enuà enà enàn eniàs enuàn enàn', CHAT);
  fin('enasa', 'namon', 'past', 'enir enur enar enran enras enrun enran', CHAT);
  fin('enasa', 'exmon', 'present', 'enix enux enax enaxan enixas enugun enaxan', CHAT);
  fin('enasa', 'exmon', 'future', 'enegi enegu enega enegan enegas enegun enegan', CHAT);
  fin('enasa', 'exmon', 'past', 'enoxi enogu enoxa enoxan enoxas enogun enoxan', CHAT);
  fin('tesseasa', 'samon', 'present', 'tessej tesseu tessea tessean tesseas tesseūn tesseān', CHAT);
  fin('tesseasa', 'samon', 'future', 'tessēğ tessēju tessēğ tesseyēñ tessējas tesseūnna tessena', CHAT);
  fin('tesseasa', 'samon', 'past', 'tesseus tessevōs tessevōs tessevīn tesseuves tesseuvōs tessevōsen', CHAT);
  fin('tesseasa', 'namon', 'present', 'tessēi tessēo tessēa tesseyēn tessēs tessēon tessēhan', CHAT);
  fin('tesseasa', 'namon', 'future', 'tesseyà tessevà tesseà tesseàn tesseyàs tessevàn tesseàn', CHAT);
  fin('tesseasa', 'namon', 'past', 'tesseir tesseur tessear tesseran tesseras tesserun tesseran', CHAT);
  fin('tesseasa', 'exmon', 'present', 'tesseix tesseux tesseax tesseaxan tesseixas tesseugun tesseaxan', CHAT);
  fin('tesseasa', 'exmon', 'future', 'tessēgi tessēgu tessēga tessēgan tessēgas tessēgun tessēgan', CHAT);
  fin('tesseasa', 'exmon', 'past', 'tesseoxi tesseogu tesseoxa tesseoxan tesseoxas tesseogun tesseoxan', CHAT);
  fin('nileasa', 'samon', 'present', 'nilej nileu nilea nilean nileas nileūn nileān', CHAT);
  fin('nileasa', 'namon', 'present', 'nilēi nilēo nilēa nileyēn nilēs nilēon nilēhan', CHAT);
  fin('nileasa', 'exmon', 'present', 'nileix nileux nileax nileaxan nileixas nileugun nileaxan', CHAT);
  fin('veasa', 'samon', 'present', 'vej veu vea vean veas veūn veān', CHAT);
  fin('eruasa', 'samon', 'past', 'erūs eruvōs eruvōs eruvīn erūves eruvunōs eruvōsen', CHAT);
  fin('kasa', 'samon', 'present', 'kai kō kā kan kas kōn kān', CHAT);
  fin('kasa', 'namon', 'present', 'käi käo käa kayēn käs käon käān', CHAT);
  fin('kasa', 'namon', 'future', 'kayà kavà kà kàn kayàs kavàn kàn', CHAT);
  fin('kasa', 'namon', 'past', 'kair kōr kar karan karas karun karan', CHAT);
  fin('irrasa', 'samon', 'future', 'irreğ irreju irreğ irrēyn irrejas irrūnna irrana', CHAT);
  fin('kamuasa', 'namon', 'past', 'kamuir kamūr kamuar kamuran kamuras kamurun kamuran', CHAT);
  fin('kamuasa', 'namon', 'future', 'kamujà kamuvà kamuà kamuàn kamujàs kamuvàn kamuàn', CHAT);
  fin('kahyasa', 'namon', 'present', 'kahyei kahyeo kahyea kahyēn kahyes kahyeon kahyeān', CHAT);

  /* ---- Imperatives (2s 2p 1p 3) ---- */
  imp('labasa', 'samon', 'lāba lābun lābas lābya', DOC);
  imp('adrasa', 'samon', 'ādra ādrun ādras ādraya', DOC);
  imp('xasa', 'samon', 'xā xōn xās xāya', DOC);
  imp('luasa', 'samon', 'lūa lūn lūas lūya', DOC);
  imp('leasa', 'samon', 'lēa lēun lēas lēya', DOC);
  imp('labasa', 'namon', 'labbu labbun labbus labbe', DOC);
  imp('adrasa', 'namon', 'adruddu adruddun adriddus adradde', DOC);
  imp('xasa', 'namon', 'xaddu xaddun xaddus xadde', DOC);
  imp('luasa', 'namon', 'luddu luddun luddus ludde', DOC);
  imp('leasa', 'namon', 'leddu leddun leddus ledde', DOC);
  imp('labasa', 'exmon', 'lāvga lāvgun lāvgas lāvge', DOC);
  imp('adrasa', 'exmon', 'ādruga ādrugun ādrigas ādrage', DOC);
  imp('xasa', 'exmon', 'xāga xāgun xāgas xāge', DOC);
  imp('luasa', 'exmon', 'lūga lūgun lūgas lūge', DOC);
  imp('leasa', 'exmon', 'lēga lēgun lēgas lēge', DOC);
  imp('irrasa', 'samon', 'īrra īrrun īrras īrraya', CHAT);
  imp('irrasa', 'namon', 'irruddu irruddun irriddus irradde', CHAT);
  imp('irrasa', 'exmon', 'īrruga īrrugun īrrigas īrrage', CHAT);
  imp('kahyasa', 'samon', 'kāhya kāhyun kāhyas kāhyaya', CHAT);
  imp('kahyasa', 'namon', 'kahyuddu kahyuddun kahyeddus kahyadde', CHAT);
  imp('kahyasa', 'exmon', 'kāhyuga kāhyugun kāhyegas kāhyage', CHAT);
  imp('gistasa', 'samon', 'gīsta gīstun gīstas gīstaya', CHAT);
  imp('gistasa', 'namon', 'gistuddu gistuddun gistiddus gistadde', CHAT);
  imp('gistasa', 'exmon', 'gīstuga gīstugun gīstigas gīstage', CHAT);
  imp('pyezasa', 'samon', 'pyēza pyēzun pyēzas pyēzya', CHAT);
  imp('pyezasa', 'namon', 'pyezzu pyezzun pyezzus pyezze', CHAT);
  imp('pyezasa', 'exmon', 'pyēzga pyēzgun pyēzgas pyēzge', CHAT);
  imp('keavasa', 'samon', 'keāva keāvun keāvas keāvya', CHAT);
  imp('keavasa', 'namon', 'keavvu keavvun keavvus keavve', CHAT);
  imp('keavasa', 'exmon', 'keāvga keāvgun keāvgas keāvge', CHAT);
  imp('värasa', 'samon', 'vǟra vǟrun vǟras vǟrya', DOC);
  imp('värasa', 'namon', 'värru värrun värrus värre', CHAT);
  imp('värasa', 'exmon', 'vǟrga vǟrgun vǟrgas vǟrge', DOC);
  imp('enasa', 'samon', 'ēna ēnun ēnas ēnya', CHAT);
  imp('enasa', 'namon', 'ennu ennun ennus enne', CHAT);
  imp('enasa', 'exmon', 'ēnga ēngun ēngas ēnge', CHAT);
  imp('sasa', 'samon', 'sā sōn sās sāya', CHAT);
  imp('sasa', 'exmon', 'sāga sāgun sāgas sāge', CHAT);
  imp('tesseasa', 'samon', 'tessēa tessēun tessēas tessēya', CHAT);
  imp('tesseasa', 'namon', 'tesseddu tesseddun tesseddus tessedde', CHAT);
  imp('tesseasa', 'exmon', 'tessēga tessēgun tessēgas tessēge', CHAT);

  /* ---- Gerunds (samon -ior, namon -inve, exmon -anga) ---- */
  ger('labasa', 'labior labinve labanga', DOC);
  ger('xasa', 'xayor xainve xanga', DOC);
  ger('luasa', 'lujor luinve luanga', DOC);
  ger('juasa', 'junor juinve juanga', DOC);
  ger('leasa', 'leyor leinve leanga', DOC);
  ger('kahyasa', 'kahyeor kahyenve kahyanga', DOC);
  ger('sasa', 'sayor sainve sanga', CHAT);
  ger('enasa', 'enior eninve enanga', CHAT);
  ger('tesseasa', 'tesseyor tesseinve tesseanga', CHAT);
  ger('nileasa', 'nileyor nileinve nileanga', CHAT);

  /* ---- Dictionary forms ---- */
  [['labasa', 'labevuos'], ['xasa', 'xavuos'], ['luasa', 'luvuos'], ['leasa', 'levuos'], ['keavasa', 'keavenuos'],
   ['veasa', 'venuos'], ['servasa', 'servenuos'], ['tavasa', 'tavenuos'], ['tasa', 'tavuos'], ['nileasa', 'nilevuos'],
   ['kasa', 'kavuos'], ['hekasa', 'hekevuos'], ['sasa', 'savuos'], ['enasa', 'enevuos'], ['tesseasa', 'tessevuos'],
   ['miadeasa', 'miadevuos'], ['edeasa', 'edevuos'], ['eruasa', 'eruvuos'], ['fastuasa', 'fastuvuos'], ['juasa', 'juvuos'],
   ['kamuasa', 'kamuvuos'], ['värasa', 'värevuos'], ['kahyasa', 'kahyevuos'], ['ajalasa', 'ajalevuos']
  ].forEach(function (p) { dict(p[0], p[1], DOC); });
  // ł is one sound, so łasa is a short stem (ła-) like xasa: łavuos.
  dict('łasa', 'łavuos', ANS2);

  /* ---- Adjectives and nouns from verbs ---- */
  der('fastuasa', 'samon participle', 'fastu', DOC);
  der('fastuasa', 'namon participle', 'fastur', DOC);
  der('fastuasa', 'exmon participle', 'fastuox', DOC);
  der('fastuasa', 'active adjective', 'fastanga', DOC);
  der('fastuasa', '-os (essence)', 'fastūos', DOC);
  der('fastuasa', '-on from the samon participle', 'fastuon', DOC);
  der('fastuasa', '-on from the namon participle', 'fasturon', DOC);
  der('fastuasa', '-on from the exmon participle', 'fastuxon', DOC);
  der('fastuasa', '-on from the active adjective', 'fastangōn', DOC);
  der('fastuasa', '-diun (animal)', 'fastudiun', DOC);
  der('miadeasa', 'samon participle', 'miade', DOC);
  der('miadeasa', 'namon participle', 'miader', DOC);
  der('miadeasa', 'exmon participle', 'miadeox', DOC);
  der('miadeasa', 'active adjective', 'miadeanga', DOC);
  der('miadeasa', '-os (essence)', 'miadeos', DOC);
  der('miadeasa', '-on from the samon participle', 'miadeon', DOC);
  der('miadeasa', '-ver (one who does it)', 'miadever', DOC);
  der('miadeasa', '-fuar (one who creates it)', 'miadefuar', DOC);
  der('labasa', 'exmon participle', 'labox', DOC);
  der('labasa', '-os (essence)', 'labos', DOC);
  der('labasa', '-ver (one who does it)', 'labver', DOC);
  der('veasa', '-ver (one who does it)', 'vener', DOC);
  der('eruasa', '-os (essence)', 'erūos', DOC);
  der('juasa', '-os (essence)', 'jūos', DOC);
  der('sasa', '-os (essence)', 'sōs', DOC);
  der('sasa', 'namon participle', 'sar', DOC);
  der('kasa', '-os (essence)', 'kōs', DOC);
  der('kasa', 'namon participle', 'kar', DOC);
  der('nileasa', '-os (essence)', 'nileos', DOC);
  der('nileasa', 'namon participle', 'niler', CHAT);
  der('nileasa', 'exmon participle', 'nileox', CHAT);
  der('nileasa', 'active adjective', 'nileanga', CHAT);
  der('nileasa', '-li (object)', 'nileli', DOC);
  der('nileasa', '-del (machine)', 'niledel', DOC);
  der('keavasa', '-li (object)', 'keavli', DOC);
  der('keavasa', '-del (machine)', 'keavdel', DOC);
  der('kamuasa', '-del (machine)', 'kamudel', DOC);
  der('kamuasa', '-fuar (one who creates it)', 'kamufuar', DOC);
  der('edeasa', '-li (object)', 'edeli', DOC);
  der('edeasa', '-ver (one who does it)', 'edever', DOC);
  der('gistasa', '-ver (one who does it)', 'gistver', DOC);
  der('pyezasa', '-fuar (one who creates it)', 'pyezfuar', DOC);
  der('värasa', '-del (machine)', 'värdel', DOC);
  der('kahyasa', '-li (object)', 'kahyli', DOC);
  der('tesseasa', '-li (object)', 'tesseli', DOC);

  /* ---- Stress (your answers, Oct 18) ---- */
  [['labasa', 1], ['gistasa', 1], ['tavenuos', 1], ['menrakeden', 1], ['ixahekanga', 2], ['rāma', 0], ['yūla', 0],
   ['tēllave', 0], ['fastūos', 1], ['maūnar', 1], ['labūn', 0], ['xavunōs', 1], ['luvōsen', 1], ['galatiōn', 1],
   ['īssim', 0], ['miadeangōn', 2], ['luūve', 1], ['rāmūna', 1], ['nileasa', 1], ['īssi', 0], ['fastūos', 1]
  ].forEach(function (p) { str(p[0], p[1], null, 'Stress test, Oct 18'); });
  str('īlabi', 0, { imon: true }, 'Stress test, Oct 18');
  str('īssiūne', 0, { base: 'īssi' }, DOC);   // case endings never count: īs-si-ū-ne

  /* ---- Īmon (doc examples) ---- */
  T.push({ kind: 'imon', base: 'labasa', form: 'samon', tense: 'present', person: 0, expect: 'īlabi', src: DOC });
  T.push({ kind: 'imon', base: 'labasa', form: 'namon', tense: 'present', person: 0, expect: 'īlabei', src: DOC });
  T.push({ kind: 'imon', base: 'labasa', form: 'exmon', tense: 'present', person: 0, expect: 'īlabix', src: DOC });
  T.push({ kind: 'imon', base: 'enasa', form: 'samon', tense: 'present', person: 1, expect: 'yenu', src: DOC });
  T.push({ kind: 'imon', base: 'eruasa', form: 'samon', tense: 'past', person: 0, expect: 'yerūs', src: DOC });
  T.push({ kind: 'imon', base: 'irrasa', form: 'samon', tense: 'present', person: 0, expect: 'yirri', src: DOC });
  T.push({ kind: 'imon', base: 'idrasa', form: 'samon', tense: 'present', person: 0, expect: 'yidri', src: DOC });

  /* ---- IPA ---- */
  ipa('nileasa', '/ni.ˈlɛ.a.sa/', 'Phonology');
  ipa('xog', '/xɔk/', 'Phonology');
  ipa('hekanga', '/hɛ.ˈka.ŋa/', 'Phonology');
  ipa('gval', '/ɣval/', 'Phonology');
  ipa('ała', '/ˈa.ɬa/', 'Phonology');
  ipa('kahyasa', '/ka.ˈxʲa.sa/', 'Phonology');
  ipa('eked', '/ˈɛ.kɛð/', 'Phonology');
  ipa('dab', '/daβ/', 'Phonology');
  ipa('ga', '/ga/', 'Phonology');

  /* ---- Your answers, Oct 18 (second session) ---- */
  one('kahyasa', 'samon', 'present', 0, 'kahye', ANS);
  imp('mailasa', 'samon', 'maīla maīlun maīlas maīlya', ANS);
  imp('mailasa', 'exmon', 'maīlga maīlgun maīlgas maīlge', ANS);
  fin('ixasa', 'exmon', 'present', 'ixig ixug ixag ixagan ixigas ixugun ixagan', ANS);
  fin('ixasa', 'exmon', 'past', 'ixogi ixogu ixoga ixogan ixogas ixogun ixogan', ANS);
  der('ixasa', 'exmon participle', 'ixog', ANS);
  der('juasa', 'active adjective', 'janga', ANS);
  der('luasa', 'active adjective', 'langa', ANS);
  der('eruasa', 'active adjective', 'eranga', ANS);
  der('kamuasa', 'active adjective', 'kamanga', ANS);
  // The samon participle of a consonant stem is the bare stem: dab, ilus (no e).
  der('dabasa', 'samon participle', 'dab', ANS2);
  der('ilusasa', 'samon participle', 'ilus', ANS2);
  der('dabasa', 'namon participle', 'daber', ANS);
  // A word may end only in -st, -rr or -nt: any other final cluster takes a between its consonants.
  der('idrasa', 'samon participle', 'idar', ANS3);
  der('ampasa', 'samon participle', 'amap', ANS3);
  der('gistasa', 'samon participle', 'gist', ANS3);
  der('ilusasa', 'namon participle', 'iluser', ANS);
  imp('lasa', 'samon', 'xāla xālun xālas xāya', ANS);

  /* ---- Prefixes ende- and łe- (doc table) ---- */
  one('endelabasa', 'samon', 'present', 0, 'endelabi', DOC);
  one('endelabasa', 'namon', 'present', 0, 'endelabei', DOC);
  one('łendelabasa', 'samon', 'present', 0, 'łendelabi', DOC);
  one('łendelabasa', 'namon', 'present', 0, 'łendelabei', DOC);
  one('łeservasa', 'namon', 'present', 0, 'łeservei', DOC);
  one('endeservasa', 'exmon', 'present', 0, 'endeservix', DOC);
  one('endefastuasa', 'exmon', 'present', 0, 'endefastuix', DOC);
  imo('endelabasa', 'samon', 'present', 0, 'īndelabi', DOC);
  imo('endelabasa', 'namon', 'present', 0, 'īndelabei', DOC);
  imo('łendelabasa', 'samon', 'present', 0, 'īłendelabi', DOC);
  imo('łendelabasa', 'namon', 'present', 0, 'īłendelabei', DOC);
  imo('łeservasa', 'namon', 'present', 0, 'īłeservei', DOC);
  imo('endeservasa', 'exmon', 'present', 0, 'īndeservix', DOC);
  imo('endefastuasa', 'exmon', 'present', 0, 'īndefastuix', DOC);

  /* ---- Cases: the adjective declension table ---- */
  decl('fastu', 'sg', 'fastu fastum fastuse fastuve fastude fastuze fastune fastułe', DOC);
  decl('fastur', 'sg', 'fastur fasturam fasturase fasturave fasturade fasturaze fasturūne fasturūłe', DOC);
  decl('fastanga', 'sg', 'fastanga fastangam fastangase fastangave fastangade fastangaze fastangaūne fastangaūłe', DOC);
  [['A', 'fastuox'], ['S', 'fastuxam'], ['O', 'fastuxase'], ['ALL', 'fastuxave'], ['GEN', 'fastuxade'], ['ABL', 'fastuxaze'], ['COM', 'fastuxūne']
  ].forEach(function (p) { cas('fastuox', p[0], 'sg', p[1], DOC); });
  // ł is one sound, and dissimilation never changes a case ending: fastuxūłe (the doc's table had fastuxūgle).
  cas('fastuox', 'ABE', 'sg', 'fastuxūłe', ANS2);
  // Dissimilation never changes a case ending, and the finished word before it stays as it is.
  cas('ve', 'ALL', 'sg', 'veve', ANS2); cas('ve', 'ALL', 'an', 'vevi', ANS2);
  cas('keav', 'ALL', 'sg', 'keavave', ANS2);

  /* ---- Cases: demonstratives ---- */
  decl('ney', 'sg', 'ney nem nese neve nede neze neūne neūłe', DOC);
  decl('nal', 'sg', 'nal nalam nalase nalave nalade nalaze nalūne nalūłe', DOC);
  decl('gval', 'sg', 'gval gvalam gvalase gvalave gvalade gvalaze gvalūne gvalūłe', DOC);
  cas('ney', 'A', 'an', 'neyi', DOC); cas('ney', 'A', 'in', 'nenen', DOC);
  cas('nal', 'A', 'an', 'nali', DOC); cas('nal', 'A', 'in', 'nalen', DOC);
  cas('gval', 'A', 'an', 'gvali', DOC); cas('gval', 'A', 'in', 'gvalen', DOC);
  cas('maū', 'S', 'sg', 'maūm', DOC); cas('maū', 'O', 'sg', 'maūse', DOC);
  cas('maū', 'COM', 'sg', 'maūne', DOC); cas('maū', 'ABE', 'sg', 'maūłe', DOC);

  /* ---- Cases: place, time, space and question words ---- */
  [['ine', 'ALL', 'ineve'], ['ine', 'ABL', 'ineze'], ['nale', 'ALL', 'naleve'], ['nale', 'ABL', 'naleze'],
   ['nar', 'ALL', 'narave'], ['nar', 'ABL', 'naraze'], ['tēlla', 'ALL', 'tēllave'], ['tēlla', 'ABL', 'tēllaze'],
   ['xamah', 'ALL', 'xamahave'], ['xamah', 'ABL', 'xamahaze'], ['xa', 'COM', 'xaūne'], ['xa', 'ABE', 'xaūłe'],
   ['xamah', 'ABE', 'xamahūłe'], ['nar', 'ABE', 'narūłe'],
   ['nä', 'ALL', 'näve'], ['nä', 'ABL', 'näze'], ['men', 'ALL', 'menave'], ['men', 'ABL', 'menaze'],
   ['ibu', 'ALL', 'ibuve'], ['ibu', 'ABL', 'ibuze'], ['bua', 'ALL', 'buave'], ['bua', 'ABL', 'buaze'],
   ['har', 'ALL', 'harave'], ['har', 'ABL', 'haraze'], ['eked', 'ALL', 'ekedave'], ['eked', 'ABL', 'ekedaze'],
   ['menrakeden', 'ALL', 'menrakedenave'], ['menrakeden', 'ABL', 'menrakedenaze']
  ].forEach(function (p) { cas(p[0], p[1], 'sg', p[2], DOC); });

  /* ---- Cases: nouns and adjectives in the doc's sentences ---- */
  [['osil', 'A', 'an', 'osili'], ['osil', 'S', 'an', 'osilami'], ['on', 'S', 'an', 'onami'], ['on', 'ABL', 'an', 'onazi'],
   ['on', 'A', 'an', 'oni'], ['rāma', 'S', 'sg', 'rāmam'], ['rāma', 'S', 'an', 'rāmami'], ['vuos', 'A', 'an', 'vuosi'],
   ['zen', 'A', 'in', 'zenen'], ['fastu', 'S', 'an', 'fastumi'], ['albade', 'S', 'sg', 'albadem'], ['albade', 'O', 'sg', 'albadese'],
   ['albaūne', 'S', 'sg', 'albaūnem'], ['alba', 'GEN', 'sg', 'albade'], ['alba', 'COM', 'sg', 'albaūne'], ['alba', 'ABE', 'sg', 'albaūłe'],
   ['heneu', 'ABE', 'sg', 'heneułe'], ['tesseli', 'O', 'sg', 'tesselise'],
   ['fastūos', 'S', 'sg', 'fastūosam'], ['miadeos', 'S', 'sg', 'miadeosam'], ['jūos', 'S', 'sg', 'jūosam'], ['ixa', 'O', 'sg', 'ixase'],
   ['ixa', 'S', 'sg', 'ixam'], ['yūla', 'S', 'sg', 'yūlam'], ['fastuon', 'S', 'sg', 'fastuonam'], ['labver', 'O', 'sg', 'labverase'],
   ['amon', 'O', 'sg', 'amonase'], ['ilus', 'O', 'sg', 'ilusase'], ['ilus', 'S', 'sg', 'ilusam'], ['ała', 'S', 'sg', 'ałam'],
   ['dab', 'S', 'sg', 'dabam'], ['ixahekanga', 'S', 'sg', 'ixahekangam'], ['labox', 'S', 'sg', 'laboxam'], ['ajalox', 'S', 'sg', 'ajaloxam'],
   ['miadeox', 'S', 'sg', 'miadexam'], ['fastuox', 'S', 'sg', 'fastuxam']
  ].forEach(function (p) { cas(p[0], p[1], p[2], p[3], DOC); });

  /* ---- Personal pronouns: S, O, allative, genitive, ablative, comitative, abessive ---- */
  pron('1s', 'kim kise kive kide kize kiūne kiūłe', DOC);
  pron('2s', 'gam guse guve gude guze gune gułe', DOC);
  pron('3s.a', 'dam dase dave dade daze daūne daūłe', DOC);
  pron('3s.i', 'nam nase nave nade naze naūne naūłe', DOC);
  pron('1p', 'īssim īsse īssive īsside īssize īssiūne īssiūłe', DOC);
  pron('2p', 'gūm gūse gūve gūde gūze gūne gūłe', DOC);
  pron('3p', 'dām dāse dāve dāde dāze daūne daūłe', DOC);

  /* ---- Numbers (base twelve) ---- */
  'ē-na ē-ra ē-hara ē-du ē-jayu ē-java ē-isa ē-gvena ē-fisa ē-dion ē-fiū ē-siōn'.split(' ').forEach(function (w, i) { num(i + 1, w, DOC, true); });
  [[12, 'siōn'], [144, 'iğiōn'], [1728, 'galatiōn'], [20736, 'hayatiōn'], [24, 'rasiōn'], [36, 'harasiōn'], [288, 'raiğiōn'],
   [13, 'siōn-na'], [15, 'siōn-hara'], [25, 'rasiōn-na'], [50, 'dusiōn-ra'], [100, 'gvenasiōn-du'], [2026, 'galatiōn-raiğiōn-dion'], [2, 'ra']
  ].forEach(function (p) { num(p[0], p[1], DOC); });
  ord(1, 'na-de', DOC); ord(2, 'ra-de', DOC); ord(12, 'siōn-ade', DOC);
  num(0, 'hūł', ANS4);

  /* ---- Orthography (Oct 18): ł = /ɬ/ (once xl), ğ = /ɟ/ (once gy); a written xl is x + l ---- */
  ipa('łasa', '/ˈɬa.sa/', ANS4);
  ipa('labeğ', '/ˈla.bɛɟ/', ANS4);
  ipa('iğiōn', '/i.ˈɟi.ˌɔːn/', ANS4);
  ipa('hūł', '/huːɬ/', ANS4);
  ipa('ixli', '/ˈix.li/', ANS4);
  der('ixasa', '-li (object)', 'ixli', ANS4);

  /* ---- Manner adverbs ---- */
  adv('ixahekanga', 'ilisixahekanga', DOC);
  adv('fastu', 'ilifastu', DOC);
  adv('miade', 'ilimiade', DOC);
  adv('ixa', 'ilisixa', DOC);

  return T;
}));
