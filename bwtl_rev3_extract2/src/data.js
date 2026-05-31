// Mock data — anchored to real BWTL inventory entities & shapes.

const ROLES = {
  pl:     { id: 'pl',     label: 'PL',          initials: 'PL', sub: 'Architect', perms: ['read','write','admin','review','create','approve_ai'] },
  theo:   { id: 'theo',   label: 'Theodoros',   initials: 'TH', sub: 'Instructor', perms: ['read','write','review','create','approve_ai'] },
  tutor:  { id: 'tutor',  label: 'Maria',       initials: 'MA', sub: 'Tutor',      perms: ['read','write','create'] },
  learner:{ id: 'learner',label: 'Stelios',     initials: 'ST', sub: 'Learner',    perms: ['read'] },
};

// PIE roots — keyed by canonical form. Realistic shapes per BWTL01 (efg_pie_explorer_data).
const PIE_ROOTS = {
  '*men-': {
    root: '*men-',
    gloss: 'to think, remember',
    ipa: '/men-/',
    audio_url: '#tts-men',
    audio_coverage: 'efg',         // came from EFG nodes (95% coverage)
    atomic: null,                  // not a compound root
    verbal_paradigm: 'The PIE root *men- generates a thematic present *méneti "thinks" preserved in Skt. mányate, Av. mainyeite, Gk. μαίνομαι (with deponent semantics — "rages, is possessed"), and the causative *monéyeti "makes (one) think, reminds" → Lat. moneō, OE manian. The reduplicated stative *me-món-e gives the perfect Gk. μέμονα "I have in mind, intend" and Lat. meminī.',
    nominal_derivatives: 'The o-grade noun *món-os- yields Gk. μένος "force of mind, anger, life-spirit". The s-stem *mn̥-tí- → Gk. μνῆσις "memory" and the more familiar *mn̥-ti-s → Lat. mēns, mentis ("mind"). With suffix *-tro- the instrument noun *men-tro- gives Skt. mántra "sacred utterance, instrument of thought".',
    modern_cognates: 'English: mental, memory, mention, mind, monitor, comment, remind. French: mémoire, mental, mention, souvenir (via Lat. subvenire — actually under *gʷem-, see *gʷem-). Spanish: mente, memoria. German: Minne ("courtly love, devoted thought"). Through Latin moneō also: monument, monster, summon, admonish.',
    // REV item 2 — Latin promoted to first-class column alongside French/Greek/Sanskrit.
    language_paradigm: {
      Latin:    { forms: [
        { form: 'meminī',        gloss: 'I remember (perfect)', class: 'verb' },
        { form: 'moneō',         gloss: 'I remind, warn',       class: 'verb (causative)' },
        { form: 'mēns, mentis',  gloss: 'mind',                 class: 'f. noun' },
        { form: 'mōns',          gloss: '(unrelated — ←*men-h₂-)', class: 'note', exclude: true },
        { form: 'mentiō',        gloss: 'a calling to mind',    class: 'f. noun' },
        { form: 'monumentum',    gloss: 'reminder',             class: 'n. noun' },
      ] },
      Greek:    { forms: [
        { form: 'μέμονα',        gloss: 'I have in mind',       class: 'verb (perfect)' },
        { form: 'μαίνομαι',      gloss: 'I rage, am possessed', class: 'verb (deponent)' },
        { form: 'μένος',         gloss: 'force of mind, spirit',class: 'n. noun' },
        { form: 'μνῆσις',        gloss: 'memory',               class: 'f. noun' },
        { form: 'μνήμη',         gloss: 'memory (Mod. Gk.)',    class: 'f. noun' },
      ] },
      Sanskrit: { forms: [
        { form: 'mányate',       gloss: 'thinks (mid.)',        class: 'verb' },
        { form: 'mátí-',         gloss: 'thought',              class: 'f. noun' },
        { form: 'mántra-',       gloss: 'sacred utterance',     class: 'm. noun' },
      ] },
      French:   { forms: [
        { form: 'mémoire',       gloss: 'memory',               class: 'f. noun', linked_card: 'fc_memoire' },
        { form: 'mental',        gloss: 'mental',               class: 'adj.' },
        { form: 'mention',       gloss: 'mention',              class: 'f. noun' },
        { form: 'mentir',        gloss: 'to lie (←mēns)',       class: 'verb' },
      ] },
    },
    word_count: 18,
  },
  '*gʷem-': {
    root: '*gʷem-',
    gloss: 'to come, go, step',
    ipa: '/gʷem-/',
    audio_url: '#tts-gwem',
    audio_coverage: 'efg',
    atomic: null,
    verbal_paradigm: 'The athematic root aorist *gʷém-/*gʷm̥- gives Skt. áganma "we went", Gk. ἔβην (with regular *gʷ- > β-). The thematic present *gʷém-e- → Lat. veniō (with *gʷ- > v-) and the reduplicated perfect *gʷé-gʷom-e → Skt. jagāma.',
    nominal_derivatives: 'The verbal noun *gʷm̥-ti- gives Lat. -ventus (in adventus, conventus, eventus). Compound *upo-gʷm̥- yields Gk. ὑποβαίνω "go under, support". Latin *sub-venīre "to come up under, come to aid" → French souvenir originally "what comes to mind" (a coming-up of memory) — note the secondary semantic merge with *men- "think".',
    modern_cognates: 'English (via Latin venire): adventure, avenue, convene, event, invent, prevent, revenue, souvenir (loanword). French: venir, avenir, convenir, souvenir. Spanish: venir, evento. Greek: βαίνω → diabetes, basis, acrobat. Sanskrit gam- → Buddha\'s gata "gone".',
    language_paradigm: {
      Latin:    { forms: [
        { form: 'veniō, venīre', gloss: 'I come, to come',      class: 'verb' },
        { form: 'adventus',      gloss: 'arrival',              class: 'm. noun' },
        { form: 'conventus',     gloss: 'meeting',              class: 'm. noun' },
        { form: 'subvenīre',     gloss: 'to come up under, aid',class: 'verb (→ Fr. souvenir)' },
        { form: 'inveniō',       gloss: 'I find, come upon',    class: 'verb' },
      ] },
      Greek:    { forms: [
        { form: 'βαίνω',         gloss: 'I go, step',           class: 'verb' },
        { form: 'ἔβην',          gloss: 'I went (aor.)',        class: 'verb' },
        { form: 'βάσις',         gloss: 'a stepping, base',     class: 'f. noun' },
        { form: 'ἐπιβάτης',      gloss: 'passenger, marine',    class: 'm. noun (compound)' },
      ] },
      Sanskrit: { forms: [
        { form: 'áganma',        gloss: 'we went (aor.)',       class: 'verb' },
        { form: 'jagāma',        gloss: 'has gone (perf.)',     class: 'verb' },
        { form: 'gata-',         gloss: 'gone',                 class: 'p. part.' },
      ] },
      French:   { forms: [
        { form: 'venir',         gloss: 'to come',              class: 'verb',   linked_card: 'fc_venir' },
        { form: 'souvenir',      gloss: 'memory; keepsake',     class: 'm. noun',linked_card: 'fc_souvenir' },
        { form: 'avenir',        gloss: 'future',               class: 'm. noun',linked_card: 'fc_avenir' },
        { form: 'convenir',      gloss: 'to suit, agree',       class: 'verb' },
        { form: 'revenir',       gloss: 'to come back',         class: 'verb' },
      ] },
    },
    word_count: 22,
  },
  '*h₂ep-': {
    root: '*h₂ep-',
    gloss: 'water',
    ipa: '/h₂ep-/',
    audio_url: '#tts-h2ep',
    audio_coverage: 'efg',
    atomic: null,
    verbal_paradigm: 'Stative/inert by nature; no productive verbal paradigm in PIE. Cf. Hitt. ḫapa- "river", which preserves the consonantal laryngeal directly.',
    nominal_derivatives: 'Skt. áp- (feminine) "water"; Av. āp-, Old Pers. āp-. Underlies hydronyms (river names) across Indo-European: Avon, Apsus, Punjab (Sanskrit pañca-āp "five waters"). The Punjabi/Persian endings preserve the n-stem extension *h₂éb-on-.',
    modern_cognates: 'English: Avon (river). Persian: āb "water". Punjabi/Urdu: -āb (Punjab "five-water"). Albanian: amë (a partial trace). Note: this root is largely fossilised in toponyms; it does not survive as a productive root in modern Germanic, where *wódr̥ ("water") supplied the slot instead.',
    word_count: 6,
  },
  '*peh₂-': {
    root: '*peh₂-',
    gloss: 'to protect, feed, shepherd',
    ipa: '/peh₂-/',
    audio_url: '#tts-peh2',
    audio_coverage: 'efg',
    atomic: null,
    verbal_paradigm: 'Thematic *peh₂-yé- → Lat. pāscō "I feed, pasture". Reduplicated stative also attested.',
    nominal_derivatives: 'Agent *peh₂-tor- "feeder, shepherd" → Lat. pāstor; *peh₂-mn̥ "pasture, food" → Lat. pābulum. Gk. πῶμα "lid, cover" preserves the protect-sense.',
    modern_cognates: 'English: pastor, pasture, food, feed, fodder. Spanish: pasto, pastor. The dual semantics "protect/feed" sit at the heart of Greek φιλόπατρις and Latin patria via metonymy, though strict reconstruction places those under *ph₂tēr.',
    word_count: 9,
  },
  '*h₁epi-+*gʷem-': {
    root: '*h₁epi- + *gʷem-',
    gloss: 'come upon, attack',
    ipa: '/h₁épi-gʷem-/',
    audio_url: '#tts-epigwem',
    audio_coverage: 'efg',
    atomic: ['*h₁epi-', '*gʷem-'],   // compound: surfaces in atomic decomposition row
    verbal_paradigm: 'Compound construction productive in Greek and Indo-Iranian: prefix *h₁epi- "upon, at" + motion root *gʷem-. Greek ἐπιβαίνω "step upon, mount" preserves the literal sense.',
    nominal_derivatives: 'Limited; mostly verbal compounds.',
    modern_cognates: 'Greek: ἐπιβάτης "passenger, marine". This entry exists to demonstrate atomic decomposition for compound roots.',
    word_count: 3,
  },
  '*gʰer-': {
    root: '*gʰer-',
    gloss: 'to grasp, enclose, contain (debated)',
    ipa: '/gʰer-/',
    audio_url: '#tts-gher',
    audio_coverage: 'efg',
    atomic: null,
    verbal_paradigm: 'Reconstruction speculative. Watkins (AHD-IE 32) connects *gʰer- to a sense of grasping/containing, producing Greek χείρ "hand" (← *ǵʰes-r-, distinct in Beekes), Latin hortus "enclosed garden", English yard, garden. Beekes rejects *gʰer- as the source of χρόνος, calling the latter Pre-Greek.',
    nominal_derivatives: 'Tentative: *gʰr-on-os "the encloser, that which contains" → possibly Gk. χρόνος "time" (per Watkins). Beekes considers χρόνος a substrate (Pre-Greek) word with no secure IE etymology.',
    modern_cognates: 'English: garden, yard, court, gird. Latin: hortus → horticulture. Greek: χορτός "pasture", χορός "enclosed dance-ground". Note: Greek χρόνος "time" appears here per the Watkins reconstruction; Beekes treats it as Pre-Greek.',
    language_paradigm: {
      Latin:    { forms: [
        { form: 'hortus',      gloss: 'enclosed garden',     class: 'm. noun' },
        { form: 'cohors',      gloss: 'enclosure, troop',    class: 'f. noun' },
      ] },
      Greek:    { forms: [
        { form: 'χρόνος',      gloss: 'time (per Watkins)',  class: 'm. noun', linked_card: 'fc_chronos' },
        { form: 'χορτός',      gloss: 'pasture',             class: 'm. noun' },
        { form: 'χορός',       gloss: 'dancing-ground',      class: 'm. noun' },
      ] },
      Sanskrit: { forms: [
        { form: 'hára-',       gloss: '(uncertain)',         class: '—', exclude: true },
      ] },
      French:   { forms: [
        { form: 'jardin',      gloss: 'garden (via Frank.)', class: 'm. noun' },
        { form: 'chronique',   gloss: 'chronicle',           class: 'f. noun' },
      ] },
    },
    word_count: 4,
  },
  '*kom-': {
    root: '*kom-',
    gloss: 'beside, near, with, together',
    ipa: '/kom-/',
    audio_url: '#tts-kom',
    audio_coverage: 'efg',
    atomic: null,
    verbal_paradigm: 'Adverb/preposition by nature; not a verbal root. Productive as a prefix across IE — Lat. con-/com-, Gk. σύν, OE ge-.',
    nominal_derivatives: 'Underlies the productive prefix class: Lat. com- (combine, compose, compound), Gk. συν- (synthesis, sympathy). The Latin allomorphy (com-/con-/co-) is conditioned by the following consonant.',
    modern_cognates: 'English (via Latin com-): combine, compose, compound, complete, conclude, conjoin, consist. Greek: σύν → sympathy, synthesis, synonym, system. The English prefix co- (cooperate) is the same morpheme reduced before vowels.',
    language_paradigm: {
      Latin:    { forms: [
        { form: 'com-, con-',  gloss: '(prefix) with, together', class: 'prefix' },
        { form: 'compōnō',     gloss: 'I put together',          class: 'verb' },
        { form: 'compositus',  gloss: 'put together, compound',  class: 'p. part.' },
      ] },
      Greek:    { forms: [
        { form: 'σύν',         gloss: 'with',                    class: 'prep.' },
        { form: 'σύνθεσις',    gloss: 'a putting together',      class: 'f. noun' },
      ] },
      Sanskrit: { forms: [
        { form: 'sám',         gloss: 'together (preverb)',      class: 'prefix' },
      ] },
      French:   { forms: [
        { form: 'com-, con-',  gloss: '(prefix, from Lat.)',     class: 'prefix' },
      ] },
    },
    word_count: 8,
  },
  '*dʰeh₁-': {
    root: '*dʰeh₁-',
    gloss: 'to put, place, set',
    ipa: '/dʰeh₁-/',
    audio_url: '#tts-dheh1',
    audio_coverage: 'efg',
    atomic: null,
    verbal_paradigm: 'Thematic *dʰé-dʰeh₁-ti (reduplicated) → Gk. τίθημι "I place", Skt. dádhāti. Lat. faciō "I make" comes from a different conjugation of the same root (*dʰh₁-k-yé-). The semantic shift "put" → "make" is regular and ancient.',
    nominal_derivatives: 'The verbal noun *dʰh₁-mn̥ → Gk. θέμα "thing put down, proposition" → English theme. With instrument suffix *-tro- → Gk. θέατρον "place for viewing" via *dʰeh₂- merger (actually a different root, but classical etymology often conflates them).',
    modern_cognates: 'English (via Lat. facere): fact, factory, affect, defect, perfect, suffice. (via Gk. τίθημι): theme, thesis, antithesis, synthesis, parenthesis, prosthesis. (native Gmc): do, deed.',
    language_paradigm: {
      Latin:    { forms: [
        { form: 'faciō',       gloss: 'I make, do',          class: 'verb' },
        { form: 'factus',      gloss: 'made, done',          class: 'p. part.' },
        { form: 'condō',       gloss: 'I found, store',      class: 'verb (←con+dʰeh₁)' },
        { form: 'pōnō',        gloss: '(actually ←*pos+sinō; see)', class: '—', exclude: true },
      ] },
      Greek:    { forms: [
        { form: 'τίθημι',      gloss: 'I place',             class: 'verb' },
        { form: 'θέσις',       gloss: 'a placing, thesis',   class: 'f. noun' },
        { form: 'θέμα',        gloss: 'thing put down',      class: 'n. noun' },
      ] },
      Sanskrit: { forms: [
        { form: 'dádhāti',     gloss: 'places',              class: 'verb' },
        { form: 'dhātar-',     gloss: 'placer, creator',     class: 'm. noun' },
      ] },
      French:   { forms: [
        { form: 'faire',       gloss: 'to do, make',         class: 'verb' },
        { form: 'thèse',       gloss: 'thesis',              class: 'f. noun' },
      ] },
    },
    word_count: 14,
  },
  '*kom-+*dʰeh₁-': {
    root: '*kom- + *dʰeh₁-',
    gloss: 'to put together, compose',
    ipa: '/kom-dʰeh₁-/',
    audio_url: '#tts-kom-dheh1',
    audio_coverage: 'efg',
    atomic: ['*kom-', '*dʰeh₁-'],
    verbal_paradigm: 'Productive compound construction in Latin: com- + ponere (from *dʰeh₁- via *po-sinō-/positum) → compōnō "I put together, compose". The English word "compound" comes via Old French componre → compoundre, originally meaning "to put together" before the chemical/mathematical sense developed.',
    nominal_derivatives: 'Lat. compositus "put together" → compostus → English "compound" (the form with -nd by analogy with sound, etc.). Lat. compositiō → "composition".',
    modern_cognates: 'English: compound, compose, composite, composition. French: composer, composition. The same compound construction is alive in modern coinages: "compound interest" (1726), "compound fracture" (1822).',
    word_count: 4,
  },
};

// EFG nodes — partial. id format mirrors EFG.nodes.id ("dcc_42", "pie_men").
const NODES = {
  pie_men:    { id: 'pie_men',    label: '*men-',   node_type: 'pie_root', pie_root: '*men-',   pie_ipa: '/men-/' },
  pie_gwem:   { id: 'pie_gwem',   label: '*gʷem-',  node_type: 'pie_root', pie_root: '*gʷem-',  pie_ipa: '/gʷem-/' },
  pie_h2ep:   { id: 'pie_h2ep',   label: '*h₂ep-',  node_type: 'pie_root', pie_root: '*h₂ep-',  pie_ipa: '/h₂ep-/' },
  word_souvenir: { id: 'word_souvenir', label: 'souvenir', node_type: 'word', language: 'French', pie_root: '*gʷem-' },
  word_memoire:  { id: 'word_memoire',  label: 'mémoire',  node_type: 'word', language: 'French', pie_root: '*men-' },
  word_mneme:    { id: 'word_mneme',    label: 'μνήμη',    node_type: 'word', language: 'Greek',  pie_root: '*men-' },
  word_avenir:   { id: 'word_avenir',   label: 'avenir',   node_type: 'word', language: 'French', pie_root: '*gʷem-' },
  word_venir:    { id: 'word_venir',    label: 'venir',    node_type: 'word', language: 'French', pie_root: '*gʷem-' },
  word_convenir: { id: 'word_convenir', label: 'convenir', node_type: 'word', language: 'French', pie_root: '*gʷem-' },
  word_mneia:    { id: 'word_mneia',    label: 'μνεία',    node_type: 'word', language: 'Greek',  pie_root: '*men-' },
  word_mnemon:   { id: 'word_mnemon',   label: 'μνήμων',   node_type: 'word', language: 'Greek',  pie_root: '*men-' },
  word_chronos:  { id: 'word_chronos',  label: 'Χρόνος',   node_type: 'word', language: 'Greek',  pie_root: '*gʰer-' },
  word_compound: { id: 'word_compound', label: 'compound', node_type: 'word', language: 'English',pie_root: '*kom-+*dʰeh₁-' },
  pie_gher:      { id: 'pie_gher',      label: '*gʰer-',   node_type: 'pie_root', pie_root: '*gʰer-',     pie_ipa: '/gʰer-/' },
  pie_kom:       { id: 'pie_kom',       label: '*kom-',    node_type: 'pie_root', pie_root: '*kom-',      pie_ipa: '/kom-/' },
  pie_dheh1:     { id: 'pie_dheh1',     label: '*dʰeh₁-',  node_type: 'pie_root', pie_root: '*dʰeh₁-',    pie_ipa: '/dʰeh₁-/' },
};

// Flashcards — shape mirrors SF.flashcards
const FLASHCARDS = {
  fc_souvenir: {
    id: 'fc_souvenir',
    word: 'souvenir',
    language: 'French',
    card_type: 'word',
    pos: 'm. noun / verb',
    ipa: '/su.və.niʁ/',
    anglicized: 'soov-NEER',
    definition: 'A memory; a keepsake. Also the verb "to remember" (literary).',
    etymology_layered: [
      { layer: 'French', text: '13c. from Old French sovenir' },
      { layer: 'Latin',  text: 'from subvenire — "to come up, occur to the mind"' },
      { layer: 'PIE',    text: '*sub- ("under") + *gʷem- ("to come"). The "memory" sense is a metaphor: what rises up from below.' },
    ],
    fun_facts: [
      { text: 'The "memory" sense is younger than the "to come" sense by ~1400 years — souvenir means literally "an under-coming."', figure: null },
      { text: 'Greek mythology calls memory Μνημοσύνη (Mnemosyne), mother of the Muses — same root *men-, not *gʷem-. So souvenir and mnemonic are NOT cognates.', figure: 'mnemosyne' },
    ],
    pie_root: '*gʷem-',
    related_words: ['avenir','convenir','venir'],
    cognates: [
      { word: 'venir',     lang: 'fr', def: 'to come' },
      { word: 'convenir',  lang: 'fr', def: 'to agree, suit' },
      { word: 'event',     lang: 'en', def: '(via Lat. e-venīre)' },
      { word: 'advent',    lang: 'en', def: '(via Lat. ad-venīre)' },
      { word: 'mnemonic',  lang: 'en', def: 'memory-aid', false: true, false_reason: 'looks similar but rooted in *men-, not *gʷem-' },
    ],
    efg_node_id: 'word_souvenir',
    figure_link: null,
    bookmarked: true,
    image_caption: 'placeholder · keepsake on a windowsill',
    has_video: false,
  },
  fc_memoire: {
    id: 'fc_memoire',
    word: 'mémoire',
    language: 'French',
    card_type: 'word',
    pos: 'f. noun',
    ipa: '/me.mwaʁ/',
    anglicized: 'mem-WAHR',
    definition: 'Memory; a written account or memoir.',
    etymology_layered: [
      { layer: 'French', text: '12c. from Old French memoire' },
      { layer: 'Latin',  text: 'memoria, from memor "mindful, remembering"' },
      { layer: 'PIE',    text: '*men- "to think". Reduplicated perfect *me-món-e → Lat. meminī.' },
    ],
    fun_facts: [
      { text: 'Mnemosyne and Hera are sisters in some Hesiodic genealogies — both daughters of Gaia. Memory and authority share a maternal line.', figure: 'mnemosyne' },
    ],
    pie_root: '*men-',
    related_words: ['mémorial','mémoriser','mentir'],
    cognates: [
      { word: 'memoria',  lang: 'es', def: 'memory' },
      { word: 'memory',   lang: 'en', def: '' },
      { word: 'mental',   lang: 'en', def: '' },
      { word: 'monitor',  lang: 'en', def: '(via Lat. monēre "to remind")' },
      { word: 'μνήμη',    lang: 'el', def: 'memory' },
    ],
    efg_node_id: 'word_memoire',
    figure_link: 'mnemosyne',
    bookmarked: false,
    image_caption: 'placeholder · stack of letters tied with twine',
    has_video: true,
  },
  fc_avenir: {
    id: 'fc_avenir', word: 'avenir', language: 'French', card_type: 'word', pos: 'm. noun',
    ipa: '/av.niʁ/', anglicized: 'av-NEER', definition: 'The future; what is to come.',
    etymology_layered: [
      { layer: 'French', text: 'from à + venir ("to come")' },
      { layer: 'Latin',  text: 'ad-venīre "to come towards"' },
      { layer: 'PIE',    text: '*ad- + *gʷem- — literally "the to-come".' },
    ],
    fun_facts: [],
    pie_root: '*gʷem-',
    related_words: ['souvenir','venir','convenir'],
    cognates: [{ word: 'advent', lang: 'en', def: 'arrival' },{ word: 'avenue', lang: 'en', def: '(approach to)' }],
    efg_node_id: 'word_avenir', figure_link: null, bookmarked: false,
    image_caption: 'placeholder · horizon at dawn', has_video: false,
  },
  fc_venir: {
    id: 'fc_venir', word: 'venir', language: 'French', card_type: 'word', pos: 'verb (irreg.)',
    ipa: '/və.niʁ/', anglicized: 'vuh-NEER', definition: 'To come.',
    etymology_layered: [
      { layer: 'French', text: 'directly from Old French venir' },
      { layer: 'Latin',  text: 'veniō, venīre' },
      { layer: 'PIE',    text: '*gʷem- (thematic *gʷém-e-) → Lat. veniō with *gʷ- > v-.' },
    ],
    fun_facts: [],
    pie_root: '*gʷem-',
    related_words: ['avenir','souvenir','convenir','revenir'],
    cognates: [{ word: 'come', lang: 'en', def: '(parallel evolution)' },{ word: 'event', lang: 'en', def: '' }],
    efg_node_id: 'word_venir', figure_link: null, bookmarked: false,
    image_caption: 'placeholder · approaching footsteps', has_video: false,
  },
  fc_chimon: {
    id: 'fc_chimon', word: 'χειμών', language: 'Greek', card_type: 'word', pos: 'm. noun',
    ipa: '/kʰeː.mɔ̌ːn/', anglicized: 'kay-MOHN', definition: 'Winter; storm.',
    etymology_layered: [
      { layer: 'Greek', text: 'χειμών, gen. χειμῶνος' },
      { layer: 'PIE',   text: '*ǵʰei- "winter" → Skt. himá-, Lat. hiems, Slavic zima.' },
    ],
    fun_facts: [{ text: 'Same root as the Himalayas — Sanskrit himālaya literally "winter-abode".', figure: null }],
    pie_root: '*ǵʰei-',
    related_words: ['χιών (snow)','χειμερινός (wintry)'],
    cognates: [{ word: 'hiems', lang: 'la', def: 'winter' },{ word: 'zima', lang: 'sla', def: 'winter' },{ word: 'Himalaya', lang: 'sa', def: 'snow-abode' }],
    efg_node_id: null, figure_link: null, bookmarked: false,
    image_caption: 'placeholder · frozen Pindus pass', has_video: false,
  },
  fc_mnemi: {
    id: 'fc_mnemi', word: 'μνήμη', language: 'Greek', card_type: 'word', pos: 'f. noun',
    ipa: '/ˈmni.mi/', anglicized: 'MNEE-mee', definition: 'Memory (Modern Greek); also the faculty of remembering in Ancient.',
    etymology_layered: [
      { layer: 'Greek', text: 'directly from Anc. μνήμη' },
      { layer: 'PIE',   text: '*men- "to think". Same root as mémoire, mental, monument.' },
    ],
    fun_facts: [{ text: 'In Modern Greek the verb θυμᾶμαι ("I remember") replaced ancient μιμνῄσκω in everyday speech, but μνήμη as a noun never left.', figure: null }],
    pie_root: '*men-',
    related_words: ['μνημόσυνο','αναμνηστικό','μνημονικός'],
    cognates: [{ word: 'mémoire', lang: 'fr', def: 'memory' },{ word: 'memory', lang: 'en', def: '' }],
    efg_node_id: 'word_mneme', figure_link: 'mnemosyne', bookmarked: false,
    image_caption: 'placeholder · church candle burning for the dead', has_video: false,
  },
  fc_apoftello: {
    id: 'fc_apoftello', word: 'ἀποστέλλω', language: 'Greek', card_type: 'word', pos: 'verb',
    ipa: '/a.poˈste.lo/', anglicized: 'a-po-STELL-o', definition: 'To send away, dispatch.',
    etymology_layered: [
      { layer: 'Greek', text: 'ἀπό- ("away") + στέλλω ("send")' },
      { layer: 'PIE',   text: '*stel- "to put, place". Source of English "stall", "stilt".' },
    ],
    fun_facts: [{ text: 'Source of English "apostle" — literally "one who is sent away".', figure: null }],
    pie_root: '*stel-',
    related_words: ['ἀπόστολος','στόλος','στολή'],
    cognates: [{ word: 'apostle', lang: 'en', def: 'one sent forth' },{ word: 'stall', lang: 'en', def: '(parallel via Germ.)' }],
    efg_node_id: null, figure_link: null, bookmarked: false,
    image_caption: 'placeholder · letter being sealed', has_video: false,
  },
  // ───────────────────────────────────────────────────────────────────────
  // REV-2 sample cards — Etymology Surface design brief
  // ───────────────────────────────────────────────────────────────────────
  fc_chronos: {
    id: 'fc_chronos',
    word: 'Χρόνος',
    language: 'Greek',
    card_type: 'word',
    pos: 'm. noun · proper / common',
    ipa: '/ˈkro.nos/',
    anglicized: 'KROH-nos',
    definition: 'Time; the personified primordial Time of Orphic cosmogony (distinct from the Titan Kronos / Κρόνος).',
    etymology_layered: [
      { layer: 'Greek', text: 'χρόνος, gen. χρόνου — Homeric onward; capitalized Χρόνος as the Orphic Protogenos' },
      { layer: 'PIE',   text: '*gʰer- "to grasp, enclose" (per Watkins AHD-IE 32) — speculative; Beekes treats χρόνος as Pre-Greek with no secure IE etymology' },
    ],
    fun_facts: [
      { text: 'Routinely conflated with Kronos (Κρόνος, the Titan father of Zeus) in late antiquity and the Renaissance. Plutarch already remarks on the confusion. Saturn the planet inherits the conflation: Father Time + the scythe-bearer.', figure: 'chronos' },
      { text: 'In the Orphic Theogony (Damascius 123 bis) Chronos emerges before all things, alongside his consort Ananke (Necessity) — they coil around the primordial egg from which the cosmos hatches.', figure: 'chronos' },
    ],
    pie_root: '*gʰer-',
    pie_roots: ['*gʰer-'],
    related_words: ['χρονικός','χρόνια','χρονογραφία','σύγχρονος','αναχρονισμός'],
    cognates: [
      { word: 'chronos',     lang: 'en', def: 'time (calque)' },
      { word: 'chronicle',   lang: 'en', def: 'time-record' },
      { word: 'chronic',     lang: 'en', def: 'long-lasting' },
      { word: 'synchronous', lang: 'en', def: 'same-time' },
      { word: 'chronique',   lang: 'fr', def: 'chronicle' },
      { word: 'cronaca',     lang: 'it', def: 'news report' },
      { word: 'Kronos',      lang: 'el', def: 'Titan father of Zeus', false: true, false_reason: 'paronym, not cognate — Κρόνος is a separate name with its own etymology (possibly Pre-Greek)' },
    ],
    efg_node_id: 'word_chronos',
    figure_link: 'chronos',
    bookmarked: false,
    image_caption: 'placeholder · winged elder coiled with a serpent (Mithraic/Orphic Aion-Chronos)',
    has_video: false,
  },
  fc_compound: {
    id: 'fc_compound',
    word: 'compound',
    language: 'English',
    card_type: 'word',
    pos: 'verb / noun / adj.',
    ipa: '/ˈkɒm.paʊnd/',
    anglicized: 'KOM-pownd',
    definition: 'To combine; a combination of two or more parts. As adj.: composite, made of multiple elements.',
    etymology_layered: [
      { layer: 'English', text: '14c. compounen, from Old French componre' },
      { layer: 'French',  text: 'componre, from Latin compōnere "to put together"' },
      { layer: 'Latin',   text: 'com- ("with, together") + pōnere → from older *com- + dʰeh₁-tó- "put-together" (the modern conjugation borrows from posui from *po-sinō)' },
      { layer: 'PIE',     text: '*kom- "with, together" + *dʰeh₁- "to put, place"' },
    ],
    fun_facts: [
      { text: 'The terminal -d in English compound is unetymological — Middle English compoun(e) acquired the -d by analogy with words like sound, round, expound. The same parasitic -d appears in expound, propound.', figure: null },
      { text: 'The chemical sense ("substance composed of multiple elements") is 1660s — predates Lavoisier and the modern theory of elements by over a century.', figure: null },
    ],
    pie_root: '*kom-+*dʰeh₁-',
    pie_roots: ['*kom-', '*dʰeh₁-'],
    related_words: ['compose','composition','composite','composer'],
    cognates: [
      { word: 'composer',    lang: 'fr', def: 'to compose' },
      { word: 'composition', lang: 'fr', def: 'composition' },
      { word: 'componere',   lang: 'la', def: 'to put together (source)' },
      { word: 'σύνθεσις',    lang: 'el', def: 'parallel calque (συν + τίθημι)' },
    ],
    efg_node_id: 'word_compound',
    figure_link: null,
    bookmarked: false,
    image_caption: 'placeholder · two ingots being welded',
    has_video: false,
  },
  fc_le_bac: {
    // demonstrates the no-etymology empty-state path (revision brief Q3)
    id: 'fc_le_bac',
    word: 'le bac',
    language: 'French',
    card_type: 'word',
    pos: 'm. noun (abbrev.)',
    ipa: '/bak/',
    anglicized: 'BAHK',
    definition: 'Familiar abbreviation of baccalauréat — the French secondary-school exit exam.',
    etymology_layered: [
      { layer: 'French', text: '20c. clipping of baccalauréat — the surface is opaque to etymology because the morphology was lost in the abbreviation.' },
    ],
    fun_facts: [],
    pie_root: null,       // intentional — exercises the empty-state surface
    pie_roots: [],
    non_pie_reason: 'Modern French abbreviation. The full form baccalauréat (←Med. Lat. baccalaureatus) has etymology; the clipped form le bac does not retain it.',
    related_words: ['baccalauréat','passer le bac'],
    cognates: [],
    efg_node_id: null,
    figure_link: null,
    bookmarked: false,
    image_caption: 'placeholder · exam booklet on a wooden desk',
    has_video: false,
  },
};

// REV-2 — Scholarly Notes (Portfolio RAG multi-source dump).
// Each PIE root gets ~5 attestations across Beekes / Watkins / Kroonen / LSJ /
// DCC frequency. Citation list format — short, dictionary-style, page-anchored.
// The first entry is presented expanded by default; the rest are collapsed headers.
const SCHOLARLY_NOTES = {
  '*men-': [
    { source: 'Beekes EDPIE',   ref: 'p. 947', headword: '*men- (1)',
      kind: 'dictionary',
      excerpt: 'PIE *men- (1) "to think, have in mind". The full grade *mén- is preserved in stative *me-món-e (Gk. μέμονα, Lat. meminī). The o-grade *món- in nominal derivation: *món-os- "spirit, anger" (Gk. μένος).',
      confidence: 0.95 },
    { source: 'Watkins AHD-IE', ref: 'p. 53', headword: '*men-¹',
      kind: 'root',
      excerpt: 'To think; with derivatives referring to various qualities and states of mind and thought. Oldest form *men-, with variants *mnā- (contracted from *mneh₂-) and *mnē-.',
      confidence: 0.93 },
    { source: 'Kroonen EDPGmc', ref: 'p. 314', headword: '*munanan',
      kind: 'dictionary',
      excerpt: 'Proto-Germanic *munanan "to think, remember" ← *men-. → Goth. munan, OE munan ("to remember, intend"), the preterite-present source of English must.',
      confidence: 0.90 },
    { source: 'DCC frequency',  ref: 'rank 42',
      kind: 'frequency',
      excerpt: 'μένω (the verbal reflex "I remain, abide") ranks 42 in the Dickinson College Commentaries Greek core lexicon. Occurs ~22 times per 10,000 tokens in the CGCG corpus.',
      confidence: 1.0 },
    { source: 'LSJ',            ref: 'p. 1101', headword: 'μέμνημαι',
      kind: 'lexicon',
      excerpt: 'Reduplicated perfect from μιμνῄσκω ("call to mind, remind"). I. Pf. & plpf. as Pres. & Impf., bear in mind, remember, c. gen. or acc. II. Most freq. of remembering after a lapse of time.',
      confidence: 0.97 },
  ],
  '*gʷem-': [
    { source: 'Beekes EDPIE',   ref: 'p. 421', headword: '*gʷem-',
      kind: 'dictionary',
      excerpt: 'PIE *gʷem- "to come, walk, step". Root aorist *gʷém- / *gʷm̥- > Skt. áganma, Gk. ἔβην. Thematic present *gʷém-e- > Lat. veniō (with regular *gʷ- > v-).',
      confidence: 0.96 },
    { source: 'Watkins AHD-IE', ref: 'p. 35', headword: '*gʷā-',
      kind: 'root',
      excerpt: 'Also *gʷem-. To go, come. Oldest form *gʷeh₂- (becoming *gʷā-) with variants *gʷm̥- and *gʷem-.',
      confidence: 0.92 },
    { source: 'Kroonen EDPGmc', ref: 'p. 196', headword: '*kweman-',
      kind: 'dictionary',
      excerpt: 'Proto-Germanic *kweman- "to come" ← *gʷem-. → Goth. qiman, OE cuman, OHG quëman → English come, German kommen. Initial /kw/ reflects Grimm\'s Law on *gʷ.',
      confidence: 0.95 },
    { source: 'DCC frequency',  ref: 'rank 89',
      kind: 'frequency',
      excerpt: 'βαίνω ("I walk, step", the reflex of *gʷem-) ranks 89 in the DCC Greek core lexicon. ~11 occurrences per 10k tokens.',
      confidence: 1.0 },
    { source: 'LSJ',            ref: 'p. 305', headword: 'βαίνω',
      kind: 'lexicon',
      excerpt: 'To walk, step, stand. Aor. ἔβην (from PIE *gʷém-). Fut. βήσομαι. Used absolutely or with prepositions of place. The compound ἐπιβαίνω "step upon" → ἐπιβάτης "passenger, marine".',
      confidence: 0.96 },
  ],
  '*gʰer-': [
    { source: 'Beekes EDPIE',   ref: 'p. 1632', headword: 'χρόνος',
      kind: 'dictionary',
      excerpt: 'χρόνος "time": no secure IE etymology. The often-cited connection with *gʰer- (Watkins) is phonologically possible but semantically a stretch; Beekes prefers Pre-Greek (substrate) origin. The variant Cypr. χορόνος may support this.',
      confidence: 0.55,
      contradicts: '*gʰer-' },
    { source: 'Watkins AHD-IE', ref: 'p. 32', headword: '*gʰer-²',
      kind: 'root',
      excerpt: 'To grasp, enclose; with derivatives meaning "enclosure". Suffixed o-grade form *ghor-dh- → Lat. hortus, English yard, garden, court. The connection to Gk. χρόνος is suggested as "the encloser of all things" but contested.',
      confidence: 0.65 },
    { source: 'Frisk GEW',      ref: 'II.1124', headword: 'χρόνος',
      kind: 'dictionary',
      excerpt: 'Already noted as etymologically obscure by Frisk. Suggested connections to χείρ (← *ǵʰes-r-, distinct root) or to *gʰer- "grasp" — both rejected. Frisk concludes "ohne sichere Etymologie".',
      confidence: 0.60 },
    { source: 'DCC frequency',  ref: 'rank 168',
      kind: 'frequency',
      excerpt: 'χρόνος ranks 168 in the Dickinson College Commentaries Greek core. Extremely productive in compounds: χρονικός, σύγχρονος, ἀναχρονισμός. ~6.5 occurrences per 10k tokens.',
      confidence: 1.0 },
    { source: 'LSJ',            ref: 'p. 2009', headword: 'χρόνος',
      kind: 'lexicon',
      excerpt: 'Time. I. A definite time, period, season. II. Time abstractly, time as a whole. III. Personified, Father Time (Χρόνος). Distinguished by good authors from Κρόνος the Titan, but later constantly confused (cf. Plut.).',
      confidence: 0.98 },
  ],
  '*kom-': [
    { source: 'Beekes EDPIE',   ref: 'p. 736', headword: '*kom-',
      kind: 'dictionary',
      excerpt: 'PIE *kom- "with, together, beside" — by nature a preposition/adverb, productive as a prefix. Latin com-/con-/co- (the allomorphy is conditioned by the following segment).',
      confidence: 0.92 },
    { source: 'Watkins AHD-IE', ref: 'p. 45', headword: '*kom',
      kind: 'root',
      excerpt: 'Beside, near, by, with. Suffixed form *ko-m, the Latin com-/con- prefix.',
      confidence: 0.95 },
    { source: 'Kroonen EDPGmc', ref: 'p. 199', headword: '*ga- (prefix)',
      kind: 'dictionary',
      excerpt: 'Proto-Germanic perfective/collective prefix *ga- ← PIE *kom- (zero grade). Survives in German ge-, archaic English y- (yclept). Functions identically to Latin com- as a collective and perfective.',
      confidence: 0.88 },
    { source: 'DCC frequency',  ref: 'n/a',
      kind: 'frequency',
      excerpt: 'Not a content word; the cognate σύν (Gk. reflex) ranks 28 in DCC Greek core as a preposition. Highest productivity in compound formation.',
      confidence: 0.85 },
  ],
  '*dʰeh₁-': [
    { source: 'Beekes EDPIE',   ref: 'p. 326', headword: '*dʰeh₁-',
      kind: 'dictionary',
      excerpt: 'PIE *dʰeh₁- "to put, place, set". Reduplicated thematic present *dʰé-dʰeh₁-ti → Gk. τίθημι, Skt. dádhāti. The semantic shift to "make" in Latin faciō (←*dʰh₁-k-yé-) is a regular development.',
      confidence: 0.97 },
    { source: 'Watkins AHD-IE', ref: 'p. 17', headword: '*dhē-',
      kind: 'root',
      excerpt: 'To set, put. Contracted from *dheh₁-. Underlies an enormous range of derivatives via Latin facere ("do, make") and Greek τιθέναι ("put").',
      confidence: 0.96 },
    { source: 'Kroonen EDPGmc', ref: 'p. 88', headword: '*dōnan',
      kind: 'dictionary',
      excerpt: 'Proto-Germanic *dōnan "to do, make" ← *dʰeh₁-. → OE dōn → English do. Suppletive paradigm in Gmc; the past participle survives as deed (*dē-d- from *dʰeh₁-tó-).',
      confidence: 0.94 },
    { source: 'DCC frequency',  ref: 'rank 19',
      kind: 'frequency',
      excerpt: 'τίθημι ranks 19 in DCC Greek core. ~58 occurrences per 10k tokens. Among the most frequent verbs in the corpus.',
      confidence: 1.0 },
    { source: 'LSJ',            ref: 'p. 1789', headword: 'τίθημι',
      kind: 'lexicon',
      excerpt: 'To set, put, place. Aor. ἔθηκα. Pf. τέθεικα. Of the most general use; over 30 sense-divisions including legal ("lay down a law"), accountancy ("set down to one\'s account"), and metaphysical ("posit").',
      confidence: 0.99 },
  ],
};

// REV-2 — search/filter primitives
const LANGUAGE_FILTERS = [
  { code: null, name: 'All languages', count: null },
  { code: 'el', name: 'Greek',         count: 1540 },
  { code: 'fr', name: 'French',        count: 616  },
  { code: 'en', name: 'English',       count: 441  },
  { code: 'es', name: 'Spanish',       count: 150  },
  { code: 'it', name: 'Italian',       count: 74   },
  { code: 'de', name: 'German',        count: 69   },
  { code: 'la', name: 'Latin',         count: 12   },
  { code: 'sa', name: 'Sanskrit',      count: 4    },
];

// Mythological figures — shape mirrors EM.mythological_figures
const FIGURES = {
  mnemosyne: {
    id: 'mnemosyne',
    english_name: 'Mnemosyne',
    greek_name: 'Μνημοσύνη',
    latin_name: 'Moneta (Roman cognate goddess)',
    figure_type: 'Titan',
    domain: 'memory, language, writing',
    ipa: '/nɪˈmɒz.ɪ.ni/',
    anglicized: 'nih-MOZ-ih-nee',
    audio_url: '#tts-mnemo',
    origin_story: 'Daughter of Gaia and Uranus; one of the twelve Titans, sister of Cronus, Rhea, Themis, Oceanus, and the others. Zeus lay with her for nine consecutive nights at the foot of Mount Olympus, producing the nine Muses — Calliope, Clio, Erato, Euterpe, Melpomene, Polyhymnia, Terpsichore, Thalia, Urania. She is the personified faculty of memory, the prerequisite for poetry.\n\nIn the underworld, Mnemosyne maintains a pool of remembrance opposite Lethe (forgetfulness). The initiated, on the Orphic gold tablets, are instructed to drink from Mnemosyne and refuse the waters of Lethe — to keep their knowledge through death.',
    pie_root: '*men-',
    relations: [
      { id: 'gaia',   name: 'Gaia',   greek: 'Γαῖα',   rel: 'parent' },
      { id: 'uranus', name: 'Uranus', greek: 'Οὐρανός',rel: 'parent' },
      { id: 'cronus', name: 'Cronus', greek: 'Κρόνος', rel: 'sibling' },
      { id: 'rhea',   name: 'Rhea',   greek: 'Ῥέα',    rel: 'sibling' },
      { id: 'themis', name: 'Themis', greek: 'Θέμις',  rel: 'sibling' },
      { id: 'zeus',   name: 'Zeus',   greek: 'Ζεύς',   rel: 'consort' },
      { id: 'muses',  name: 'The Nine Muses', greek: 'Μοῦσαι', rel: 'child', plural: 9 },
      { id: 'lethe',  name: 'Lethe',  greek: 'Λήθη',   rel: 'inverse_of' },
      { id: 'moneta', name: 'Moneta', greek: '—',      rel: 'equivalent', tradition: 'Roman' },
    ],
    attestations: [
      { source: 'Hesiod',           ref: 'Theogony 53–60, 915',          era: '~700 BC' },
      { source: 'Orphic Hymns',     ref: '77 (to Mnemosyne)',            era: '~3c BC' },
      { source: 'Pausanias',        ref: 'Description 9.39.8',           era: '~150 AD' },
      { source: 'Orphic gold tablets', ref: 'Petelia, Hipponion',        era: '4c BC' },
    ],
    cognates_to_card: ['mémoire','memory','mnemonic','μνήμη'],
    image_caption: 'placeholder · seated Titan with stylus and tablet',
  },
  // ── REV-2 — full figure record demonstrating origin story + family tree
  chronos: {
    id: 'chronos',
    english_name: 'Chronos',
    greek_name: 'Χρόνος',
    latin_name: 'Aevum (later, ≠ Saturnus)',
    figure_type: 'Protogenos (Primordial)',
    domain: 'time, the unfolding of all things',
    ipa: '/ˈkro.nos/',
    anglicized: 'KROH-nos',
    audio_url: '#tts-chronos',
    origin_story:
      'In the Orphic cosmogony (preserved by Damascius, De Principiis 123 bis, citing the Rhapsodic Theogony), Chronos arises before all things — self-generated, ageless. Around him coils Ananke (Necessity), his consort and serpent-twin. Together they encircle the primordial Cosmic Egg. When Chronos cracks the egg, three things emerge: Aether (the bright upper air), Erebus (the dark below), and Chaos (the gap). From these the world unfolds.\n\nLater traditions conflate him with Kronos the Titan (father of Zeus). The conflation is already noted by Plutarch (De Iside 32) and becomes routine in the Renaissance — Father Time with his scythe is iconographically Kronos-the-Titan but allegorically Chronos-the-Time. Greek writers as careful as Damascius keep them apart; popular art does not.\n\nIn Mithraic mystery cult, Chronos appears as the lion-headed god Aion or Zurvan (Iranian "Time"), wound by a serpent — the iconography of timeless time, the container of duration.',
    pie_root: '*gʰer-',
    relations: [
      // Parent-of-self in Orphic tradition (auto-generated). We render this as a node with rel='self_generated'.
      { id: 'ananke', name: 'Ananke', greek: 'Ἀνάγκη', rel: 'consort' },
      { id: 'aether', name: 'Aether', greek: 'Αἰθήρ', rel: 'child' },
      { id: 'erebus', name: 'Erebus', greek: 'Ἔρεβος', rel: 'child' },
      { id: 'chaos',  name: 'Chaos',  greek: 'Χάος',   rel: 'child' },
      { id: 'aion',   name: 'Aion',   greek: 'Αἰών',   rel: 'equivalent' },
      { id: 'zurvan', name: 'Zurvan', greek: '—',      rel: 'equivalent', tradition: 'Mithraic / Iranian' },
      { id: 'saturnus', name: 'Saturnus', greek: '—',  rel: 'often_confused_with', tradition: 'Roman folk' },
      { id: 'kronos_titan', name: 'Kronos (Titan)', greek: 'Κρόνος', rel: 'distinct_from' },
    ],
    attestations: [
      { source: 'Pherecydes of Syros',      ref: 'fr. 14 D-K',            era: '6c BC' },
      { source: 'Orphic Theogony',          ref: 'Rhapsodic Theogony',    era: '~5c BC' },
      { source: 'Plutarch',                 ref: 'De Iside et Osiride 32',era: '~100 AD' },
      { source: 'Damascius',                ref: 'De Principiis 123 bis', era: '~530 AD' },
      { source: 'Mithraic iconography',     ref: 'CIMRM passim',          era: '2c–4c AD' },
    ],
    cognates_to_card: ['chronos','chronicle','chronic','synchronous'],
    image_caption: 'placeholder · winged elder with serpent (Mithraic Aion-Chronos relief)',
  },
};

// Portfolio RAG / Beekes dictionary entry shape
const RAG_ENTRIES = {
  '*men-': {
    source: 'Beekes EDPIE, p. 947',
    headword: '*men-',
    excerpt: 'PIE *men- (1) "to think, have in mind". The full grade *mén- is preserved in stative *me-món-e (Gk. μέμονα, Lat. meminī). The o-grade *món- in nominal derivation: *món-os- "spirit, anger" (Gk. μένος), *món-ti- > Lat. mōns (mētiri "to measure" is unrelated, ← *meh₁-). The zero grade *mn̥- in *mn̥-tí- "memory" (Gk. μνῆσις, Skt. matí-).',
    confidence: 'high',
  },
  '*gʷem-': {
    source: 'Beekes EDPIE, p. 421',
    headword: '*gʷem-',
    excerpt: 'PIE *gʷem- "to come, walk, step". Root aorist *gʷém- / *gʷm̥- > Skt. áganma, Gk. ἔβην. Thematic present *gʷém-e- > Lat. veniō (regular *gʷ- > v-). Common substitution for *gʷh₂- in some etymological dictionaries.',
    confidence: 'high',
  },
};

// Chat threads — anchored to flashcard_id primary (per revision item 1).
// PIE-root cross-card relevance is handled by the promote mechanism, not anchor.
// Each thread carries an editable `context` payload (revision item 3) and
// per-AI-message `context_snapshot` so the user can see exactly what the AI saw.
const CHAT_THREADS = {
  fc_souvenir: [
    {
      id: 'th_souvenir_1',
      title: 'Why is souvenir feminine in some texts?',
      when: '2026-05-12',
      anchor: { kind: 'flashcard_id', value: 'fc_souvenir' },
      context: {
        fields: ['word_or_phrase', 'language', 'definition', 'pos', 'etymology_layered', 'pie_root', 'cognates'],
        efg_node: 'word_souvenir',
        figure: null,
        steering: 'Focus on French historical morphology, not PIE reconstruction. Cite Old French sources where possible.',
      },
      messages: [
        { role: 'you', text: 'I keep seeing "la souvenir" in older French — is the gender unstable?' },
        { role: 'ai',  text: 'It\'s a fossil. Souvenir is solidly masculine in modern French (le souvenir), but Old French treated the verbal noun as feminine — la sovenance, la sovenir — before the masculine -ir form crystallized. The shift tracks with the lexicalisation: when it stopped being "an under-coming" and became "a keepsake", the noun took the more common -ir-noun masculine pattern.',
          context_snapshot: { card_fields: 7, efg_node: 'word_souvenir', figure: null, steering_applied: true, tokens_in: 1284, tokens_out: 142 } },
        { role: 'you', text: 'Etymological gender drift!' },
        { role: 'ai',  text: 'Yes. There\'s a class of nominalised infinitives in French (le rire, le déjeuner, le souvenir) that all settled masculine. The pattern is so regular it\'s a pedagogical rule.',
          context_snapshot: { card_fields: 7, efg_node: 'word_souvenir', figure: null, steering_applied: true, tokens_in: 1426, tokens_out: 88 },
          promotable: { card: 'fc_souvenir', preview: 'Old French treated souvenir as feminine (la sovenance/la sovenir) before the -ir nominalisation pattern crystallized the masculine. Same class as le rire, le déjeuner.' } },
      ],
    },
  ],
  fc_memoire: [
    {
      id: 'th_memoire_1',
      title: 'Mnemosyne ↔ Lethe symmetry',
      when: '2026-04-22',
      anchor: { kind: 'flashcard_id', value: 'fc_memoire' },
      context: {
        fields: ['word_or_phrase', 'definition', 'etymology_layered', 'pie_root', 'fun_facts'],
        efg_node: 'word_memoire',
        figure: 'mnemosyne',
        steering: 'Treat as a Greek-religion question, not pure linguistics. Surface initiate-rite framings.',
      },
      messages: [
        { role: 'you', text: 'Wait, if Mnemosyne is memory, is Lethe literally constructed as her opposite at the PIE level too, or is that a Greek-internal mythological pairing?' },
        { role: 'ai',  text: 'Greek-internal. *men- "to think/remember" is solidly PIE — secure cognates in Indo-Iranian, Latin, Germanic. Lethe (λήθη) is from PIE *leh₂dʰ- "to be hidden, escape notice" — a separate root. The mythological inversion is poetic, not etymological. The Orphic plates contrast them but Beekes notes the roots never sit in a paradigm together.',
          context_snapshot: { card_fields: 5, efg_node: 'word_memoire', figure: 'mnemosyne', steering_applied: true, tokens_in: 1502, tokens_out: 167 } },
        { role: 'you', text: 'So in initiate-rite contexts, "drinking from Mnemosyne" is metaphorical opposition, not linguistic opposition. Got it.' },
        { role: 'ai',  text: 'Right. Worth noting Mnemosyne herself is a transparent agent-noun: *mn̥-mon-iH-yeh₂ "she who remembers". The -syne suffix is a feminine abstract — same in Σωφροσύνη, Δικαιοσύνη. So she\'s less "Memory the Person" and more "the personification of remembering" — Hesiod\'s prose is structurally a noun phrase.',
          context_snapshot: { card_fields: 5, efg_node: 'word_memoire', figure: 'mnemosyne', steering_applied: true, tokens_in: 1689, tokens_out: 198 },
          promotable: { card: 'fc_memoire', preview: 'Mnemosyne is literally "she-who-remembers" — Greek -syne suffix forms feminine abstracts (cf. Σωφροσύνη "moderation", Δικαιοσύνη "justice"). Hesiod\'s line is structurally a noun phrase, not a name.' } },
      ],
    },
    {
      id: 'th_memoire_2',
      title: 'False friend: mention vs. mental',
      when: '2026-05-08',
      anchor: { kind: 'flashcard_id', value: 'fc_memoire' },
      context: {
        fields: ['word_or_phrase', 'etymology_layered', 'pie_root', 'cognates'],
        efg_node: 'word_memoire',
        figure: null,
        steering: '',
      },
      messages: [
        { role: 'you', text: 'Are mention and mental both from *men-, or is one of them a Latin coincidence?' },
        { role: 'ai',  text: 'Both genuine *men- descendants. mention ← Lat. mentiō "a calling to mind", from the verbal noun *mn̥-ti-on-. mental ← Lat. mēns, mentis ("mind"), same *mn̥-ti- stem, different suffix. So they\'re siblings, not coincidences.',
          context_snapshot: { card_fields: 4, efg_node: 'word_memoire', figure: null, steering_applied: false, tokens_in: 942, tokens_out: 86 } },
      ],
    },
  ],
  fc_chimon: [
    {
      id: 'th_chimon_1',
      title: 'χειμών and the Himalayas',
      when: '2026-05-14',
      anchor: { kind: 'flashcard_id', value: 'fc_chimon' },
      context: {
        fields: ['word_or_phrase', 'definition', 'etymology_layered', 'pie_root', 'fun_facts'],
        efg_node: null,
        figure: null,
        steering: 'No PIE root anchor available — this is one of the 879 cards without pie_root. Lean on text and fun_facts only.',
      },
      messages: [
        { role: 'you', text: 'How robust is the χειμών ↔ himālaya link? Is it actually the same PIE root or just a folk parallel?' },
        { role: 'ai',  text: 'Robust. PIE *ǵʰei- "winter, cold", with the *-mo- nominal suffix giving both *ǵʰei-mo- → Gk. χεῖμα/χειμών and Skt. himá- (with *ǵʰ > h regularly). Himālaya is the bahuvrīhi compound himá-ālaya "snow-abode". The vowel and laryngeal correspondences are textbook — not a folk parallel.',
          context_snapshot: { card_fields: 5, efg_node: null, figure: null, steering_applied: true, tokens_in: 612, tokens_out: 122 } },
      ],
    },
  ],
};

// Bookmarks — cross-app primitives
const BOOKMARKS = [
  { id: 'bm1', kind: 'word',     ref: 'fc_souvenir', label: 'souvenir',  meta: 'fr · memory', when: 'today' },
  { id: 'bm2', kind: 'word',     ref: 'fc_memoire',  label: 'mémoire',   meta: 'fr · memory', when: 'today' },
  { id: 'bm3', kind: 'pie_root', ref: '*men-',       label: '*men-',     meta: 'to think', when: 'this week' },
  { id: 'bm4', kind: 'pie_root', ref: '*gʷem-',      label: '*gʷem-',    meta: 'to come', when: 'this week' },
  { id: 'bm5', kind: 'figure',   ref: 'mnemosyne',   label: 'Mnemosyne', meta: 'Titan · memory', when: 'this week' },
  { id: 'bm6', kind: 'thread',   ref: 'th_men_1',    label: 'Mnemosyne ↔ Lethe symmetry', meta: 'thread · 4 msgs', when: 'this week' },
  { id: 'bm7', kind: 'collection', ref: 'cls_aor3',  label: 'Tuesday class — aorist drill',  meta: '12 cards · for Theo', when: 'last week' },
];

// Chat promotions audit log (replaces review queue per revision item 4).
// Every Accept click on a chat AI message appends one row.
// Schema: chat_promotions(id, when, who, thread_id, message_idx, card, field, before, after)
const CHAT_PROMOTIONS = [
  {
    id: 'cp_001', when: '2026-05-15 14:22', who: 'pl', thread_id: 'th_memoire_1', message_idx: 4,
    card: 'fc_memoire', field: 'fun_facts',
    before: '(none on this card with -syne morphology framing)',
    after: 'Mnemosyne is literally "she-who-remembers" — the Greek -syne suffix forms feminine abstracts (cf. Σωφροσύνη "moderation", Δικαιοσύνη "justice"). So Hesiod\'s text is structurally a noun phrase, not a name.',
  },
  {
    id: 'cp_002', when: '2026-05-14 09:51', who: 'theo', thread_id: 'th_memoire_2', message_idx: 2,
    card: 'fc_memoire', field: 'cognates',
    before: 'memoria · memory · mental · monitor · μνήμη',
    after: 'memoria · memory · mental · mention (NEW · ← Lat. mentiō) · monitor · μνήμη',
  },
  {
    id: 'cp_003', when: '2026-05-12 16:03', who: 'pl', thread_id: 'th_souvenir_1', message_idx: 4,
    card: 'fc_souvenir', field: 'fun_facts',
    before: '(two existing facts)',
    after: '(appended) Old French treated souvenir as feminine — la sovenance / la sovenir — before the masculine -ir nominalisation pattern crystallized. Same class as le rire, le déjeuner.',
  },
  {
    id: 'cp_004', when: '2026-05-09 11:14', who: 'tutor', thread_id: 'th_chimon_1', message_idx: 2,
    card: 'fc_chimon', field: 'pie_root',
    before: '*ǵʰei- (no pie_ipa)',
    after: '*ǵʰei- · IPA /ǵʰei-/ · with *-mo- nominal suffix → *ǵʰei-mo-',
  },
];

// 16 AI-healable fields — drives the Accept-button dropdown on every chat AI message.
// Schema lifted from BWTL01 inventory; each entry is a card-level write target.
const PROMOTE_FIELDS = [
  { key: 'word_or_phrase',           label: 'Word / phrase',     table: 'flashcards.word_or_phrase',                tier: 'core' },
  { key: 'definition',               label: 'Definition',        table: 'flashcards.definition',                    tier: 'core' },
  { key: 'ipa',                      label: 'IPA',               table: 'flashcards.pie_ipa',                       tier: 'phonetic' },
  { key: 'audio_url',                label: 'Audio URL',         table: 'flashcards.audio_url',                     tier: 'phonetic' },
  { key: 'etymology',                label: 'Etymology (prose)', table: 'flashcards.etymology',                     tier: 'etymology' },
  { key: 'etymology_layer.PIE',      label: 'Etymology · PIE',   table: 'flashcard_pie_roots.etymology_layer',      tier: 'etymology' },
  { key: 'etymology_layer.Latin',    label: 'Etymology · Latin', table: 'flashcard_pie_roots.etymology_layer',      tier: 'etymology' },
  { key: 'etymology_layer.Greek',    label: 'Etymology · Greek', table: 'flashcard_pie_roots.etymology_layer',      tier: 'etymology' },
  { key: 'pie_root',                 label: 'PIE root',          table: 'flashcards.pie_root',                      tier: 'etymology' },
  { key: 'pie_ipa',                  label: 'PIE root IPA',      table: 'flashcards.pie_ipa',                       tier: 'etymology' },
  { key: 'pie_audio_url',            label: 'PIE root audio',    table: 'flashcards.pie_audio_url',                 tier: 'etymology' },
  { key: 'non_pie_reason',           label: 'Non-PIE reason',    table: 'flashcards.non_pie_reason (new)',          tier: 'etymology' },
  { key: 'cognates',                 label: 'English cognates',  table: 'flashcards.english_cognates',              tier: 'relations' },
  { key: 'fun_facts',                label: 'Fun facts',         table: 'em.fun_facts (junction)',                  tier: 'relations' },
  { key: 'efg_node_id',              label: 'EFG node link',     table: 'flashcards.efg_node_id',                   tier: 'relations' },
  { key: 'image_caption',            label: 'Image caption',     table: 'flashcards.image_caption',                 tier: 'media' },
];

// Theodoros review queue (legacy — kept for back-compat with admin batch view only).
// The user-facing "queue + approval gate" surface has been removed per revision item 5.
const REVIEW_ITEMS = [
  {
    id: 'rv1',
    type: 'ai_correction',
    card: 'fc_souvenir',
    field: 'etymology_layered.PIE',
    confidence: 0.91,
    proposed_by: 'gpt-4o · 2026-05-14',
    before: '*sub- ("under") + *gʷem- ("to come"). Treated as a single root in 11 SF cards.',
    after: '*sub- ("under") + *gʷem- ("to come"). Compound root — flag for atomic decomposition. The "memory" sense is a metaphor: what rises up from below.',
    reason: 'PL added 3 souvenir-family cards in last 30 days. Compound nature of the root should be surfaced consistently.',
  },
  {
    id: 'rv2',
    type: 'pie_backfill',
    card: 'fc_le_bac',
    field: 'pie_root',
    confidence: 0.42,
    proposed_by: 'cai · TSK-008',
    before: '(no PIE root)',
    after: '(none — flag as genuinely non-PIE; reason: French abbreviation of baccalauréat)',
    reason: 'TSK-008 batch flagged this as bucket-2 (non-PIE). Awaiting human confirmation before write.',
  },
  {
    id: 'rv3',
    type: 'fun_fact',
    card: 'fc_memoire',
    field: 'fun_facts',
    confidence: 0.78,
    proposed_by: 'gpt-4o promoted from chat',
    before: '(none on this card)',
    after: 'Mnemosyne is literally "she-who-remembers" — the Greek -syne suffix forms feminine abstracts (cf. Σωφροσύνη "moderation", Δικαιοσύνη "justice"). So Hesiod\'s text is structurally a noun phrase, not a name.',
    reason: 'Promoted from chat thread th_men_1 by PL. Field-level promotion, anchored to *men-.',
  },
  {
    id: 'rv4',
    type: 'figure_audio',
    card: null,
    figure: 'apollon',
    field: 'pronunciation_audio_url',
    confidence: 0.95,
    proposed_by: 'elevenlabs · batch-EM-2026-05',
    before: '(no audio)',
    after: 'audio · 1.3s · /əˈpɒl.oʊ/',
    reason: 'Batch TTS generated for 111 figures missing audio. Awaiting Theo approval for voice quality.',
  },
];

// Languages — shape mirrors SF.languages
const LANGUAGES = [
  { code: 'el', name: 'Greek',      total: 1540, no_pie: 432, queue_today: 18, study_pct: 0.62, current: true },
  { code: 'fr', name: 'French',     total: 616,  no_pie: 120, queue_today:  7, study_pct: 0.81, current: false },
  { code: 'en', name: 'English',    total: 441,  no_pie: 178, queue_today:  3, study_pct: 0.45, current: false },
  { code: 'es', name: 'Spanish',    total: 150,  no_pie:  44, queue_today:  0, study_pct: 0.22, current: false },
  { code: 'it', name: 'Italian',    total:  74,  no_pie:  27, queue_today:  0, study_pct: 0.13, current: false },
  { code: 'de', name: 'German',     total:  69,  no_pie:  43, queue_today:  0, study_pct: 0.10, current: false },
  { code: 'pt', name: 'Portuguese', total:  46,  no_pie:  35, queue_today:  0, study_pct: 0.05, current: false },
];

// AI-editable fields on a flashcard — drives the spark pencils on the word card.
// Mirrors SF /api/ai/ai_generate per-field generation.
const AI_FIELDS = {
  etymology:       { endpoint: 'POST /api/ai/generate', model: 'gpt-4o', avg_ms: 2100, last_run: '2026-04-19', confidence: 'high' },
  cognates:        { endpoint: 'POST /api/ai/generate', model: 'gpt-4o', avg_ms: 1900, last_run: '2026-04-19', confidence: 'high' },
  fun_facts:       { endpoint: 'POST /api/ai/generate', model: 'gpt-4o', avg_ms: 2400, last_run: '2026-05-08', confidence: 'medium' },
  ipa:             { endpoint: 'POST /api/v1/pronunciation/generate', model: 'phon-1', avg_ms: 800, last_run: '2026-05-01', confidence: 'high' },
  pie_root:        { endpoint: 'POST /api/ai/generate', model: 'gpt-4o + Beekes RAG', avg_ms: 3200, last_run: '2026-04-22', confidence: 'medium' },
  audio:           { endpoint: 'POST /api/audio/tts', model: 'elevenlabs', avg_ms: 1500, last_run: '2026-05-04', confidence: 'high' },
  image:           { endpoint: 'POST /api/external/generate-video → image', model: 'flux-pro (AF)', avg_ms: 4200, last_run: '—', confidence: 'medium' },
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDY QUEUE — represents SF.study_sessions + SRS state
// ─────────────────────────────────────────────────────────────────────────────
const STUDY_QUEUE = [
  { card: 'fc_souvenir', due: 'now',        last_grade: 'good',   interval_days: 4,  reps: 7  },
  { card: 'fc_memoire',  due: 'now',        last_grade: 'hard',   interval_days: 1,  reps: 3  },
  { card: 'fc_avenir',   due: 'in 1m',      last_grade: 'good',   interval_days: 7,  reps: 12 },
  { card: 'fc_venir',    due: 'in 3m',      last_grade: 'easy',   interval_days: 14, reps: 18 },
  { card: 'fc_chimon',   due: 'in 5m',      last_grade: 'new',    interval_days: 0,  reps: 0  },
  { card: 'fc_mnemi',    due: 'in 8m',      last_grade: 'good',   interval_days: 3,  reps: 4  },
  { card: 'fc_apoftello',due: 'in 12m',     last_grade: 'again',  interval_days: 0,  reps: 1  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ARTFORGE JOBS — etymology-driven only (per scope)
// ─────────────────────────────────────────────────────────────────────────────
const AF_JOBS = [
  { id: 'job_47c0b1a', kind: 'word_video',    subject: 'souvenir',  status: 'rendering', progress: 0.62, model: 'veo-3',    started: '14:22', eta: '90s',     scenes: 3, source: 'SF · /api/external/generate-video' },
  { id: 'job_3f1d92e', kind: 'from_figure',   subject: 'Mnemosyne', status: 'done',      progress: 1.0,  model: 'flux-pro', started: '10:05', duration: '4m', scenes: 5, source: 'EM · /api/v1/stories/from-figure' },
  { id: 'job_91baa2c', kind: 'word_video',    subject: 'mémoire',   status: 'done',      progress: 1.0,  model: 'veo-3',    started: 'yesterday', duration: '3m', scenes: 3, source: 'SF · /api/external/generate-video' },
  { id: 'job_a01eecf', kind: 'image',         subject: 'Apollon',   status: 'queued',    progress: 0,    model: 'flux-pro', started: '14:30', eta: '60s',     scenes: 1, source: 'EM · image_gen' },
  { id: 'job_77b3211', kind: 'enrich',        subject: 'fc_souvenir', status: 'done',    progress: 1.0,  model: 'gpt-4o',   started: '2 days ago', duration: '40s', scenes: null, source: 'AF · /api/stories/{id}/enrich' },
  { id: 'job_55c8801', kind: 'word_video',    subject: 'Guten Appetit', status: 'failed', progress: 0.31, model: 'veo-3',   started: 'last week', duration: '1m', scenes: 3, source: 'SF · /api/external/generate-video', error: 'Prompt safety filter triggered on "Appetit" — retry with reworded scene prompts.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// VOICE CLONES — SF.UserVoiceClones / VoiceCloneSamples
// ─────────────────────────────────────────────────────────────────────────────
const VOICE_CLONES = [
  { id: 'vc_eleni', name: 'Eleni',  language: 'Greek',  samples: 14, status: 'active', provider: 'elevenlabs', sample_id: 'eleni-v3', usage_count: 1240 },
  { id: 'vc_marcus', name: 'Marcus', language: 'Latin (restored)', samples: 8,  status: 'active', provider: 'elevenlabs', sample_id: 'marcus-v1', usage_count: 312 },
  { id: 'vc_theo',  name: 'Theodoros', language: 'Greek (instructor)', samples: 22, status: 'active', provider: 'elevenlabs', sample_id: 'theo-v2', usage_count: 802 },
  { id: 'vc_pl',    name: 'PL voice', language: 'English', samples: 6,  status: 'draft', provider: 'elevenlabs', sample_id: null,       usage_count: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// DCC sample — Greek core vocabulary surfaced from EFG
// ─────────────────────────────────────────────────────────────────────────────
const DCC_WORDS = [
  { rank:  1, word: 'καί',     gloss: 'and',     pos: 'conj', sf_linked: true,  freq_per_10k: 412 },
  { rank:  2, word: 'ὁ',       gloss: 'the',     pos: 'det',  sf_linked: true,  freq_per_10k: 388 },
  { rank: 12, word: 'ἔρχομαι', gloss: 'to come', pos: 'verb', sf_linked: true,  freq_per_10k:  72, pie_root: '*h₁ergʰ-' },
  { rank: 14, word: 'εἰμί',    gloss: 'to be',   pos: 'verb', sf_linked: true,  freq_per_10k:  68, pie_root: '*h₁es-'  },
  { rank: 42, word: 'μένω',    gloss: 'to remain', pos: 'verb', sf_linked: false, freq_per_10k: 22, pie_root: '*men-'  },
  { rank: 89, word: 'βαίνω',   gloss: 'to walk, step', pos: 'verb', sf_linked: true, freq_per_10k: 11, pie_root: '*gʷem-' },
  { rank: 142,word: 'μνῆμα',   gloss: 'memorial, tomb', pos: 'noun', sf_linked: false, freq_per_10k: 6, pie_root: '*men-' },
  { rank: 312,word: 'παμμνηστος', gloss: 'all-remembering', pos: 'adj', sf_linked: false, freq_per_10k: 1, pie_root: '*men-' },
];

// ─────────────────────────────────────────────────────────────────────────────
// BEEKES sample — Portfolio RAG etymology collection
// ─────────────────────────────────────────────────────────────────────────────
const BEEKES_DOCS = [
  { id: 'b_men',    page: 947, headword: '*men- (1)',  excerpt: 'PIE *men- "to think, have in mind". Full grade *mén- preserved in stative *me-món-e (Gk. μέμονα, Lat. meminī). The o-grade *món- in nominal derivation: *món-os- "spirit, anger" (Gk. μένος).' },
  { id: 'b_gwem',   page: 421, headword: '*gʷem-',      excerpt: 'PIE *gʷem- "to come, walk, step". Root aorist *gʷém- / *gʷm̥- > Skt. áganma, Gk. ἔβην. Thematic present *gʷém-e- > Lat. veniō.' },
  { id: 'b_peh2',   page: 1188,headword: '*peh₂-',     excerpt: 'PIE *peh₂- "to protect, feed, shepherd". Thematic *peh₂-yé- → Lat. pāscō. Agent *peh₂-tor- "shepherd" → Lat. pāstor.' },
  { id: 'b_h2ep',   page: 89,  headword: '*h₂ep-',     excerpt: 'PIE *h₂ep- "water". Largely fossilised in toponyms; cf. Hitt. ḫapa- "river", Skt. áp-, Av. āp-, Punjab "five waters".' },
  { id: 'b_leh2dh', page: 802, headword: '*leh₂dʰ-',   excerpt: 'PIE *leh₂dʰ- "to be hidden, escape notice". Source of Gk. λήθη (Lethe), λανθάνω.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// EFG admin sample — node/edge inventory
// ─────────────────────────────────────────────────────────────────────────────
const EFG_STATS = {
  total_nodes: 3290, word_nodes: 2233, pie_root_nodes: 1057,
  total_edges: 2111, pie_explorer_data: 992,
  sf_linked: 2146, pie_ipa_filled: 1005, pie_ipa_missing: 52,
  pie_audio_filled: 1005, pie_audio_missing: 52,
};

// ─────────────────────────────────────────────────────────────────────────────
// RAG collections health
// ─────────────────────────────────────────────────────────────────────────────
const RAG_COLLECTIONS = [
  { name: 'portfolio',  docs: 412,  size: '38 MB', last_ingest: '2 hours ago',  status: 'healthy',  consumer: 'AI agents · CAI standards' },
  { name: 'etymology',  docs: 1840, size: '142 MB', last_ingest: '4 days ago',  status: 'healthy',  consumer: 'EFG dictionary search · PIE research' },
  { name: 'dcc',        docs: 2086, size: '18 MB', last_ingest: '1 week ago',   status: 'healthy',  consumer: 'SF dcc.py enrichment' },
  { name: 'metapm',     docs: 3110, size: '92 MB', last_ingest: '12 min ago',   status: 'healthy',  consumer: 'AI agents · MetaPM requirements' },
  { name: 'jazz_theory',docs: 88,   size: '6 MB',  last_ingest: '3 weeks ago',  status: 'healthy',  consumer: 'HarmonyLab' },
  { name: 'code',       docs: 0,    size: '0 MB',  last_ingest: '—',            status: 'deprecated', consumer: '(deprecated · MP48 TSK-005)' },
];

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT IMPORT — recent runs from SF /api/document/parse
// ─────────────────────────────────────────────────────────────────────────────
const DOCUMENT_RUNS = [
  { id: 'doc_1', source: 'Iliad Book 1 · lines 1-50',     extracted: 78,  approved: 64, status: 'partial', when: 'today', kind: 'paste' },
  { id: 'doc_2', source: 'Plato_Republic_Bk7.pdf',         extracted: 142, approved: 142,status: 'complete',when: 'yesterday', kind: 'pdf' },
  { id: 'doc_3', source: 'Souvenirs_dEnfance_Pagnol.pdf',  extracted: 96,  approved: 0,  status: 'pending', when: '3 days ago', kind: 'pdf' },
];

window.BWTL = {
  ROLES,
  PIE_ROOTS,
  NODES,
  FLASHCARDS,
  FIGURES,
  RAG_ENTRIES,
  SCHOLARLY_NOTES,
  LANGUAGE_FILTERS,
  CHAT_THREADS,
  CHAT_PROMOTIONS,
  PROMOTE_FIELDS,
  BOOKMARKS,
  REVIEW_ITEMS,
  LANGUAGES,
  AI_FIELDS,
  STUDY_QUEUE,
  AF_JOBS,
  VOICE_CLONES,
  DCC_WORDS,
  BEEKES_DOCS,
  EFG_STATS,
  RAG_COLLECTIONS,
  DOCUMENT_RUNS,
};
