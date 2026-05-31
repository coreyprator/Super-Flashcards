// bwtl-api.js — replaces data.js for the SF-hosted BWTL frontend.
// Provides real fetch() wrappers for live SF endpoints while keeping
// mock data for display-only fields not yet wired to an API.
//
// BWTL03-MEGA-001 (Challenge: 92c8f456ecf825af3edb3010f60633aa)

// Bypass token removed in BWTL09 (SF-16)

async function _apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

// ─── Static data (not yet endpoint-backed) ───────────────────────────────────

const ROLES = {
  pl:     { id: 'pl',     label: 'PL',        initials: 'PL', sub: 'Architect',  perms: ['read','write','admin','review','create','approve_ai'] },
  theo:   { id: 'theo',   label: 'Theodoros', initials: 'TH', sub: 'Instructor', perms: ['read','write','review','create','approve_ai'] },
  tutor:  { id: 'tutor',  label: 'Maria',     initials: 'MA', sub: 'Tutor',      perms: ['read','write','create'] },
  learner:{ id: 'learner',label: 'Stelios',   initials: 'ST', sub: 'Learner',    perms: ['read'] },
};

const PROMOTE_FIELDS = [
  { key: 'word_or_phrase',           label: 'Word / phrase',     table: 'flashcards.word_or_phrase',           tier: 'core' },
  { key: 'definition',               label: 'Definition',        table: 'flashcards.definition',               tier: 'core' },
  { key: 'ipa',                      label: 'IPA',               table: 'flashcards.ipa_pronunciation',        tier: 'phonetic' },
  { key: 'audio_url',                label: 'Audio URL',         table: 'flashcards.audio_url',                tier: 'phonetic' },
  { key: 'etymology',                label: 'Etymology (prose)', table: 'flashcards.etymology',                tier: 'etymology' },
  { key: 'etymology_layer.PIE',      label: 'Etymology · PIE',   table: 'flashcard_pie_roots.etymology_layer', tier: 'etymology' },
  { key: 'etymology_layer.Latin',    label: 'Etymology · Latin', table: 'flashcard_pie_roots.etymology_layer', tier: 'etymology' },
  { key: 'etymology_layer.Greek',    label: 'Etymology · Greek', table: 'flashcard_pie_roots.etymology_layer', tier: 'etymology' },
  { key: 'pie_root',                 label: 'PIE root',          table: 'flashcards.pie_root',                 tier: 'etymology' },
  { key: 'pie_ipa',                  label: 'PIE root IPA',      table: 'flashcards.pie_ipa',                  tier: 'etymology' },
  { key: 'pie_audio_url',            label: 'PIE root audio',    table: 'flashcards.pie_audio_url',            tier: 'etymology' },
  { key: 'non_pie_reason',           label: 'Non-PIE reason',    table: 'flashcards.non_pie_reason',           tier: 'etymology' },
  { key: 'cognates',                 label: 'English cognates',  table: 'flashcards.english_cognates',         tier: 'relations' },
  { key: 'fun_facts',                label: 'Fun facts',         table: 'em.fun_facts (junction)',             tier: 'relations' },
  { key: 'efg_node_id',              label: 'EFG node link',     table: 'flashcards.efg_node_id',              tier: 'relations' },
  { key: 'image_caption',            label: 'Image caption',     table: 'flashcards.image_description',        tier: 'media' },
];

// ─── Flashcard API ────────────────────────────────────────────────────────────

async function fetchCard(id) {
  const card = await _apiFetch(`/api/flashcards/${id}`);
  if (!card || typeof card !== 'object') throw new Error(`Card not found: ${id}`);
  card.word = card.word || card.word_or_phrase; // normalize: API returns word_or_phrase, FE reads card.word
  // Option B (BWTL05): normalize language name from LANGUAGES cache
  if (!card.language && card.language_id) {
    const lang = (window.BWTL.LANGUAGES || []).find(l => l.id === card.language_id);
    if (lang) card.language = lang.name;
  }
  const prev = window.BWTL.FLASHCARDS[id];
  if (prev?.bookmarked) card.bookmarked = true; // preserve bookmark annotation
  window.BWTL.FLASHCARDS[id] = card;
  return card;
}

async function fetchCards(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await _apiFetch(`/api/flashcards/?${qs}`);
  const cards = data.items || data || [];
  cards.forEach(c => {
    const prev = window.BWTL.FLASHCARDS[c.id];
    if (prev?.bookmarked) c.bookmarked = true; // preserve bookmark annotation set by loadCards
    // Normalize language name from LANGUAGES cache (same as fetchCard)
    if (!c.language && c.language_id) {
      const lang = (window.BWTL.LANGUAGES || []).find(l => l.id === c.language_id);
      if (lang) c.language = lang.name;
    }
    window.BWTL.FLASHCARDS[c.id] = c;
  });
  return cards;
}

// ─── PIE Explorer API ─────────────────────────────────────────────────────────

async function fetchPieRoot(root) {
  const data = await _apiFetch(`/api/flashcards/pie-explorer/${encodeURIComponent(root)}`);
  window.BWTL.PIE_ROOTS[root] = {
    root: data.pie_root,
    gloss: data.pie_meaning || '',
    ipa: data.efg_pie_ipa || data.pie_ipa || '',
    audio_url: data.efg_pie_audio_url || data.pie_audio_url || null,
    audio_coverage: data.efg_pie_audio_url ? 'efg' : 'sf',
    atomic: data.atomic_roots && data.atomic_roots.length > 1 ? data.atomic_roots : null,
    verbal_paradigm: data.verbal_paradigm || null,
    nominal_derivatives: data.nominal_derivatives || null,
    modern_cognates: data.modern_cognates || null,
    language_paradigm: data.language_paradigm || {},
    word_count: data.card_count || 0,
    branches: data.branches || [],
    scholarly_notes: data.scholarly_notes || [],
  };
  // Also populate the SCHOLARLY_NOTES cache keyed by root
  window.BWTL.SCHOLARLY_NOTES[root] = (data.scholarly_notes || []).map(n => ({
    source: n.source || '',
    ref: n.page_ref || '',
    excerpt: n.content || '',
    kind: 'dictionary',
    confidence: null,
  }));
  return window.BWTL.PIE_ROOTS[root];
}

// ─── Chat API ─────────────────────────────────────────────────────────────────

// Default anchor mode per spec (Drift #2: flashcard_id is primary, not pie_root)
const ANCHOR_MODE_DEFAULT = 'flashcard_id';

async function createThread(body) {
  const payload = { anchor_mode: ANCHOR_MODE_DEFAULT, ...body };
  return _apiFetch('/api/chat/threads', { method: 'POST', body: JSON.stringify(payload) });
}

async function getThreads(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return _apiFetch(`/api/chat/threads?${qs}`);
}

async function addMessage(threadId, body) {
  return _apiFetch(`/api/chat/threads/${threadId}/messages`, { method: 'POST', body: JSON.stringify(body) });
}

async function getMessages(threadId) {
  return _apiFetch(`/api/chat/threads/${threadId}/messages`);
}

async function promoteField(body) {
  // body: { chat_message_id, card_id, target_field, before_value, after_value, accepted_by }
  return _apiFetch('/api/chat/promotions', { method: 'POST', body: JSON.stringify(body) });
}

// ─── Bookmark API ─────────────────────────────────────────────────────────────

async function createBookmark(body) {
  return _apiFetch('/api/bookmarks', { method: 'POST', body: JSON.stringify(body) });
}

async function getBookmarks(ownerId, kind = null) {
  const params = { owner_id: ownerId };
  if (kind) params.kind = kind;
  return _apiFetch(`/api/bookmarks?${new URLSearchParams(params)}`);
}

async function deleteBookmark(id) {
  return _apiFetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
}

async function createCollection(body) {
  return _apiFetch('/api/bookmark_collections', { method: 'POST', body: JSON.stringify(body) });
}

async function getCollections(ownerId) {
  return _apiFetch(`/api/bookmark_collections?owner_id=${encodeURIComponent(ownerId)}`);
}

// ─── Admin API ────────────────────────────────────────────────────────────────

async function getCoverage() {
  return _apiFetch('/api/admin/coverage');
}

// ─── Stubs for display-only collections ──────────────────────────────────────
// These replace the large inline mock datasets from data.js.
// Components that still read these synchronously get empty arrays/objects
// and will render gracefully with "no data" states.

const FIGURES      = {};
const RAG_ENTRIES  = {};
const NODES        = {};
const CHAT_THREADS = [];
const CHAT_PROMOTIONS = [];
const BOOKMARKS    = [];
const REVIEW_ITEMS = [];
const LANGUAGES    = ['Ancient Greek', 'French', 'Latin', 'Sanskrit', 'English'];
const AI_FIELDS    = [];
const STUDY_QUEUE  = [];
const AF_JOBS      = [];
const VOICE_CLONES = {};
const DCC_WORDS    = [];
const BEEKES_DOCS  = [];
const EFG_STATS    = { node_count: 0, pie_root_count: 0, edge_count: 0, word_count: 0 };
const RAG_COLLECTIONS = [];
const DOCUMENT_RUNS = [];

// ─── Cross-app service base URLs ─────────────────────────────────────────────
const _EM_URL  = 'https://etymython.rentyourcio.com';
const _EFG_URL = 'https://efg.rentyourcio.com';
const _RAG_URL = 'https://portfolio-rag-57478301787.us-central1.run.app';

async function _fetchExternal(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`External ${res.status}: ${url}`);
  return res.json();
}

// ─── Languages API ────────────────────────────────────────────────────────────
async function fetchLanguages() {
  const data = await _apiFetch('/api/languages');
  const langs = Array.isArray(data) ? data : [];
  window.BWTL.LANGUAGES = langs;
  return langs;
}

// ─── Study API ────────────────────────────────────────────────────────────────
async function fetchStudyDue() {
  const data = await _apiFetch('/api/study/due');
  const queue = Array.isArray(data) ? data : [];
  window.BWTL.STUDY_QUEUE = queue;
  return queue;
}

async function fetchStudyStats() {
  return _apiFetch('/api/study/stats');
}

// ─── EM (Etymython) API ───────────────────────────────────────────────────────
async function fetchFigures(limit = 20) {
  const data = await _fetchExternal(`${_EM_URL}/api/v1/figures?limit=${limit}`);
  const figures = Array.isArray(data) ? data : (data.items || []);
  figures.forEach(f => { window.BWTL.FIGURES[f.id] = f; });
  return figures;
}

async function fetchFigure(id) {
  const data = await _fetchExternal(`${_EM_URL}/api/v1/figures/${id}/mythology-data`);
  window.BWTL.FIGURES[id] = data;
  return data;
}

async function fetchFigureStory(id) {
  return _fetchExternal(`${_EM_URL}/api/v1/figures/${id}/artforge-story`);
}

async function fetchCognates(word) {
  return _fetchExternal(`${_EM_URL}/api/v1/cognates/lookup?word=${encodeURIComponent(word)}`);
}

// ─── EFG API ──────────────────────────────────────────────────────────────────
async function fetchEfgGraph(nodeId) {
  return _fetchExternal(`${_EFG_URL}/api/nodes/${encodeURIComponent(nodeId)}`);
}

async function fetchEfgRoots() {
  const data = await _fetchExternal(`${_EFG_URL}/api/roots`);
  return Array.isArray(data) ? data : (data.roots || []);
}

// ─── RAG API ──────────────────────────────────────────────────────────────────
async function searchRag(q, collection) {
  const path = collection === 'etymology'
    ? `/search/etymology?q=${encodeURIComponent(q)}`
    : `/search?collection=${encodeURIComponent(collection || 'etymology')}&q=${encodeURIComponent(q)}`;
  return _fetchExternal(`${_RAG_URL}${path}`);
}

// ─── ArtForge API (via SF proxy) ──────────────────────────────────────────────
async function fetchAfJobs() {
  return _apiFetch('/api/bwtl/af-jobs');
}

async function generateVideo(cardId) {
  return _apiFetch(`/api/flashcards/${cardId}/generate-video`, { method: 'POST', body: JSON.stringify({}) });
}

async function fetchAfJobStatus(jobId) {
  return _apiFetch(`/api/bwtl/af-jobs/${jobId}`);
}

// ─── Voice clones API ─────────────────────────────────────────────────────────
async function fetchVoiceClones() {
  // BUG fix: correct URL is /voice-clone (hyphen), not /voice_clone (underscore)
  const data = await _apiFetch('/api/v1/voice-clone');
  const clones = Array.isArray(data) ? data : (data.items || []);
  window.BWTL.VOICE_CLONES = clones;
  return clones;
}

// ─── Initialize window.BWTL ───────────────────────────────────────────────────

window.BWTL = {
  // static
  ROLES,
  PROMOTE_FIELDS,

  // lazy-populated caches
  FLASHCARDS: {},
  PIE_ROOTS: {},
  SCHOLARLY_NOTES: {},

  // stubs (display-only, populated on demand)
  NODES,
  FIGURES,
  RAG_ENTRIES,
  CHAT_THREADS,
  CHAT_PROMOTIONS,
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

  // Internal API helper — exposed for components that need direct fetch access
  _apiFetch,

  // SF API helpers
  fetchCard,
  fetchCards,
  fetchPieRoot,
  createThread,
  getThreads,
  addMessage,
  getMessages,
  promoteField,
  createBookmark,
  getBookmarks,
  deleteBookmark,
  createCollection,
  getCollections,
  getCoverage,
  fetchLanguages,
  fetchStudyDue,
  fetchStudyStats,
  fetchVoiceClones,

  // Cross-app API helpers
  fetchFigures,
  fetchFigure,
  fetchFigureStory,
  fetchCognates,
  fetchEfgGraph,
  fetchEfgRoots,
  searchRag,
  fetchAfJobs,
  generateVideo,
  fetchAfJobStatus,
};
