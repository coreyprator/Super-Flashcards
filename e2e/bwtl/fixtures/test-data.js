// BWTL04 Test Fixtures — real IDs sourced from live DB and API probes
// Card "born":   GET /api/flashcards/414cc303-3d92-4c9f-a1bb-0d1086ea0f00
//   word_or_phrase: "born", pie_root: "*bher-", efg_node_id: "pie_bher"
// Card "Aorist": GET /api/flashcards/eb4ad93e-6842-4048-bc85-002498ca7e8f
//   word_or_phrase: "Aorist", pie_root: null, has audio_url
// PIE root "bher-" (URL-safe; asterisk stripped):
//   GET /api/flashcards/pie-explorer/bher-  → verbal_paradigm, modern_cognates
// EM figure id=1: english_name="Aphrodite", latin_name="Venus"

const KNOWN = {
  // Flashcard IDs
  cardWithPieRoot:    '414cc303-3d92-4c9f-a1bb-0d1086ea0f00', // "born", pie_root: *bher-
  cardWithPieRootWord: 'born',
  cardWithAudio:      'eb4ad93e-6842-4048-bc85-002498ca7e8f', // "Aorist", has audio_url
  cardWithAudioWord:  'Aorist',

  // PIE root (no asterisk for URL path; API returns *bher- in pie_root field)
  pieRootUrlKey:      'bher-',
  pieRootDisplay:     '*bher-',

  // EFG node linked to "born" card
  efgNodeId:          'pie_bher',

  // Etymython / EM figures
  emFigureId:         1,
  emFigureEnglishName: 'Aphrodite',
  emFigureLatinName:  'Venus',

  // Live service URLs (used directly in cross-app tests)
  emBaseUrl:          'https://etymython.rentyourcio.com',
  sfBaseUrl:          'https://learn.rentyourcio.com',
};

module.exports = { KNOWN };
