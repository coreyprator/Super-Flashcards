// bwtl-api.js — replaces data.js for the SF-hosted BWTL frontend.
// Provides real fetch() wrappers for live SF endpoints while keeping
// mock data for display-only fields not yet wired to an API.
//
// BWTL03-MEGA-001 (Challenge: 92c8f456ecf825af3edb3010f60633aa)

// ─── Auth ────────────────────────────────────────────────────────────────────

function _getAuthHeaders() {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function _apiFetch(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { ..._getAuthHeaders(), ...(opts.headers || {}) } });
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
  window.BWTL.FLASHCARDS[id] = card;
  return card;
}

async function fetchCards(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await _apiFetch(`/api/flashcards/?${qs}`);
  const cards = data.items || data || [];
  cards.forEach(c => { window.BWTL.FLASHCARDS[c.id] = c; });
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
  };
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

// ─── Initialize window.BWTL ───────────────────────────────────────────────────

window.BWTL = {
  // static
  ROLES,
  PROMOTE_FIELDS,

  // lazy-populated caches
  FLASHCARDS: {},
  PIE_ROOTS: {},

  // stubs (display-only)
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

  // API helpers — components call these for live data
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
};
