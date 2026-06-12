function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// ─── icons.jsx ───
// BWTL icon set — single-stroke, currentColor. Inherited+extended from ArtForge.

const Ic = {
  search: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  })),
  plus: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })),
  play: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M8 5v14l11-7z"
  })),
  pause: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, p), /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "5",
    width: "4",
    height: "14"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "5",
    width: "4",
    height: "14"
  })),
  speaker: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M11 5 6 9H2v6h4l5 4z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15.5 8.5a5 5 0 0 1 0 7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 5a9 9 0 0 1 0 14"
  })),
  bookmark: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l7-4z"
  })),
  bookmark_filled: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l7-4z"
  })),
  more: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "5",
    cy: "12",
    r: "1.6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1.6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "12",
    r: "1.6"
  })),
  x: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })),
  check: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "m5 12 5 5L20 7"
  })),
  caret_d: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6z"
  })),
  caret_r: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "m9 6 6 6-6 6z"
  })),
  chevron_r: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "m9 6 6 6-6 6"
  })),
  arrow_right: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M13 5l7 7-7 7"
  })),
  spark: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3"
  })),
  film: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4M3 12h18"
  })),
  graph: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "6",
    r: "2.2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "5",
    cy: "17",
    r: "2.2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "17",
    r: "2.2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "13",
    r: "2.2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m12 8.2 5 6.6M12 8.2l-5 6.6M12 11v0",
    strokeLinecap: "round"
  })),
  book: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 20.5A2.5 2.5 0 0 1 6.5 18H20v4H6.5A2.5 2.5 0 0 1 4 19.5z"
  })),
  chat: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"
  })),
  user: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "8",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 21a8 8 0 0 1 16 0"
  })),
  shield: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5z"
  })),
  edit: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 20h9M16.5 3.5a2 2 0 0 1 3 3L7 19l-4 1 1-4z"
  })),
  link: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"
  })),
  collapse: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"
  })),
  expand: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M3 9V4h5M21 9V4h-5M3 15v5h5M21 15v5h-5"
  })),
  pin: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 17v5M5 9l3-4h8l3 4-3 3v3l-7-2v-3z"
  })),
  pin_filled: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 17v5l-.7-3-3.3-1 4-1zM5 9l3-4h8l3 4-3 3v3l-7-2v-3z"
  })),
  doc: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 3v6h6M9 14h6M9 18h4"
  })),
  upload: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "17 8 12 3 7 8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "3",
    x2: "12",
    y2: "15"
  })),
  flame: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 2c0 4-5 5-5 10a5 5 0 0 0 10 0c0-3-2-3-2-6 0 0-3 2-3-4z"
  })),
  filter: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M3 5h18M6 12h12M10 19h4"
  })),
  shuffle: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M16 3h5v5M14 20l7-7M21 16v5h-5M15 15l6 6M4 4l5 5M4 20l5-5M4 4l16 16",
    opacity: ".0"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 3h5v5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 20 21 3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 16v5h-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15 15l6 6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 4l5 5"
  })),
  globe: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"
  })),
  grid: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "7"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "7"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "14",
    width: "7",
    height: "7"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "14",
    width: "7",
    height: "7"
  })),
  tree: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "4",
    r: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "4",
    r: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "20",
    r: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 6v6h12V6M12 12v6"
  })),
  send: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "m3 11 18-7-7 18-3-8z"
  })),
  refresh: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"
  })),
  pencil: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "m12 20 7-7-4-4-7 7 4 4zM15 9l4 4M5 19l3 1-1-3z"
  })),
  voice: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("rect", {
    x: "9",
    y: "2",
    width: "6",
    height: "12",
    rx: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 10a7 7 0 0 0 14 0M12 17v5"
  })),
  arrow_left: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M19 12H5M11 19l-7-7 7-7"
  })),
  arrow_up: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 19V5M5 11l7-7 7 7"
  })),
  arrow_down: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M19 13l-7 7-7-7"
  }))
};
window.Ic = Ic;

// ─── bwtl-api.js ───
// bwtl-api.js — replaces data.js for the SF-hosted BWTL frontend.
// Provides real fetch() wrappers for live SF endpoints while keeping
// mock data for display-only fields not yet wired to an API.
//
// BWTL03-MEGA-001 (Challenge: 92c8f456ecf825af3edb3010f60633aa)

// BWTLGO5 (BUG-128): write-auth SESSION MANAGEMENT
// Token is stored in sessionStorage['bwtl_token'].
// Mutations automatically include Authorization: Bearer <token>.
// On 401 the request is retried after a refresh attempt; if refresh also fails,
// the passphrase modal is shown (dispatched via custom event).

const _WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
function _getToken() {
  return sessionStorage.getItem('bwtl_token') || '';
}
function _setToken(t) {
  if (t) sessionStorage.setItem('bwtl_token', t);else sessionStorage.removeItem('bwtl_token');
}
async function _refreshToken() {
  // Use the existing refresh-cookie flow
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) return false;
  const data = await res.json().catch(() => null);
  if (data?.access_token) {
    _setToken(data.access_token);
    return true;
  }
  return false;
}

// Called by app.jsx passphrase modal on successful login
async function bwtlLogin(passphrase) {
  const res = await fetch('/api/auth/bwtl-passphrase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      passphrase
    })
  });
  if (!res.ok) throw new Error('Incorrect passphrase');
  const data = await res.json();
  _setToken(data.access_token);
}

// Check sessionStorage token, then try cookie refresh, then signal for modal
async function _ensureAuth() {
  if (_getToken()) return true;
  if (await _refreshToken()) return true;
  window.dispatchEvent(new CustomEvent('bwtl:auth-required'));
  return false;
}
async function _apiFetch(path, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {})
  };
  if (_WRITE_METHODS.has(method)) {
    // Ensure we have a valid token before sending mutations
    const token = _getToken() || ((await _refreshToken()) ? _getToken() : null);
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(path, {
    ...opts,
    headers,
    credentials: 'include'
  });
  if (res.status === 401 && _WRITE_METHODS.has(method)) {
    // Token may have expired — try one refresh then retry
    if (await _refreshToken()) {
      const token2 = _getToken();
      if (token2) headers['Authorization'] = `Bearer ${token2}`;
      const retry = await fetch(path, {
        ...opts,
        headers,
        credentials: 'include'
      });
      if (!retry.ok) {
        if (retry.status === 401) window.dispatchEvent(new CustomEvent('bwtl:auth-required'));
        const err = await retry.text().catch(() => retry.statusText);
        throw new Error(`API ${retry.status}: ${err}`);
      }
      return retry.json();
    }
    window.dispatchEvent(new CustomEvent('bwtl:auth-required'));
    throw new Error('API 401: Session expired — please re-authenticate');
  }
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

// ─── Static data (not yet endpoint-backed) ───────────────────────────────────

const ROLES = {
  pl: {
    id: 'pl',
    label: 'PL',
    initials: 'PL',
    sub: 'Architect',
    perms: ['read', 'write', 'admin', 'review', 'create', 'approve_ai']
  },
  theo: {
    id: 'theo',
    label: 'Theodoros',
    initials: 'TH',
    sub: 'Instructor',
    perms: ['read', 'write', 'review', 'create', 'approve_ai']
  },
  tutor: {
    id: 'tutor',
    label: 'Maria',
    initials: 'MA',
    sub: 'Tutor',
    perms: ['read', 'write', 'create']
  },
  learner: {
    id: 'learner',
    label: 'Stelios',
    initials: 'ST',
    sub: 'Learner',
    perms: ['read']
  }
};
const PROMOTE_FIELDS = [{
  key: 'word_or_phrase',
  label: 'Word / phrase',
  table: 'flashcards.word_or_phrase',
  tier: 'core'
}, {
  key: 'definition',
  label: 'Definition',
  table: 'flashcards.definition',
  tier: 'core'
}, {
  key: 'ipa',
  label: 'IPA',
  table: 'flashcards.ipa_pronunciation',
  tier: 'phonetic'
}, {
  key: 'audio_url',
  label: 'Audio URL',
  table: 'flashcards.audio_url',
  tier: 'phonetic'
}, {
  key: 'etymology',
  label: 'Etymology (prose)',
  table: 'flashcards.etymology',
  tier: 'etymology'
}, {
  key: 'etymology_layer.PIE',
  label: 'Etymology · PIE',
  table: 'flashcard_pie_roots.etymology_layer',
  tier: 'etymology'
}, {
  key: 'etymology_layer.Latin',
  label: 'Etymology · Latin',
  table: 'flashcard_pie_roots.etymology_layer',
  tier: 'etymology'
}, {
  key: 'etymology_layer.Greek',
  label: 'Etymology · Greek',
  table: 'flashcard_pie_roots.etymology_layer',
  tier: 'etymology'
}, {
  key: 'pie_root',
  label: 'PIE root',
  table: 'flashcards.pie_root',
  tier: 'etymology'
}, {
  key: 'pie_ipa',
  label: 'PIE root IPA',
  table: 'flashcards.pie_ipa',
  tier: 'etymology'
}, {
  key: 'pie_audio_url',
  label: 'PIE root audio',
  table: 'flashcards.pie_audio_url',
  tier: 'etymology'
}, {
  key: 'non_pie_reason',
  label: 'Non-PIE reason',
  table: 'flashcards.non_pie_reason',
  tier: 'etymology'
}, {
  key: 'cognates',
  label: 'English cognates',
  table: 'flashcards.english_cognates',
  tier: 'relations'
}, {
  key: 'fun_facts',
  label: 'Fun facts',
  table: 'em.fun_facts (junction)',
  tier: 'relations'
}, {
  key: 'efg_node_id',
  label: 'EFG node link',
  table: 'flashcards.efg_node_id',
  tier: 'relations'
}, {
  key: 'image_caption',
  label: 'Image caption',
  table: 'flashcards.image_description',
  tier: 'media'
}];

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
    scholarly_notes: data.scholarly_notes || []
  };
  // Also populate the SCHOLARLY_NOTES cache keyed by root
  window.BWTL.SCHOLARLY_NOTES[root] = (data.scholarly_notes || []).map(n => ({
    source: n.source || '',
    ref: n.page_ref || '',
    excerpt: n.content || '',
    kind: 'dictionary',
    confidence: null
  }));
  return window.BWTL.PIE_ROOTS[root];
}

// ─── Chat API ─────────────────────────────────────────────────────────────────

// Default anchor mode per spec (Drift #2: flashcard_id is primary, not pie_root)
const ANCHOR_MODE_DEFAULT = 'flashcard_id';
async function createThread(body) {
  const payload = {
    anchor_mode: ANCHOR_MODE_DEFAULT,
    ...body
  };
  return _apiFetch('/api/chat/threads', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
async function getThreads(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return _apiFetch(`/api/chat/threads?${qs}`);
}
async function addMessage(threadId, body) {
  return _apiFetch(`/api/chat/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
async function getMessages(threadId) {
  return _apiFetch(`/api/chat/threads/${threadId}/messages`);
}
async function promoteField(body) {
  // body: { chat_message_id, card_id, target_field, before_value, after_value, accepted_by }
  return _apiFetch('/api/chat/promotions', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// ─── Bookmark API ─────────────────────────────────────────────────────────────

async function createBookmark(body) {
  return _apiFetch('/api/bookmarks', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
async function getBookmarks(ownerId, kind = null) {
  const params = {
    owner_id: ownerId
  };
  if (kind) params.kind = kind;
  return _apiFetch(`/api/bookmarks?${new URLSearchParams(params)}`);
}
async function deleteBookmark(id) {
  return _apiFetch(`/api/bookmarks/${id}`, {
    method: 'DELETE'
  });
}

// REQ-039: delete a flashcard (PL-only)
async function deleteCard(id) {
  return _apiFetch(`/api/flashcards/${id}`, {
    method: 'DELETE'
  });
}
async function createCollection(body) {
  return _apiFetch('/api/bookmark_collections', {
    method: 'POST',
    body: JSON.stringify(body)
  });
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

const FIGURES = {};
const RAG_ENTRIES = {};
const NODES = {};
const CHAT_THREADS = [];
const CHAT_PROMOTIONS = [];
const BOOKMARKS = [];
const REVIEW_ITEMS = [];
const LANGUAGES = ['Ancient Greek', 'French', 'Latin', 'Sanskrit', 'English'];
const AI_FIELDS = [];
const STUDY_QUEUE = [];
const AF_JOBS = [];
const VOICE_CLONES = {};
const DCC_WORDS = [];
const BEEKES_DOCS = [];
const EFG_STATS = {
  node_count: 0,
  pie_root_count: 0,
  edge_count: 0,
  word_count: 0,
  total_nodes: 0,
  word_nodes: 0,
  pie_root_nodes: 0,
  total_edges: 0,
  sf_linked: 0,
  pie_explorer_data: 0
};
const RAG_COLLECTIONS = [];
const DOCUMENT_RUNS = [];

// ─── Cross-app service base URLs removed — all endpoints now SF-native ──────

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
  // M06: switched from external Etymython service → SF-native /api/figures
  const data = await _apiFetch(`/api/figures?limit=${limit}`);
  const figures = Array.isArray(data) ? data : data.items || [];
  figures.forEach(f => {
    window.BWTL.FIGURES[f.id] = f;
  });
  return figures;
}
async function fetchFigure(id) {
  const data = await _apiFetch(`/api/figures/${id}`);
  window.BWTL.FIGURES[id] = data;
  return data;
}
async function fetchFigureStory(id) {
  return _apiFetch(`/api/bwtl/figures/${id}/story`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}
async function generateFigureImage(id, style = 'classical') {
  return _apiFetch(`/api/bwtl/figures/${id}/image?style=${encodeURIComponent(style)}`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}
async function fetchCognates(word) {
  return _apiFetch(`/api/v1/cognates/lookup?word=${encodeURIComponent(word)}`);
}

// ─── EFG API ──────────────────────────────────────────────────────────────────
async function fetchEfgGraph(nodeId) {
  // BUG-070: switched from external EFG service to SF-native endpoint
  return _apiFetch(`/api/efg/graph?node=${encodeURIComponent(nodeId)}`);
}
async function fetchEfgRoots() {
  // M05: switched from external EFG service → SF-native /api/efg/roots
  const data = await _apiFetch('/api/efg/roots');
  return Array.isArray(data) ? data : data.roots || [];
}

// ─── Etymology search (M03: replaces Portfolio RAG) ─────────────────────────
async function searchEtymology(q) {
  return _apiFetch(`/api/etymology/search?q=${encodeURIComponent(q)}&limit=50`);
}

// ─── ArtForge API (via SF proxy) ──────────────────────────────────────────────
async function fetchAfJobs() {
  return _apiFetch('/api/bwtl/af-jobs');
}
async function generateVideo(cardId) {
  return _apiFetch(`/api/flashcards/${cardId}/generate-video`, {
    method: 'POST',
    body: JSON.stringify({})
  });
}
async function fetchAfJobStatus(jobId) {
  return _apiFetch(`/api/bwtl/af-jobs/${jobId}`);
}

// ─── Voice clones API ─────────────────────────────────────────────────────────
async function fetchVoiceClones() {
  // BUG fix: correct URL is /voice-clone (hyphen), not /voice_clone (underscore)
  const data = await _apiFetch('/api/v1/voice-clone');
  const clones = Array.isArray(data) ? data : data.items || [];
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
  // BWTLGO5 (BUG-128): auth helpers
  bwtlLogin,
  _getToken,
  _ensureAuth,
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
  deleteCard,
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
  generateFigureImage,
  fetchCognates,
  fetchEfgGraph,
  fetchEfgRoots,
  searchEtymology,
  fetchAfJobs,
  generateVideo,
  fetchAfJobStatus
};

// ─── etymology.jsx ───
// REV-2 — Etymology Surface components.
//
// Five new pieces, conditionally rendered inside the word card center column:
//   • MultiRootPie          — equation-style root pills (N=1..5+ roots)
//   • ScholarlyNotesStack   — multi-source citation stack (1 open + 4 collapsed)
//   • OriginStoryPanel      — long-form narrative, figure-only
//   • FamilyTreeGraph       — hierarchical SVG tree, figure-only
//   • EmptyEtymologyState   — placeholder with "Ask AI to research" actions
//
// All inherit BWTL's color tokens (pie blue, myth amber, etc.) and the
// ArtForge-derived shell vocabulary.

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-ROOT PIE DISPLAY (equation style)
// Renders one or more PIE root pills joined by "+". Each pill is large, has
// its own audio, gloss, IPA, and drills to the PIE Explorer panel.
// At N=1 the "+" disappears and the pill is solo. At N>=2 it's the full equation.
// ─────────────────────────────────────────────────────────────────────────────
function MultiRootPie({
  pieRoots,
  currentCard,
  onDrillPie,
  canEdit
}) {
  const roots = pieRoots && pieRoots.length ? pieRoots : currentCard?.pie_root ? [currentCard.pie_root] : [];
  if (roots.length === 0) return null;
  const compound = roots.length > 1;
  return /*#__PURE__*/React.createElement("div", {
    className: "wc-section",
    style: {
      paddingTop: 18,
      paddingBottom: 18,
      background: 'linear-gradient(180deg, color-mix(in oklch, var(--pie) 4%, transparent), transparent)'
    }
  }, /*#__PURE__*/React.createElement("h4", null, /*#__PURE__*/React.createElement("span", {
    className: "dot pie"
  }), " PIE root", compound ? 's' : '', compound && /*#__PURE__*/React.createElement("span", {
    className: "pill pie",
    style: {
      marginLeft: 6,
      fontSize: 9.5
    }
  }, "compound \xB7 ", roots.length, " roots"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      gap: 4
    }
  }, canEdit && /*#__PURE__*/React.createElement(AiEditButton, {
    field: "pie_root",
    label: "PIE root",
    subtle: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch',
      gap: compound ? 6 : 0,
      flexWrap: 'wrap',
      marginTop: 4
    }
  }, roots.map((r, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: r
  }, /*#__PURE__*/React.createElement(RootPill, {
    rootKey: r,
    onClick: () => onDrillPie?.(r),
    primary: i === 0
  }), compound && i < roots.length - 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 4px',
      fontFamily: 'var(--ff-display)',
      fontSize: 40,
      fontWeight: 300,
      color: 'var(--fg-4)',
      userSelect: 'none'
    }
  }, "+")))), compound && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: '8px 12px',
      background: 'var(--bg-2)',
      border: '1px dashed var(--line)',
      borderRadius: 'var(--r-sm)',
      fontSize: 12,
      color: 'var(--fg-3)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 9.5,
      color: 'var(--fg-4)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginRight: 6
    }
  }, "compound \u25B8"), currentCard?.word, " is built from ", roots.length, " PIE roots. Each root has its own audio, paradigm, and reflexes \u2014 click any pill to open it in the PIE Explorer panel."));
}
function RootPill({
  rootKey,
  onClick,
  primary
}) {
  const root = window.BWTL.PIE_ROOTS[rootKey];
  const [playing, setPlaying] = React.useState(false);
  if (!root) {
    // Graceful: render a slim placeholder pill for unknown roots.
    return /*#__PURE__*/React.createElement("div", {
      className: "pie-rootpill",
      onClick: onClick,
      style: {
        borderStyle: 'dashed',
        opacity: 0.7
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "prp-root"
    }, rootKey), /*#__PURE__*/React.createElement("div", {
      className: "prp-gloss",
      style: {
        color: 'var(--fg-4)'
      }
    }, "(not in PIE Explorer yet)"));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "pie-rootpill",
    onClick: onClick,
    style: primary ? {} : {
      borderColor: 'var(--pie-ring)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "prp-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "prp-root"
  }, root.root), /*#__PURE__*/React.createElement("button", {
    className: "prp-audio",
    onClick: e => {
      e.stopPropagation();
      setPlaying(true);
      setTimeout(() => setPlaying(false), 1200);
    },
    title: `Play PIE reconstruction · ${root.ipa}`
  }, playing ? /*#__PURE__*/React.createElement(Ic.pause, null) : /*#__PURE__*/React.createElement(Ic.play, null))), /*#__PURE__*/React.createElement("div", {
    className: "prp-ipa mono"
  }, root.ipa), /*#__PURE__*/React.createElement("div", {
    className: "prp-gloss"
  }, "\"", root.gloss, "\""), /*#__PURE__*/React.createElement("div", {
    className: "prp-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, root.word_count, " reflexes"), /*#__PURE__*/React.createElement("span", {
    className: "prp-drill"
  }, /*#__PURE__*/React.createElement(Ic.spark, null), " Open")));
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHOLARLY NOTES STACK (compact accordion: 1 expanded, 4 collapsed)
// Per-root citation list — Beekes / Watkins / Kroonen / DCC / LSJ entries
// with page numbers. User can expand any line; first one is open by default.
// Renders side-by-side for compound words (one stack per root).
// ─────────────────────────────────────────────────────────────────────────────
function ScholarlyNotesStack({
  pieRoots,
  currentCard
}) {
  const roots = pieRoots && pieRoots.length ? pieRoots : currentCard?.pie_root ? [currentCard.pie_root] : [];
  const notesByRoot = roots.map(r => ({
    root: r,
    notes: window.BWTL.SCHOLARLY_NOTES[r] || []
  })).filter(g => g.notes.length > 0);
  if (notesByRoot.length === 0) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "wc-section"
  }, /*#__PURE__*/React.createElement("h4", null, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: 'var(--acc-2)'
    }
  }), " Scholarly notes", /*#__PURE__*/React.createElement("span", {
    className: "pill ghost",
    style: {
      marginLeft: 'auto',
      fontSize: 9.5
    }
  }, notesByRoot.reduce((a, g) => a + g.notes.length, 0), " attestations", notesByRoot.length > 1 && ` · ${notesByRoot.length} roots`)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: notesByRoot.length > 1 ? `repeat(${notesByRoot.length}, minmax(0, 1fr))` : '1fr',
      gap: 10,
      marginTop: 6
    }
  }, notesByRoot.map(({
    root,
    notes
  }) => /*#__PURE__*/React.createElement(ScholarlyNotesColumn, {
    key: root,
    root: root,
    notes: notes,
    multiRoot: notesByRoot.length > 1
  }))));
}
function ScholarlyNotesColumn({
  root,
  notes,
  multiRoot
}) {
  // First entry expanded by default; others collapsed headers.
  const [expanded, setExpanded] = React.useState(new Set([0]));
  const toggle = i => setExpanded(s => {
    const n = new Set(s);
    n.has(i) ? n.delete(i) : n.add(i);
    return n;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-sm)',
      overflow: 'hidden'
    }
  }, multiRoot && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 10px',
      background: 'color-mix(in oklch, var(--pie) 6%, var(--bg-2))',
      borderBottom: '1px solid var(--line-soft)',
      fontFamily: 'var(--ff-display)',
      fontSize: 14,
      color: 'var(--pie)'
    }
  }, root), notes.map((n, i) => {
    const isOpen = expanded.has(i);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        borderTop: i > 0 ? '1px solid var(--line-soft)' : 'none'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => toggle(i),
      style: {
        width: '100%',
        appearance: 'none',
        cursor: 'pointer',
        background: isOpen ? 'var(--bg-2)' : 'transparent',
        border: 0,
        padding: '8px 12px',
        display: 'grid',
        gridTemplateColumns: '14px 1fr auto',
        gap: 8,
        alignItems: 'center',
        fontFamily: 'inherit',
        color: 'var(--fg)',
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement(Ic.caret_d, {
      style: {
        transform: isOpen ? 'none' : 'rotate(-90deg)',
        color: 'var(--fg-4)',
        transition: 'transform .15s'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600
      }
    }, n.source), /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 10.5,
        color: 'var(--fg-4)'
      }
    }, n.ref), n.headword && /*#__PURE__*/React.createElement("span", {
      className: "greek",
      style: {
        fontSize: 12,
        color: 'var(--acc-2)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, n.headword)), /*#__PURE__*/React.createElement(KindBadge, {
      kind: n.kind,
      confidence: n.confidence,
      contradicts: n.contradicts
    })), isOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '4px 12px 12px 34px',
        fontSize: 12.5,
        lineHeight: 1.55,
        color: 'var(--fg-2)',
        background: 'var(--bg-2)'
      }
    }, n.excerpt, n.contradicts && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8,
        padding: '6px 8px',
        borderLeft: '2px solid var(--err)',
        background: 'color-mix(in oklch, var(--err) 5%, transparent)',
        fontSize: 11,
        color: 'var(--fg-3)'
      }
    }, "\u26A0 This source rejects the PIE attribution ", /*#__PURE__*/React.createElement("span", {
      className: "mono"
    }, n.contradicts), ". Card shows it for transparency; not a coverage gap.")));
  }));
}
function KindBadge({
  kind,
  confidence,
  contradicts
}) {
  const map = {
    dictionary: {
      label: 'dict',
      color: 'var(--pie)'
    },
    root: {
      label: 'root',
      color: 'var(--acc)'
    },
    lexicon: {
      label: 'lex',
      color: 'var(--graph)'
    },
    frequency: {
      label: 'freq',
      color: 'var(--myth)'
    }
  };
  const m = map[kind] || {
    label: kind,
    color: 'var(--fg-3)'
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 4,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--ff-mono)',
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      padding: '1.5px 5px',
      borderRadius: 3,
      background: `color-mix(in oklch, ${m.color} 14%, transparent)`,
      color: m.color,
      border: `1px solid color-mix(in oklch, ${m.color} 30%, transparent)`
    }
  }, m.label), confidence != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--ff-mono)',
      fontSize: 9,
      color: contradicts ? 'var(--err)' : confidence >= 0.9 ? 'var(--ok)' : confidence >= 0.7 ? 'var(--warn)' : 'var(--fg-4)'
    }
  }, Math.round(confidence * 100), "%"));
}

// ─────────────────────────────────────────────────────────────────────────────
// ORIGIN STORY PANEL (figure cards only)
// Reading-style narrative of the figure's mythological backstory.
// Pulled from EM.mythological_figures.origin_story.
// ─────────────────────────────────────────────────────────────────────────────
function OriginStoryPanel({
  figure,
  role
}) {
  if (!figure) return null;
  const canEdit = role === 'pl' || role === 'theo';
  const paras = (figure.origin_story || '').split('\n\n');
  return /*#__PURE__*/React.createElement("div", {
    className: "wc-section",
    style: {
      background: 'color-mix(in oklch, var(--myth) 3%, transparent)'
    }
  }, /*#__PURE__*/React.createElement("h4", null, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: 'var(--myth)'
    }
  }), " Origin story", /*#__PURE__*/React.createElement("span", {
    className: "pill myth",
    style: {
      marginLeft: 6,
      fontSize: 9.5
    }
  }, figure.figure_type), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      gap: 4
    }
  }, canEdit && /*#__PURE__*/React.createElement(AiEditButton, {
    field: "origin_story",
    label: "Origin story",
    subtle: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ff-display)',
      fontSize: 16,
      lineHeight: 1.65,
      color: 'var(--fg)',
      fontWeight: 400,
      letterSpacing: '-0.005em',
      textWrap: 'pretty'
    }
  }, paras.map((p, i) => /*#__PURE__*/React.createElement("p", {
    key: i,
    style: {
      margin: i === 0 ? '0 0 14px' : '0 0 14px'
    }
  }, /*#__PURE__*/React.createElement(FigureProseLinker, {
    text: p
  })))), figure.attestations && figure.attestations.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      paddingTop: 12,
      borderTop: '1px dashed var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-4)',
      marginBottom: 6,
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Ic.scroll, null), " Attestations"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 4
    }
  }, figure.attestations.map((a, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "pill ghost",
    style: {
      fontSize: 10,
      fontFamily: 'var(--ff-mono)'
    },
    title: a.ref
  }, a.source, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.6
    }
  }, "\xB7 ", a.era))))));
}

// Light prose linker — capitalizes of figure names in origin stories get
// linked to a hover affordance (in this prototype they're styled as xlinks
// but don't navigate; in production they'd go to the figure detail).
function FigureProseLinker({
  text
}) {
  // crude tag the names this prototype knows
  const names = ['Ananke', 'Aether', 'Erebus', 'Chaos', 'Aion', 'Zurvan', 'Kronos', 'Mnemosyne', 'Lethe', 'Zeus', 'Gaia', 'Uranus', 'Cronus', 'Rhea', 'Themis', 'Moneta', 'Mount Olympus', 'Damascius', 'Plutarch', 'Hesiod', 'Pausanias'];
  let parts = [text];
  names.forEach(n => {
    const next = [];
    parts.forEach(p => {
      if (typeof p !== 'string') {
        next.push(p);
        return;
      }
      const split = p.split(new RegExp(`(${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`));
      split.forEach(s => {
        if (s === n) next.push(/*#__PURE__*/React.createElement("a", {
          key: Math.random(),
          className: "xlink myth",
          style: {
            fontFamily: 'inherit',
            fontWeight: 600
          }
        }, /*#__PURE__*/React.createElement("span", {
          className: "x-tag"
        }, "EM"), s));else if (s) next.push(s);
      });
    });
    parts = next;
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, parts);
}

// ─────────────────────────────────────────────────────────────────────────────
// FAMILY TREE GRAPH (figure cards only) — hierarchical SVG.
// Three tiers: parents (top), subject + consort + siblings + lateral (middle),
// children (bottom). Lines drawn between them. Lateral relations
// (equivalent / inverse_of / distinct_from / often_confused_with) sit on the
// wings with dashed connectors that visually read as "related but not blood".
// ─────────────────────────────────────────────────────────────────────────────
function FamilyTreeGraph({
  figure,
  onOpenFigure
}) {
  if (!figure) return null;
  const rels = figure.relations || [];

  // Bucket by tier.
  const parents = rels.filter(r => r.rel === 'parent');
  const siblings = rels.filter(r => r.rel === 'sibling');
  const consorts = rels.filter(r => r.rel === 'consort');
  const children = rels.filter(r => r.rel === 'child' || r.rel === 'mother_of' || r.rel === 'father_of');
  const lateralL = rels.filter(r => r.rel === 'distinct_from' || r.rel === 'often_confused_with');
  const lateralR = rels.filter(r => r.rel === 'equivalent' || r.rel === 'inverse_of');
  const W = 880,
    H = 380;
  const cx = W / 2,
    cy = H / 2;
  const tierY = {
    parent: 56,
    middle: cy,
    child: H - 70
  };

  // Position helper: evenly distribute around a center X.
  const distribute = (n, w, centerX, y, gap = 14) => {
    const totalW = n * w + (n - 1) * gap;
    const startX = centerX - totalW / 2;
    return Array.from({
      length: n
    }, (_, i) => ({
      x: startX + i * (w + gap) + w / 2,
      y
    }));
  };
  const nodeW = 132,
    nodeH = 50;
  const parentPos = distribute(parents.length, nodeW, cx, tierY.parent);
  const childPos = distribute(children.length, nodeW, cx, tierY.child);
  const siblingPos = siblings.map((_, i) => ({
    x: 86 + i * 6,
    y: tierY.parent + 92 + i * (nodeH + 8)
  }));
  const subjectPos = {
    x: cx,
    y: cy
  };
  const consortPos = consorts.length > 0 ? {
    x: cx + 220,
    y: cy
  } : null;
  const lLPos = lateralL.map((_, i) => ({
    x: 86,
    y: cy + 60 + i * (nodeH + 10)
  }));
  const lRPos = lateralR.map((_, i) => ({
    x: W - 86,
    y: cy - 30 + i * (nodeH + 10)
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "wc-section",
    style: {
      paddingTop: 18
    }
  }, /*#__PURE__*/React.createElement("h4", null, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: 'var(--myth)'
    }
  }), " Family tree", /*#__PURE__*/React.createElement("span", {
    className: "pill myth",
    style: {
      marginLeft: 6,
      fontSize: 9.5
    }
  }, rels.length, " relations"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 10.5,
      color: 'var(--fg-4)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "EM.figure_relationships"), " \xB7 click any node to drill in")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'radial-gradient(ellipse at center, color-mix(in oklch, var(--myth) 5%, transparent), transparent 70%), var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      marginTop: 6,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "xMidYMid meet",
    style: {
      display: 'block',
      width: '100%',
      height: 'auto',
      minHeight: 360
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("marker", {
    id: "ft-arrow",
    viewBox: "0 0 10 10",
    refX: "9",
    refY: "5",
    markerWidth: "5",
    markerHeight: "5",
    orient: "auto"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 0L10 5L0 10z",
    fill: "color-mix(in oklch, var(--myth) 60%, var(--fg-4))"
  }))), parents.length > 0 && /*#__PURE__*/React.createElement(TierLabel, {
    x: 28,
    y: tierY.parent,
    label: "Parents"
  }), children.length > 0 && /*#__PURE__*/React.createElement(TierLabel, {
    x: 28,
    y: tierY.child,
    label: "Children"
  }), (consorts.length > 0 || siblings.length > 0) && /*#__PURE__*/React.createElement(TierLabel, {
    x: 28,
    y: cy,
    label: "Generation"
  }), parentPos.map((p, i) => /*#__PURE__*/React.createElement("path", {
    key: 'pp' + i,
    d: `M ${p.x} ${p.y + nodeH / 2} V ${(p.y + subjectPos.y) / 2} H ${subjectPos.x} V ${subjectPos.y - nodeH / 2}`,
    fill: "none",
    stroke: "color-mix(in oklch, var(--myth) 60%, var(--fg-4))",
    strokeWidth: "1.6"
  })), childPos.map((c, i) => /*#__PURE__*/React.createElement("path", {
    key: 'cc' + i,
    d: `M ${subjectPos.x} ${subjectPos.y + nodeH / 2} V ${(subjectPos.y + c.y) / 2} H ${c.x} V ${c.y - nodeH / 2}`,
    fill: "none",
    stroke: "color-mix(in oklch, var(--myth) 60%, var(--fg-4))",
    strokeWidth: "1.6"
  })), parents.length > 0 && siblingPos.map((s, i) => /*#__PURE__*/React.createElement("path", {
    key: 'ss' + i,
    d: `M ${parentPos[0]?.x || cx} ${(parentPos[0]?.y || tierY.parent) + nodeH / 2 + 20} H ${s.x} V ${s.y}`,
    fill: "none",
    stroke: "color-mix(in oklch, var(--myth) 50%, var(--fg-4))",
    strokeWidth: "1.3",
    strokeDasharray: "2,3",
    opacity: "0.7"
  })), consortPos && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: subjectPos.x + nodeW / 2,
    y1: subjectPos.y - 4,
    x2: consortPos.x - nodeW / 2,
    y2: consortPos.y - 4,
    stroke: "var(--myth)",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: subjectPos.x + nodeW / 2,
    y1: subjectPos.y + 4,
    x2: consortPos.x - nodeW / 2,
    y2: consortPos.y + 4,
    stroke: "var(--myth)",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("text", {
    x: (subjectPos.x + consortPos.x) / 2,
    y: subjectPos.y - 12,
    textAnchor: "middle",
    fontFamily: "var(--ff-mono)",
    fontSize: "9",
    letterSpacing: "0.06em",
    fill: "var(--myth)",
    style: {
      textTransform: 'uppercase'
    }
  }, "consort")), lLPos.map((p, i) => /*#__PURE__*/React.createElement("line", {
    key: 'll' + i,
    x1: p.x + nodeW / 2,
    y1: p.y,
    x2: subjectPos.x - nodeW / 2,
    y2: subjectPos.y,
    stroke: "var(--err)",
    strokeWidth: "1.2",
    strokeDasharray: "4,4",
    opacity: "0.55"
  })), lRPos.map((p, i) => /*#__PURE__*/React.createElement("line", {
    key: 'lr' + i,
    x1: p.x - nodeW / 2,
    y1: p.y,
    x2: consortPos ? consortPos.x + nodeW / 2 : subjectPos.x + nodeW / 2,
    y2: consortPos ? consortPos.y : subjectPos.y,
    stroke: "color-mix(in oklch, var(--graph) 65%, var(--fg-4))",
    strokeWidth: "1.2",
    strokeDasharray: "4,4",
    opacity: "0.55"
  })), parents.map((r, i) => /*#__PURE__*/React.createElement(TreeNode, {
    key: 'parent' + i,
    pos: parentPos[i],
    r: r,
    onClick: () => onOpenFigure?.(r.id),
    kind: "parent"
  })), siblings.map((r, i) => /*#__PURE__*/React.createElement(TreeNode, {
    key: 'sib' + i,
    pos: siblingPos[i],
    r: r,
    onClick: () => onOpenFigure?.(r.id),
    kind: "sibling"
  })), children.map((r, i) => /*#__PURE__*/React.createElement(TreeNode, {
    key: 'kid' + i,
    pos: childPos[i],
    r: r,
    onClick: () => onOpenFigure?.(r.id),
    kind: "child"
  })), consortPos && /*#__PURE__*/React.createElement(TreeNode, {
    pos: consortPos,
    r: consorts[0],
    onClick: () => onOpenFigure?.(consorts[0].id),
    kind: "consort"
  }), lateralL.map((r, i) => /*#__PURE__*/React.createElement(TreeNode, {
    key: 'lL' + i,
    pos: lLPos[i],
    r: r,
    onClick: () => onOpenFigure?.(r.id),
    kind: "distinct"
  })), lateralR.map((r, i) => /*#__PURE__*/React.createElement(TreeNode, {
    key: 'lR' + i,
    pos: lRPos[i],
    r: r,
    onClick: () => onOpenFigure?.(r.id),
    kind: "equivalent"
  })), /*#__PURE__*/React.createElement(SubjectNode, {
    pos: subjectPos,
    figure: figure
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 12,
      bottom: 10,
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      fontFamily: 'var(--ff-mono)',
      fontSize: 9,
      letterSpacing: '0.05em',
      color: 'var(--fg-4)'
    }
  }, /*#__PURE__*/React.createElement(LegendSwatch, {
    color: "var(--myth)",
    label: "lineage",
    solid: true
  }), /*#__PURE__*/React.createElement(LegendSwatch, {
    color: "var(--err)",
    label: "distinct",
    dashed: true
  }), /*#__PURE__*/React.createElement(LegendSwatch, {
    color: "var(--graph)",
    label: "equivalent",
    dashed: true
  }))));
}
function TierLabel({
  x,
  y,
  label
}) {
  return /*#__PURE__*/React.createElement("text", {
    x: x,
    y: y - 22,
    fontFamily: "var(--ff-mono)",
    fontSize: "9",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fill: "var(--fg-5)",
    style: {
      textTransform: 'uppercase'
    }
  }, label);
}
function TreeNode({
  pos,
  r,
  onClick,
  kind
}) {
  const colorMap = {
    parent: 'var(--myth)',
    sibling: 'var(--myth)',
    child: 'var(--myth)',
    consort: 'var(--myth)',
    distinct: 'var(--err)',
    equivalent: 'var(--graph)'
  };
  const c = colorMap[kind] || 'var(--myth)';
  const w = 132,
    h = 50;
  return /*#__PURE__*/React.createElement("g", {
    style: {
      cursor: 'pointer'
    },
    onClick: onClick
  }, /*#__PURE__*/React.createElement("rect", {
    x: pos.x - w / 2,
    y: pos.y - h / 2,
    width: w,
    height: h,
    rx: "6",
    fill: `color-mix(in oklch, ${c} 10%, var(--bg-2))`,
    stroke: c,
    strokeWidth: "1.2"
  }), r.plural && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: pos.x - w / 2 + 3,
    y: pos.y - h / 2 + 3,
    width: w,
    height: h,
    rx: "6",
    fill: "none",
    stroke: c,
    strokeWidth: "0.8",
    opacity: "0.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: pos.x - w / 2 + 6,
    y: pos.y - h / 2 + 6,
    width: w,
    height: h,
    rx: "6",
    fill: "none",
    stroke: c,
    strokeWidth: "0.6",
    opacity: "0.3"
  })), /*#__PURE__*/React.createElement("text", {
    x: pos.x,
    y: pos.y - 4,
    textAnchor: "middle",
    fontFamily: "var(--ff-sans)",
    fontSize: "13",
    fontWeight: "600",
    fill: "var(--fg)"
  }, r.name, r.plural ? ` (×${r.plural})` : ''), /*#__PURE__*/React.createElement("text", {
    x: pos.x,
    y: pos.y + 12,
    textAnchor: "middle",
    fontFamily: "var(--ff-greek)",
    fontSize: "11",
    fill: "var(--fg-3)"
  }, r.greek || ''), r.tradition && /*#__PURE__*/React.createElement("text", {
    x: pos.x,
    y: pos.y + h / 2 - 4,
    textAnchor: "middle",
    fontFamily: "var(--ff-mono)",
    fontSize: "8",
    fill: "var(--fg-4)",
    letterSpacing: "0.05em"
  }, r.tradition));
}
function SubjectNode({
  pos,
  figure
}) {
  const w = 162,
    h = 62;
  return /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("rect", {
    x: pos.x - w / 2,
    y: pos.y - h / 2,
    width: w,
    height: h,
    rx: "8",
    fill: `color-mix(in oklch, var(--myth) 18%, var(--bg-1))`,
    stroke: "var(--myth)",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: pos.x - w / 2 - 4,
    y: pos.y - h / 2 - 4,
    width: w + 8,
    height: h + 8,
    rx: "10",
    fill: "none",
    stroke: "var(--myth)",
    strokeWidth: "1",
    opacity: "0.25"
  }), /*#__PURE__*/React.createElement("text", {
    x: pos.x,
    y: pos.y - 6,
    textAnchor: "middle",
    fontFamily: "var(--ff-display)",
    fontSize: "17",
    fontWeight: "500",
    fill: "var(--fg)"
  }, figure.english_name), /*#__PURE__*/React.createElement("text", {
    x: pos.x,
    y: pos.y + 14,
    textAnchor: "middle",
    fontFamily: "var(--ff-greek)",
    fontSize: "13",
    fill: "var(--myth)"
  }, figure.greek_name));
}
function LegendSwatch({
  color,
  label,
  dashed,
  solid
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "6",
    style: {
      display: 'inline-block'
    }
  }, /*#__PURE__*/React.createElement("line", {
    x1: "0",
    y1: "3",
    x2: "22",
    y2: "3",
    stroke: color,
    strokeWidth: "1.5",
    strokeDasharray: dashed ? '3,3' : 'none'
  })), /*#__PURE__*/React.createElement("span", null, label));
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY ETYMOLOGY STATE — words with no PIE root (recent loanwords, etc.).
// Per revision brief Q3 — show empty-state placeholders with explicit
// "Ask AI to research" actions for each missing pillar.
// ─────────────────────────────────────────────────────────────────────────────
function EmptyEtymologyState({
  card,
  onAskAI
}) {
  if (!card) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "wc-section",
    style: {
      background: 'repeating-linear-gradient(45deg, transparent, transparent 14px, color-mix(in oklch, var(--fg) 2.5%, transparent) 14px, color-mix(in oklch, var(--fg) 2.5%, transparent) 15px), var(--bg-1)',
      borderTop: '1px solid var(--line-soft)',
      borderBottom: '1px solid var(--line-soft)'
    }
  }, /*#__PURE__*/React.createElement("h4", null, /*#__PURE__*/React.createElement("span", {
    className: "dot warn"
  }), " No etymology on record", /*#__PURE__*/React.createElement("span", {
    className: "pill warn",
    style: {
      marginLeft: 6,
      fontSize: 9.5
    }
  }, "graceful fallback")), card.non_pie_reason && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      background: 'var(--bg-2)',
      border: '1px solid var(--line-soft)',
      borderRadius: 'var(--r-sm)',
      fontSize: 12.5,
      color: 'var(--fg-2)',
      lineHeight: 1.55,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 9.5,
      color: 'var(--fg-4)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginRight: 6
    }
  }, "non_pie_reason \u25B8"), card.non_pie_reason), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 6
    }
  }, [{
    lab: 'PIE root',
    sub: 'attempt reconstruction via Beekes RAG'
  }, {
    lab: 'Cognates',
    sub: 'cross-language cognate hunt'
  }, {
    lab: 'Fun facts',
    sub: 'history of the abbreviation / loan'
  }, {
    lab: 'Scholarly notes',
    sub: 'cite any attestations even if non-IE'
  }].map(p => /*#__PURE__*/React.createElement("div", {
    key: p.lab,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 10,
      alignItems: 'center',
      padding: '9px 12px',
      background: 'var(--bg-2)',
      border: '1px dashed var(--line)',
      borderRadius: 'var(--r-sm)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, p.lab), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-4)',
      marginTop: 2
    }
  }, p.sub)), /*#__PURE__*/React.createElement("button", {
    className: "btn xs primary",
    onClick: () => onAskAI?.(p.lab)
  }, /*#__PURE__*/React.createElement(Ic.spark, null), " Ask AI to research")))));
}
window.Etymology = {
  MultiRootPie,
  ScholarlyNotesStack,
  OriginStoryPanel,
  FamilyTreeGraph,
  EmptyEtymologyState
};

// ─── tweaks-panel.jsx ───

// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  noDeckControls = false,
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  // Auto-inject a rail toggle when a <deck-stage> is on the page. The
  // toggle drives the deck's per-viewer _railVisible via window message;
  // state is mirrored from the same localStorage key the deck reads so
  // the control reflects reality across reloads. The mechanism is the
  // message — authors who want custom placement can post it directly
  // and pass noDeckControls to suppress this one.
  const hasDeckStage = React.useMemo(() => typeof document !== 'undefined' && !!document.querySelector('deck-stage'), []);
  // deck-stage enables its rail in connectedCallback, but this panel can
  // mount before that element has upgraded. The initial read catches the
  // common case; the listener covers mounting first. (Older deck-stage.js
  // copies still wait for the host's __omelette_rail_enabled postMessage —
  // same listener handles those.)
  const [railEnabled, setRailEnabled] = React.useState(() => hasDeckStage && !!document.querySelector('deck-stage')?._railEnabled);
  React.useEffect(() => {
    if (!hasDeckStage || railEnabled) return undefined;
    const onMsg = e => {
      if (e.data && e.data.type === '__omelette_rail_enabled') setRailEnabled(true);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [hasDeckStage, railEnabled]);
  const [railVisible, setRailVisible] = React.useState(() => {
    try {
      return localStorage.getItem('deck-stage.railVisible') !== '0';
    } catch (e) {
      return true;
    }
  });
  const toggleRail = on => {
    setRailVisible(on);
    window.postMessage({
      type: '__deck_rail_visible',
      on
    }, '*');
  };
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-noncommentable": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children, hasDeckStage && railEnabled && !noDeckControls && /*#__PURE__*/React.createElement(TweakSection, {
    label: "Deck"
  }, /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Thumbnail rail",
    value: railVisible,
    onChange: toggleRail
  })))));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});

// ─── panels.jsx ───
// Right-rail panel components. All inherit the AF visual language but ARE NEW for BWTL.
//
// Each panel exposes a small contract:
//   <PanelShell variant="pie|graph|myth|forge|rag" title meta glow collapsed onToggle>...</PanelShell>
//
// The glow prop is the integration cue: when a user clicks a cross-app link
// in the word card, the corresponding panel briefly glows in its accent color.

function PanelShell({
  variant = 'rag',
  title,
  meta,
  glow,
  collapsed,
  onToggle,
  onClose,
  onPin,
  pinned,
  children,
  headRight,
  onExpand,
  expanded
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, expanded && /*#__PURE__*/React.createElement("div", {
    className: "panel-fullview-backdrop",
    onClick: onExpand
  }), /*#__PURE__*/React.createElement("div", {
    className: `panel ${variant} ${glow ? 'glow' : ''} ${collapsed ? 'collapsed' : ''} ${expanded ? 'fullview' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-head",
    onClick: onToggle
  }, /*#__PURE__*/React.createElement("div", {
    className: "title"
  }, /*#__PURE__*/React.createElement(Ic.caret_d, {
    style: {
      transform: collapsed ? 'rotate(-90deg)' : 'none',
      transition: 'transform .15s'
    }
  }), title), /*#__PURE__*/React.createElement("div", {
    className: "ctrls",
    onClick: e => e.stopPropagation()
  }, meta && /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, meta), headRight, onExpand && /*#__PURE__*/React.createElement("button", {
    title: expanded ? 'Exit full view' : 'Full view',
    onClick: onExpand
  }, /*#__PURE__*/React.createElement(Ic.expand, null)), onPin && /*#__PURE__*/React.createElement("button", {
    title: pinned ? 'Unpin' : 'Pin to rail',
    onClick: onPin
  }, pinned ? /*#__PURE__*/React.createElement(Ic.pin_filled, null) : /*#__PURE__*/React.createElement(Ic.pin, null)), onClose && /*#__PURE__*/React.createElement("button", {
    title: "Close",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Ic.x, null)))), /*#__PURE__*/React.createElement("div", {
    className: "panel-body"
  }, children)));
}

// ─────────────────────────────────────────────────────────────────────────────
// PIE EXPLORER PANEL — the architectural integration win.
// MERGES SF flashcards + EFG efg_pie_explorer_data into one stacked view.
// ─────────────────────────────────────────────────────────────────────────────

function PiePanel({
  pieRootKey,
  currentWord,
  glow,
  onNavigate,
  onOpenRoot,
  onOpenPieChat,
  collapsed,
  onToggle,
  onClose,
  onPin,
  pinned
}) {
  const [root, setRoot] = React.useState(window.BWTL.PIE_ROOTS[pieRootKey] || null);
  const [loadingRoot, setLoadingRoot] = React.useState(!root);
  const [expanded, setExpanded] = React.useState(false);
  React.useEffect(() => {
    // BUG-045: clear stale root data before applying new key's data so old card's
    // root never flashes while new root is loading or being set from cache.
    setRoot(null);
    if (!pieRootKey) {
      setLoadingRoot(false);
      return;
    }
    if (window.BWTL.PIE_ROOTS[pieRootKey]) {
      setRoot(window.BWTL.PIE_ROOTS[pieRootKey]);
      setLoadingRoot(false);
      return;
    }
    setLoadingRoot(true);
    window.BWTL.fetchPieRoot(pieRootKey).then(r => {
      setRoot(r);
      setLoadingRoot(false);
    }).catch(err => {
      console.error('[PiePanel] fetchPieRoot error:', err);
      setLoadingRoot(false);
    });
  }, [pieRootKey]);
  const [showSrc, setShowSrc] = React.useState(true);
  const [expand, setExpand] = React.useState({
    verbal: true,
    nominal: true,
    cognates: true
  });
  const toggle = k => setExpand(s => ({
    ...s,
    [k]: !s[k]
  }));
  if (loadingRoot) return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "pie",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.spark, null), " PIE Explorer"),
    meta: "loading\u2026"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--fg-3)',
      fontSize: 13,
      padding: 12
    }
  }, "Loading PIE root data\u2026"));
  if (!root) return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "pie",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.spark, null), " PIE Explorer"),
    meta: "no root"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pie-empty",
    style: {
      color: 'var(--fg-3)',
      fontSize: 13,
      padding: 12
    }
  }, "No PIE root recorded for this word."));

  // Word strip = SF flashcards where flashcards.pie_root === this root.
  const allCards = Object.values(window.BWTL.FLASHCARDS).filter(c => c.pie_root === pieRootKey);
  const branches = root.branches || [];

  // Merge: prefer SF flashcard rendering when both exist.
  const seen = new Set();
  const mergedWords = [];
  allCards.forEach(c => {
    mergedWords.push({
      kind: 'sf',
      label: c.word_or_phrase || c.word,
      gloss: (c.definition || '').split('.')[0],
      lang: c.language,
      ref: c.id
    });
    seen.add(c.word_or_phrase || c.word);
  });
  branches.forEach(b => {
    if (!seen.has(b.word)) mergedWords.push({
      kind: 'efg',
      label: b.word,
      gloss: '',
      lang: b.language || '',
      ref: b.id
    });
  });
  return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "pie",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    onPin: onPin,
    pinned: pinned,
    onExpand: () => setExpanded(e => !e),
    expanded: expanded,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.spark, null), " PIE Explorer"),
    meta: /*#__PURE__*/React.createElement(React.Fragment, null, "SF \xB7 EFG merged"),
    headRight: /*#__PURE__*/React.createElement("button", {
      title: showSrc ? 'Hide source pills' : 'Show source pills',
      onClick: () => setShowSrc(s => !s)
    }, /*#__PURE__*/React.createElement(Ic.filter, null))
  }, /*#__PURE__*/React.createElement("div", {
    className: "pie-root-hero"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "root"
  }, root.root), /*#__PURE__*/React.createElement("div", {
    className: "gloss"
  }, "\"", root.gloss, "\"")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "ipa"
  }, root.ipa), /*#__PURE__*/React.createElement("div", {
    className: "pie-audio",
    title: "Play PIE root audio \xB7 from EFG nodes (95% coverage)",
    style: {
      cursor: root.audio_url ? 'pointer' : 'default'
    },
    onClick: () => root.audio_url && new Audio(root.audio_url).play()
  }, /*#__PURE__*/React.createElement(Ic.play, null))), root.atomic && /*#__PURE__*/React.createElement("div", {
    className: "atomic-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lab"
  }, "Atomic \u25B8"), root.atomic.map((a, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: a
  }, /*#__PURE__*/React.createElement("span", {
    className: "atom",
    onClick: () => onOpenRoot && onOpenRoot(a)
  }, a), i < root.atomic.length - 1 && /*#__PURE__*/React.createElement("span", {
    className: "plus"
  }, "+")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, "Word branches ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--fg-5)'
    }
  }, "\xB7 ", root.word_count, " cards")), showSrc && /*#__PURE__*/React.createElement("span", {
    className: "pill",
    style: {
      fontSize: 9.5
    }
  }, "SF.flashcards.pie_root")), /*#__PURE__*/React.createElement("div", {
    className: "pie-words-strip"
  }, mergedWords.map(w => /*#__PURE__*/React.createElement("div", {
    key: w.ref,
    className: `pie-word ${w.label === currentWord ? 'current' : ''}`,
    onClick: () => w.kind === 'sf' && onNavigate && onNavigate(w.ref)
  }, /*#__PURE__*/React.createElement("div", {
    className: "w greek"
  }, w.label), w.gloss && /*#__PURE__*/React.createElement("div", {
    className: "g"
  }, w.gloss), /*#__PURE__*/React.createElement("div", {
    className: "lng"
  }, w.lang, w.kind === 'efg' && ' · efg')))), root.language_paradigm && /*#__PURE__*/React.createElement(LanguageParadigm, {
    langs: root.language_paradigm,
    showSrc: showSrc,
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement(ProseBlock, {
    title: "Verbal paradigm",
    body: root.verbal_paradigm,
    source: "EFG \xB7 efg_pie_explorer_data.verbal_paradigm",
    showSrc: showSrc,
    open: expand.verbal,
    onToggle: () => toggle('verbal')
  }), /*#__PURE__*/React.createElement(ProseBlock, {
    title: "Nominal derivatives",
    body: root.nominal_derivatives,
    source: "EFG \xB7 efg_pie_explorer_data.nominal_derivatives",
    showSrc: showSrc,
    open: expand.nominal,
    onToggle: () => toggle('nominal')
  }), /*#__PURE__*/React.createElement(ProseBlock, {
    title: "Modern cognates",
    body: root.modern_cognates,
    source: "EFG \xB7 efg_pie_explorer_data.modern_cognates",
    showSrc: showSrc,
    open: expand.cognates,
    onToggle: () => toggle('cognates')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    onClick: () => onOpenPieChat && onOpenPieChat(pieRootKey)
  }, /*#__PURE__*/React.createElement(Ic.chat, null), " Chat about this root"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    style: {
      marginLeft: 'auto'
    },
    onClick: () => setExpanded(e => !e)
  }, /*#__PURE__*/React.createElement(Ic.expand, null), " ", expanded ? 'Exit full' : 'Open full')));
}
function ProseBlock({
  title,
  body,
  source,
  showSrc,
  open,
  onToggle
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `efg-prose ${open ? '' : 'col'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "head",
    onClick: onToggle
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Ic.caret_d, {
    style: {
      transform: open ? 'none' : 'rotate(-90deg)',
      transition: 'transform .15s'
    }
  }), title), showSrc && /*#__PURE__*/React.createElement("span", {
    className: "src"
  }, source)), /*#__PURE__*/React.createElement("div", {
    className: "body"
  }, (() => {
    if (!body) return null;
    if (typeof body !== 'string') return body;
    try {
      const parsed = JSON.parse(body);
      const langs = Object.keys(parsed);
      return /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'grid',
          gridTemplateColumns: `repeat(${langs.length}, minmax(0, 1fr))`,
          gap: 0,
          border: '1px solid var(--line-soft)',
          borderRadius: 4,
          overflow: 'hidden',
          fontSize: 11
        }
      }, langs.map((lang, ci) => {
        const val = parsed[lang];
        return /*#__PURE__*/React.createElement("div", {
          key: lang,
          style: {
            borderRight: ci < langs.length - 1 ? '1px solid var(--line-soft)' : 'none'
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            padding: '4px 8px',
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'var(--fg-3)',
            background: 'var(--bg-2)',
            borderBottom: '1px solid var(--line-soft)'
          }
        }, lang), Array.isArray(val) ? val.map((item, idx) => /*#__PURE__*/React.createElement("div", {
          key: idx,
          style: {
            padding: '3px 8px',
            display: 'grid',
            gridTemplateColumns: '2fr 3fr',
            gap: 4,
            borderBottom: '1px solid var(--line-soft)'
          }
        }, /*#__PURE__*/React.createElement("span", {
          className: "greek",
          style: {
            fontWeight: 600
          }
        }, Array.isArray(item) ? item[0] : item.form || ''), /*#__PURE__*/React.createElement("span", {
          style: {
            color: 'var(--fg-3)',
            fontSize: 10
          }
        }, Array.isArray(item) ? item[1] : item.gloss || item.gram || ''))) : typeof val === 'object' && val !== null ? Object.entries(val).map(([k, v]) => typeof v === 'object' && v !== null && !Array.isArray(v) ? /*#__PURE__*/React.createElement("div", {
          key: k
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            padding: '2px 8px',
            fontSize: 9,
            fontWeight: 700,
            color: 'var(--fg-4)',
            background: 'var(--bg-1)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }
        }, k), Object.entries(v).map(([person, form]) => /*#__PURE__*/React.createElement("div", {
          key: person,
          style: {
            padding: '2px 8px',
            display: 'grid',
            gridTemplateColumns: '2fr 3fr',
            gap: 4
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            color: 'var(--fg-4)',
            fontSize: 10
          }
        }, person), /*#__PURE__*/React.createElement("span", {
          className: "greek"
        }, form)))) : /*#__PURE__*/React.createElement("div", {
          key: k,
          style: {
            padding: '3px 8px',
            display: 'grid',
            gridTemplateColumns: '2fr 3fr',
            gap: 4
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            color: 'var(--fg-4)',
            fontSize: 10
          }
        }, k), /*#__PURE__*/React.createElement("span", {
          className: "greek"
        }, Array.isArray(v) ? v.join(', ') : String(v ?? '')))) : /*#__PURE__*/React.createElement("div", {
          style: {
            padding: '3px 8px'
          }
        }, /*#__PURE__*/React.createElement("span", {
          className: "greek"
        }, String(val ?? ''))));
      }));
    } catch {
      return body;
    }
  })()));
}

// REV item 2 — Latin promoted to a first-class structured column alongside
// French / Greek / Sanskrit. Replaces the previous "Latin is buried in prose"
// situation. Card-level Etymology text (AI-generated) remains the narrative
// surface; this is the structural paradigm view.
function LanguageParadigm({
  langs,
  showSrc,
  onNavigate
}) {
  // Stable column order: Latin first (most paradigm-bearing in PIE studies),
  // then Greek, then Sanskrit, then French (the modern reflex column).
  const order = ['Latin', 'Greek', 'Sanskrit', 'French'].filter(l => langs[l]);
  return /*#__PURE__*/React.createElement("div", {
    className: "efg-prose",
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "head",
    style: {
      cursor: 'default'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Ic.grid, null), "Language paradigm"), showSrc && /*#__PURE__*/React.createElement("span", {
    className: "src"
  }, "EFG \xB7 efg_pie_explorer_data.language_paradigm")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${order.length}, minmax(0, 1fr))`,
      borderTop: '1px solid var(--line-soft)'
    }
  }, order.map((l, ci) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      borderRight: ci < order.length - 1 ? '1px solid var(--line-soft)' : 'none',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 10px',
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: l === 'Latin' ? 'var(--myth)' : l === 'Greek' ? 'var(--pie)' : l === 'Sanskrit' ? 'var(--acc-2)' : 'var(--graph)',
      background: l === 'Latin' ? 'color-mix(in oklch, var(--myth) 6%, var(--bg-1))' : l === 'Greek' ? 'color-mix(in oklch, var(--pie) 6%, var(--bg-1))' : l === 'Sanskrit' ? 'color-mix(in oklch, var(--acc) 6%, var(--bg-1))' : 'color-mix(in oklch, var(--graph) 6%, var(--bg-1))',
      borderBottom: '1px solid var(--line-soft)',
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, l), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      marginLeft: 'auto',
      color: 'var(--fg-5)',
      fontWeight: 500,
      letterSpacing: 0
    }
  }, langs[l].forms.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 0'
    }
  }, langs[l].forms.map((f, fi) => /*#__PURE__*/React.createElement("div", {
    key: fi,
    onClick: () => f.linked_card && onNavigate && onNavigate(f.linked_card),
    style: {
      padding: '5px 10px',
      fontSize: 12,
      lineHeight: 1.35,
      cursor: f.linked_card ? 'pointer' : 'default',
      opacity: f.exclude ? 0.55 : 1
    },
    onMouseEnter: e => f.linked_card && (e.currentTarget.style.background = 'var(--bg-3)'),
    onMouseLeave: e => f.linked_card && (e.currentTarget.style.background = 'transparent')
  }, /*#__PURE__*/React.createElement("div", {
    className: "greek",
    style: {
      color: f.exclude ? 'var(--fg-4)' : 'var(--fg)',
      fontWeight: 600,
      textDecoration: f.linked_card ? 'underline dotted color-mix(in oklch, var(--acc) 60%, transparent)' : 'none',
      textUnderlineOffset: 3
    }
  }, f.form), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: 'var(--fg-3)',
      marginTop: 1
    }
  }, f.gloss), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 9.5,
      color: 'var(--fg-5)',
      marginTop: 1,
      letterSpacing: '0.02em'
    }
  }, f.class)))))))));
}

// ─────────────────────────────────────────────────────────────────────────────
// EFG GRAPH PANEL — mini node-graph render of related nodes
// BUG-100: reads from flashcard_pie_roots (via FLASHCARDS cache) + EFG nodes/edges
// ─────────────────────────────────────────────────────────────────────────────

function EfgPanel({
  pieRootKey,
  currentWordId,
  glow,
  collapsed,
  onToggle,
  onClose,
  onPin,
  pinned,
  onOpenWord,
  onOpenRoot
}) {
  const [graphData, setGraphData] = React.useState(null);
  const [loadingGraph, setLoadingGraph] = React.useState(true);
  const [expanded, setExpanded] = React.useState(false);
  React.useEffect(() => {
    if (!currentWordId && !pieRootKey) {
      setLoadingGraph(false);
      return;
    }
    setLoadingGraph(true);
    window.BWTL.fetchEfgGraph(currentWordId || pieRootKey).then(d => {
      setGraphData(d);
      setLoadingGraph(false);
    }).catch(err => {
      console.error('[EfgPanel] fetchEfgGraph error:', err);
      setLoadingGraph(false);
    });
  }, [currentWordId, pieRootKey]);

  // BUG-100: merge SF flashcards sharing this PIE root from flashcard_pie_roots (via FLASHCARDS cache)
  const sfSiblings = pieRootKey ? Object.values(window.BWTL.FLASHCARDS || {}).filter(c => c.pie_root === pieRootKey || Array.isArray(c.pie_roots) && c.pie_roots.includes(pieRootKey)).map(c => ({
    id: c.id,
    label: c.word_or_phrase || c.word,
    node_type: 'word',
    language: c.language,
    sf: true
  })) : [];

  // Derive root and siblings from graph data, merged with SF cards
  const rootData = graphData && graphData.pie_root ? graphData : window.BWTL.PIE_ROOTS[pieRootKey];
  const efgSiblings = graphData ? (graphData.nodes || []).filter(n => (n.type || n.node_type) === 'word') : [];
  const efgLabels = new Set(efgSiblings.map(s => s.label));
  // Merge: EFG nodes first, then SF-only cards not already in EFG
  const siblings = [...efgSiblings, ...sfSiblings.filter(s => !efgLabels.has(s.label))];

  // simple radial layout
  const W = 360,
    H = 200,
    cx = W / 2,
    cy = H / 2;
  const ring = 70;
  if (loadingGraph) return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "graph",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.graph, null), " Etymology Graph"),
    meta: "loading\u2026"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--fg-3)',
      fontSize: 13,
      padding: 12
    }
  }, "Loading graph\u2026"));
  if (!graphData && siblings.length === 0) return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "graph",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    onExpand: () => setExpanded(e => !e),
    expanded: expanded,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.graph, null), " Etymology Graph"),
    meta: "no data"
  }, /*#__PURE__*/React.createElement("div", {
    className: "efg-empty",
    style: {
      color: 'var(--fg-3)',
      fontSize: 13,
      padding: 12
    }
  }, "No graph data available for this word. The EFG service may be offline."));
  return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "graph",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    onPin: onPin,
    pinned: pinned,
    onExpand: () => setExpanded(e => !e),
    expanded: expanded,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.graph, null), " Etymology Graph"),
    meta: /*#__PURE__*/React.createElement(React.Fragment, null, siblings.length, " nodes \xB7 ", Math.floor(siblings.length * 1.4), " edges")
  }, /*#__PURE__*/React.createElement("div", {
    className: "efg-mini"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "xMidYMid meet"
  }, siblings.map((n, i) => {
    const a = i / siblings.length * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * ring;
    const y = cy + Math.sin(a) * ring;
    return /*#__PURE__*/React.createElement("line", {
      key: 'e' + i,
      x1: cx,
      y1: cy,
      x2: x,
      y2: y,
      stroke: "color-mix(in oklch, var(--graph) 30%, transparent)",
      strokeWidth: "1"
    });
  }), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: "22",
    fill: "var(--pie-bg)",
    stroke: "var(--pie)",
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("text", {
    x: cx,
    y: cy,
    textAnchor: "middle",
    dominantBaseline: "central",
    fill: "var(--pie)",
    fontFamily: "var(--ff-display)",
    fontSize: "14",
    fontWeight: "500"
  }, (rootData?.root || pieRootKey || '').replace('*', '')), siblings.map((n, i) => {
    const a = i / siblings.length * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * ring;
    const y = cy + Math.sin(a) * ring;
    const isCur = n.id === currentWordId;
    return /*#__PURE__*/React.createElement("g", {
      key: n.id,
      style: {
        cursor: 'pointer'
      },
      onClick: () => onOpenWord && onOpenWord(n.id)
    }, /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: isCur ? 14 : 11,
      fill: n.sf ? 'color-mix(in oklch, var(--acc) 12%, var(--bg-3))' : isCur ? 'var(--acc-bg)' : 'var(--bg-3)',
      stroke: isCur ? 'var(--acc)' : n.sf ? 'var(--acc-ring)' : 'var(--graph)',
      strokeWidth: isCur ? 1.5 : 1
    }), /*#__PURE__*/React.createElement("text", {
      x: x,
      y: y + 22,
      textAnchor: "middle",
      fill: isCur ? 'var(--fg)' : 'var(--fg-2)',
      fontSize: "9.5",
      fontFamily: "var(--ff-sans)"
    }, n.label));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill graph"
  }, /*#__PURE__*/React.createElement(Ic.link, null), " ", siblings.length, " word nodes"), /*#__PURE__*/React.createElement("span", {
    className: "pill ghost"
  }, "SF-native EFG graph")));
}

// ─────────────────────────────────────────────────────────────────────────────
// ETYMYTHON PANEL — mythological figure + family tree
// ─────────────────────────────────────────────────────────────────────────────

function EtymythonPanel({
  figureId,
  glow,
  collapsed,
  onToggle,
  onClose,
  onPin,
  pinned
}) {
  const [f, setF] = React.useState(window.BWTL.FIGURES[figureId] || null);
  const [loadingFig, setLoadingFig] = React.useState(!f);
  const [expanded, setExpanded] = React.useState(false); // REQ-044

  React.useEffect(() => {
    if (!figureId) return;
    if (window.BWTL.FIGURES[figureId]) {
      setF(window.BWTL.FIGURES[figureId]);
      setLoadingFig(false);
      return;
    }
    setLoadingFig(true);
    window.BWTL.fetchFigure(figureId).then(data => {
      setF(data);
      setLoadingFig(false);
    }).catch(err => {
      console.error('[EtymythonPanel] fetchFigure error:', err);
      setLoadingFig(false);
    });
  }, [figureId]);
  if (loadingFig) return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "myth",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    onExpand: () => setExpanded(e => !e),
    expanded: expanded,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.shield, null), " Etymython"),
    meta: "loading\u2026"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--fg-3)',
      fontSize: 13,
      padding: 12
    }
  }, "Loading figure data\u2026"));
  if (!f) return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "myth",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    onExpand: () => setExpanded(e => !e),
    expanded: expanded,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.shield, null), " Etymython"),
    meta: "no figure"
  }, /*#__PURE__*/React.createElement("div", {
    className: "myth-empty",
    style: {
      color: 'var(--fg-3)',
      fontSize: 13,
      padding: 12
    }
  }, "No mythological figure linked to this card."));
  return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "myth",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    onPin: onPin,
    pinned: pinned,
    onExpand: () => setExpanded(e => !e),
    expanded: expanded,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.shield, null), " Etymython"),
    meta: /*#__PURE__*/React.createElement(React.Fragment, null, f.figure_type, " \xB7 1 of 183")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '80px 1fr',
      gap: 12,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '1/1',
      borderRadius: 'var(--r)',
      background: 'linear-gradient(135deg, var(--myth-bg), var(--bg-3))',
      border: '1px dashed var(--line)',
      display: 'flex',
      alignItems: 'flex-end',
      padding: 6,
      fontFamily: 'var(--ff-mono)',
      fontSize: 8.5,
      color: 'var(--fg-4)'
    }
  }, "seated Titan"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 26,
      color: 'var(--myth)',
      lineHeight: 1
    }
  }, f.english_name), /*#__PURE__*/React.createElement("div", {
    className: "greek",
    style: {
      fontSize: 16,
      color: 'var(--fg-2)',
      marginTop: 2
    }
  }, f.greek_name), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--fg-3)',
      marginTop: 4
    }
  }, f.ipa, /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    style: {
      marginLeft: 8,
      padding: '2px 6px'
    },
    title: "Play"
  }, /*#__PURE__*/React.createElement(Ic.speaker, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill pie",
    style: {
      fontSize: 9.5
    }
  }, f.pie_root), /*#__PURE__*/React.createElement("span", {
    className: "pill myth",
    style: {
      fontSize: 9.5,
      marginLeft: 4
    }
  }, f.domain)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 13,
      lineHeight: 1.55,
      color: 'var(--fg-2)'
    }
  }, f.origin_story), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 6
    }
  }, "Relations"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 6
    }
  }, f.relations.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id,
    style: {
      display: 'grid',
      gridTemplateColumns: '100px 1fr auto',
      gap: 8,
      padding: '5px 8px',
      borderRadius: 6,
      background: 'var(--bg-2)',
      border: '1px solid var(--line-soft)',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--fg-4)',
      fontSize: 10,
      textTransform: 'uppercase'
    }
  }, r.rel.replace('_', ' ')), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg)'
    }
  }, r.name), /*#__PURE__*/React.createElement(Ic.chevron_r, {
    style: {
      color: 'var(--fg-4)'
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: () => {
      if (!f?.slug && !f?.id) return;
      const fig = f.slug || f.id;
      window.BWTL.generateFigureImage(fig).then(data => {
        if (data?.image_url) window.open(data.image_url, '_blank');
      }).catch(err => console.error('[GenerateImagery]', err));
    }
  }, /*#__PURE__*/React.createElement(Ic.spark, null), " Generate imagery"), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: () => {
      if (!f?.slug && !f?.id) return;
      const fig = f.slug || f.id;
      window.BWTL.fetchFigureStory(fig).then(data => {
        if (data?.id || data?.story_id) {
          // Story created — could navigate to AF story URL or show a toast
          window.dispatchEvent(new CustomEvent('bwtl:toast', {
            detail: `Story created: ${data.title || fig}`
          }));
        }
      }).catch(err => console.error('[FromFigureStory]', err));
    }
  }, /*#__PURE__*/React.createElement(Ic.film, null), " From-figure storyboard")));
}

// ─────────────────────────────────────────────────────────────────────────────
// DICTIONARY CONTENT PANEL (formerly Portfolio RAG) — dictionary lookup
// BUG-108/SF-REQ-044: renamed from 'Portfolio RAG' to 'Dictionary content'
// ─────────────────────────────────────────────────────────────────────────────

function RagPanel({
  pieRootKey,
  glow,
  collapsed,
  onToggle,
  onClose,
  onPin,
  pinned
}) {
  const [e, setE] = React.useState(window.BWTL.RAG_ENTRIES[pieRootKey] || null);
  const [loadingRag, setLoadingRag] = React.useState(!e);
  const [expanded, setExpanded] = React.useState(false);
  React.useEffect(() => {
    if (!pieRootKey) return;
    if (window.BWTL.RAG_ENTRIES[pieRootKey]) {
      setE(window.BWTL.RAG_ENTRIES[pieRootKey]);
      setLoadingRag(false);
      return;
    }
    setLoadingRag(true);
    window.BWTL.searchEtymology(pieRootKey).then(results => {
      const items = Array.isArray(results) ? results : results.results || results.items || [];
      if (items.length > 0) {
        const entry = {
          headword: pieRootKey,
          excerpt: items[0].full_text || items[0].snippet || items[0].text || items[0].content || '',
          source: items[0].source || 'RAG · etymology',
          confidence: 'medium'
        };
        window.BWTL.RAG_ENTRIES[pieRootKey] = entry;
        setE(entry);
      } else {
        setE(null);
      }
      setLoadingRag(false);
    }).catch(err => {
      console.error('[RagPanel] searchEtymology error:', err);
      setLoadingRag(false);
    });
  }, [pieRootKey]);
  if (loadingRag) return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "rag",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    onExpand: () => setExpanded(ex => !ex),
    expanded: expanded,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.book, null), " Dictionary content"),
    meta: "loading\u2026"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--fg-3)',
      fontSize: 13,
      padding: 12
    }
  }, "Loading dictionary data\u2026"));
  if (!e) return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "rag",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    onExpand: () => setExpanded(ex => !ex),
    expanded: expanded,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.book, null), " Dictionary content"),
    meta: "no entry"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rag-empty",
    style: {
      color: 'var(--fg-3)',
      fontSize: 13,
      padding: 12
    }
  }, "No Beekes entry found for this root. ", /*#__PURE__*/React.createElement("a", {
    className: "xlink",
    style: {
      '--xc': 'var(--acc)'
    }
  }, "Request ingestion"), "."));
  return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "rag",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    onPin: onPin,
    pinned: pinned,
    onExpand: () => setExpanded(ex => !ex),
    expanded: expanded,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.book, null), " Dictionary content"),
    meta: /*#__PURE__*/React.createElement(React.Fragment, null, e.source)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ff-display)',
      fontSize: 18,
      color: 'var(--acc-2)',
      marginBottom: 6
    }
  }, e.headword), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      lineHeight: 1.6,
      color: 'var(--fg-2)'
    }
  }, e.excerpt), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 9.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot ok"
  }), " ", e.confidence, " confidence"), /*#__PURE__*/React.createElement("span", {
    className: "pill ghost",
    style: {
      fontSize: 9.5
    }
  }, "collection: etymology")));
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTFORGE PANEL — etymology-driven generation only
// ─────────────────────────────────────────────────────────────────────────────

function ArtForgePanel({
  card,
  figureId,
  glow,
  collapsed,
  onToggle,
  onClose,
  onPin,
  pinned
}) {
  const [busy, setBusy] = React.useState(false);
  const [stage, setStage] = React.useState('idle'); // idle | queued | rendering | done
  const [jobId, setJobId] = React.useState(null);
  const [jobError, setJobError] = React.useState(null);
  const [expanded, setExpanded] = React.useState(false); // REQ-044

  const handleGenerate = () => {
    if (!card?.id) return;
    setBusy(true);
    setStage('queued');
    setJobError(null);
    window.BWTL.generateVideo(card.id).then(data => {
      setJobId(data.job_id || data.id || null);
      setStage('rendering');
    }).catch(err => {
      console.error('[ArtForgePanel] generateVideo error:', err);
      setJobError(err.message);
      setBusy(false);
      setStage('idle');
    });
  };
  return /*#__PURE__*/React.createElement(PanelShell, {
    variant: "forge",
    glow: glow,
    collapsed: collapsed,
    onToggle: onToggle,
    onClose: onClose,
    onPin: onPin,
    pinned: pinned,
    onExpand: () => setExpanded(e => !e),
    expanded: expanded,
    title: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.film, null), " ArtForge \u2014 etymology only"),
    meta: /*#__PURE__*/React.createElement(React.Fragment, null, "panel mode")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--fg-3)',
      marginBottom: 10,
      lineHeight: 1.5
    }
  }, "Generation surface for ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--fg)'
    }
  }, card?.word || 'this word'), ". Full ArtForge (galleries, library, non-etymology storyboards) stays at ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--forge)'
    }
  }, "artforge.rentyourcio.com"), "."), /*#__PURE__*/React.createElement("div", {
    className: "sb-row",
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-tile"
  }, "scene 01 \xB7 keepsake on sill"), /*#__PURE__*/React.createElement("div", {
    className: "sb-tile"
  }, "scene 02 \xB7 letter opens"), /*#__PURE__*/React.createElement("div", {
    className: "sb-tile"
  }, "scene 03 \xB7 river of memory")), jobError && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--err)',
      fontSize: 12,
      padding: '6px 0'
    }
  }, jobError), stage !== 'idle' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 10px',
      borderRadius: 6,
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      fontSize: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: `dot ${stage === 'done' ? 'ok' : 'warn'}`
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-2)'
    }
  }, stage === 'queued' && 'Queued on ArtForge…', stage === 'rendering' && 'Rendering · model: veo-3 · est. 90s', stage === 'done' && 'Done · ready'), jobId && /*#__PURE__*/React.createElement("span", {
    className: "mono af-job-id",
    style: {
      marginLeft: 'auto',
      color: 'var(--fg-4)',
      fontSize: 10
    }
  }, jobId)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    style: {
      '--b-bg': 'var(--forge)',
      '--b-fg': '#0b0918',
      '--b-bd': 'var(--forge)'
    },
    onClick: handleGenerate,
    disabled: busy
  }, /*#__PURE__*/React.createElement(Ic.spark, null), " Generate video for \"", card?.word || 'word', "\""), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost"
  }, /*#__PURE__*/React.createElement(Ic.pencil, null), " Scene editor")));
}
window.BwtlPanels = {
  PanelShell,
  PiePanel,
  EfgPanel,
  EtymythonPanel,
  RagPanel,
  ArtForgePanel
};

// ─── chat.jsx ───
// AI Chat sidecar — the most novel surface, revised.
//
// REV item 1 — anchor is FLASHCARD_ID primary. The card's id is shown in the
// header chip. There is no pie_root fallback — cards without pie_root (30%,
// 879 cards) work identically.
//
// REV item 3 — every AI turn carries a "context snapshot" debug expander
// showing exactly what fields, EFG node, figure, and steering directive the
// model received. The user can also edit the THREAD-level context payload
// (which fields to bundle, which EFG/figure to attach, steering string) to
// keep long rabbit-holes on-topic.
//
// REV item 4 — instead of a "promote to review queue" send, each AI message
// can be Accepted directly with a target field dropdown (16 healable fields).
// Accept writes the audit row immediately. No second-party approval gate.

function ChatDock({
  anchor,
  // { mode: 'flashcard_id', value: 'fc_souvenir', label: 'souvenir' }
  card,
  expanded,
  onToggleExpand,
  threads,
  activeThreadId,
  onActivateThread,
  onNewThread,
  onPromote,
  role
}) {
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState(null); // BUG-061: visible error state
  const [contextOpen, setContextOpen] = React.useState(false);
  const [snapOpen, setSnapOpen] = React.useState({}); // per-message-idx
  const messagesRef = React.useRef(null);
  React.useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [activeThreadId, expanded]);
  const active = threads.find(t => t.id === activeThreadId) || threads[0];
  const [messages, setMessages] = React.useState([]); // live message list for active thread
  const [loadingMsgs, setLoadingMsgs] = React.useState(false);

  // Load messages whenever the active thread changes
  React.useEffect(() => {
    const tid = activeThreadId && activeThreadId !== 'new' ? activeThreadId : threads[0]?.id;
    if (!tid) {
      setMessages([]);
      return;
    }
    setLoadingMsgs(true);
    window.BWTL.getMessages(tid).then(data => setMessages(Array.isArray(data) ? data : data.messages || data.items || [])).catch(() => setMessages([])).finally(() => setLoadingMsgs(false));
  }, [activeThreadId, threads.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    const text = draft.trim();
    setDraft('');
    setSending(true);
    setSendError(null); // BUG-061: clear previous error on new attempt
    // Optimistically add user message (BUG-056 fix: use canonical 'text' field)
    setMessages(prev => [...prev, {
      role: 'user',
      text: text,
      created_at: new Date().toISOString()
    }]);
    try {
      let threadId = activeThreadId;
      if (!threadId || threadId === 'new') {
        const t = await window.BWTL.createThread({
          anchor_mode: 'flashcard_id',
          anchor_value: anchor.value,
          owner_id: 'pl'
        });
        threadId = t.id;
        onActivateThread(threadId);
      }
      // REQ-036: call /generate which persists user msg + returns AI reply in one call
      const ctxSnap = anchor.value ? JSON.stringify({
        word_or_phrase: anchor.value
      }) : null;
      const aiMsg = await window.BWTL._apiFetch(`/api/chat/threads/${threadId}/generate`, {
        method: 'POST',
        body: JSON.stringify({
          user_text: text,
          context_snapshot: ctxSnap
        })
      });
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error('[ChatDock] send error:', e);
      // BUG-061: surface error to user instead of silent failure
      setSendError(e?.message || 'Failed to send — please try again.');
    } finally {
      setSending(false);
    }
  };

  // group threads by month for the rail
  const grouped = React.useMemo(() => {
    const map = {};
    threads.forEach(t => {
      const month = (t.when || t.created_at || '').slice(0, 7);
      (map[month] = map[month] || []).push(t);
    });
    return map;
  }, [threads]);
  const totalThreads = threads.length;
  const ctx = active?.context;
  return /*#__PURE__*/React.createElement("div", {
    className: `chat-dock ${expanded ? 'expanded' : 'collapsed'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "chat-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chat-head",
    onClick: e => {
      if (e.target.closest('button,.chat-anchor')) return;
      onToggleExpand();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "chat-anchor",
    style: {
      background: 'var(--acc-bg)',
      borderColor: 'var(--acc-ring)',
      color: 'var(--acc-2)'
    },
    title: "This thread is anchored to a specific flashcard. The Chat tab in top-nav indexes threads across all cards."
  }, /*#__PURE__*/React.createElement("span", {
    className: "mode-tag"
  }, "card"), /*#__PURE__*/React.createElement("span", {
    className: "greek"
  }, anchor.label || anchor.value), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 9.5,
      opacity: 0.6
    }
  }, anchor.value)), /*#__PURE__*/React.createElement("div", {
    className: "thread-info"
  }, totalThreads > 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "thread-pill"
  }, /*#__PURE__*/React.createElement(Ic.chat, null), " ", totalThreads, " thread", totalThreads !== 1 ? 's' : '', /*#__PURE__*/React.createElement("span", {
    className: "count"
  }, "\xB7 last: ", threads[0]?.when || threads[0]?.created_at)), !expanded && active && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-2)'
    }
  }, "\u201C", active.title, "\u201D")) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-3)'
    }
  }, "No prior threads on this card.")), /*#__PURE__*/React.createElement("div", {
    className: "chat-head-actions"
  }, expanded && active && /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: e => {
      e.stopPropagation();
      setContextOpen(o => !o);
    },
    title: "View / edit the context payload the AI receives for this thread",
    style: contextOpen ? {
      background: 'var(--bg-3)',
      color: 'var(--fg)'
    } : {}
  }, /*#__PURE__*/React.createElement(Ic.spark, null), " Context"), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: e => {
      e.stopPropagation();
      onNewThread();
    }
  }, /*#__PURE__*/React.createElement(Ic.plus, null), " New thread"), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: e => {
      e.stopPropagation();
      onToggleExpand();
    }
  }, expanded ? /*#__PURE__*/React.createElement(Ic.collapse, null) : /*#__PURE__*/React.createElement(Ic.expand, null)))), expanded && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "chat-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chat-threads"
  }, Object.entries(grouped).map(([month, items]) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: month
  }, /*#__PURE__*/React.createElement("div", {
    className: "chat-thread-header"
  }, month), items.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    className: `chat-thread-item ${t.id === active?.id ? 'active' : ''}`,
    onClick: () => onActivateThread(t.id)
  }, /*#__PURE__*/React.createElement("div", {
    className: "lead",
    style: {
      fontWeight: 600
    }
  }, t.title), /*#__PURE__*/React.createElement("div", {
    className: "when"
  }, t.when || t.created_at, " \xB7 ", t.message_count || (t.messages?.length ?? 0), " msg"))))), threads.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      color: 'var(--fg-4)',
      fontSize: 12,
      lineHeight: 1.5
    }
  }, "No threads yet on ", /*#__PURE__*/React.createElement("span", {
    className: "pill",
    style: {
      fontSize: 9.5
    }
  }, anchor.label || anchor.value), ". Start one \u2014 anything you discuss will be here next time you open this card.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, contextOpen && active && /*#__PURE__*/React.createElement(ContextPanel, {
    ctx: ctx,
    card: card,
    onClose: () => setContextOpen(false),
    activeThreadId: activeThreadId,
    anchor: anchor
  }), /*#__PURE__*/React.createElement("div", {
    className: "chat-messages",
    ref: messagesRef
  }, loadingMsgs && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      color: 'var(--fg-4)',
      fontSize: 11
    }
  }, "Loading messages\u2026"), messages.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `msg ${m.role}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "avt"
  }, m.role === 'user' || m.role === 'you' ? window.BWTL.ROLES[role]?.initials || 'U' : 'AI'), /*#__PURE__*/React.createElement("div", {
    className: "bubble"
  }, /*#__PURE__*/React.createElement("div", null, m.text), m.role === 'ai' && m.context_snapshot && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      paddingTop: 6,
      borderTop: '1px dashed var(--line)',
      fontSize: 10.5,
      color: 'var(--fg-4)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSnapOpen(s => ({
      ...s,
      [i]: !s[i]
    })),
    style: {
      appearance: 'none',
      background: 'transparent',
      border: 0,
      color: 'var(--fg-4)',
      cursor: 'pointer',
      padding: 0,
      fontFamily: 'inherit',
      fontSize: 10.5,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(Ic.caret_d, {
    style: {
      transform: snapOpen[i] ? 'none' : 'rotate(-90deg)'
    }
  }), "context \xB7 ", m.context_snapshot.card_fields, " card field", m.context_snapshot.card_fields !== 1 ? 's' : '', m.context_snapshot.efg_node ? ' · efg ✓' : '', m.context_snapshot.figure ? ` · figure ${m.context_snapshot.figure}` : '', m.context_snapshot.steering_applied ? ' · steered' : '', /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      marginLeft: 6
    }
  }, m.context_snapshot.tokens_in, "/", m.context_snapshot.tokens_out, "t")), snapOpen[i] && /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: '6px 0 0',
      padding: '8px 10px',
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 5,
      fontFamily: 'var(--ff-mono)',
      fontSize: 10,
      color: 'var(--fg-3)',
      whiteSpace: 'pre-wrap'
    }
  }, JSON.stringify({
    ...m.context_snapshot,
    anchor
  }, null, 2))), m.role === 'ai' && m.promotable && /*#__PURE__*/React.createElement(AcceptBar, {
    promotable: m.promotable,
    role: role,
    onPromote: onPromote
  })))), !loadingMsgs && messages.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--fg-4)',
      fontSize: 13,
      padding: 12
    }
  }, "Pick a thread on the left, or start a new one.")))), /*#__PURE__*/React.createElement("div", {
    className: "chat-compose"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
    value: draft,
    onChange: e => setDraft(e.target.value),
    onKeyDown: e => e.key === 'Enter' && !e.shiftKey && handleSend(),
    placeholder: `Ask about ${anchor.label || anchor.value} — anchored to this card.`
  }), sendError && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--danger, #e55)',
      marginTop: 4,
      padding: '4px 6px',
      background: 'rgba(229,85,85,0.08)',
      borderRadius: 4
    }
  }, sendError), /*#__PURE__*/React.createElement("div", {
    className: "chat-compose-prompt"
  }, /*#__PURE__*/React.createElement("span", null, "Try:"), /*#__PURE__*/React.createElement("span", {
    className: "prompt-chip",
    onClick: () => setDraft('What\'s a striking fun-fact for this word?')
  }, "fun fact?"), /*#__PURE__*/React.createElement("span", {
    className: "prompt-chip",
    onClick: () => setDraft('Show me the conjugation table.')
  }, "conjugation"), /*#__PURE__*/React.createElement("span", {
    className: "prompt-chip",
    onClick: () => setDraft('Walk me through a false cognate.')
  }, "false cognate"), /*#__PURE__*/React.createElement("span", {
    className: "prompt-chip",
    onClick: () => setDraft('Which figures are linked to this word?')
  }, "linked figures"))), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    disabled: !draft.trim() || sending,
    onClick: handleSend
  }, /*#__PURE__*/React.createElement(Ic.send, null), " ", sending ? 'Sending…' : 'Send')))));
}

// ── Context payload panel ──────────────────────────────────────────────────
// BUG-122: Save-for-thread persists context settings as a chat_messages row
// (role='context_snapshot') in the active thread via POST /api/chat/threads/{id}/messages.
// No DB migration — uses the existing context_snapshot NVARCHAR(MAX) column.
function ContextPanel({
  ctx,
  card,
  onClose,
  activeThreadId,
  anchor
}) {
  const allFields = ['word_or_phrase', 'language', 'pos', 'ipa_pronunciation', 'definition', 'etymology', 'pie_root', 'pie_ipa', 'english_cognates', 'related_words', 'image_caption', 'efg_node_id'];
  const [fields, setFields] = React.useState(new Set(ctx?.fields || []));
  const [efg, setEfg] = React.useState(!!ctx?.efg_node);
  const [fig, setFig] = React.useState(!!ctx?.figure);
  const [steering, setSteering] = React.useState(ctx?.steering || '');
  const toggle = k => setFields(s => {
    const n = new Set(s);
    n.has(k) ? n.delete(k) : n.add(k);
    return n;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: '1px solid var(--line-soft)',
      background: 'var(--bg-2)',
      padding: '10px 16px',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--acc-2)'
    }
  }, /*#__PURE__*/React.createElement(Ic.spark, {
    style: {
      verticalAlign: '-2px'
    }
  }), " Context payload \xB7 sent on every turn"), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--fg-4)'
    }
  }, fields.size + (efg ? 1 : 0) + (fig ? 1 : 0), " attached"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      marginLeft: 'auto',
      background: 'transparent',
      border: 0,
      color: 'var(--fg-3)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Ic.x, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--fg-4)',
      marginBottom: 5
    }
  }, "Card fields bundled"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 4
    }
  }, allFields.map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    onClick: () => toggle(f),
    style: {
      appearance: 'none',
      cursor: 'pointer',
      padding: '3px 8px',
      borderRadius: 99,
      border: '1px solid ' + (fields.has(f) ? 'var(--acc-ring)' : 'var(--line)'),
      background: fields.has(f) ? 'var(--acc-bg)' : 'transparent',
      color: fields.has(f) ? 'var(--acc-2)' : 'var(--fg-3)',
      fontFamily: 'var(--ff-mono)',
      fontSize: 10.5
    }
  }, fields.has(f) && '✓ ', f))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 11.5,
      color: 'var(--fg-2)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: efg,
    onChange: e => setEfg(e.target.checked)
  }), "attach EFG node ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--graph)'
    }
  }, card?.efg_node_id || '—')), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 11.5,
      color: 'var(--fg-2)',
      cursor: 'pointer',
      opacity: card?.figure_link ? 1 : 0.4
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: fig,
    onChange: e => setFig(e.target.checked),
    disabled: !card?.figure_link
  }), "attach figure ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--myth)'
    }
  }, card?.figure_link || '—')))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--fg-4)',
      marginBottom: 5
    }
  }, "Steering directive", /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 6,
      color: 'var(--fg-5)',
      textTransform: 'none',
      letterSpacing: 0
    }
  }, "\xB7 keeps long threads on-topic")), /*#__PURE__*/React.createElement("textarea", {
    value: steering,
    onChange: e => setSteering(e.target.value),
    placeholder: "e.g. \"Focus on French historical morphology, not PIE reconstruction.\"",
    style: {
      width: '100%',
      height: 64,
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 5,
      padding: 8,
      color: 'var(--fg)',
      font: 'inherit',
      fontSize: 12,
      resize: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 6,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: () => {
      setSteering(ctx?.steering || '');
      setFields(new Set(ctx?.fields || []));
    }
  }, "Revert"), /*#__PURE__*/React.createElement("button", {
    className: "btn xs primary",
    onClick: async () => {
      // BUG-122: persist context as a chat_messages row
      const snapshot = JSON.stringify({
        fields: [...fields],
        efg,
        figure: fig,
        steering
      });
      try {
        let tid = activeThreadId;
        if (!tid || tid === 'new') {
          // Create a thread if none active
          const anchorMode = anchor && anchor.mode || 'flashcard_id';
          const anchorVal = anchor && anchor.value || card && card.id || '';
          const t = await window.BWTL.createThread({
            anchor_mode: anchorMode,
            anchor_value: anchorVal,
            owner_id: 'pl'
          });
          tid = t.id;
        }
        await window.BWTL.addMessage(tid, {
          role: 'context_snapshot',
          text: `Context saved: ${fields.size} fields, steering: ${steering || '(none)'}`,
          context_snapshot: snapshot
        });
      } catch (e) {
        console.error('[ContextPanel save]', e);
      }
      onClose();
    }
  }, /*#__PURE__*/React.createElement(Ic.check, null), " Save for thread")))));
}

// ── Per-message Accept + field dropdown (REV item 4) ───────────────────────
// No more "send to review queue". Accept writes immediately and appends an
// audit row to chat_promotions. The user picks the target field from a
// dropdown of 16 healable fields, modelled on the Verify PIE round-trip.
function AcceptBar({
  promotable,
  role,
  onPromote
}) {
  const [open, setOpen] = React.useState(false);
  const [field, setField] = React.useState('fun_facts');
  const [stage, setStage] = React.useState('idle'); // idle | confirm | done

  const fieldMeta = window.BWTL.PROMOTE_FIELDS.find(f => f.key === field);
  const grouped = React.useMemo(() => {
    const m = {};
    window.BWTL.PROMOTE_FIELDS.forEach(f => {
      (m[f.tier] = m[f.tier] || []).push(f);
    });
    return m;
  }, []);
  const accept = () => {
    setStage('done');
    onPromote({
      card: promotable.card,
      field,
      preview: promotable.preview
    });
    setTimeout(() => {
      setOpen(false);
      setStage('idle');
    }, 1600);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: 8,
      borderTop: '1px dashed var(--line)',
      borderRadius: 5,
      background: 'color-mix(in oklch, var(--ok) 4%, transparent)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, /*#__PURE__*/React.createElement(Ic.spark, {
    style: {
      color: 'var(--ok)'
    }
  }), /*#__PURE__*/React.createElement("span", null, "Accept this insight to ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--fg-2)'
    }
  }, promotable.card), " \u2192"), /*#__PURE__*/React.createElement("select", {
    value: field,
    onChange: e => setField(e.target.value),
    style: {
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      color: 'var(--fg)',
      borderRadius: 5,
      padding: '3px 6px',
      fontFamily: 'var(--ff-mono)',
      fontSize: 11,
      cursor: 'pointer'
    }
  }, Object.entries(grouped).map(([tier, items]) => /*#__PURE__*/React.createElement("optgroup", {
    key: tier,
    label: tier
  }, items.map(f => /*#__PURE__*/React.createElement("option", {
    key: f.key,
    value: f.key
  }, f.label))))), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: () => setOpen(o => !o),
    title: "Preview the write",
    style: open ? {
      background: 'var(--bg-3)',
      color: 'var(--fg)'
    } : {}
  }, open ? 'hide' : 'preview'), stage === 'idle' && /*#__PURE__*/React.createElement("button", {
    className: "btn xs primary",
    style: {
      marginLeft: 'auto',
      '--b-bg': 'var(--ok)',
      '--b-fg': '#0b0918',
      '--b-bd': 'var(--ok)'
    },
    onClick: accept
  }, /*#__PURE__*/React.createElement(Ic.check, null), " Accept"), stage === 'done' && /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 9.5,
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot ok"
  }), " written \xB7 audit row appended")), open && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: '8px 10px',
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 5,
      fontSize: 11.5,
      color: 'var(--fg-2)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--fg-4)'
    }
  }, "writes to \u25B8 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--acc-2)'
    }
  }, fieldMeta?.table || field)), /*#__PURE__*/React.createElement("span", {
    className: "pill ghost",
    style: {
      fontSize: 9.5
    }
  }, "by ", window.BWTL.ROLES[role]?.label || role)), promotable.preview));
}
window.ChatDock = ChatDock;

// ─── workspace.jsx ───
// The unified workspace — the front door.
//
// Layout: center column (the word card with cross-app drill-down links)
//         + right rail (stacked panels) + chat dock at bottom.
//
// All cross-app drill-downs are <a className="xlink xxx"> with a class hinting
// at the destination color (pie/myth/graph/forge). Clicking one:
//   1. opens / un-collapses the matching panel
//   2. briefly glows that panel
//   3. updates the chat anchor if relevant

function Workspace({
  cardId,
  role,
  onNavigateWord,
  onNavByDelta,
  onOpenFigure,
  panelState,
  setPanelState,
  glowedPanel,
  triggerGlow,
  expandedChat,
  setExpandedChat,
  activeThreadId,
  setActiveThreadId,
  onPromote,
  onCardDeleted
}) {
  const [card, setCard] = React.useState(window.BWTL.FLASHCARDS[cardId] || null);
  // loadingCard is only true when we have a real cardId to fetch
  const [loadingCard, setLoadingCard] = React.useState(!!cardId && !card);
  const [threads, setThreads] = React.useState([]);
  const [imgModalSrc, setImgModalSrc] = React.useState(null); // REQ-029: image iframe modal

  React.useEffect(() => {
    if (!cardId) return;
    setLoadingCard(true);
    window.BWTL.fetchCard(cardId).then(c => {
      setCard(c);
      setLoadingCard(false);
    }).catch(err => {
      console.error('[Workspace] fetchCard error:', err);
      setLoadingCard(false);
    });
  }, [cardId]);
  React.useEffect(() => {
    if (!cardId) return;
    window.BWTL.getThreads({
      anchor_value: cardId
    }).then(data => setThreads(Array.isArray(data) ? data : data.items || [])).catch(() => setThreads([]));
  }, [cardId]);
  if (loadingCard) return /*#__PURE__*/React.createElement("div", {
    className: "ws-empty",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 300,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "Loading card\u2026");
  if (!card) return /*#__PURE__*/React.createElement("div", {
    className: "ws-empty",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 300,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "No card loaded. Select a card from the Library to begin.");
  const pieRootKey = card.pie_root;
  // Option B (BWTL05): read actual DB column names — no BE transformation layer
  const figureId = card.figure_link;

  // ── handle: cross-app link clicks ────────────────────────────────────────
  const drillToPie = rootKey => {
    // For now panels follow the current card's root. Future: support
    // alternate roots (e.g. drilling into an atomic component).
    setPanelState(p => ({
      ...p,
      pie: 'open'
    }));
    triggerGlow('pie');
  };
  const drillToFigure = id => {
    onOpenFigure?.(id);
    setPanelState(p => ({
      ...p,
      myth: 'open'
    }));
    triggerGlow('myth');
  };
  const drillToGraph = () => {
    setPanelState(p => ({
      ...p,
      graph: 'open'
    }));
    triggerGlow('graph');
  };
  const drillToForge = () => {
    setPanelState(p => ({
      ...p,
      forge: 'open'
    }));
    triggerGlow('forge');
  };
  const drillToRag = () => {
    setPanelState(p => ({
      ...p,
      rag: 'open'
    }));
    triggerGlow('rag');
  };

  // ── handle: action buttons ────────────────────────────────────────────────
  const handleBookmark = () => {
    const wasBookmarked = card.bookmarked;
    setCard(c => ({
      ...c,
      bookmarked: !wasBookmarked
    }));
    // Sync bookmark flag in global FLASHCARDS cache so Browse "Study set" chip filter sees it
    if (window.BWTL.FLASHCARDS[card.id]) window.BWTL.FLASHCARDS[card.id].bookmarked = !wasBookmarked;
    if (wasBookmarked) {
      // find bookmark id in cache and delete (BUG-053 fix: match on flashcard_ref_id)
      const bm = (window.BWTL.BOOKMARKS || []).find(b => b.flashcard_ref_id === card.id);
      if (bm) window.BWTL.deleteBookmark(bm.id).catch(() => {
        setCard(c => ({
          ...c,
          bookmarked: true
        }));
        if (window.BWTL.FLASHCARDS[card.id]) window.BWTL.FLASHCARDS[card.id].bookmarked = true;
      });
    } else {
      // BUG-053 fix: send canonical BookmarkCreate shape matching learning DB schema
      window.BWTL.createBookmark({
        kind: 'word',
        flashcard_ref_id: card.id,
        ref_label: card.word_or_phrase || card.word || null,
        owner_id: role
      }).then(bm => {
        if (bm?.id) window.BWTL.BOOKMARKS.push(bm);
      }).catch(() => {
        setCard(c => ({
          ...c,
          bookmarked: false
        }));
        if (window.BWTL.FLASHCARDS[card.id]) window.BWTL.FLASHCARDS[card.id].bookmarked = false;
      });
    }
  };
  const handleChatAboutThis = () => {
    setExpandedChat(true);
    setActiveThreadId('new');
  };
  const handleNextInStudy = () => {
    const queue = window.BWTL.STUDY_QUEUE || [];
    const idx = queue.findIndex(q => (q.card_id || q.id) === card.id);
    if (idx >= 0 && idx < queue.length - 1) {
      onNavigateWord(queue[idx + 1].card_id || queue[idx + 1].id);
    } else if (idx === 0 && queue.length > 0 && queue[0].card_id !== card.id) {
      onNavigateWord(queue[0].card_id || queue[0].id);
    } else if (onNavByDelta) {
      onNavByDelta(1);
    }
  };

  // REQ-039: delete card (PL-only) — confirms, calls DELETE /api/flashcards/{id}, evicts cache
  const handleDeleteCard = async () => {
    if (!window.confirm(`Delete "${card.word_or_phrase || card.word}"? This cannot be undone.`)) return;
    try {
      await window.BWTL.deleteCard(card.id);
      delete window.BWTL.FLASHCARDS[card.id];
      window.BWTL.BOOKMARKS = (window.BWTL.BOOKMARKS || []).filter(b => b.flashcard_ref_id !== card.id);
      if (onCardDeleted) onCardDeleted(card.id);
    } catch (e) {
      window.alert(`Failed to delete card: ${e?.message || e}`);
    }
  };
  const togglePanel = k => {
    setPanelState(p => ({
      ...p,
      [k]: p[k] === 'collapsed' ? 'open' : p[k] === 'open' ? 'collapsed' : 'open'
    }));
  };
  const closePanel = k => setPanelState(p => ({
    ...p,
    [k]: 'closed'
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "workspace"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-center fade-up"
  }, /*#__PURE__*/React.createElement(WordCard, {
    card: card,
    role: role,
    onDrillPie: () => drillToPie(pieRootKey),
    onDrillFigure: drillToFigure,
    onDrillGraph: drillToGraph,
    onDrillForge: drillToForge,
    onDrillRag: drillToRag,
    onNavigateWord: onNavigateWord,
    onBookmark: handleBookmark,
    onChatAboutThis: handleChatAboutThis,
    onNextInStudy: handleNextInStudy,
    onDelete: handleDeleteCard,
    onOpenImage: setImgModalSrc
  })), /*#__PURE__*/React.createElement("div", {
    className: "ws-rail"
  }, panelState.pie !== 'closed' && /*#__PURE__*/React.createElement(PiePanel, {
    pieRootKey: pieRootKey,
    currentWord: card.word,
    glow: glowedPanel === 'pie',
    collapsed: panelState.pie === 'collapsed',
    onToggle: () => togglePanel('pie'),
    onClose: () => closePanel('pie'),
    onNavigate: onNavigateWord,
    onOpenPieChat: root => {
      // REQ-047/BUG-119: open ChatDock anchored to the PIE root
      setExpandedChat(true);
      setActiveThreadId(null); // new thread anchored to pie_root
      // Dispatch event so ChatDock can pick up a fresh anchor
      window.dispatchEvent(new CustomEvent('bwtl:open-pie-chat', {
        detail: {
          root
        }
      }));
    },
    pinned: true
  }), panelState.graph !== 'closed' && /*#__PURE__*/React.createElement(EfgPanel, {
    pieRootKey: pieRootKey,
    currentWordId: card.efg_node_id,
    glow: glowedPanel === 'graph',
    collapsed: panelState.graph === 'collapsed',
    onToggle: () => togglePanel('graph'),
    onClose: () => closePanel('graph'),
    onOpenWord: onNavigateWord
  }), panelState.myth !== 'closed' && figureId && /*#__PURE__*/React.createElement(EtymythonPanel, {
    figureId: figureId,
    glow: glowedPanel === 'myth',
    collapsed: panelState.myth === 'collapsed',
    onToggle: () => togglePanel('myth'),
    onClose: () => closePanel('myth')
  }), panelState.rag !== 'closed' && /*#__PURE__*/React.createElement(RagPanel, {
    pieRootKey: pieRootKey,
    glow: glowedPanel === 'rag',
    collapsed: panelState.rag === 'collapsed',
    onToggle: () => togglePanel('rag'),
    onClose: () => closePanel('rag')
  }), panelState.forge !== 'closed' && /*#__PURE__*/React.createElement(ArtForgePanel, {
    card: card,
    glow: glowedPanel === 'forge',
    collapsed: panelState.forge === 'collapsed',
    onToggle: () => togglePanel('forge'),
    onClose: () => closePanel('forge')
  })), /*#__PURE__*/React.createElement(ChatDock, {
    anchor: {
      mode: 'flashcard_id',
      value: card.id,
      label: card.word
    },
    card: card,
    expanded: expandedChat,
    onToggleExpand: () => setExpandedChat(x => !x),
    threads: threads,
    activeThreadId: activeThreadId,
    onActivateThread: setActiveThreadId,
    onNewThread: () => setActiveThreadId('new'),
    onPromote: onPromote,
    role: role
  }), imgModalSrc && /*#__PURE__*/React.createElement("dialog", {
    open: true,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 999,
      width: '90vw',
      maxWidth: 900,
      height: '80vh',
      margin: 'auto',
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-lg)',
      padding: 0,
      boxShadow: '0 24px 80px rgba(0,0,0,0.7)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      borderBottom: '1px solid var(--line-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--fg-3)',
      fontFamily: 'var(--ff-mono)'
    }
  }, card.word, " \xB7 image"), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: () => setImgModalSrc(null)
  }, "\u2715 Close")), /*#__PURE__*/React.createElement("img", {
    src: imgModalSrc,
    alt: card.word,
    style: {
      width: '100%',
      height: 'calc(100% - 40px)',
      objectFit: 'contain',
      display: 'block',
      background: '#000'
    }
  })), imgModalSrc && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 998
    },
    onClick: () => setImgModalSrc(null)
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// WORD CARD — the centerpiece of the workspace
// ─────────────────────────────────────────────────────────────────────────────

function WordCard({
  card,
  role,
  onDrillPie,
  onDrillFigure,
  onDrillGraph,
  onDrillForge,
  onDrillRag,
  onNavigateWord,
  onBookmark,
  onChatAboutThis,
  onNextInStudy,
  onDelete,
  onOpenImage
}) {
  const canEdit = role === 'pl' || role === 'theo' || role === 'tutor';
  // BV-006: navigate to a cognate word card by searching the flashcards cache
  const handleCogClick = async cogText => {
    const word = (cogText || '').toLowerCase().trim();
    if (!word) return;
    const cached = Object.values(window.BWTL.FLASHCARDS).find(c => (c.word || c.word_or_phrase || '').toLowerCase() === word);
    if (cached) {
      onNavigateWord && onNavigateWord(cached.id);
      return;
    }
    const cards = await window.BWTL.fetchCards({
      limit: 1000
    }).catch(() => []);
    const found = cards.find(c => (c.word || c.word_or_phrase || '').toLowerCase() === word);
    if (found) onNavigateWord && onNavigateWord(found.id);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "wordcard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wordcard-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wordcard-img",
    title: card.image_caption || card.word,
    style: {
      position: 'relative',
      overflow: 'hidden',
      cursor: card.image_url ? 'zoom-in' : 'default'
    },
    onClick: () => card.image_url && onOpenImage && onOpenImage(card.image_url)
  }, card.image_url ? /*#__PURE__*/React.createElement("img", {
    src: card.image_url,
    alt: card.word,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: 6,
      left: 8,
      fontSize: 9,
      color: 'var(--fg-4)',
      fontFamily: 'var(--ff-mono)'
    }
  }, "no image"), canEdit && /*#__PURE__*/React.createElement(AiEditButton, {
    field: "image",
    label: "Image",
    floating: true,
    card: card
  })), /*#__PURE__*/React.createElement("div", {
    className: "wordcard-meta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wordcard-row1"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "display"
  }, card.word, /*#__PURE__*/React.createElement("span", {
    className: "lang"
  }, card.language, " \xB7 ", card.pos))), /*#__PURE__*/React.createElement("div", {
    className: "ipa mono",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10
    }
  }, card.ipa_pronunciation, /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    style: {
      padding: '3px 7px'
    },
    title: "Play audio (TTS)",
    onClick: () => {
      if (card.audio_url) new Audio(card.audio_url).play();
    }
  }, /*#__PURE__*/React.createElement(Ic.speaker, null)), canEdit && /*#__PURE__*/React.createElement(AiEditButton, {
    field: "ipa",
    label: "IPA",
    subtle: true,
    card: card
  }), canEdit && /*#__PURE__*/React.createElement(AiEditButton, {
    field: "audio",
    label: "Audio",
    subtle: true,
    card: card
  })), /*#__PURE__*/React.createElement("div", {
    className: "definition",
    style: {
      marginTop: 4
    }
  }, card.definition), /*#__PURE__*/React.createElement("div", {
    className: "wordcard-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: onBookmark
  }, /*#__PURE__*/React.createElement(Ic.bookmark_filled, {
    style: {
      color: card.bookmarked ? 'var(--acc-2)' : 'var(--fg-3)'
    }
  }), card.bookmarked ? 'Bookmarked' : 'Bookmark'), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    onClick: onChatAboutThis
  }, /*#__PURE__*/React.createElement(Ic.chat, null), " Chat about this"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    onClick: onDrillForge
  }, /*#__PURE__*/React.createElement(Ic.film, null), " Generate video"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    style: {
      marginLeft: 'auto'
    },
    onClick: onNextInStudy
  }, /*#__PURE__*/React.createElement(Ic.shuffle, null), " Next in study"), role === 'pl' && /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    title: "Delete this card",
    style: {
      color: 'var(--danger, #e55)'
    },
    onClick: onDelete
  }, "\u2715 Delete card")))), /*#__PURE__*/React.createElement("div", {
    className: "wc-section"
  }, /*#__PURE__*/React.createElement("h4", null, /*#__PURE__*/React.createElement("span", {
    className: "dot pie"
  }), " Etymology", /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      gap: 4
    }
  }, canEdit && /*#__PURE__*/React.createElement(AiEditButton, {
    field: "etymology",
    label: "Etymology",
    card: card
  }), canEdit && /*#__PURE__*/React.createElement(AiEditButton, {
    field: "pie_root",
    label: "PIE root",
    subtle: true,
    card: card
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      lineHeight: 1.6,
      color: 'var(--fg-2)'
    }
  }, card.etymology ? /*#__PURE__*/React.createElement(EtymologyPIELine, {
    text: card.etymology,
    pieRoot: card.pie_root,
    onDrillPie: onDrillPie
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-4)'
    }
  }, "No etymology on file.")), card.pie_root && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      fontSize: 12.5,
      color: 'var(--fg-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill pie",
    style: {
      fontSize: 9.5
    }
  }, card.pie_root), card.pie_ipa && /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11
    }
  }, card.pie_ipa), card.etymology_layer && /*#__PURE__*/React.createElement("span", {
    className: "pill ghost",
    style: {
      fontSize: 9.5,
      textTransform: 'capitalize'
    },
    title: "Etymology layer: direct=borrowed directly; intermediate=via another language; distant=reconstructed cognate"
  }, card.etymology_layer), card.pie_audio_url && /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    style: {
      padding: '2px 6px'
    },
    title: "Play PIE root audio",
    onClick: () => new Audio(card.pie_audio_url).play()
  }, /*#__PURE__*/React.createElement(Ic.speaker, null)))), window.Etymology && /*#__PURE__*/React.createElement(window.Etymology.MultiRootPie, {
    pieRoots: card.pie_roots || (card.pie_root ? [card.pie_root] : []),
    currentCard: card,
    onDrillPie: onDrillPie,
    canEdit: canEdit
  }), /*#__PURE__*/React.createElement("div", {
    className: "wc-section"
  }, /*#__PURE__*/React.createElement("h4", null, /*#__PURE__*/React.createElement("span", {
    className: "dot acc"
  }), " Cognates", /*#__PURE__*/React.createElement("span", {
    className: "pill ghost",
    style: {
      marginLeft: 'auto',
      fontSize: 9.5
    }
  }, (() => {
    const ec = (card.english_cognates || '').split(',').filter(s => s.trim());
    let rw = [];
    try {
      rw = JSON.parse(card.related_words || '[]');
    } catch {
      rw = (card.related_words || '').split(',').map(s => s.trim()).filter(Boolean);
    }
    return ec.length + rw.length;
  })(), " cognates"), canEdit && /*#__PURE__*/React.createElement(AiEditButton, {
    field: "cognates",
    label: "Cognates",
    card: card
  })), /*#__PURE__*/React.createElement("div", {
    className: "chip-row"
  }, (card.english_cognates || '').split(',').map((c, i) => c.trim() ? /*#__PURE__*/React.createElement("span", {
    key: 'en_' + i,
    className: "cog",
    style: {
      cursor: 'pointer'
    },
    onClick: () => handleCogClick(c.trim())
  }, /*#__PURE__*/React.createElement("span", {
    className: "lang"
  }, "en"), /*#__PURE__*/React.createElement("span", null, c.trim())) : null), (() => {
    let rw = [];
    try {
      rw = JSON.parse(card.related_words || '[]');
    } catch {
      rw = (card.related_words || '').split(',').map(s => s.trim()).filter(Boolean);
    }
    return rw.map((c, i) => /*#__PURE__*/React.createElement("span", {
      key: 'rw_' + i,
      className: "cog",
      style: {
        cursor: 'pointer'
      },
      onClick: () => handleCogClick(typeof c === 'string' ? c.trim() : String(c))
    }, /*#__PURE__*/React.createElement("span", {
      className: "lang"
    }, "rel"), /*#__PURE__*/React.createElement("span", null, typeof c === 'string' ? c.trim() : c)));
  })(), /*#__PURE__*/React.createElement("span", {
    className: "cog",
    style: {
      borderStyle: 'dashed',
      color: 'var(--fg-3)'
    },
    onClick: onDrillGraph
  }, /*#__PURE__*/React.createElement(Ic.graph, null), " Open full graph"))), window.Etymology && !card.pie_root && !card.etymology && /*#__PURE__*/React.createElement(window.Etymology.EmptyEtymologyState, {
    card: card,
    onAskAI: field => onChatAboutThis && onChatAboutThis(field)
  }), card.fun_facts && card.fun_facts.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "wc-section"
  }, /*#__PURE__*/React.createElement("h4", null, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: 'var(--myth)'
    }
  }), " Fun facts", /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      display: 'inline-flex',
      gap: 4
    }
  }, canEdit && /*#__PURE__*/React.createElement(AiEditButton, {
    field: "fun_facts",
    label: "Fun facts",
    card: card
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, card.fun_facts.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "ff-card"
  }, /*#__PURE__*/React.createElement(FunFactBody, {
    text: f.text,
    figure: f.figure,
    onDrillFigure: onDrillFigure,
    onDrillPie: onDrillPie
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 6,
      alignItems: 'center',
      fontSize: 10.5,
      color: 'var(--fg-4)'
    }
  }, /*#__PURE__*/React.createElement(Ic.chat, null), /*#__PURE__*/React.createElement("span", null, "Discuss in chat"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto'
    },
    className: "mono"
  }, "fun_fact \xB7 ", i + 1, " of ", card.fun_facts.length)))))), /*#__PURE__*/React.createElement("div", {
    className: "wc-section",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Ic.book, null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--fg-2)'
    }
  }, "Scholarly entry available in ", /*#__PURE__*/React.createElement("a", {
    className: "xlink rag",
    style: {
      '--xc': 'var(--acc)'
    },
    onClick: onDrillRag
  }, /*#__PURE__*/React.createElement("span", {
    className: "x-tag"
  }, "RAG"), "Beekes EDPIE / Dictionary content"), " \u2014 1 match for this root.")));
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper renderers — turn key tokens in prose into cross-app drill-down links.
// ─────────────────────────────────────────────────────────────────────────────

function EtymologyPIELine({
  text,
  pieRoot,
  onDrillPie
}) {
  // Replace PIE root literal in text with a clickable xlink.
  // This is the cue the design brief calls out: clicking the PIE root opens
  // the PIE Explorer panel.
  if (!pieRoot) return /*#__PURE__*/React.createElement("span", null, text);
  const parts = text.split(pieRoot);
  if (parts.length === 1) return /*#__PURE__*/React.createElement("span", null, text);
  return /*#__PURE__*/React.createElement("span", null, parts.map((p, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, p, i < parts.length - 1 && /*#__PURE__*/React.createElement("a", {
    className: "xlink pie",
    onClick: onDrillPie
  }, /*#__PURE__*/React.createElement("span", {
    className: "x-tag"
  }, "PIE"), pieRoot))));
}
function FunFactBody({
  text,
  figure,
  onDrillFigure,
  onDrillPie
}) {
  // Look for capitalized figure names — we naively detect Mnemosyne, Hera, Lethe etc.
  // For mock purposes we use a small replacements table.
  const figs = ['Mnemosyne', 'Hera', 'Lethe', 'Gaia', 'Zeus'];
  let parts = [text];
  figs.forEach(f => {
    const next = [];
    parts.forEach(p => {
      if (typeof p !== 'string') {
        next.push(p);
        return;
      }
      const split = p.split(new RegExp(`(${f})`));
      split.forEach((s, i) => {
        if (s === f) next.push(/*#__PURE__*/React.createElement("a", {
          key: Math.random(),
          className: "xlink myth",
          onClick: () => onDrillFigure(figure || 'mnemosyne')
        }, /*#__PURE__*/React.createElement("span", {
          className: "x-tag"
        }, "EM"), s));else next.push(s);
      });
    });
    parts = next;
  });
  // also linkify *root- patterns
  const finalParts = [];
  parts.forEach((p, idx) => {
    if (typeof p !== 'string') {
      finalParts.push(p);
      return;
    }
    const re = /(\*[a-zA-Z₀-₉ʷʰ¹²³⁴-]+-?)/g;
    let last = 0;
    let m;
    while (m = re.exec(p)) {
      finalParts.push(p.slice(last, m.index));
      finalParts.push(/*#__PURE__*/React.createElement("a", {
        key: idx + '_' + m.index,
        className: "xlink pie",
        onClick: onDrillPie
      }, /*#__PURE__*/React.createElement("span", {
        className: "x-tag"
      }, "PIE"), m[1]));
      last = m.index + m[1].length;
    }
    finalParts.push(p.slice(last));
  });
  return /*#__PURE__*/React.createElement("span", null, finalParts);
}

// ─────────────────────────────────────────────────────────────────────────────
// AI EDIT BUTTON — small spark/pencil that opens a per-field regenerate popover.
// Mirrors SF /api/ai/ai_generate. The popover routes through Theodoros review
// queue for non-admin roles (per the role matrix).
// ─────────────────────────────────────────────────────────────────────────────

function AiEditButton({
  field,
  label,
  subtle,
  floating,
  card
}) {
  const [open, setOpen] = React.useState(false);
  const [stage, setStage] = React.useState('idle'); // idle | running | done
  const [proposedValue, setProposedValue] = React.useState(null);
  const [promptText, setPromptText] = React.useState('');
  const meta = window.BWTL.AI_FIELDS[field] || {
    endpoint: 'POST /api/ai/generate',
    model: 'gpt-4o'
  };
  const FIELD_API_KEYS = {
    ipa: 'ipa_pronunciation',
    audio: 'audio_url',
    cognates: 'english_cognates',
    image: 'image_url',
    definition: 'definition',
    etymology: 'etymology',
    pie_root: 'pie_root',
    pie_ipa: 'pie_ipa'
  };
  const runIt = async () => {
    setStage('running');
    if (!card) {
      setProposedValue(null);
      setStage('done');
      return;
    }
    try {
      // BUG-055 fix: use _apiFetch instead of raw fetch()
      const result = await window.BWTL._apiFetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          card_id: card.id,
          field,
          prompt: promptText,
          word_or_phrase: card.word || card.word_or_phrase,
          language_id: card.language_id
        })
      });
      const apiKey = FIELD_API_KEYS[field] || field;
      setProposedValue(result[apiKey] ?? null);
    } catch (e) {
      console.error('[AiEditButton] generate error:', e);
    }
    setStage('done');
  };
  const applyIt = async () => {
    if (card && proposedValue !== null) {
      const apiKey = FIELD_API_KEYS[field] || field;
      try {
        // BUG-055 fix: use _apiFetch instead of raw fetch()
        await window.BWTL._apiFetch(`/api/flashcards/${card.id}/`, {
          method: 'PUT',
          body: JSON.stringify({
            [apiKey]: proposedValue
          })
        });
        window.dispatchEvent(new CustomEvent('bwtl:toast', {
          detail: `Applied AI ${label} to card`
        }));
        window.dispatchEvent(new CustomEvent('bwtl:card-reload', {
          detail: card.id
        }));
      } catch (e) {
        window.dispatchEvent(new CustomEvent('bwtl:toast', {
          detail: `Failed to apply ${label}`
        }));
      }
    } else {
      window.dispatchEvent(new CustomEvent('bwtl:toast', {
        detail: `Applied AI ${label} to card`
      }));
    }
    setOpen(false);
  };
  const popoverStyle = floating ? {
    position: 'absolute',
    bottom: 8,
    right: 8
  } : {
    position: 'relative'
  };
  return /*#__PURE__*/React.createElement("span", {
    style: popoverStyle
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setOpen(o => !o);
      setStage('idle');
    },
    title: `Edit ${label} with AI — ${meta.endpoint}`,
    style: {
      appearance: 'none',
      border: '1px solid ' + (open ? 'var(--acc-ring)' : 'var(--line)'),
      background: open ? 'var(--acc-bg)' : subtle ? 'transparent' : 'var(--bg-2)',
      color: open ? 'var(--acc-2)' : 'var(--fg-3)',
      padding: subtle ? '2px 5px' : '3px 7px',
      borderRadius: 6,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 10.5,
      fontWeight: 600,
      fontFamily: 'inherit'
    }
  }, /*#__PURE__*/React.createElement(Ic.spark, null), " ", !subtle && 'AI'), open && /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      top: 'calc(100% + 6px)',
      right: floating ? 0 : 'auto',
      left: floating ? 'auto' : 0,
      zIndex: 30,
      width: 320,
      background: 'var(--bg-2)',
      border: '1px solid var(--acc-ring)',
      borderRadius: 'var(--r)',
      padding: 12,
      boxShadow: '0 20px 50px -10px rgba(0,0,0,.6)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Ic.spark, {
    style: {
      color: 'var(--acc-2)'
    }
  }), /*#__PURE__*/React.createElement("strong", {
    style: {
      fontSize: 12
    }
  }, "Regenerate ", label, " with AI")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(false),
    style: {
      background: 'transparent',
      border: 0,
      color: 'var(--fg-3)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Ic.x, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 6,
      fontSize: 11.5,
      color: 'var(--fg-3)',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--fg-4)'
    }
  }, "endpoint:"), " ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--acc-2)'
    }
  }, meta.endpoint)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--fg-4)'
    }
  }, "model:"), " ", meta.model), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--fg-4)'
    }
  }, "last run:"), " ", meta.last_run, " \xB7 avg ", meta.avg_ms, "ms")), /*#__PURE__*/React.createElement("textarea", {
    value: promptText,
    onChange: e => setPromptText(e.target.value),
    placeholder: `Optional: tell the AI what to focus on (e.g. "emphasize the compound nature of *h₁epi-+*gʷem-")`,
    style: {
      width: '100%',
      height: 64,
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 6,
      padding: 8,
      color: 'var(--fg)',
      font: 'inherit',
      fontSize: 12,
      resize: 'none'
    }
  }), stage === 'idle' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginTop: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: () => {
      const root = card?.pie_root || card?.word_or_phrase || '';
      if (!root) return;
      window.BWTL.searchEtymology(root).then(results => {
        const items = Array.isArray(results) ? results : results.results || results.items || [];
        const entry = items[0];
        if (entry) {
          const snippet = entry.full_text || entry.snippet || entry.text || entry.content || '';
          setPromptText(pt => `[Beekes: ${snippet.slice(0, 300)}]\n${pt}`);
        }
      }).catch(err => console.error('[Beekes]', err));
    }
  }, "Use Beekes context"), /*#__PURE__*/React.createElement("button", {
    className: "btn xs primary",
    style: {
      marginLeft: 'auto'
    },
    onClick: runIt
  }, /*#__PURE__*/React.createElement(Ic.spark, null), " Generate")), stage === 'running' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: 8,
      borderRadius: 6,
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 12,
      color: 'var(--fg-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot warn"
  }), " Running on ", meta.model, "\u2026"), stage === 'done' && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 8,
      borderRadius: 6,
      background: 'color-mix(in oklch, var(--ok) 5%, var(--bg-1))',
      border: '1px solid color-mix(in oklch, var(--ok) 30%, var(--line))',
      fontSize: 12,
      color: 'var(--fg-2)',
      lineHeight: 1.5,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--ok)',
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      marginBottom: 4
    }
  }, "Proposed"), proposedValue !== null ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: label === 'IPA' ? 'var(--ff-mono)' : 'inherit'
    }
  }, String(proposedValue)) : `Suggested ${label.toLowerCase()} drafted. Review before apply.`), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: () => setStage('idle')
  }, "Re-roll"), /*#__PURE__*/React.createElement("button", {
    className: "btn xs primary",
    onClick: applyIt
  }, /*#__PURE__*/React.createElement(Ic.check, null), " Apply")))));
}
window.Workspace = Workspace;
window.AiEditButton = AiEditButton;

// CardDetail — REV-3 unified card view with sticky nav header + mode tabs
// Wraps Workspace (Study), PronunciationView, and ShadowingView.
function CardDetail({
  cardId,
  role,
  spine,
  mode,
  setMode,
  onBack,
  onNavByDelta,
  onOpenCard,
  onOpenFigure,
  panelState,
  setPanelState,
  glowedPanel,
  triggerGlow,
  expandedChat,
  setExpandedChat,
  activeThreadId,
  setActiveThreadId,
  onPromote,
  onCardDeleted
}) {
  const [card, setCard] = React.useState(window.BWTL.FLASHCARDS[cardId] || null);
  React.useEffect(() => {
    const cached = window.BWTL.FLASHCARDS[cardId];
    if (cached && cached.word) {
      setCard(cached);
      return;
    }
    window.BWTL.fetchCard(cardId).then(c => {
      setCard(c);
      if (c) window.BWTL.FLASHCARDS[c.id] = c;
    }).catch(console.error);
  }, [cardId]);
  const word = card ? card.word_or_phrase || card.word : cardId;
  const pos = spine && spine.length ? spine.indexOf(cardId) : -1;
  const total = spine && spine.length ? spine.length : 0;
  const [bookmarked, setBookmarked] = React.useState(card?.bookmarked || false);
  React.useEffect(() => {
    setBookmarked(card?.bookmarked || false);
  }, [card]);
  const handleBookmark = () => {
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);
    if (wasBookmarked) {
      const bm = (window.BWTL.BOOKMARKS || []).find(b => b.flashcard_ref_id === cardId);
      if (bm) window.BWTL.deleteBookmark(bm.id).catch(() => setBookmarked(true));
    } else {
      window.BWTL.createBookmark({
        kind: 'word',
        flashcard_ref_id: cardId,
        ref_label: word,
        owner_id: role
      }).then(bm => {
        if (bm?.id) window.BWTL.BOOKMARKS.push(bm);
      }).catch(() => setBookmarked(false));
    }
    if (window.BWTL.FLASHCARDS[cardId]) window.BWTL.FLASHCARDS[cardId].bookmarked = !wasBookmarked;
  };
  const MODES = [['study', 'Study'], ['pronunciation', 'Pronunciation'], ['shadowing', 'Shadowing']];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 'var(--topbar-h, 52px)',
      zIndex: 40,
      background: 'color-mix(in oklch, var(--bg-0) 92%, transparent)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--line-soft)',
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    onClick: onBack,
    style: {
      gap: 6,
      display: 'inline-flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Ic.arrow_left, null), " Browse"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--fg-4)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    }
  }, "Browse", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-5)',
      margin: '0 2px'
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-2)',
      fontWeight: 600
    }
  }, word)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    style: {
      color: bookmarked ? 'var(--acc-2)' : 'var(--fg-3)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4
    },
    onClick: handleBookmark,
    title: bookmarked ? 'Remove from study set' : 'Add to study set'
  }, bookmarked ? /*#__PURE__*/React.createElement(Ic.bookmark_filled, null) : /*#__PURE__*/React.createElement(Ic.bookmark, null), bookmarked ? 'Saved' : 'Save'), total > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost icon",
    onClick: () => onNavByDelta(-1),
    disabled: pos <= 0,
    title: "Previous card (Alt+\u2191)"
  }, /*#__PURE__*/React.createElement(Ic.arrow_up, null)), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--fg-3)',
      minWidth: 42,
      textAlign: 'center'
    }
  }, pos >= 0 ? pos + 1 : '?', " / ", total), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost icon",
    onClick: () => onNavByDelta(1),
    disabled: pos < 0 || pos >= total - 1,
    title: "Next card (Alt+\u2193)"
  }, /*#__PURE__*/React.createElement(Ic.arrow_down, null)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 0,
      padding: '0 20px',
      borderBottom: '1px solid var(--line)'
    }
  }, MODES.map(([k, lab]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setMode(k),
    style: {
      appearance: 'none',
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      padding: '8px 16px',
      borderBottom: '2px solid ' + (mode === k ? 'var(--acc)' : 'transparent'),
      marginBottom: -1,
      color: mode === k ? 'var(--fg)' : 'var(--fg-3)',
      fontWeight: 600,
      fontSize: 13,
      fontFamily: 'inherit'
    }
  }, lab))), mode === 'study' && /*#__PURE__*/React.createElement(Workspace, {
    cardId: cardId,
    role: role,
    onNavigateWord: onOpenCard,
    onNavByDelta: onNavByDelta,
    onOpenFigure: onOpenFigure,
    panelState: panelState,
    setPanelState: setPanelState,
    glowedPanel: glowedPanel,
    triggerGlow: triggerGlow,
    expandedChat: expandedChat,
    setExpandedChat: setExpandedChat,
    activeThreadId: activeThreadId,
    setActiveThreadId: setActiveThreadId,
    onPromote: onPromote,
    onCardDeleted: onCardDeleted
  }), mode === 'pronunciation' && /*#__PURE__*/React.createElement(PronunciationView, {
    card: card
  }), mode === 'shadowing' && /*#__PURE__*/React.createElement(ShadowingView, {
    card: card
  }));
}
window.CardDetail = CardDetail;

// ─── study-extra.jsx ───
// STUDY EXTRAS — SRS queue, pronunciation practice, shadowing.
// Mirrors SF /api/study/*, /api/v1/pronunciation/*, /api/shadowing/*.

function StudyQueueView({
  onNavigateWord
}) {
  const [queue, setQueue] = React.useState(window.BWTL.STUDY_QUEUE || []);
  const [loading, setLoading] = React.useState(!queue.length);
  const reviewedCount = 0;
  React.useEffect(() => {
    setLoading(true);
    window.BWTL.fetchStudyDue().then(data => setQueue(Array.isArray(data) ? data : data.items || data.cards || [])).catch(console.error).finally(() => setLoading(false));
  }, []);
  if (loading) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "Loading study queue\u2026");
  if (!queue.length) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 200px',
      maxWidth: 1300,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "display",
    style: {
      fontSize: 32,
      margin: 0
    }
  }, "Today's queue"), /*#__PURE__*/React.createElement("div", {
    className: "study-empty",
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14,
      marginTop: 24
    }
  }, "No cards due. Great job \u2014 check back tomorrow!"));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 200px',
      maxWidth: 1300,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "display",
    style: {
      fontSize: 32,
      margin: 0
    }
  }, "Today's queue"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-3)',
      margin: '4px 0 0',
      fontSize: 13
    }
  }, "SRS-scheduled review \xB7 pulled from ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--acc-2)'
    }
  }, "SF.study_sessions"), " and ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--acc-2)'
    }
  }, "/api/study/next"), ".")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill ghost"
  }, /*#__PURE__*/React.createElement(Ic.flame, {
    style: {
      color: 'var(--warn)'
    }
  }), " 21-day streak"), /*#__PURE__*/React.createElement("button", {
    className: "btn"
  }, /*#__PURE__*/React.createElement(Ic.play, null), " Resume session"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      gap: 14,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontSize: 14
    }
  }, "Session progress"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--fg-3)'
    }
  }, reviewedCount, " reviewed \xB7 ", queue.length - reviewedCount, " remaining \xB7 est. ", Math.round((queue.length - reviewedCount) * 1.2), "m")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2,
      height: 8
    }
  }, queue.map((q, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      borderRadius: 2,
      background: i < reviewedCount ? 'var(--ok)' : i === reviewedCount ? 'var(--acc)' : 'var(--bg-3)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      marginTop: 14,
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: 'var(--ok)',
      display: 'inline-block',
      marginRight: 6,
      verticalAlign: 'middle'
    }
  }), " done"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: 'var(--acc)',
      display: 'inline-block',
      marginRight: 6,
      verticalAlign: 'middle'
    }
  }), " current"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: 'var(--bg-3)',
      display: 'inline-block',
      marginRight: 6,
      verticalAlign: 'middle'
    }
  }), " upcoming"))), /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 8
    }
  }, "This week"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 22
    }
  }, "42"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-4)'
    }
  }, "cards reviewed")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 22,
      color: 'var(--ok)'
    }
  }, "87%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-4)'
    }
  }, "good or better")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 22
    }
  }, "3"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-4)'
    }
  }, "new cards")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 22,
      color: 'var(--warn)'
    }
  }, "5"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-4)'
    }
  }, "marked hard"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 6
    }
  }, queue.map((q, i) => {
    const card = window.BWTL.FLASHCARDS[q.card];
    if (!card) return null;
    const isCurrent = i === reviewedCount;
    return /*#__PURE__*/React.createElement("div", {
      key: q.card,
      className: "card",
      style: {
        padding: 0,
        cursor: 'pointer',
        borderColor: isCurrent ? 'var(--acc-ring)' : 'var(--line)',
        opacity: i < reviewedCount ? 0.55 : 1
      },
      onClick: () => onNavigateWord(q.card)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '12px 16px',
        display: 'grid',
        gridTemplateColumns: '40px 1fr 120px 100px 140px auto',
        gap: 14,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 10,
        color: 'var(--fg-4)',
        fontWeight: 700
      }
    }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "display",
      style: {
        fontSize: 20
      }
    }, card.word), /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 11,
        color: 'var(--fg-4)'
      }
    }, card.ipa_pronunciation)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--fg-3)',
        marginTop: 2
      }
    }, card.definition)), /*#__PURE__*/React.createElement("span", {
      className: "pill ghost",
      style: {
        fontSize: 10
      }
    }, card.language), /*#__PURE__*/React.createElement("span", {
      className: `pill ${q.last_grade === 'easy' ? 'ok' : q.last_grade === 'good' ? 'accent' : q.last_grade === 'hard' ? 'warn' : q.last_grade === 'again' ? 'err' : 'ghost'}`,
      style: {
        fontSize: 10
      }
    }, q.last_grade), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--fg-3)'
      }
    }, q.due, " \xB7 ", /*#__PURE__*/React.createElement("span", {
      className: "mono"
    }, "+", q.interval_days, "d")), isCurrent ? /*#__PURE__*/React.createElement("button", {
      className: "btn sm primary"
    }, "Study ", /*#__PURE__*/React.createElement(Ic.arrow_right, null)) : i < reviewedCount ? /*#__PURE__*/React.createElement(Ic.check, {
      style: {
        color: 'var(--ok)'
      }
    }) : /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 10,
        color: 'var(--fg-5)'
      }
    }, "reps ", q.reps)));
  })));
}
function PronunciationView({
  card
}) {
  const word = card ? card.word_or_phrase || card.word || 'μνήμη' : 'μνήμη';
  const ipa = card ? card.ipa_pronunciation || card.ipa || '/ˈmni.mi/' : '/ˈmni.mi/';
  const audioUrl = card ? card.audio_url || null : null;
  const cardId = card ? card.id : null;
  const [recording, setRecording] = React.useState(false);
  const [score, setScore] = React.useState(null);
  const [scoreError, setScoreError] = React.useState(null);
  const [scoring, setScoring] = React.useState(false);
  const mediaRecRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  const playReference = () => {
    if (audioUrl) {
      const a = new Audio(audioUrl);
      a.play().catch(console.error);
    } else if (word && window.speechSynthesis) {
      const utt = new SpeechSynthesisUtterance(word);
      utt.lang = card?.language_code || 'el-GR';
      window.speechSynthesis.speak(utt);
    }
  };

  // BUG-123: wire Record/Stop to MediaRecorder + POST /api/v1/pronunciation/record
  const handleRecord = async () => {
    if (recording) {
      // Stop recording — triggers onstop which POSTs the audio
      mediaRecRef.current && mediaRecRef.current.stop();
      setRecording(false);
    } else {
      setScore(null);
      setScoreError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
        const mr = new MediaRecorder(stream);
        chunksRef.current = [];
        mr.ondataavailable = e => chunksRef.current.push(e.data);
        mr.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          setScoring(true);
          try {
            const blob = new Blob(chunksRef.current, {
              type: 'audio/webm'
            });
            const form = new FormData();
            form.append('audio_file', blob, 'recording.webm');
            form.append('flashcard_id', cardId || '');
            form.append('user_id', 'pl');
            // Mutation: needs auth header
            const token = window.BWTL._getToken ? window.BWTL._getToken() : '';
            const headers = token ? {
              'Authorization': `Bearer ${token}`
            } : {};
            const res = await fetch('/api/v1/pronunciation/record', {
              method: 'POST',
              body: form,
              headers,
              credentials: 'include'
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            // Map API response to display shape
            const words = data.word_scores || [];
            const segments = words.length ? words.map(w => [w.word || w.phoneme || '?', Math.round((w.score || 0) * 100)]) : (data.ipa_target || ipa).replace(/[/[\]]/g, '').split('').filter(c => c.trim()).map(c => [c, Math.round(Math.random() * 30 + 60)]);
            setScore({
              overall: Math.round(data.overall_score ?? data.score ?? 0),
              segments,
              feedback: data.feedback || ''
            });
          } catch (e) {
            setScoreError(`Scoring failed: ${e.message}`);
          } finally {
            setScoring(false);
          }
        };
        mr.start();
        mediaRecRef.current = mr;
        setRecording(true);
      } catch (e) {
        setScoreError(`Microphone access denied: ${e.message}`);
      }
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 200px',
      maxWidth: 1100,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 22,
      margin: 0
    }
  }, "Pronunciation \u2014 ", word), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-3)',
      margin: '4px 0 0',
      fontSize: 13
    }
  }, "Record yourself, get an alignment score against the reference IPA. ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--acc-2)'
    }
  }, "POST /api/v1/pronunciation/score"), ".")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 24,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 16
    }
  }, "Now practicing"), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 52,
      lineHeight: 1
    }
  }, word), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 16,
      color: 'var(--fg-2)',
      marginTop: 8
    }
  }, ipa), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    onClick: playReference
  }, /*#__PURE__*/React.createElement(Ic.speaker, null), " Hear reference")), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '24px auto 0',
      maxWidth: 400
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 80,
      background: 'var(--bg-1)',
      borderRadius: 10,
      border: '1px solid var(--line)',
      padding: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 400 60",
    style: {
      width: '100%',
      height: '100%'
    }
  }, Array.from({
    length: 80
  }, (_, i) => /*#__PURE__*/React.createElement("rect", {
    key: i,
    x: i * 5,
    y: 30 - (Math.sin(i * 0.3) * 12 + Math.random() * 8) / 2,
    width: "3",
    height: Math.abs(Math.sin(i * 0.3) * 12 + Math.random() * 8),
    fill: recording ? 'var(--acc)' : 'var(--fg-5)',
    rx: "1"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      gap: 10,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    style: {
      padding: '14px 22px',
      borderRadius: 99
    },
    onClick: handleRecord,
    disabled: scoring
  }, scoring ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.spark, null), " Scoring\u2026") : recording ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.pause, null), " Stop & score") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.voice, null), " Record")), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => {
      setScore(null);
      setScoreError(null);
    }
  }, /*#__PURE__*/React.createElement(Ic.refresh, null), " Try again")), scoreError && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 12,
      color: 'var(--danger, #e55)',
      textAlign: 'center'
    }
  }, scoreError)), /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 10
    }
  }, "Phoneme alignment"), score ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "display",
    style: {
      fontSize: 28,
      color: score.overall >= 80 ? 'var(--ok)' : 'var(--warn)'
    }
  }, score.overall), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--fg-3)'
    }
  }, " / 100 overall")), score.segments.map(([phon, s], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: '40px 1fr auto',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12,
      color: 'var(--fg-2)'
    }
  }, "/", phon, "/"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      background: 'var(--bg-3)',
      borderRadius: 99,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: s + '%',
      height: '100%',
      background: s >= 80 ? 'var(--ok)' : s >= 60 ? 'var(--warn)' : 'var(--err)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--fg-3)',
      width: 28,
      textAlign: 'right'
    }
  }, s))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: 8,
      borderRadius: 6,
      background: 'var(--bg-2)',
      fontSize: 11.5,
      color: 'var(--fg-3)',
      lineHeight: 1.5
    }
  }, "Watch the second ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "/n/"), " \u2014 you flattened it into a vowel. Try sustained nasal closure.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--fg-4)',
      lineHeight: 1.6
    }
  }, "Record to see per-phoneme alignment. Scores feed back to ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "SF.PronunciationAttempts"), " for tracking."))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: 12,
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      borderRadius: 10,
      fontSize: 11.5,
      color: 'var(--fg-3)'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--fg-2)'
    }
  }, "Scoreboard for this card:"), " last 5 attempts averaged ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--ok)'
    }
  }, "82"), ". View progress trend in ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "vw_UserPronunciationProgress"), "."));
}
function ShadowingView({
  card
}) {
  const word = card ? card.word_or_phrase || card.word || 'μνήμη' : 'μνήμη';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 200px',
      maxWidth: 1100,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    className: "display",
    style: {
      fontSize: 22,
      margin: 0
    }
  }, "Shadowing \u2014 ", word), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-3)',
      margin: '4px 0 0',
      fontSize: 13
    }
  }, "Listen, speak alongside, replay. Sessions persist in ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--acc-2)'
    }
  }, "SF.shadowing_sessions"), ".")), /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 22
    }
  }, "Hesiod \xB7 Theogony \xB7 lines 53-62"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--fg-3)',
      marginTop: 4
    }
  }, "Mnemosyne and the birth of the Muses \xB7 47s \xB7 Eleni voice")), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost"
  }, /*#__PURE__*/React.createElement(Ic.shuffle, null), " Choose passage")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg-1)',
      borderRadius: 10,
      border: '1px solid var(--line)',
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "greek",
    style: {
      fontSize: 17,
      lineHeight: 1.7,
      color: 'var(--fg-2)'
    }
  }, "\u03C4\u1F70\u03C2 \u1F10\u03BD \u03A0\u03B9\u03B5\u03C1\u03AF\u1FC3 \u039A\u03C1\u03BF\u03BD\u03AF\u03B4\u1FC3 \u03C4\u03AD\u03BA\u03B5 \u03C0\u03B1\u03C4\u03C1\u1F76 \u03BC\u03B9\u03B3\u03B5\u1FD6\u03C3\u03B1", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--acc-bg)',
      padding: '0 4px',
      borderRadius: 3
    }
  }, "\u039C\u03BD\u03B7\u03BC\u03BF\u03C3\u03CD\u03BD\u03B7"), ", \u03B3\u03BF\u03C5\u03BD\u03BF\u1FD6\u03C3\u03B9\u03BD \u1F18\u03BB\u03B5\u03C5\u03B8\u1FC6\u03C1\u03BF\u03C2 \u03BC\u03B5\u03B4\u03AD\u03BF\u03C5\u03C3\u03B1,", /*#__PURE__*/React.createElement("br", null), "\u03BB\u03B7\u03C3\u03BC\u03BF\u03C3\u03CD\u03BD\u03B7\u03BD \u03C4\u03B5 \u03BA\u03B1\u03BA\u1FF6\u03BD \u1F04\u03BC\u03C0\u03B1\u03C5\u03BC\u03AC \u03C4\u03B5 \u03BC\u03B5\u03C1\u03BC\u03B7\u03C1\u03AC\u03C9\u03BD."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: '1px dashed var(--line)',
      fontSize: 12,
      color: 'var(--fg-3)',
      fontStyle: 'italic',
      lineHeight: 1.5
    }
  }, "In Pieria, lying with the Son of Cronus their father, Mnemosyne bore them, mistress of the hills of Eleuther \u2014 forgetfulness of evil and respite from cares.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    style: {
      padding: '12px 18px',
      borderRadius: 99
    }
  }, /*#__PURE__*/React.createElement(Ic.play, null), " Play & shadow"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 4,
      background: 'var(--bg-3)',
      borderRadius: 99,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '35%',
      height: '100%',
      background: 'var(--acc)',
      borderRadius: 99
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '35%',
      top: -3,
      width: 10,
      height: 10,
      background: 'var(--acc)',
      borderRadius: 99,
      transform: 'translateX(-50%)'
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, "0:16 / 0:47"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, [0.5, 0.75, 1.0, 1.25].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    className: "btn xs ghost",
    style: {
      background: s === 0.75 ? 'var(--bg-3)' : 'transparent'
    }
  }, s, "\xD7")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 10
    }
  }, [{
    label: 'Reference',
    wave: true,
    role: 'instructor'
  }, {
    label: 'Your shadow',
    wave: true,
    role: 'you'
  }, {
    label: 'Alignment',
    diff: true
  }].map(p => /*#__PURE__*/React.createElement("div", {
    key: p.label,
    style: {
      padding: 10,
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-4)',
      marginBottom: 8
    }
  }, p.label), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 200 30",
    style: {
      width: '100%',
      height: 28
    }
  }, Array.from({
    length: 40
  }, (_, i) => /*#__PURE__*/React.createElement("rect", {
    key: i,
    x: i * 5,
    y: 15 - Math.abs(Math.sin(i * 0.4)) * 10,
    width: "3",
    height: Math.abs(Math.sin(i * 0.4)) * 20 + 2,
    fill: p.role === 'instructor' ? 'var(--graph)' : p.role === 'you' ? 'var(--acc)' : 'var(--ok)',
    rx: "1"
  }))))))));
}
window.StudyQueueView = StudyQueueView;
window.PronunciationView = PronunciationView;
window.ShadowingView = ShadowingView;

// ─── library.jsx ───
// BROWSE — unified browse for the five entity types (REV-3 rename from Library)
// REV-3: BrowseView replaces LibraryView; search for cards persists via cardFilter in App (BUG-059 resolved structurally).
// Tabs: Cards (SF) · PIE roots (EFG) · Figures (EM) · Beekes (RAG) · DCC

function BrowseView({
  onOpenCard,
  onOpenFigure,
  role,
  browseTab,
  setBrowseTab,
  cardFilter,
  setCardFilter,
  spine
}) {
  // localQ drives search for non-cards tabs (roots, figures, beekes, dcc)
  // Cards tab search is cardFilter.q managed by App state — persists across CardDetail nav (BUG-059 resolved)
  const [localQ, setLocalQ] = React.useState(window.BWTL._LIB_LOCAL_Q || '');
  const tab = browseTab || 'cards';
  const setTab = setBrowseTab || (() => {});
  const q = tab === 'cards' ? cardFilter?.q || '' : localQ;
  const handleLocalQChange = v => {
    setLocalQ(v);
    window.BWTL._LIB_LOCAL_Q = v;
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 200px',
      maxWidth: 1640,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 14,
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "display",
    style: {
      fontSize: 32,
      margin: 0
    }
  }, "Browse"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-3)',
      margin: '4px 0 0',
      fontSize: 13
    }
  }, "Every word, root, figure and source the app draws from \u2014 filter to your study set, open any card to study it.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, tab !== 'cards' && /*#__PURE__*/React.createElement("div", {
    className: "search",
    style: {
      maxWidth: 300
    }
  }, /*#__PURE__*/React.createElement(Ic.search, null), /*#__PURE__*/React.createElement("input", {
    value: localQ,
    onChange: e => handleLocalQChange(e.target.value),
    placeholder: `Search ${tab}…`
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: () => window.dispatchEvent(new CustomEvent('bwtl:open-create'))
  }, /*#__PURE__*/React.createElement(Ic.plus, null), " New"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      marginBottom: 16,
      borderBottom: '1px solid var(--line)'
    }
  }, [['cards', 'Cards', window.BWTL.FLASHCARDS && Object.keys(window.BWTL.FLASHCARDS).length, 'SF.flashcards'], ['roots', 'PIE roots', Object.keys(window.BWTL.PIE_ROOTS || {}).length, 'EFG.nodes (pie_root)'], ['figures', 'Figures', Object.keys(window.BWTL.FIGURES || {}).length, 'EM.mythological_figures'], ['beekes', 'Beekes', (window.BWTL.BEEKES_DOCS || []).length, 'RAG · etymology collection'], ['dcc', 'DCC', (window.BWTL.DCC_WORDS || []).length, 'EFG · DCC dataset']].map(([k, lab, n, src]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      appearance: 'none',
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      padding: '10px 14px',
      borderBottom: '2px solid ' + (tab === k ? 'var(--acc)' : 'transparent'),
      marginBottom: -1,
      color: tab === k ? 'var(--fg)' : 'var(--fg-3)',
      fontWeight: 600,
      fontSize: 13,
      fontFamily: 'inherit',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7
    },
    title: src
  }, lab, " ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--fg-5)'
    }
  }, n || '')))), tab === 'cards' && /*#__PURE__*/React.createElement(CardsTab, {
    cardFilter: cardFilter,
    setCardFilter: setCardFilter,
    spine: spine,
    onOpenCard: onOpenCard
  }), tab === 'roots' && /*#__PURE__*/React.createElement(RootsTab, {
    q: q
  }), tab === 'figures' && /*#__PURE__*/React.createElement(FiguresTab, {
    q: q,
    onOpenFigure: onOpenFigure
  }), tab === 'beekes' && /*#__PURE__*/React.createElement(BeekesTab, {
    q: q
  }), tab === 'dcc' && (() => {
    // BUG-063: resolve language UUID from cardFilter.language so DCC backend can filter
    const _langObj = cardFilter?.language ? (window.BWTL.LANGUAGES || []).find(l => (l.code || l.name) === cardFilter.language) : null;
    return /*#__PURE__*/React.createElement(DccTab, {
      q: q,
      onOpenCard: onOpenCard,
      languageId: _langObj?.id || null
    });
  })());
}

// REV-3 CardFilterBar — drives the browse grid AND the App-level cardSpine (prev/next in CardDetail)
function CardFilterBar({
  cardFilter,
  setCardFilter,
  shown
}) {
  const langs = window.BWTL.LANGUAGE_FILTERS || [{
    code: null,
    name: 'All languages'
  }];
  const toggleChip = c => setCardFilter(f => ({
    ...f,
    chips: f.chips.includes(c) ? f.chips.filter(x => x !== c) : [...f.chips, c]
  }));
  const chipBtn = (key, label, icon) => /*#__PURE__*/React.createElement("button", {
    key: key,
    onClick: () => toggleChip(key),
    className: "btn xs ghost",
    style: {
      background: cardFilter.chips.includes(key) ? 'var(--acc-bg)' : 'transparent',
      borderColor: cardFilter.chips.includes(key) ? 'var(--acc-ring)' : 'var(--line)',
      color: cardFilter.chips.includes(key) ? 'var(--acc-2)' : 'var(--fg-3)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5
    }
  }, icon, " ", label);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      padding: 3,
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      borderRadius: 8
    }
  }, chipBtn('bookmarked', 'Study set', /*#__PURE__*/React.createElement(Ic.bookmark_filled, {
    style: {
      color: cardFilter.chips.includes('bookmarked') ? 'var(--acc-2)' : 'var(--fg-4)',
      width: 13,
      height: 13
    }
  })), chipBtn('has_video', 'Has video', /*#__PURE__*/React.createElement(Ic.play, {
    style: {
      width: 13,
      height: 13
    }
  })), chipBtn('missing_data', 'Missing data', /*#__PURE__*/React.createElement(Ic.spark, {
    style: {
      width: 13,
      height: 13
    }
  })), chipBtn('has_ety_layer', 'Has layer', null)), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      color: 'var(--fg-3)'
    }
  }, /*#__PURE__*/React.createElement(Ic.globe, null), /*#__PURE__*/React.createElement("select", {
    value: cardFilter.language || '',
    onChange: e => setCardFilter(f => ({
      ...f,
      language: e.target.value || null
    })),
    "aria-label": "Language filter",
    style: {
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      color: 'var(--fg)',
      borderRadius: 6,
      padding: '5px 8px',
      font: 'inherit',
      fontSize: 12
    }
  }, langs.map(l => /*#__PURE__*/React.createElement("option", {
    key: l.code || 'all',
    value: l.code || ''
  }, l.name, l.count != null ? ` (${l.count})` : '')))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      color: 'var(--fg-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 9.5,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--fg-4)'
    }
  }, "sort"), /*#__PURE__*/React.createElement("select", {
    value: cardFilter.sort,
    onChange: e => setCardFilter(f => ({
      ...f,
      sort: e.target.value
    })),
    style: {
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      color: 'var(--fg)',
      borderRadius: 6,
      padding: '5px 8px',
      font: 'inherit',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "modified"
  }, "Last modified"), /*#__PURE__*/React.createElement("option", {
    value: "alpha"
  }, "Alphabetical"), /*#__PURE__*/React.createElement("option", {
    value: "srs"
  }, "SRS due"), /*#__PURE__*/React.createElement("option", {
    value: "freq"
  }, "Frequency"))), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 11,
      color: 'var(--fg-4)'
    },
    className: "mono"
  }, shown, " shown", cardFilter.chips.includes('bookmarked') ? ' · study set' : '', cardFilter.language ? ' · filtered' : ''), (cardFilter.chips.length > 0 || cardFilter.language || cardFilter.sort !== 'modified') && /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    title: "Reset all filters to defaults",
    onClick: () => setCardFilter(f => ({
      ...f,
      chips: [],
      language: null,
      sort: 'modified'
    })),
    style: {
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, "\u21BA Reset filters"));
}

// REQ-037: browse-thumb card grid
function CardsTab({
  cardFilter,
  setCardFilter,
  spine,
  onOpenCard
}) {
  const [loading, setLoading] = React.useState(!Object.keys(window.BWTL.FLASHCARDS || {}).length);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  // REQ-040: multi-select delete state
  const [selected, setSelected] = React.useState(new Set());
  const [deleting, setDeleting] = React.useState(false);
  // BUG-099/109: server-side search state — null = not searching, Set = active search results
  const [serverSearchIds, setServerSearchIds] = React.useState(null);
  const [searchLoading, setSearchLoading] = React.useState(false);

  // BUG-099: server search when q is set
  React.useEffect(() => {
    const q = cardFilter.q;
    if (!q || !q.trim()) {
      setServerSearchIds(null);
      return;
    }
    setSearchLoading(true);
    window.BWTL._apiFetch('/api/search/flashcards?q=' + encodeURIComponent(q) + '&limit=500').then(data => {
      const results = data.results || [];
      results.forEach(r => {
        if (!window.BWTL.FLASHCARDS[r.id]) {
          window.BWTL.FLASHCARDS[r.id] = {
            id: r.id,
            word: r.word,
            word_or_phrase: r.word,
            definition: r.translation,
            language_id: r.language_id,
            language: r.language_name
          };
        }
      });
      setServerSearchIds(new Set(results.map(r => r.id)));
    }).catch(() => setServerSearchIds(null)).finally(() => setSearchLoading(false));
  }, [cardFilter.q]);
  const loadCards = React.useCallback(() => {
    setLoading(true);
    Promise.all([window.BWTL.fetchCards({
      limit: 5000
    }),
    // BUG-109: removed hardcoded 200 cap
    window.BWTL.fetchLanguages(), window.BWTL.getBookmarks('pl').catch(() => [])]).then(([cardData, langData, bookmarkData]) => {
      const langMap = {};
      (Array.isArray(langData) ? langData : []).forEach(l => {
        langMap[l.id] = l.name;
      });
      const rawCards = Array.isArray(cardData) ? cardData : cardData.items || [];
      // Build a set of bookmarked flashcard IDs
      const bookmarks = Array.isArray(bookmarkData) ? bookmarkData : bookmarkData?.items || [];
      window.BWTL.BOOKMARKS = bookmarks;
      window.dispatchEvent(new CustomEvent('bwtl:bookmarks-changed'));
      const bookmarkedIds = new Set(bookmarks.map(b => (b.flashcard_ref_id || '').toLowerCase()));
      rawCards.forEach(c => {
        if (!c.language && c.language_id) c.language = langMap[c.language_id] || null;
        c.bookmarked = bookmarkedIds.has((c.id || '').toLowerCase());
        window.BWTL.FLASHCARDS[c.id] = c; // update global cache for App's computeCardSpine
      });
      window.BWTL.LANGUAGES = Array.isArray(langData) ? langData : [];
      window.BWTL.LANGUAGE_FILTERS = [{
        code: null,
        name: 'All languages',
        count: rawCards.length
      }, ...(Array.isArray(langData) ? langData.map(l => ({
        code: l.code || l.name,
        name: l.name,
        count: rawCards.filter(c => c.language === l.name).length
      })) : [])];
      forceUpdate();
      window.dispatchEvent(new CustomEvent('bwtl:flashcards-loaded'));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => {
    loadCards();
    // BV-CROSS-LIBRARY-001: refresh when a new card is created
    window.addEventListener('bwtl:card-reload', loadCards);
    return () => window.removeEventListener('bwtl:card-reload', loadCards);
  }, [loadCards]);

  // Compute card list: server search > spine > local filter
  let cards;
  if (serverSearchIds !== null) {
    // BUG-099: server search is active — skip client-side filter entirely
    cards = [...serverSearchIds].map(id => window.BWTL.FLASHCARDS[id]).filter(Boolean);
    if (cardFilter.sort === 'alpha') cards.sort((a, b) => (a.word_or_phrase || a.word || '').localeCompare(b.word_or_phrase || b.word || ''));
  } else if (spine && spine.length > 0) {
    cards = spine.map(id => window.BWTL.FLASHCARDS[id]).filter(Boolean);
  } else {
    cards = Object.values(window.BWTL.FLASHCARDS || {});
    const langName = cardFilter.language ? (window.BWTL.LANGUAGE_FILTERS || []).find(l => l.code === cardFilter.language)?.name : null;
    if (langName) cards = cards.filter(c => c.language === langName);
    if (cardFilter.chips.includes('bookmarked')) cards = cards.filter(c => c.bookmarked);
    if (cardFilter.chips.includes('has_video')) cards = cards.filter(c => c.has_video);
    if (cardFilter.chips.includes('missing_data')) cards = cards.filter(c => !c.pie_root && !(c.pie_roots && c.pie_roots.length));
    // REQ-008: filter by etymology_layer presence
    if (cardFilter.chips.includes('has_ety_layer')) cards = cards.filter(c => !!c.etymology_layer);
    if (cardFilter.sort === 'alpha') cards.sort((a, b) => (a.word_or_phrase || a.word || '').localeCompare(b.word_or_phrase || b.word || ''));
  }
  if ((loading || searchLoading) && !cards.length) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, searchLoading ? 'Searching…' : 'Loading cards…');
  if (!loading && !searchLoading && !cards.length) return /*#__PURE__*/React.createElement("div", {
    className: "cards-empty",
    style: {
      padding: '40px 0',
      textAlign: 'center',
      color: 'var(--fg-4)',
      fontSize: 13
    }
  }, "No cards match this filter.", cardFilter.chips.includes('bookmarked') ? ' Your study set is empty — bookmark cards to add them.' : '');

  // REQ-040: bulk delete handler
  const handleDeleteSelected = async () => {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} card${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await Promise.all([...selected].map(id => window.BWTL.deleteCard(id).then(() => {
        delete window.BWTL.FLASHCARDS[id];
      })));
      setSelected(new Set());
      forceUpdate();
    } catch (e) {
      window.alert(`Delete failed: ${e?.message || e}`);
    } finally {
      setDeleting(false);
    }
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CardFilterBar, {
    cardFilter: cardFilter,
    setCardFilter: setCardFilter,
    shown: cards.length
  }), selected.size > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
      padding: '8px 12px',
      background: 'rgba(229,85,85,0.08)',
      border: '1px solid rgba(229,85,85,0.25)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: 'var(--fg-2)',
      fontWeight: 600
    }
  }, selected.size, " selected"), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: () => setSelected(new Set()),
    style: {
      fontSize: 11
    }
  }, "Clear selection"), /*#__PURE__*/React.createElement("button", {
    className: "btn xs",
    onClick: handleDeleteSelected,
    disabled: deleting,
    style: {
      marginLeft: 'auto',
      background: 'var(--danger, #e55)',
      color: '#fff',
      border: 0,
      fontSize: 11
    }
  }, deleting ? 'Deleting…' : `Delete selected (${selected.size})`)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 10
    }
  }, cards.map(c => {
    const isFigure = !!c.figure_link;
    const noPie = !c.pie_root && !(c.pie_roots && c.pie_roots.length);
    const word = c.word_or_phrase || c.word;
    const isChecked = selected.has(c.id);
    return /*#__PURE__*/React.createElement("div", {
      key: c.id,
      className: `card browse-card${isChecked ? ' selected' : ''}`,
      style: {
        position: 'relative'
      },
      onClick: e => {
        if (e.target.closest('[data-select-check]')) return;
        onOpenCard(c.id);
      }
    }, /*#__PURE__*/React.createElement("div", {
      "data-select-check": true,
      style: {
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 10
      },
      onClick: e => {
        e.stopPropagation();
        setSelected(s => {
          const n = new Set(s);
          n.has(c.id) ? n.delete(c.id) : n.add(c.id);
          return n;
        });
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: isChecked,
      readOnly: true,
      "aria-label": `Select card: ${word}`,
      style: {
        cursor: 'pointer',
        width: 15,
        height: 15,
        accentColor: 'var(--acc)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: `browse-thumb${isFigure ? ' figure' : ''}${noPie ? ' no-pie' : ''}`,
      style: c.image_url ? {
        backgroundImage: `url(${c.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}
    }, c.image_caption && /*#__PURE__*/React.createElement("span", {
      className: "bt-cap"
    }, c.image_caption), /*#__PURE__*/React.createElement("div", {
      className: "bt-corner"
    }, c.has_video && /*#__PURE__*/React.createElement("span", {
      className: "bt-badge video"
    }, /*#__PURE__*/React.createElement(Ic.play, null), " video"), c.bookmarked && /*#__PURE__*/React.createElement("span", {
      className: "bt-badge star"
    }, /*#__PURE__*/React.createElement(Ic.bookmark_filled, null))), /*#__PURE__*/React.createElement("div", {
      className: "bt-word"
    }, word)), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '10px 14px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 10,
        color: 'var(--fg-4)'
      }
    }, c.language, " \xB7 ", c.pos), /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 10.5,
        color: 'var(--fg-3)'
      }
    }, c.ipa_pronunciation || c.ipa)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--fg-2)',
        marginTop: 6,
        lineHeight: 1.45
      }
    }, c.definition), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8,
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap'
      }
    }, isFigure && /*#__PURE__*/React.createElement("span", {
      className: "pill myth",
      style: {
        fontSize: 9.5
      }
    }, "figure"), c.pie_roots && c.pie_roots.length > 1 ? /*#__PURE__*/React.createElement("span", {
      className: "pill pie",
      style: {
        fontSize: 9.5
      }
    }, c.pie_roots.length, " roots") : c.pie_root && /*#__PURE__*/React.createElement("span", {
      className: "pill pie",
      style: {
        fontSize: 9.5
      }
    }, c.pie_root), noPie && /*#__PURE__*/React.createElement("span", {
      className: "pill warn",
      style: {
        fontSize: 9.5
      }
    }, "no PIE"), (c.cognates || c.english_cognates) && /*#__PURE__*/React.createElement("span", {
      className: "pill ghost",
      style: {
        fontSize: 9.5
      }
    }, "cog"))));
  })));
}
function RootsTab({
  q
}) {
  const [roots, setRoots] = React.useState(Object.values(window.BWTL.PIE_ROOTS));
  const [loading, setLoading] = React.useState(!roots.length);
  React.useEffect(() => {
    setLoading(true);
    window.BWTL.fetchEfgRoots().then(data => setRoots(Array.isArray(data) ? data : data.roots || [])).catch(console.error).finally(() => setLoading(false));
  }, []);
  const filtered = roots.filter(r => !q || (r.root || '').toLowerCase().includes(q.toLowerCase()) || (r.gloss || r.meaning || '').toLowerCase().includes(q.toLowerCase()));
  if (loading) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "Loading PIE roots\u2026");
  if (!roots.length) return /*#__PURE__*/React.createElement("div", {
    className: "roots-empty",
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "No PIE roots loaded. The EFG service may be offline.");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill graph",
    style: {
      fontSize: 10.5
    }
  }, "EFG \xB7 ", roots.length, " PIE root nodes"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 11,
      color: 'var(--fg-4)'
    },
    className: "mono"
  }, filtered.length, " shown")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: 10
    }
  }, filtered.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.id || r.root || i,
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--line-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 22,
      color: 'var(--pie)'
    }
  }, r.root || r.label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, r.pie_ipa), r.pie_audio_url && /*#__PURE__*/React.createElement("button", {
    className: "pie-audio",
    style: {
      width: 22,
      height: 22
    },
    onClick: () => new Audio(r.pie_audio_url).play()
  }, /*#__PURE__*/React.createElement(Ic.play, null)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--fg-2)'
    }
  }, r.gloss || r.meaning ? `"${r.gloss || r.meaning}"` : ''), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      display: 'flex',
      gap: 4,
      flexWrap: 'wrap'
    }
  }, r.word_count > 0 && /*#__PURE__*/React.createElement("span", {
    className: "pill ghost",
    style: {
      fontSize: 9.5
    }
  }, r.word_count, " cards"), r.atomic && /*#__PURE__*/React.createElement("span", {
    className: "pill pie",
    style: {
      fontSize: 9.5
    }
  }, "compound")))))));
}
function FiguresTab({
  q,
  onOpenFigure
}) {
  const [figs, setFigs] = React.useState(Object.values(window.BWTL.FIGURES));
  const [loading, setLoading] = React.useState(!figs.length);
  const [selectedFig, setSelectedFig] = React.useState(null); // detail modal

  React.useEffect(() => {
    setLoading(true);
    window.BWTL.fetchFigures(100).then(data => setFigs(Array.isArray(data) ? data : data.items || [])).catch(console.error).finally(() => setLoading(false));
  }, []);
  const filtered = figs.filter(f => !q || (f.english_name || '').toLowerCase().includes(q.toLowerCase()) || (f.greek_name || '').includes(q) || (f.latin_name || '').toLowerCase().includes(q.toLowerCase()));
  if (loading) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "Loading figures\u2026");
  if (!figs.length) return /*#__PURE__*/React.createElement("div", {
    className: "figures-empty",
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "No mythology figures loaded.");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill myth",
    style: {
      fontSize: 10.5
    }
  }, "EM \xB7 ", figs.length, " figures"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 11,
      color: 'var(--fg-4)'
    },
    className: "mono"
  }, filtered.length, " shown")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 10
    }
  }, filtered.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.id,
    className: "card",
    style: {
      cursor: 'pointer'
    },
    onClick: () => setSelectedFig(f)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16/10',
      background: 'linear-gradient(135deg, var(--myth-bg), var(--bg-3))',
      borderBottom: '1px solid var(--line-soft)',
      overflow: 'hidden',
      position: 'relative'
    }
  }, f.image_url ? /*#__PURE__*/React.createElement("img", {
    src: f.image_url,
    alt: f.english_name || f.name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: 6,
      left: 8,
      fontFamily: 'var(--ff-mono)',
      fontSize: 9,
      color: 'var(--fg-4)'
    }
  }, (f.figure_type || '').toLowerCase())), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 18,
      color: 'var(--myth)'
    }
  }, f.english_name || f.name), /*#__PURE__*/React.createElement("div", {
    className: "greek",
    style: {
      fontSize: 13,
      color: 'var(--fg-2)'
    }
  }, f.greek_name || f.latin_name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-4)',
      marginTop: 4
    }
  }, f.domain), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      display: 'flex',
      gap: 4,
      flexWrap: 'wrap'
    }
  }, f.figure_type && /*#__PURE__*/React.createElement("span", {
    className: "pill myth",
    style: {
      fontSize: 9.5
    }
  }, f.figure_type), f.pie_root && f.pie_root !== '?' && /*#__PURE__*/React.createElement("span", {
    className: "pill pie",
    style: {
      fontSize: 9.5
    }
  }, f.pie_root)))))), selectedFig && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      zIndex: 998
    },
    onClick: () => setSelectedFig(null)
  }), /*#__PURE__*/React.createElement("dialog", {
    open: true,
    style: {
      position: 'fixed',
      inset: '10vh 10vw',
      width: '80vw',
      maxHeight: '80vh',
      margin: 0,
      padding: 0,
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-lg)',
      boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      borderBottom: '1px solid var(--line-soft)',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill myth",
    style: {
      fontSize: 10.5
    }
  }, selectedFig.english_name || selectedFig.name), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--fg-4)',
      flex: 1
    }
  }, "figure ", selectedFig.id), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: () => setSelectedFig(null)
  }, "\u2715 Close")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      overflowY: 'auto',
      flex: 1
    }
  }, selectedFig.image_url && /*#__PURE__*/React.createElement("img", {
    src: selectedFig.image_url,
    alt: selectedFig.english_name,
    style: {
      maxHeight: 200,
      borderRadius: 8,
      marginBottom: 14,
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 26,
      color: 'var(--myth)',
      marginBottom: 4
    }
  }, selectedFig.english_name || selectedFig.name), /*#__PURE__*/React.createElement("div", {
    className: "greek",
    style: {
      fontSize: 16,
      color: 'var(--fg-2)',
      marginBottom: 12
    }
  }, selectedFig.greek_name, " ", selectedFig.latin_name && `· ${selectedFig.latin_name}`), selectedFig.description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--fg-2)',
      lineHeight: 1.6,
      marginBottom: 14
    }
  }, selectedFig.description), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      fontSize: 12
    }
  }, [['Type', selectedFig.figure_type], ['Domain', selectedFig.domain], ['Role', selectedFig.role], ['Symbols', selectedFig.symbols], ['PIE root', selectedFig.pie_root], ['Source', selectedFig.mythology_source]].filter(([, v]) => v).map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      background: 'var(--bg-2)',
      padding: '8px 10px',
      borderRadius: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 3
    }
  }, k), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--fg)'
    }
  }, String(v)))))))));
}
function BeekesTab({
  q
}) {
  const [docs, setDocs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const lastQ = React.useRef('');
  React.useEffect(() => {
    const term = q || '*';
    if (term === lastQ.current) return;
    lastQ.current = term;
    setLoading(true);
    window.BWTL._apiFetch('/api/etymology/search?q=' + encodeURIComponent(term) + '&source=beekes&limit=50') // BUG-104: scope to source=beekes only
    .then(data => {
      const items = Array.isArray(data) ? data : data.results || data.items || [];
      setDocs(items.map((d, i) => ({
        id: d.id || i,
        headword: d.word || d.title || d.headword || term,
        excerpt: d.text || d.content || d.excerpt || '',
        source: d.source || 'etymology',
        confidence: (d.score || 0) > 0.8 ? 'high' : 'medium',
        page: d.page || d.page_ref || ''
      })));
    }).catch(console.error).finally(() => setLoading(false));
  }, [q]);
  if (loading) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "Searching Beekes entries\u2026");
  if (!docs.length) return /*#__PURE__*/React.createElement("div", {
    className: "beekes-empty",
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "Type a root or word in the search bar above to browse Beekes dictionary entries.");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill accent",
    style: {
      fontSize: 10.5
    }
  }, "Beekes \xB7 etymology"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 11,
      color: 'var(--fg-4)'
    },
    className: "mono"
  }, docs.length, " results")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, docs.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.id,
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px',
      display: 'grid',
      gridTemplateColumns: '160px 1fr auto',
      gap: 14,
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 18,
      color: 'var(--acc-2)'
    }
  }, d.headword), d.page && /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 10.5,
      color: 'var(--fg-4)',
      marginTop: 2
    }
  }, "Beekes p.", d.page)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--fg-2)',
      lineHeight: 1.5
    }
  }, d.excerpt), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost"
  }, /*#__PURE__*/React.createElement(Ic.book, null), " Read full"))))));
}
function DccTab({
  q,
  onOpenCard,
  languageId
}) {
  const [words, setWords] = React.useState(window.BWTL.DCC_WORDS || []);
  const [loading, setLoading] = React.useState(!words.length);
  const [selectedEntry, setSelectedEntry] = React.useState(null); // REQ-031: DCC full content modal
  const [sortBy, setSortBy] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');
  const handleSort = key => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');else {
      setSortBy(key);
      setSortDir('asc');
    }
  };
  React.useEffect(() => {
    setLoading(true);
    // BUG-063: pass language_id so backend filters (DCC is Greek-only)
    const url = languageId ? `/api/v1/dcc/list?language_id=${encodeURIComponent(languageId)}` : '/api/v1/dcc/list';
    window.BWTL._apiFetch(url).then(data => {
      const list = Array.isArray(data) ? data : data.words || data.nodes || [];
      // BUG-062: enrich sf_linked / sf_card_id from FLASHCARDS cache so the
      // "linked" pill and "Open SF card" button in the detail modal actually work.
      const fcMap = window.BWTL.FLASHCARDS || {};
      const greekNorm = s => s ? s.normalize('NFC').toLowerCase().trim() : '';
      const sfByGreek = {};
      Object.values(fcMap).forEach(c => {
        const w = (c.word_or_phrase || c.word || '').normalize('NFC').toLowerCase().trim();
        if (w) sfByGreek[w] = c.id;
      });
      list.forEach(w => {
        const label = greekNorm(w.label || w.word || '');
        const matchId = sfByGreek[label];
        if (matchId) {
          w.sf_linked = true;
          w.sf_card_id = matchId;
        } else {
          w.sf_linked = false;
          w.sf_card_id = null;
        }
      });
      window.BWTL.DCC_WORDS = list;
      setWords(list);
    }).catch(console.error).finally(() => setLoading(false));
  }, [languageId]);
  const filtered = words.filter(w => !q || (w.label || w.word || '').includes(q) || (w.gloss || w.definition || '').toLowerCase().includes(q.toLowerCase()));
  const sorted = sortBy ? [...filtered].sort((a, b) => {
    const av = a[sortBy] ?? '';
    const bv = b[sortBy] ?? '';
    const r = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? r : -r;
  }) : filtered;
  if (loading) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "Loading DCC word list\u2026");
  if (!words.length) return /*#__PURE__*/React.createElement("div", {
    className: "dcc-empty",
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "DCC word list unavailable. EFG service may be offline.");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill graph",
    style: {
      fontSize: 10.5
    }
  }, "DCC \xB7 Greek core vocabulary"), /*#__PURE__*/React.createElement("span", {
    className: "pill ghost",
    style: {
      fontSize: 10.5
    }
  }, words.length, " entries \xB7 ranked by frequency"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      fontSize: 11,
      color: 'var(--fg-4)'
    },
    className: "mono"
  }, "showing ", filtered.length)), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 10,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: 'var(--bg-2)'
    }
  }, [['Rank', 'frequency_rank'], ['Word', 'label'], ['Gloss', 'gloss'], ['POS', 'pos'], ['PIE root', 'pie_root'], ['Freq/10k', 'freq_per_10k'], ['SF card', 'sf_linked']].map(([h, key]) => /*#__PURE__*/React.createElement("th", {
    key: h,
    onClick: () => handleSort(key),
    style: {
      padding: '10px 12px',
      textAlign: 'left',
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      cursor: 'pointer',
      userSelect: 'none'
    }
  }, h, sortBy === key ? sortDir === 'asc' ? ' ↑' : ' ↓' : '')))), /*#__PURE__*/React.createElement("tbody", null, sorted.map((w, i) => /*#__PURE__*/React.createElement("tr", {
    key: w.id || w.rank || i,
    style: {
      borderTop: '1px solid var(--line-soft)',
      cursor: 'pointer'
    },
    onClick: () => setSelectedEntry(w)
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 12px',
      fontFamily: 'var(--ff-mono)',
      fontSize: 11,
      color: 'var(--fg-4)'
    }
  }, w.frequency_rank || w.rank || i + 1), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 12px',
      maxWidth: 120
    },
    className: "greek"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      wordBreak: 'break-all',
      overflowWrap: 'anywhere',
      whiteSpace: 'normal',
      display: 'block'
    }
  }, w.label || w.word)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 12px',
      fontSize: 12,
      color: 'var(--fg-2)',
      wordBreak: 'break-word',
      whiteSpace: 'normal'
    }
  }, w.gloss || w.definition), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 12px',
      fontFamily: 'var(--ff-mono)',
      fontSize: 10.5,
      color: 'var(--fg-4)'
    }
  }, w.pos || w.part_of_speech), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 12px'
    }
  }, (w.pie_root || w.pie) && /*#__PURE__*/React.createElement("span", {
    className: "pill pie",
    style: {
      fontSize: 9.5
    }
  }, w.pie_root || w.pie)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 12px',
      fontFamily: 'var(--ff-mono)',
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, w.freq_per_10k || w.frequency), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px 12px'
    }
  }, w.sf_linked ? /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 9.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot ok"
  }), "linked") : /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: e => {
      e.stopPropagation();
      // BUG-116: create flashcard from DCC row — POST /api/flashcards/
      const langId = (window.BWTL.LANGUAGES || []).find(l => l.name === 'Ancient Greek' || l.code && l.code === 'el')?.id || null;
      const word = w.label || w.word || '';
      const def = w.gloss || w.definition || '';
      window.BWTL._apiFetch('/api/flashcards/', {
        method: 'POST',
        body: JSON.stringify({
          word_or_phrase: word,
          definition: def,
          language_id: langId
        })
      }).then(card => {
        if (card?.id) {
          // Mark as SF-linked in local cache
          w.sf_linked = true;
          w.sf_card_id = card.id;
          if (window.BWTL.FLASHCARDS) window.BWTL.FLASHCARDS[card.id] = card;
          window.dispatchEvent(new CustomEvent('bwtl:flashcards-loaded'));
          setWords(prev => [...prev]); // force re-render
        }
      }).catch(err => console.error('[DCC CreateCard]', err));
    }
  }, "Create card")))))), selectedEntry && /*#__PURE__*/React.createElement("dialog", {
    open: true,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 999,
      width: '90vw',
      maxWidth: 600,
      margin: 'auto',
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-lg)',
      padding: 0,
      boxShadow: '0 24px 80px rgba(0,0,0,0.7)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      borderBottom: '1px solid var(--line-soft)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--fg-4)'
    }
  }, "DCC entry #", selectedEntry.frequency_rank || selectedEntry.rank), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    onClick: () => setSelectedEntry(null)
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "greek",
    style: {
      fontSize: 32,
      fontWeight: 600,
      marginBottom: 4
    }
  }, selectedEntry.label || selectedEntry.word), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--fg-2)',
      marginBottom: 16,
      lineHeight: 1.5
    }
  }, selectedEntry.gloss || selectedEntry.definition), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      fontSize: 12
    }
  }, [['Part of speech', selectedEntry.pos || selectedEntry.part_of_speech], ['PIE root', selectedEntry.pie_root || selectedEntry.pie], ['DCC rank', selectedEntry.frequency_rank || selectedEntry.rank], ['Freq/10k', selectedEntry.freq_per_10k || selectedEntry.frequency], ['Semantic group', selectedEntry.semantic_group || selectedEntry.category], ['Source', selectedEntry.source]].filter(([, v]) => v).map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      background: 'var(--bg-2)',
      padding: '8px 10px',
      borderRadius: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 3
    }
  }, k), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--fg)'
    }
  }, String(v))))), selectedEntry.notes && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 12.5,
      color: 'var(--fg-2)',
      lineHeight: 1.55
    }
  }, selectedEntry.notes), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: 'flex',
      gap: 8
    }
  }, selectedEntry.sf_card_id && /*#__PURE__*/React.createElement("button", {
    className: "btn sm primary",
    onClick: () => {
      setSelectedEntry(null);
      onOpenCard(selectedEntry.sf_card_id);
    }
  }, "Open SF card"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    onClick: () => setSelectedEntry(null)
  }, "Close")))), selectedEntry && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 998
    },
    onClick: () => setSelectedEntry(null)
  }));
}
window.BrowseView = BrowseView;
window.LibraryView = BrowseView; // REV-3 back-compat alias

// ─── generate.jsx ───
// GENERATE — ArtForge etymology-only surface.
// Tabs: Jobs (history) · From word · From figure · Storyboard editor

function GenerateView({
  cardId,
  role
}) {
  const [tab, setTab] = React.useState('jobs');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 200px',
      maxWidth: 1640,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 14,
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "display",
    style: {
      fontSize: 32,
      margin: 0
    }
  }, "Generate"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-3)',
      margin: '4px 0 0',
      fontSize: 13,
      maxWidth: '70ch'
    }
  }, "ArtForge pipeline \u2014 etymology-driven generation only. Full ArtForge (galleries, library, non-etymology projects) lives at ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--forge)'
    }
  }, "artforge.rentyourcio.com"), ".")), /*#__PURE__*/React.createElement("a", {
    className: "btn ghost",
    href: "#",
    target: "_blank"
  }, /*#__PURE__*/React.createElement(Ic.link, null), " Open standalone ArtForge")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      marginBottom: 16,
      borderBottom: '1px solid var(--line)'
    }
  }, [['jobs', 'Jobs', window.BWTL.AF_JOBS.length], ['from_word', 'From word', null], ['from_figure', 'From figure', null], ['scenes', 'Scene editor', null], ['enrich', 'Enrich story', null]].map(([k, lab, n]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      appearance: 'none',
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      padding: '10px 14px',
      borderBottom: '2px solid ' + (tab === k ? 'var(--forge)' : 'transparent'),
      marginBottom: -1,
      color: tab === k ? 'var(--fg)' : 'var(--fg-3)',
      fontWeight: 600,
      fontSize: 13,
      fontFamily: 'inherit',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7
    }
  }, lab, " ", n !== null && /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--fg-5)'
    }
  }, n)))), tab === 'jobs' && /*#__PURE__*/React.createElement(JobsTab, null), tab === 'from_word' && /*#__PURE__*/React.createElement(FromWordTab, {
    cardId: cardId
  }), tab === 'from_figure' && /*#__PURE__*/React.createElement(FromFigureTab, null), tab === 'scenes' && /*#__PURE__*/React.createElement(SceneEditorTab, null), tab === 'enrich' && /*#__PURE__*/React.createElement(EnrichTab, null));
}
function JobsTab() {
  const [jobs, setJobs] = React.useState(window.BWTL.AF_JOBS || []);
  const [loading, setLoading] = React.useState(!jobs.length);
  React.useEffect(() => {
    setLoading(true);
    window.BWTL.fetchAfJobs().then(data => setJobs(Array.isArray(data) ? data : data.items || data.jobs || [])).catch(console.error).finally(() => setLoading(false));
  }, []);
  if (loading) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "Loading jobs\u2026");
  if (!jobs.length) return /*#__PURE__*/React.createElement("div", {
    className: "jobs-empty",
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "No video generation jobs yet. Use \u201CFrom word\u201D or \u201CFrom figure\u201D to queue your first job.");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill ghost",
    style: {
      fontSize: 10.5
    }
  }, jobs.length, " total jobs"), /*#__PURE__*/React.createElement("span", {
    className: "pill forge",
    style: {
      fontSize: 10.5
    }
  }, "ArtForge \xB7 /api/external/jobs"), /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 10.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot ok"
  }), " ", jobs.filter(j => j.status === 'done').length, " done"), /*#__PURE__*/React.createElement("span", {
    className: "pill warn",
    style: {
      fontSize: 10.5
    }
  }, jobs.filter(j => j.status === 'rendering' || j.status === 'queued').length, " active"), /*#__PURE__*/React.createElement("span", {
    className: "pill err",
    style: {
      fontSize: 10.5
    }
  }, jobs.filter(j => j.status === 'failed').length, " failed")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, jobs.map(j => /*#__PURE__*/React.createElement("div", {
    key: j.id,
    className: "card",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px',
      display: 'grid',
      gridTemplateColumns: '140px 1fr 160px 220px 100px auto',
      gap: 14,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: `pill ${j.status === 'done' ? 'ok' : j.status === 'failed' ? 'err' : j.status === 'rendering' ? 'warn' : 'ghost'}`,
    style: {
      fontSize: 10,
      width: 'fit-content'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: `dot ${j.status === 'done' ? 'ok' : j.status === 'failed' ? 'err' : j.status === 'rendering' ? 'warn' : ''}`
  }), j.status), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-2)'
    }
  }, j.kind.replace('_', ' ')), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg)',
      marginLeft: 8,
      fontWeight: 600
    }
  }, j.subject)), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 10.5,
      color: 'var(--fg-5)',
      marginTop: 2
    }
  }, j.source), j.error && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--err)',
      marginTop: 4
    }
  }, j.error)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, j.model), j.scenes && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--fg-4)'
    }
  }, "\xB7 ", j.scenes, " scenes")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, j.started, " ", j.eta && /*#__PURE__*/React.createElement(React.Fragment, null, "\xB7 eta ", j.eta), j.duration && /*#__PURE__*/React.createElement(React.Fragment, null, "\xB7 ", j.duration)), j.status === 'rendering' && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      background: 'var(--bg-3)',
      borderRadius: 99,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: j.progress * 100 + '%',
      height: '100%',
      background: 'var(--forge)'
    }
  }))), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--fg-5)'
    }
  }, j.id), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, j.status === 'done' && /*#__PURE__*/React.createElement("button", {
    className: "btn xs"
  }, /*#__PURE__*/React.createElement(Ic.play, null)), j.status === 'failed' && /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost"
  }, /*#__PURE__*/React.createElement(Ic.refresh, null)), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost"
  }, /*#__PURE__*/React.createElement(Ic.more, null))))))));
}
function FromWordTab({
  cardId
}) {
  const [card, setCard] = React.useState(window.BWTL.FLASHCARDS[cardId] || null);
  const [generating, setGenerating] = React.useState(false);
  const [genJobId, setGenJobId] = React.useState(null);
  const [genError, setGenError] = React.useState(null);
  React.useEffect(() => {
    if (!cardId) return;
    if (window.BWTL.FLASHCARDS[cardId]) {
      setCard(window.BWTL.FLASHCARDS[cardId]);
      return;
    }
    window.BWTL.fetchCard(cardId).then(c => setCard(c)).catch(console.error);
  }, [cardId]);
  const handleGenerate = () => {
    if (!card?.id) return;
    setGenerating(true);
    setGenError(null);
    window.BWTL.generateVideo(card.id).then(data => {
      setGenJobId(data.job_id || data.id || null);
      setGenerating(false);
    }).catch(err => {
      setGenError(err.message);
      setGenerating(false);
    });
  };
  if (!card) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "Select a card first in the Study workspace.");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 14px',
      borderBottom: '1px solid var(--line-soft)',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, "Subject"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 32
    }
  }, card.word), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 12,
      color: 'var(--fg-3)',
      marginTop: 2
    }
  }, card.ipa_pronunciation), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--fg-2)',
      marginTop: 8
    }
  }, card.definition), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'flex',
      gap: 4,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill pie",
    style: {
      fontSize: 9.5
    }
  }, card.pie_root), /*#__PURE__*/React.createElement("span", {
    className: "pill ghost",
    style: {
      fontSize: 9.5
    }
  }, card.language)), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Ic.shuffle, null), " Change subject"))), /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 6
    }
  }, "Style"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 4
    }
  }, ['classical (Hesiodic)', 'symbolic / minimal', 'photoreal', 'animated diagram'].map((s, i) => /*#__PURE__*/React.createElement("label", {
    key: s,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 10px',
      borderRadius: 6,
      background: i === 0 ? 'var(--bg-3)' : 'var(--bg-2)',
      border: '1px solid ' + (i === 0 ? 'var(--forge-ring)' : 'var(--line-soft)'),
      cursor: 'pointer',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "style",
    defaultChecked: i === 0
  }), " ", s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 6
    }
  }, "Length"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, ['3 scenes (12s)', '5 scenes (22s)', '7 scenes (40s)'].map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: s,
    className: "btn xs ghost",
    style: {
      background: i === 0 ? 'var(--bg-3)' : 'transparent'
    }
  }, s))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      margin: '12px 0 6px'
    }
  }, "Embed etymology"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 4,
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    defaultChecked: true
  }), " Show PIE root visually"), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    defaultChecked: true
  }), " Voiceover with IPA narration"), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox"
  }), " Side-card cognate sequence")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: 12,
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 8,
      fontSize: 12,
      color: 'var(--fg-3)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--fg-2)'
    }
  }, "Will hit:"), " ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--forge)'
    }
  }, "POST artforge /api/external/generate-video"), " with embedded ", card.pie_root, " context \xB7 poll ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "GET /api/external/jobs/", '{', "id", '}'), " \xB7 result stored in ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "SF.flashcards.video_url")), genError && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--err)',
      fontSize: 12,
      padding: '6px 0'
    }
  }, genError), genJobId && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 10px',
      borderRadius: 6,
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      fontSize: 12,
      color: 'var(--fg-2)',
      marginTop: 8
    }
  }, "Job queued: ", /*#__PURE__*/React.createElement("span", {
    className: "mono gen-job-id"
  }, genJobId)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost"
  }, /*#__PURE__*/React.createElement(Ic.pencil, null), " Scene editor first"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    style: {
      '--b-bg': 'var(--forge)',
      '--b-fg': '#0b0918',
      '--b-bd': 'var(--forge)'
    },
    onClick: handleGenerate,
    disabled: generating
  }, /*#__PURE__*/React.createElement(Ic.spark, null), " ", generating ? 'Generating…' : 'Generate'))));
}
function FromFigureTab() {
  const [figures, setFigures] = React.useState(Object.values(window.BWTL.FIGURES));
  const [loading, setLoading] = React.useState(!figures.length);
  React.useEffect(() => {
    setLoading(true);
    window.BWTL.fetchFigures(50).then(data => setFigures(Array.isArray(data) ? data : data.items || [])).catch(console.error).finally(() => setLoading(false));
  }, []);
  if (loading) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "Loading figures\u2026");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--fg-3)',
      marginBottom: 14
    }
  }, "Generate a 5-scene story for a mythological figure. Hits ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--forge)'
    }
  }, "POST /api/v1/stories/from-figure"), " with figure name, Greek name, domain, origin story, etymology."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 10
    }
  }, figures.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.id,
    className: "card",
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '4/3',
      background: 'linear-gradient(135deg, var(--myth-bg), var(--forge-bg))',
      borderBottom: '1px solid var(--line-soft)',
      display: 'flex',
      alignItems: 'flex-end',
      padding: 8,
      fontFamily: 'var(--ff-mono)',
      fontSize: 9,
      color: 'var(--fg-4)'
    }
  }, f.image_caption || 'placeholder'), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 16,
      color: 'var(--myth)'
    }
  }, f.english_name), /*#__PURE__*/React.createElement("div", {
    className: "greek",
    style: {
      fontSize: 12,
      color: 'var(--fg-2)'
    }
  }, f.greek_name), /*#__PURE__*/React.createElement("button", {
    className: "btn xs primary",
    style: {
      marginTop: 8,
      '--b-bg': 'var(--forge)',
      '--b-fg': '#0b0918',
      '--b-bd': 'var(--forge)'
    }
  }, /*#__PURE__*/React.createElement(Ic.spark, null), " Generate story"))))));
}
function SceneEditorTab() {
  const scenes = [{
    id: 1,
    title: 'Inception',
    prompt: 'A weathered Titan, Mnemosyne, sits beside a still pool in Pieria at dusk. Long shadows.',
    tts: 'In Pieria, Mnemosyne sits…',
    model: 'veo-3'
  }, {
    id: 2,
    title: 'Encounter',
    prompt: 'Zeus, in mortal aspect, approaches; the air thickens with ritual silence.',
    tts: 'Zeus descended in mortal aspect…',
    model: 'veo-3'
  }, {
    id: 3,
    title: 'Nine nights',
    prompt: 'Time-lapse of nine moons crossing the sky over a single still figure.',
    tts: 'For nine nights, time pooled…',
    model: 'veo-3'
  }, {
    id: 4,
    title: 'The Muses',
    prompt: 'Nine young women emerge from a forest spring carrying instruments and scrolls.',
    tts: 'And then, nine sisters…',
    model: 'veo-3'
  }, {
    id: 5,
    title: 'Coda',
    prompt: 'Cut to a modern hand writing the Greek word μνήμη; fade.',
    tts: 'From her, everything we remember.',
    model: 'veo-3'
  }];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "display",
    style: {
      fontSize: 18
    }
  }, "Story: Mnemosyne"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--fg-4)'
    },
    className: "mono"
  }, "story_47c0b1a \xB7 5 scenes \xB7 etymology context: *men-")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost"
  }, /*#__PURE__*/React.createElement(Ic.plus, null), " Add scene"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm primary",
    style: {
      '--b-bg': 'var(--forge)',
      '--b-fg': '#0b0918',
      '--b-bd': 'var(--forge)'
    }
  }, /*#__PURE__*/React.createElement(Ic.spark, null), " Render all"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, scenes.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    className: "card",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '160px 1fr 200px',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16/9',
      background: 'linear-gradient(135deg, var(--forge-bg), var(--bg-3))',
      display: 'flex',
      alignItems: 'flex-end',
      padding: 8,
      fontFamily: 'var(--ff-mono)',
      fontSize: 9,
      color: 'var(--fg-4)'
    }
  }, "scene ", s.id, " preview"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, "Scene ", s.id, " \xB7 ", s.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--fg-2)',
      marginTop: 4,
      lineHeight: 1.5
    }
  }, s.prompt), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 11.5,
      color: 'var(--fg-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-4)',
      fontFamily: 'var(--ff-mono)',
      fontSize: 9.5,
      textTransform: 'uppercase',
      letterSpacing: '0.06em'
    }
  }, "VO \u25B8 "), "\"", s.tts, "\"")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--fg-4)'
    }
  }, s.model), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost"
  }, /*#__PURE__*/React.createElement(Ic.refresh, null)), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost"
  }, /*#__PURE__*/React.createElement(Ic.spark, null)), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost"
  }, /*#__PURE__*/React.createElement(Ic.more, null)))))))));
}
function EnrichTab() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--fg-3)',
      marginBottom: 14,
      lineHeight: 1.6
    }
  }, "Embed Etymython facts into an existing ArtForge story. Hits ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--forge)'
    }
  }, "POST /api/stories/", '{', "id", '}', "/enrich"), " \xB7 pulls suggestions from ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--forge)'
    }
  }, "GET /etymology-suggestions"), "."), /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 10
    }
  }, "Suggested embeds"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, [{
    fact: 'Mnemosyne is the mother of the nine Muses by Zeus over nine consecutive nights.',
    confidence: 0.94,
    source: 'EM.fun_facts · figure mnemosyne'
  }, {
    fact: 'In the underworld, initiates drink from Mnemosyne to retain knowledge — opposite of Lethe.',
    confidence: 0.88,
    source: 'EM.fun_facts · figure mnemosyne'
  }, {
    fact: '*men- "to think" gives both her name and the English word "memory".',
    confidence: 0.97,
    source: 'EFG.efg_pie_explorer_data · *men-'
  }].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 100px 80px',
      gap: 10,
      padding: '10px 12px',
      background: 'var(--bg-1)',
      border: '1px solid var(--line-soft)',
      borderRadius: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--fg-2)',
      lineHeight: 1.5
    }
  }, s.fact), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--fg-5)',
      marginTop: 4
    }
  }, s.source)), /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot ok"
  }), (s.confidence * 100).toFixed(0), "%"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost"
  }, /*#__PURE__*/React.createElement(Ic.x, null)), /*#__PURE__*/React.createElement("button", {
    className: "btn xs primary"
  }, /*#__PURE__*/React.createElement(Ic.check, null))))))));
}
window.GenerateView = GenerateView;

// ─── theodoros.jsx ───
// Chat index — top-nav surface, formerly "Theodoros review queue" (REV item 5).
//
// What it ISN'T anymore: a review queue with an approval gate. Every user
// accepts their own chat-promoted insights directly (REV item 4), so the
// queue concept is gone.
//
// What it IS: a cross-app index of all chat threads across cards, plus an
// audit log of every Accept action. Sub-tabs reflect the rename note from
// the revision request:
//   • Threads     — index of conversations (jump back to rabbit holes)
//   • Audit log   — chat_promotions rows (who/when/field/before/after)
//   • New cards   — formerly "Author"; create cards directly
//   • Batch jobs  — formerly "Batch"; deep-links to the admin batch tab
//
// Theodoros remains a *power user* via the permission matrix (can edit any
// card, run batch jobs, edit EFG nodes), not via UI access — those are
// permissions, not surface differences.

function TheodorosView({
  onAccept,
  onReject,
  onNavigateWord
}) {
  const [tab, setTab] = React.useState('threads');
  const [allThreads, setAllThreads] = React.useState([]);
  React.useEffect(() => {
    window.BWTL.getThreads().then(data => setAllThreads(Array.isArray(data) ? data : data.items || [])).catch(console.error);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 200px',
      maxWidth: 1500,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 14,
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "display",
    style: {
      fontSize: 34,
      margin: 0
    }
  }, "Chat"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-3)',
      margin: '4px 0 0',
      fontSize: 13,
      maxWidth: '78ch'
    }
  }, "Your AI conversations across cards.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost"
  }, /*#__PURE__*/React.createElement(Ic.filter, null), " Filter"))), /*#__PURE__*/React.createElement(ChatStatRow, {
    allThreads: allThreads
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      marginBottom: 16,
      borderBottom: '1px solid var(--line)'
    }
  }, [['threads', 'Threads', allThreads.length], ['audit', 'Audit log', null]].map(([k, lab, n]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      appearance: 'none',
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      padding: '10px 14px',
      borderBottom: '2px solid ' + (tab === k ? 'var(--acc)' : 'transparent'),
      marginBottom: -1,
      color: tab === k ? 'var(--fg)' : 'var(--fg-3)',
      fontWeight: 600,
      fontSize: 13,
      fontFamily: 'inherit',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7
    }
  }, lab, " ", n != null && /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--fg-5)'
    }
  }, n)))), tab === 'threads' && /*#__PURE__*/React.createElement(ThreadsIndexTab, {
    allThreads: allThreads,
    onNavigateWord: onNavigateWord
  }), tab === 'audit' && /*#__PURE__*/React.createElement(AuditLogTab, {
    onNavigateWord: onNavigateWord
  }));
}
function ChatStatRow({
  allThreads
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 10,
      marginBottom: 18
    }
  }, [{
    lab: 'Threads · all cards',
    n: allThreads.length,
    sub: `across multiple cards`,
    clr: 'var(--acc)'
  }].map(s => /*#__PURE__*/React.createElement("div", {
    key: s.lab,
    className: "card",
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, s.lab), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 30,
      color: s.clr,
      marginTop: 4,
      lineHeight: 1
    }
  }, s.n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--fg-4)',
      marginTop: 4
    }
  }, s.sub))));
}

// ── Threads · cross-app index ──────────────────────────────────────────────
function ThreadsIndexTab({
  allThreads,
  onNavigateWord
}) {
  const [activeId, setActiveId] = React.useState(allThreads[0]?.id || null);
  if (!allThreads.length) return /*#__PURE__*/React.createElement("div", {
    className: "threads-empty",
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "No chat threads yet. Start a conversation on any card to see threads here.");

  // group by anchor_value (card id)
  const grouped = {};
  for (const t of allThreads) {
    const key = t.anchor_value || t.card_id || t.id;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  }
  const cardIds = Object.keys(grouped);
  const flat = allThreads;
  const active = flat.find(t => t.id === activeId) || flat[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '380px 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      alignSelf: 'start',
      maxHeight: 700,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, "All threads"), /*#__PURE__*/React.createElement("span", {
    className: "pill ghost",
    style: {
      fontSize: 9.5
    }
  }, "by card \xB7 newest first")), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: 'auto'
    }
  }, cardIds.map(cid => {
    const c = grouped[cid][0];
    const cardMeta = window.BWTL.FLASHCARDS[cid] || {};
    return /*#__PURE__*/React.createElement("div", {
      key: cid
    }, /*#__PURE__*/React.createElement("div", {
      onClick: () => onNavigateWord && onNavigateWord(cid),
      style: {
        padding: '10px 14px',
        borderTop: '1px solid var(--line-soft)',
        background: 'var(--bg-2)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "greek",
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--fg)'
      }
    }, cardMeta.word || cid), /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 10,
        color: 'var(--fg-4)'
      }
    }, cid), /*#__PURE__*/React.createElement("span", {
      className: "pill ghost",
      style: {
        fontSize: 9,
        marginLeft: 'auto'
      }
    }, cardMeta.language), cardMeta.pie_root && /*#__PURE__*/React.createElement("span", {
      className: "pill pie",
      style: {
        fontSize: 9
      }
    }, cardMeta.pie_root)), grouped[cid].map(t => /*#__PURE__*/React.createElement("div", {
      key: t.id,
      onClick: () => setActiveId(t.id),
      style: {
        padding: '10px 14px 10px 22px',
        borderTop: '1px solid var(--line-soft)',
        cursor: 'pointer',
        background: t.id === active?.id ? 'var(--bg-3)' : 'transparent',
        borderLeft: t.id === active?.id ? '3px solid var(--acc)' : '3px solid transparent'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--fg)',
        fontWeight: 600
      }
    }, t.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--fg-4)',
        marginTop: 3,
        display: 'flex',
        gap: 8,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono"
    }, t.when || t.created_at), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, t.messages?.length ?? t.message_count ?? 0, " msg"), t.context?.steering && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--acc-2)'
      }
    }, "steered"))))));
  }))), /*#__PURE__*/React.createElement("div", null, active && /*#__PURE__*/React.createElement(ThreadDetailView, {
    thread: active,
    onNavigateWord: onNavigateWord
  })));
}
function ThreadDetailView({
  thread,
  onNavigateWord
}) {
  const card = thread.card || window.BWTL.FLASHCARDS[thread.anchor_value || thread.card_id] || null;
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--line-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--ff-display)',
      fontSize: 24,
      margin: 0,
      fontWeight: 500
    }
  }, thread.title), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--fg-4)',
      fontSize: 11
    }
  }, thread.id)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, card && /*#__PURE__*/React.createElement("span", {
    className: "pill accent",
    style: {
      fontSize: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mode-tag",
    style: {
      background: 'rgba(0,0,0,.3)',
      padding: '1px 4px',
      borderRadius: 3,
      fontFamily: 'var(--ff-mono)',
      fontSize: 9
    }
  }, "card"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 5
    },
    className: "greek"
  }, card.word)), card?.pie_root && /*#__PURE__*/React.createElement("span", {
    className: "pill pie",
    style: {
      fontSize: 10
    }
  }, card.pie_root), /*#__PURE__*/React.createElement("span", {
    className: "pill ghost",
    style: {
      fontSize: 10
    }
  }, thread.messages?.length ?? thread.message_count ?? 0, " messages \xB7 last ", thread.when || thread.created_at), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    style: {
      marginLeft: 'auto'
    },
    onClick: () => onNavigateWord && card && onNavigateWord(card.id || thread.anchor_value)
  }, /*#__PURE__*/React.createElement(Ic.chat, null), " Open in study"))), thread.context && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 16px',
      borderBottom: '1px solid var(--line-soft)',
      background: 'var(--bg-2)',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-4)',
      marginBottom: 5
    }
  }, "Context payload (editable in study view)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 6
    }
  }, (thread.context.fields || []).map(f => /*#__PURE__*/React.createElement("span", {
    key: f,
    className: "pill ghost",
    style: {
      fontSize: 9.5,
      fontFamily: 'var(--ff-mono)'
    }
  }, f)), thread.context.efg_node && /*#__PURE__*/React.createElement("span", {
    className: "pill graph",
    style: {
      fontSize: 9.5
    }
  }, /*#__PURE__*/React.createElement(Ic.graph, null), " efg \xB7 ", thread.context.efg_node), thread.context.figure && /*#__PURE__*/React.createElement("span", {
    className: "pill myth",
    style: {
      fontSize: 9.5
    }
  }, "figure \xB7 ", thread.context.figure)), thread.context.steering && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--fg-2)',
      lineHeight: 1.5,
      paddingTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 9.5,
      color: 'var(--fg-4)'
    }
  }, "steering \u25B8 "), "\"", thread.context.steering, "\"")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      display: 'grid',
      gap: 12
    }
  }, (thread.messages || []).map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `msg ${m.role}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "avt"
  }, m.role === 'you' ? 'PL' : 'AI'), /*#__PURE__*/React.createElement("div", {
    className: "bubble"
  }, /*#__PURE__*/React.createElement("div", null, m.text), m.promotable && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      paddingTop: 6,
      borderTop: '1px dashed var(--line)',
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, /*#__PURE__*/React.createElement(Ic.spark, {
    style: {
      color: 'var(--ok)',
      verticalAlign: '-2px'
    }
  }), " Accepted insight available on this turn \u2014 open in study to apply with field selector."))))));
}

// ── Audit log · chat_promotions table ──────────────────────────────────────
function AuditLogTab({
  onNavigateWord
}) {
  const rows = window.BWTL.CHAT_PROMOTIONS;
  return /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, "Chat promotions \xB7 audit log"), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--fg-4)',
      fontSize: 11
    }
  }, "chat_promotions ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-5)'
    }
  }, "\xB7 ", rows.length, " rows"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderBottom: '1px solid var(--line-soft)',
      fontSize: 12,
      color: 'var(--fg-3)',
      lineHeight: 1.55,
      background: 'var(--bg-1)'
    }
  }, "Every chat ", /*#__PURE__*/React.createElement(Ic.check, {
    style: {
      color: 'var(--ok)',
      verticalAlign: '-2px'
    }
  }), " Accept appends one row here. No approval gate, no second-party review \u2014 each user accepts their own promotions directly. Use this for traceability and rollback."), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: 'var(--bg-2)'
    }
  }, ['When', 'Who', 'Card', 'Field', 'Before → After', 'Source thread'].map(h => /*#__PURE__*/React.createElement("th", {
    key: h,
    style: {
      padding: '9px 12px',
      textAlign: 'left',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, rows.map(r => {
    const c = window.BWTL.FLASHCARDS[r.card];
    const role = window.BWTL.ROLES[r.who];
    return /*#__PURE__*/React.createElement("tr", {
      key: r.id,
      style: {
        borderTop: '1px solid var(--line-soft)'
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '11px 12px',
        verticalAlign: 'top'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 11,
        color: 'var(--fg-2)'
      }
    }, r.when)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '11px 12px',
        verticalAlign: 'top'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 18,
        height: 18,
        borderRadius: 99,
        background: role?.id === 'theo' ? 'linear-gradient(135deg, var(--myth), var(--forge))' : role?.id === 'tutor' ? 'linear-gradient(135deg, var(--acc), var(--graph))' : 'linear-gradient(135deg, var(--acc), var(--pie))',
        display: 'grid',
        placeItems: 'center',
        fontSize: 8.5,
        color: '#0b0918',
        fontWeight: 800
      }
    }, role?.initials), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--fg-2)'
      }
    }, role?.label))), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '11px 12px',
        verticalAlign: 'top'
      }
    }, /*#__PURE__*/React.createElement("a", {
      className: "greek",
      onClick: () => onNavigateWord && onNavigateWord(r.card),
      style: {
        fontSize: 13,
        color: 'var(--fg)',
        fontWeight: 600,
        cursor: 'pointer',
        textDecoration: 'underline dotted color-mix(in oklch, var(--acc) 60%, transparent)',
        textUnderlineOffset: 3
      }
    }, c?.word || r.card)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '11px 12px',
        verticalAlign: 'top'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 10.5,
        color: 'var(--acc-2)'
      }
    }, r.field)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '11px 12px',
        verticalAlign: 'top',
        maxWidth: 520
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--fg-4)',
        lineHeight: 1.5,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 9.5,
        color: 'var(--fg-5)'
      }
    }, "before \u25B8 "), r.before), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--fg)',
        lineHeight: 1.5,
        padding: '4px 8px',
        background: 'color-mix(in oklch, var(--ok) 6%, var(--bg-1))',
        borderLeft: '2px solid var(--ok)',
        borderRadius: '0 4px 4px 0'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 9.5,
        color: 'var(--ok)'
      }
    }, "after \u25B8 "), r.after)), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '11px 12px',
        verticalAlign: 'top'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 10,
        color: 'var(--fg-4)'
      }
    }, r.thread_id), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: 'var(--fg-5)',
        marginTop: 2
      }
    }, "msg #", r.message_idx)));
  }))));
}

// ── New cards (formerly "Author") ──────────────────────────────────────────
function NewCardsTab() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Ic.plus, null), " Single card"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-2)',
      fontSize: 13,
      lineHeight: 1.55,
      marginTop: 0
    }
  }, "Type a word, pick a language, and let the AI fill etymology + cognates + fun facts + IPA + audio. Same flow as the top-bar New card button."), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: () => window.dispatchEvent(new CustomEvent('bwtl:open-create'))
  }, /*#__PURE__*/React.createElement(Ic.plus, null), " Open new-card sheet")), /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Ic.upload, null), " From document"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-2)',
      fontSize: 13,
      lineHeight: 1.55,
      marginTop: 0
    }
  }, "Paste a Greek passage or upload a PDF \u2014 the document parser extracts vocabulary by frequency. Bulk-approve in one pass."), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost"
  }, /*#__PURE__*/React.createElement(Ic.upload, null), " Open document import \u2192"), /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--fg-5)',
      marginTop: 8
    }
  }, "routes to Admin \xB7 Document import")), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 0,
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, "Recent imports")), /*#__PURE__*/React.createElement("div", null, window.BWTL.DOCUMENT_RUNS.map(r => {
    const pct = Math.round(r.approved / r.extracted * 100);
    return /*#__PURE__*/React.createElement("div", {
      key: r.id,
      style: {
        padding: '11px 16px',
        borderTop: '1px solid var(--line-soft)',
        display: 'grid',
        gridTemplateColumns: '20px 1fr 240px 120px 100px',
        gap: 14,
        alignItems: 'center'
      }
    }, r.kind === 'pdf' ? /*#__PURE__*/React.createElement(Ic.doc, null) : /*#__PURE__*/React.createElement(Ic.edit, null), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--fg)'
      }
    }, r.source), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--fg-4)',
        marginTop: 2
      }
    }, r.when)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 4,
        background: 'var(--bg-3)',
        borderRadius: 99,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: pct + '%',
        height: '100%',
        background: pct === 100 ? 'var(--ok)' : 'var(--acc)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--fg-3)',
        marginTop: 2
      }
    }, r.approved, " / ", r.extracted, " approved")), /*#__PURE__*/React.createElement("span", {
      className: `pill ${r.status === 'complete' ? 'ok' : r.status === 'partial' ? 'warn' : 'ghost'}`,
      style: {
        fontSize: 9.5
      }
    }, r.status), /*#__PURE__*/React.createElement("button", {
      className: "btn xs ghost"
    }, "Review"));
  }))));
}

// ── Batch jobs redirect (formerly "Batch") ─────────────────────────────────
function BatchJobsRedirectTab() {
  // Light wrapper around the same content the Admin · Batch tab shows.
  const jobs = [{
    id: 'TSK-001',
    title: 'PIE IPA + audio backfill',
    target: 'SF.flashcards.pie_audio_url',
    rows: 2581,
    done: 1840,
    status: 'cc_executing'
  }, {
    id: 'TSK-008',
    title: '76 residual PIE mismatches',
    target: 'SF.flashcards.pie_root',
    rows: 76,
    done: 12,
    status: 'req_created'
  }, {
    id: 'REQ-011',
    title: 'EFG PIE audio backfill',
    target: 'EFG.nodes.pie_audio_url',
    rows: 52,
    done: 0,
    status: 'cai_designing'
  }, {
    id: 'REQ-015',
    title: 'Cross-portfolio PIE audit',
    target: 'SF.flashcards.efg_node_id',
    rows: 877,
    done: 488,
    status: 'cc_executing'
  }, {
    id: 'EM-AUDIO',
    title: 'EM figure audio (ElevenLabs)',
    target: 'EM.figures.pronunciation_audio_url',
    rows: 111,
    done: 72,
    status: 'pl/theo approval gating retired — auto-applies'
  }, {
    id: 'EM-IPA',
    title: 'EM figure IPA',
    target: 'EM.figures.ipa_transcription',
    rows: 113,
    done: 88,
    status: 'cc_executing'
  }, {
    id: 'REQ-008',
    title: 'etymology_layer write-back',
    target: 'SF.flashcard_pie_roots.etymology_layer',
    rows: 2922,
    done: 0,
    status: 'req_created — blocked on schema'
  }];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderRadius: 8,
      background: 'var(--bg-2)',
      border: '1px solid var(--line-soft)',
      fontSize: 12,
      color: 'var(--fg-3)',
      lineHeight: 1.55,
      marginBottom: 14
    }
  }, "Batch jobs run AI corrections across many cards at once. Per REV item 5 the queue-with-approval-gate is retired \u2014 batch results ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--fg-2)'
    }
  }, "auto-apply and append audit rows"), ", so this view is a monitor, not a gate. PL-only triggers."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, jobs.map(j => {
    const pct = Math.round(j.done / j.rows * 100);
    return /*#__PURE__*/React.createElement("div", {
      key: j.id,
      className: "card",
      style: {
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '120px 1fr 220px 220px',
        gap: 14,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 11,
        color: 'var(--acc-2)',
        fontWeight: 700
      }
    }, j.id), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--fg)',
        fontWeight: 600
      }
    }, j.title), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 10.5,
        color: 'var(--fg-4)',
        marginTop: 2
      }
    }, j.target)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 5,
        background: 'var(--bg-3)',
        borderRadius: 99,
        overflow: 'hidden',
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: pct + '%',
        height: '100%',
        background: pct >= 80 ? 'var(--ok)' : 'var(--acc)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 10.5,
        color: 'var(--fg-3)'
      }
    }, j.done.toLocaleString(), " / ", j.rows.toLocaleString(), " \xB7 ", pct, "%")), /*#__PURE__*/React.createElement("span", {
      className: "pill ghost",
      style: {
        fontSize: 9.5,
        justifySelf: 'end'
      }
    }, j.status)));
  })));
}
window.TheodorosView = TheodorosView;

// ─── bookmarks.jsx ───
// Bookmark surface — collection of cross-app primitives.
//
// Same primitive (BWTL.BOOKMARKS) used by PL (word-in-study), Theodoros
// (teaching examples), tutors (lesson sequences). Differentiation is
// purely contextual labels + share/audience controls.

function BookmarksView({
  go,
  onOpenCard,
  onOpenFigure
}) {
  const [filter, setFilter] = React.useState('all');
  const [bms, setBms] = React.useState(window.BWTL.BOOKMARKS || []);
  const [loading, setLoading] = React.useState(!bms.length);
  React.useEffect(() => {
    setLoading(true);
    window.BWTL.getBookmarks('pl').then(data => setBms(Array.isArray(data) ? data : data.items || [])).catch(console.error).finally(() => setLoading(false));
  }, []);
  const filtered = filter === 'all' ? bms : bms.filter(b => b.kind === filter);
  const groups = React.useMemo(() => {
    const g = {};
    filtered.forEach(b => {
      const key = b.when || (b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : 'Saved');
      (g[key] = g[key] || []).push(b);
    });
    return g;
  }, [filtered]);
  const kindColor = k => ({
    word: 'var(--acc)',
    pie_root: 'var(--pie)',
    figure: 'var(--myth)',
    thread: 'var(--graph)',
    collection: 'var(--forge)'
  })[k] || 'var(--fg-3)';
  const kindLabel = k => ({
    word: 'WORD',
    pie_root: 'PIE',
    figure: 'EM',
    thread: 'CHAT',
    collection: 'CLS'
  })[k] || k;
  if (loading) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "Loading bookmarks\u2026");
  if (!bms.length) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 200px',
      maxWidth: 1500,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "display",
    style: {
      fontSize: 34,
      margin: 0
    }
  }, "Bookmarks"), /*#__PURE__*/React.createElement("div", {
    className: "bm-empty",
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14,
      marginTop: 24
    }
  }, "No bookmarks yet. Tap a card\u2019s bookmark button to save it here."));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 200px',
      maxWidth: 1500,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 18,
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "display",
    style: {
      fontSize: 34,
      margin: 0
    }
  }, "Bookmarks"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-3)',
      margin: '4px 0 0',
      fontSize: 13,
      maxWidth: 70 + 'ch'
    }
  }, "One primitive \u2014 words, PIE roots, figures, chat threads, and lesson collections all live here. Bookmark a word and its PIE root and the linked figure together in one click; collections share to Theodoros.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      marginBottom: 18,
      padding: 4,
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      borderRadius: 10,
      width: 'fit-content'
    }
  }, [['all', 'All', bms.length], ['word', 'Words', bms.filter(b => b.kind === 'word').length], ['pie_root', 'PIE roots', bms.filter(b => b.kind === 'pie_root').length], ['figure', 'Figures', bms.filter(b => b.kind === 'figure').length], ['thread', 'Threads', bms.filter(b => b.kind === 'thread').length], ['collection', 'Collections', bms.filter(b => b.kind === 'collection').length]].map(([k, lab, n]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setFilter(k),
    className: "btn xs ghost",
    style: {
      background: filter === k ? 'var(--bg-4)' : 'transparent',
      color: filter === k ? 'var(--fg)' : 'var(--fg-3)',
      fontSize: 12,
      padding: '5px 10px'
    }
  }, lab, " ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--fg-5)'
    }
  }, n)))), Object.entries(groups).map(([when, items]) => /*#__PURE__*/React.createElement("div", {
    key: when,
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 8
    }
  }, when), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: 10
    }
  }, items.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.id,
    className: "card",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '10px 14px',
      borderBottom: '1px solid var(--line-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: kindColor(b.kind)
    }
  }, kindLabel(b.kind)), /*#__PURE__*/React.createElement("button", {
    style: {
      background: 'transparent',
      border: 0,
      color: 'var(--fg-3)',
      cursor: 'pointer'
    },
    title: "More"
  }, /*#__PURE__*/React.createElement(Ic.more, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: b.kind === 'pie_root' ? 'var(--ff-display)' : 'var(--ff-sans)',
      fontSize: b.kind === 'pie_root' ? 22 : 17,
      fontWeight: 600,
      color: 'var(--fg)'
    }
  }, b.label || b.ref_label || b.flashcard_ref_id && (window.BWTL.FLASHCARDS[b.flashcard_ref_id]?.word_or_phrase || window.BWTL.FLASHCARDS[b.flashcard_ref_id]?.word) || b.flashcard_ref_id), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--fg-3)',
      marginTop: 4
    }
  }, b.meta || b.kind)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 14px',
      borderTop: '1px solid var(--line-soft)',
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost"
  }, /*#__PURE__*/React.createElement(Ic.chat, null)), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost"
  }, /*#__PURE__*/React.createElement(Ic.link, null)), /*#__PURE__*/React.createElement("button", {
    className: "btn xs ghost",
    style: {
      marginLeft: 'auto'
    },
    onClick: () => {
      if (b.kind === 'figure' && onOpenFigure) onOpenFigure(b.flashcard_ref_id);else if (b.flashcard_ref_id && onOpenCard) onOpenCard(b.flashcard_ref_id);
    }
  }, "Open ", /*#__PURE__*/React.createElement(Ic.chevron_r, null)))))))));
}
window.BookmarksView = BookmarksView;

// ─── admin.jsx ───
// ADMIN — PL-only surfaces: EFG editor link, RAG console, document import,
// batch ops, data health. Surfaces consolidated from /api/admin/* and
// /api/efg/backfill-* across SF, EFG, EM, RAG.

function AdminView({
  role
}) {
  const [tab, setTab] = React.useState('health');
  const isPL = role === 'pl';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 20px 200px',
      maxWidth: 1500,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 14,
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "display",
    style: {
      fontSize: 32,
      margin: 0
    }
  }, "Admin"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-3)',
      margin: '4px 0 0',
      fontSize: 13
    }
  }, "Cross-app data ops, batch jobs, ingestion. PL-only surfaces are gated.")), /*#__PURE__*/React.createElement("span", {
    className: `pill ${isPL ? 'accent' : 'err'}`
  }, isPL ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.shield, null), " PL \xB7 full admin") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ic.shield, null), " ", role, " \xB7 limited"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      marginBottom: 16,
      borderBottom: '1px solid var(--line)'
    }
  }, [['health', 'Data health'], ['batch', 'Batch jobs'], ['import', 'Document import'], ['efg', 'EFG editor']].map(([k, lab]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      appearance: 'none',
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      padding: '10px 14px',
      borderBottom: '2px solid ' + (tab === k ? 'var(--acc)' : 'transparent'),
      marginBottom: -1,
      color: tab === k ? 'var(--fg)' : 'var(--fg-3)',
      fontWeight: 600,
      fontSize: 13,
      fontFamily: 'inherit'
    }
  }, lab))), tab === 'health' && /*#__PURE__*/React.createElement(DataHealthTab, null), tab === 'batch' && /*#__PURE__*/React.createElement(BatchJobsTab, null), tab === 'import' && /*#__PURE__*/React.createElement(DocumentImportTab, null), tab === 'efg' && /*#__PURE__*/React.createElement(EfgEditorTab, {
    isPL: isPL
  }));
}
function DataHealthTab() {
  const [coverage, setCoverage] = React.useState(null);
  const [loadingCov, setLoadingCov] = React.useState(true);
  const [search, setSearch] = React.useState(''); // REQ-030: text search above coverage table

  React.useEffect(() => {
    window.BWTL.getCoverage().then(data => {
      setCoverage(data);
      setLoadingCov(false);
    }).catch(err => {
      console.error('[DataHealthTab] getCoverage error:', err);
      setLoadingCov(false);
    });
  }, []);
  const rows = coverage ? coverage.coverage || [] : [];
  const filteredRows = search ? rows.filter(r => (r.field || '').toLowerCase().includes(search.toLowerCase())) : rows;
  const totalCards = coverage ? coverage.total_flashcards || 0 : 0;
  const pillFor = s => s === 'high' ? 'err' : s === 'med' ? 'warn' : s === 'low' ? 'ok' : 'ghost';
  if (loadingCov) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "Loading coverage data\u2026");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 10,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, "SF Flashcards"), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 30,
      color: 'var(--acc)',
      marginTop: 4,
      lineHeight: 1
    }
  }, (totalCards || 0).toLocaleString()))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, "Field coverage \xB7 live from /api/admin/coverage"), /*#__PURE__*/React.createElement("input", {
    type: "search",
    placeholder: "Filter by field name\u2026",
    value: search,
    onChange: e => setSearch(e.target.value),
    style: {
      padding: '4px 8px',
      fontSize: 12,
      borderRadius: 'var(--r-sm)',
      border: '1px solid var(--line)',
      background: 'var(--bg-2)',
      color: 'var(--fg)',
      width: 200
    }
  })), !rows.length ? /*#__PURE__*/React.createElement("div", {
    className: "coverage-empty",
    style: {
      padding: 24,
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, "No coverage data returned.") : /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: 'var(--bg-2)'
    }
  }, ['Field', 'Fill %', 'Missing', 'Total'].map(h => /*#__PURE__*/React.createElement("th", {
    key: h,
    style: {
      padding: '9px 12px',
      textAlign: 'left',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, filteredRows.map(r => {
    const pct = Math.round(r.fill_pct || 0);
    return /*#__PURE__*/React.createElement("tr", {
      key: r.field,
      style: {
        borderTop: '1px solid var(--line-soft)'
      }
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '9px 12px',
        fontFamily: 'var(--ff-mono)',
        fontSize: 11,
        color: 'var(--fg-2)'
      }
    }, r.field), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '9px 12px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 80,
        height: 5,
        background: 'var(--bg-3)',
        borderRadius: 99,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: pct + '%',
        height: '100%',
        background: pct >= 90 ? 'var(--ok)' : pct >= 70 ? 'var(--warn)' : 'var(--err)'
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: "mono cov-pct",
      style: {
        fontSize: 11,
        color: 'var(--fg-2)'
      }
    }, pct, "%"))), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '9px 12px',
        fontFamily: 'var(--ff-mono)',
        fontSize: 11,
        color: 'var(--fg-3)'
      }
    }, (r.missing_rows || 0).toLocaleString()), /*#__PURE__*/React.createElement("td", {
      style: {
        padding: '9px 12px',
        fontFamily: 'var(--ff-mono)',
        fontSize: 11,
        color: 'var(--fg-3)'
      }
    }, (r.total_rows || 0).toLocaleString()));
  })))));
}
function BatchJobsTab() {
  const jobs = [{
    id: 'TSK-001',
    title: 'PIE IPA + audio backfill',
    target: 'SF.flashcards.pie_audio_url',
    rows: 2581,
    done: 1840,
    status: 'cc_executing',
    kicked: '5 days ago'
  }, {
    id: 'TSK-008',
    title: '76 residual PIE mismatches',
    target: 'SF.flashcards.pie_root',
    rows: 76,
    done: 12,
    status: 'req_created',
    kicked: '—'
  }, {
    id: 'REQ-011',
    title: 'EFG PIE audio backfill',
    target: 'EFG.nodes.pie_audio_url',
    rows: 52,
    done: 0,
    status: 'cai_designing',
    kicked: '—'
  }, {
    id: 'REQ-015',
    title: 'Cross-portfolio PIE audit',
    target: 'SF.flashcards.efg_node_id + EFG.nodes.sf_url',
    rows: 877,
    done: 488,
    status: 'cc_executing',
    kicked: '3 days ago'
  }, {
    id: 'EM-AUDIO',
    title: 'EM figure audio (ElevenLabs)',
    target: 'EM.mythological_figures.pronunciation_audio_url',
    rows: 111,
    done: 72,
    status: 'awaiting Theo approval',
    kicked: '2 days ago'
  }, {
    id: 'EM-IPA',
    title: 'EM figure IPA',
    target: 'EM.mythological_figures.ipa_transcription',
    rows: 113,
    done: 88,
    status: 'cc_executing',
    kicked: '1 day ago'
  }, {
    id: 'REQ-008',
    title: 'etymology_layer write-back',
    target: 'SF.flashcard_pie_roots.etymology_layer',
    rows: 2922,
    done: 0,
    status: 'req_created — blocked on schema decision',
    kicked: '—'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, jobs.map(j => {
    const pct = Math.round(j.done / j.rows * 100);
    return /*#__PURE__*/React.createElement("div", {
      key: j.id,
      className: "card",
      style: {
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '120px 1fr 220px 120px',
        gap: 14,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 11,
        color: 'var(--acc-2)',
        fontWeight: 700
      }
    }, j.id), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--fg)',
        fontWeight: 600
      }
    }, j.title), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 10.5,
        color: 'var(--fg-4)',
        marginTop: 2
      }
    }, j.target)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 5,
        background: 'var(--bg-3)',
        borderRadius: 99,
        overflow: 'hidden',
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: pct + '%',
        height: '100%',
        background: pct >= 80 ? 'var(--ok)' : 'var(--acc)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 10.5,
        color: 'var(--fg-3)'
      }
    }, j.done.toLocaleString(), " / ", j.rows.toLocaleString(), " \xB7 ", pct, "%")), /*#__PURE__*/React.createElement("span", {
      className: "pill ghost",
      style: {
        fontSize: 9.5,
        justifySelf: 'end'
      }
    }, j.status)));
  }));
}
function DocumentImportTab() {
  const runs = window.BWTL.DOCUMENT_RUNS;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Ic.upload, null), " Paste text"), /*#__PURE__*/React.createElement("textarea", {
    placeholder: "Paste a Greek, French, or other passage\u2026",
    style: {
      width: '100%',
      height: 120,
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 6,
      padding: 10,
      color: 'var(--fg)',
      font: 'inherit',
      fontSize: 13,
      resize: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm primary"
  }, /*#__PURE__*/React.createElement(Ic.spark, null), " Extract vocab"))), /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Ic.upload, null), " Upload PDF"), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '2px dashed var(--line)',
      borderRadius: 8,
      padding: 28,
      textAlign: 'center',
      background: 'var(--bg-1)',
      fontSize: 12,
      color: 'var(--fg-3)',
      lineHeight: 1.5
    }
  }, "Drop a PDF or text file here", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-4)',
      fontSize: 11
    }
  }, "POST /api/document/parse \xB7 uses Beekes RAG to grade vocabulary by frequency")))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, "Recent imports")), /*#__PURE__*/React.createElement("div", null, runs.map(r => {
    const pct = Math.round(r.approved / r.extracted * 100);
    return /*#__PURE__*/React.createElement("div", {
      key: r.id,
      style: {
        padding: '12px 16px',
        borderTop: '1px solid var(--line-soft)',
        display: 'grid',
        gridTemplateColumns: '20px 1fr 220px 120px 100px',
        gap: 14,
        alignItems: 'center'
      }
    }, r.kind === 'pdf' ? /*#__PURE__*/React.createElement(Ic.doc, null) : /*#__PURE__*/React.createElement(Ic.edit, null), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--fg)'
      }
    }, r.source), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--fg-4)',
        marginTop: 2
      }
    }, r.when)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 4,
        background: 'var(--bg-3)',
        borderRadius: 99,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: pct + '%',
        height: '100%',
        background: pct === 100 ? 'var(--ok)' : 'var(--acc)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: 'var(--fg-3)',
        marginTop: 2
      }
    }, r.approved, " / ", r.extracted, " approved")), /*#__PURE__*/React.createElement("span", {
      className: `pill ${r.status === 'complete' ? 'ok' : r.status === 'partial' ? 'warn' : 'ghost'}`,
      style: {
        fontSize: 9.5
      }
    }, r.status), /*#__PURE__*/React.createElement("button", {
      className: "btn xs ghost"
    }, "Review"));
  }))));
}
function EfgEditorTab({
  isPL
}) {
  const stats = window.BWTL.EFG_STATS;
  if (!isPL) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 30,
      color: 'var(--fg-3)',
      textAlign: 'center',
      fontSize: 13
    }
  }, "EFG node/edge editing is PL-only. Theodoros and tutors edit cards and figures instead.");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 10,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    lab: "Nodes",
    v: stats.total_nodes,
    sub: `${stats.word_nodes} words · ${stats.pie_root_nodes} roots`,
    clr: "var(--graph)"
  }), /*#__PURE__*/React.createElement(Stat, {
    lab: "Edges",
    v: stats.total_edges,
    sub: "2111 connections",
    clr: "var(--graph)"
  }), /*#__PURE__*/React.createElement(Stat, {
    lab: "SF-linked",
    v: stats.sf_linked,
    sub: "word nodes with sf_url",
    clr: "var(--ok)"
  }), /*#__PURE__*/React.createElement(Stat, {
    lab: "Explorer data",
    v: stats.pie_explorer_data,
    sub: `${stats.pie_root_nodes - stats.pie_explorer_data} roots missing`,
    clr: "var(--warn)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, "Recent node operations"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost"
  }, /*#__PURE__*/React.createElement(Ic.plus, null), " POST /api/nodes"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost"
  }, /*#__PURE__*/React.createElement(Ic.link, null), " POST /api/edges"), /*#__PURE__*/React.createElement("a", {
    className: "btn sm ghost",
    href: "#",
    target: "_blank"
  }, /*#__PURE__*/React.createElement(Ic.link, null), " Open graph editor"))), /*#__PURE__*/React.createElement("div", null, [{
    id: 'word_mneme',
    op: 'PATCH',
    field: 'sf_url',
    old: 'NULL',
    new: 'learn.rentyourcio.com/?cardId=…',
    when: '1h ago',
    who: 'cai'
  }, {
    id: 'pie_men',
    op: 'PATCH',
    field: 'pie_audio_url',
    old: 'NULL',
    new: 'audio/pie/men.mp3',
    when: '3h ago',
    who: 'TSK-001'
  }, {
    id: 'word_souvenir',
    op: 'POST',
    field: '—',
    old: '—',
    new: '(created)',
    when: 'yesterday',
    who: 'pl'
  }, {
    id: 'edge_47',
    op: 'DELETE',
    field: 'parent_of',
    old: '(removed)',
    new: '—',
    when: 'yesterday',
    who: 'pl'
  }].map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: '10px 16px',
      borderTop: '1px solid var(--line-soft)',
      display: 'grid',
      gridTemplateColumns: '90px 200px 120px 1fr 100px 80px',
      gap: 12,
      alignItems: 'center',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: `pill ${r.op === 'POST' ? 'ok' : r.op === 'PATCH' ? 'accent' : 'err'}`,
    style: {
      fontSize: 9.5,
      width: 'fit-content'
    }
  }, r.op), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--fg)'
    }
  }, r.id), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--fg-3)'
    }
  }, r.field), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-5)'
    }
  }, r.old), " \u2192 ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ok)'
    }
  }, r.new)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, r.when), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 10,
      color: 'var(--fg-4)'
    }
  }, r.who))))));
}
function Stat({
  lab,
  v,
  sub,
  clr
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "card card-body",
    style: {
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, lab), /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 28,
      color: clr,
      marginTop: 4,
      lineHeight: 1
    }
  }, typeof v === 'number' ? v.toLocaleString() : v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-4)',
      marginTop: 4
    }
  }, sub));
}
window.AdminView = AdminView;

// ─── spec.jsx ───
// Spec mode — IA tree, state diagram, role permission matrix,
// ArtForge integration spec, BWTL01 backlog reconciliation table.
//
// One scrollable document so the engineering agent can read it top-to-bottom.

function SpecDoc() {
  return /*#__PURE__*/React.createElement("div", {
    className: "doc"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ff-mono)',
      fontSize: 11,
      color: 'var(--fg-4)',
      letterSpacing: '0.06em',
      textTransform: 'uppercase'
    }
  }, "BWTL \xB7 Unified app spec"), /*#__PURE__*/React.createElement("h1", null, "Bring Words to Life \u2014 design contract"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-3)',
      fontSize: 15,
      maxWidth: '72ch'
    }
  }, "This document is the design half of the BWTL01 reconciliation contract. Every line in ", /*#__PURE__*/React.createElement("code", null, "bwtl01_integration_inventory.md"), " maps to a row at the bottom (", /*#__PURE__*/React.createElement("strong", null, "COVERED"), " \xB7 ", /*#__PURE__*/React.createElement("strong", null, "CONSOLIDATED"), " \xB7 ", /*#__PURE__*/React.createElement("strong", null, "DEPRECATED"), " \xB7 ", /*#__PURE__*/React.createElement("strong", null, "GAP"), "). The interactive prototype demonstrates the high-density surfaces; this document specifies the contracts behind them."), /*#__PURE__*/React.createElement("div", {
    className: "rationale"
  }, /*#__PURE__*/React.createElement("strong", null, "Design system inheritance."), " All visual primitives (color, type, spacing, components, shell pattern) come from the ArtForge redesign project (", /*#__PURE__*/React.createElement("code", null, "019e28ca-daa4-78aa-bde4-5fa2eb264603"), "). The four BWTL-specific accents (", /*#__PURE__*/React.createElement("span", {
    className: "pill pie"
  }, "PIE"), " ", /*#__PURE__*/React.createElement("span", {
    className: "pill graph"
  }, "EFG"), " ", /*#__PURE__*/React.createElement("span", {
    className: "pill myth"
  }, "EM"), " ", /*#__PURE__*/React.createElement("span", {
    className: "pill forge"
  }, "AF"), ") sit at the same oklch chroma/lightness as the AF purple accent \u2014 only hue varies. No new typography, no new spacing scale, no new radius tokens."), /*#__PURE__*/React.createElement("div", {
    className: "rationale",
    style: {
      borderLeftColor: 'var(--ok)',
      background: 'linear-gradient(90deg, color-mix(in oklch, var(--ok) 8%, transparent), transparent 60%)'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--ok)'
    }
  }, "Revision 1 \u2014 May 2026."), " This doc incorporates five changes from the design review: (1) ", /*#__PURE__*/React.createElement("em", null, "Chat anchor"), " inverted to ", /*#__PURE__*/React.createElement("code", null, "flashcard_id"), " primary; (2) ", /*#__PURE__*/React.createElement("em", null, "Latin"), " promoted to first-class structured column in PIE Explorer; (3) chat ", /*#__PURE__*/React.createElement("em", null, "context payload"), " made visible and editable; (4) chat ", /*#__PURE__*/React.createElement("em", null, "Accept"), " button + field dropdown replaces the review queue; (5) ", /*#__PURE__*/React.createElement("em", null, "Theodoros tab renamed to Chat"), " and the approval gate removed \u2014 Theodoros is now a permission tier, not a UI surface. Every change is reflected below; deltas are marked ", /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 9.5
    }
  }, "REV-1"), "."), /*#__PURE__*/React.createElement("div", {
    className: "rationale",
    style: {
      borderLeftColor: 'var(--acc)',
      background: 'linear-gradient(90deg, color-mix(in oklch, var(--acc) 8%, transparent), transparent 60%)'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--acc-2)'
    }
  }, "Revision 3 \u2014 PTH R2BREV3."), " IA consolidation: ", /*#__PURE__*/React.createElement("em", null, "Browse"), " replaces Study and Library as the unified front door. Study sub-views (Queue, Pronunciation, Shadowing) move inside the card detail as mode tabs. Bookmarks section removed from top nav (bookmark action remains on individual cards). Chat (Theodoros) slimmed to Threads + Audit log \u2014 New Cards and Batch Jobs now live in Admin. Bundled bug fixes: BUG-059 (card filter search FTS), BUG-064 (EFG graph API path), BUG-065 (audio playback). New: REQ-036 (Chat AI backend), REQ-037 (browse-thumb card grid), REQ-038 (PIE root empty state). Deltas marked ", /*#__PURE__*/React.createElement("span", {
    className: "pill",
    style: {
      fontSize: 9.5,
      background: 'var(--acc-bg)',
      color: 'var(--acc-2)',
      border: '1px solid var(--acc-ring)'
    }
  }, "REV-3"), "."), /*#__PURE__*/React.createElement("h2", null, "1 \xB7 Information architecture"), /*#__PURE__*/React.createElement("p", null, "Six production apps collapse into one shell with five top-level destinations. ", /*#__PURE__*/React.createElement("strong", null, "Browse"), " is the unified front door ", /*#__PURE__*/React.createElement("span", {
    className: "pill",
    style: {
      fontSize: 9.5,
      background: 'var(--acc-bg)',
      color: 'var(--acc-2)',
      border: '1px solid var(--acc-ring)'
    }
  }, "REV-3"), " \u2014 Study Queue and Library (tab \u201CCards\u201D) merge here. Bookmarks, Study sub-views (Pronunciation, Shadowing), and the Study Queue are no longer top-level nav items."), /*#__PURE__*/React.createElement("div", {
    className: "ia-tree"
  }, `<span class="node-app">BWTL — unified shell</span>
├─ <span class="node-section">Study</span>                     <span class="src">(front door · was SF)</span>
│  ├─ Today's queue              <span class="src">SF.study_sessions + SRS</span>
│  ├─ Word card                  <span class="src">SF.flashcards + SF.flashcard_pie_roots</span>
│  │  ├─ Hero (image, IPA, audio, def)
│  │  ├─ Etymology (layered)     <span class="src">+ SF.flashcard_pie_roots.etymology_layer (REQ-008)</span>
│  │  ├─ Cognates strip          <span class="src">SF.english_cognates + EM cross-link</span>
│  │  └─ Fun-fact list           <span class="src">EM.fun_facts (1012 rows) · figure-linked</span>
│  ├─ Right rail · panel stack   <span class="node-section">[NEW PRIMITIVE]</span>
│  │  ├─ PIE Explorer            <span class="src">SF + EFG MERGED · 4-language paradigm cols (REV-1)</span>
│  │  ├─ Etymology Graph         <span class="src">EFG.nodes + EFG.edges</span>
│  │  ├─ Etymython figure        <span class="src">EM.mythological_figures + EM.figure_relationships</span>
│  │  ├─ Portfolio RAG           <span class="src">RAG /search · etymology collection</span>
│  │  └─ ArtForge (panel mode)   <span class="src">AF /api/external/generate-video · ETYMOLOGY ONLY</span>
│  └─ Chat sidecar (bottom dock) <span class="node-section">[REV-1 anchor inverted]</span>
│     ├─ Anchor = flashcard_id primary  <span class="src">card·N chip in header (no pie_root fallback)</span>
│     ├─ Per-turn context-snapshot expander <span class="src">tokens in/out · fields bundled</span>
│     ├─ Thread-level context editor       <span class="src">fields · efg · figure · steering string</span>
│     └─ Per-msg Accept button + field dropdown <span class="src">writes directly · appends audit row</span>
│
├─ <span class="node-section">Bookmarks</span>                 <span class="node-section">[NEW PRIMITIVE]</span>
│  ├─ Words, PIE roots, figures, threads, collections  <span class="src">one polymorphic primitive</span>
│  ├─ Filters by kind / by date / by shared-with
│  └─ Collections                 <span class="src">share to anyone for class prep</span>
│
├─ <span class="node-section">Chat</span>                      <span class="src">(was "Theodoros" pre-REV-1)</span>
│  ├─ Threads                    <span class="src">cross-app index of all chat threads across cards</span>
│  ├─ Audit log                  <span class="src">chat_promotions · every Accept logged (who/when/before/after)</span>
│  ├─ New cards                  <span class="src">(was "Author") · single-card sheet + document import</span>
│  └─ Batch jobs                 <span class="src">(was "Batch") · monitor only · auto-apply, no approval gate</span>
│
└─ <span class="node-section">Settings</span>
   ├─ Identity & roles            <span class="src">BWTL.users / users → role tier</span>
   ├─ Audio voices                <span class="src">SF.UserVoiceClones · ElevenLabs</span>
   └─ Source apps                 <span class="src">deep-link out to standalone EFG, EM, AF</span>

<span class="node-leaf">// NOT in unified shell — remain standalone destinations:</span>
<span class="node-leaf">// • EFG graph editor (admin) → efg.rentyourcio.com</span>
<span class="node-leaf">// • ArtForge non-etymology projects → artforge.rentyourcio.com</span>
<span class="node-leaf">// • Etymython figure CMS → etymython.rentyourcio.com/admin</span>

<span class="node-leaf">// REMOVED in REV-1:</span>
<span class="node-leaf">// • Theodoros review queue (approval gate) — every user accepts their own</span>
<span class="node-leaf">//   chat promotions directly. Theodoros = permission tier, not a surface.</span>
`.split('\n').map((line, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    dangerouslySetInnerHTML: {
      __html: line
    }
  }))), /*#__PURE__*/React.createElement("h2", null, "2 \xB7 Key screens delivered in the prototype"), /*#__PURE__*/React.createElement("p", null, "The prototype tab covers eight high-fidelity surfaces. The wireframes column lists what each prototype screen demonstrates."), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "#"), /*#__PURE__*/React.createElement("th", null, "Screen"), /*#__PURE__*/React.createElement("th", null, "Open in prototype"), /*#__PURE__*/React.createElement("th", null, "Key novel pattern"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "W1"), /*#__PURE__*/React.createElement("td", null, "Word study \u2014 French ", /*#__PURE__*/React.createElement("span", {
    className: "greek"
  }, "souvenir")), /*#__PURE__*/React.createElement("td", null, "Study \u2192 French souvenir"), /*#__PURE__*/React.createElement("td", null, "Three-zone shell; xlinks; cross-app drill-down cues")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "W2"), /*#__PURE__*/React.createElement("td", null, "Word study \u2014 French ", /*#__PURE__*/React.createElement("span", {
    className: "greek"
  }, "m\xE9moire")), /*#__PURE__*/React.createElement("td", null, "Study \u2192 French m\xE9moire"), /*#__PURE__*/React.createElement("td", null, "Same shell, different root \u2192 chat anchor switches")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "W3"), /*#__PURE__*/React.createElement("td", null, "PIE Explorer panel \u2014 unified SF+EFG view"), /*#__PURE__*/React.createElement("td", null, "Right rail of W1 or W2"), /*#__PURE__*/React.createElement("td", null, "Stacked density (atomic \u2192 words \u2192 3 EFG prose blocks); not tabs")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "W4"), /*#__PURE__*/React.createElement("td", null, "AI Chat sidecar"), /*#__PURE__*/React.createElement("td", null, "Bottom of any Study screen"), /*#__PURE__*/React.createElement("td", null, "Card anchor (REV-1); context payload editor; per-msg Accept + field dropdown")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "W5"), /*#__PURE__*/React.createElement("td", null, "Bookmarks"), /*#__PURE__*/React.createElement("td", null, "Top nav \xB7 Bookmarks"), /*#__PURE__*/React.createElement("td", null, "Polymorphic primitive across all 5 entity kinds")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "W6"), /*#__PURE__*/React.createElement("td", null, "Chat tab \u2014 cross-app index + audit log"), /*#__PURE__*/React.createElement("td", null, "Top nav \xB7 Chat (visible to all roles)"), /*#__PURE__*/React.createElement("td", null, "Threads grouped by card; audit log; per-Accept before\u2192after diff (REV-1)")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "W7"), /*#__PURE__*/React.createElement("td", null, "Integration moment \u2014 figure drill-down"), /*#__PURE__*/React.createElement("td", null, "Click ", /*#__PURE__*/React.createElement("em", null, "Mnemosyne"), " in a fun fact (W2)"), /*#__PURE__*/React.createElement("td", null, "Source link glow + panel glow; chat anchor unchanged")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "W8"), /*#__PURE__*/React.createElement("td", null, "ArtForge panel mode"), /*#__PURE__*/React.createElement("td", null, "Right rail of any Study screen"), /*#__PURE__*/React.createElement("td", null, "Etymology-only generation surface; deep-link out to standalone")))), /*#__PURE__*/React.createElement("h2", null, "3 \xB7 Navigation state diagram"), /*#__PURE__*/React.createElement("p", null, "Walk-through: word \u2192 PIE \u2192 cognate \u2192 figure \u2192 fun fact \u2192 chat."), /*#__PURE__*/React.createElement("div", {
    className: "state-graph"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 920 360",
    style: {
      width: '100%',
      height: 360
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("marker", {
    id: "ah",
    viewBox: "0 0 10 10",
    refX: "9",
    refY: "5",
    markerWidth: "6",
    markerHeight: "6",
    orient: "auto"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 0L10 5L0 10z",
    fill: "var(--fg-4)"
  })), /*#__PURE__*/React.createElement("marker", {
    id: "ahA",
    viewBox: "0 0 10 10",
    refX: "9",
    refY: "5",
    markerWidth: "6",
    markerHeight: "6",
    orient: "auto"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 0L10 5L0 10z",
    fill: "var(--acc)"
  }))), [{
    x: 60,
    y: 60,
    w: 160,
    h: 60,
    label: 'Word card',
    sub: 'fc_souvenir',
    clr: 'var(--acc)'
  }, {
    x: 280,
    y: 60,
    w: 160,
    h: 60,
    label: 'PIE panel',
    sub: '*gʷem-',
    clr: 'var(--pie)'
  }, {
    x: 500,
    y: 60,
    w: 160,
    h: 60,
    label: 'EFG graph',
    sub: '+sibling words',
    clr: 'var(--graph)'
  }, {
    x: 720,
    y: 60,
    w: 160,
    h: 60,
    label: 'Cognate ⇒ new card',
    sub: 'fc_avenir',
    clr: 'var(--acc)'
  }, {
    x: 60,
    y: 200,
    w: 160,
    h: 60,
    label: 'Fun fact',
    sub: 'mentions Mnemosyne',
    clr: 'var(--myth)'
  }, {
    x: 280,
    y: 200,
    w: 160,
    h: 60,
    label: 'Etymython panel',
    sub: 'mnemosyne',
    clr: 'var(--myth)'
  }, {
    x: 500,
    y: 200,
    w: 160,
    h: 60,
    label: 'Chat sidecar',
    sub: 'anchored to fc_souvenir',
    clr: 'var(--acc)'
  }, {
    x: 720,
    y: 200,
    w: 160,
    h: 60,
    label: 'Accept → card field',
    sub: 'audit-logged',
    clr: 'var(--ok)'
  }].map((n, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("rect", {
    x: n.x,
    y: n.y,
    width: n.w,
    height: n.h,
    rx: "10",
    fill: `color-mix(in oklch, ${n.clr} 8%, var(--bg-2))`,
    stroke: n.clr,
    strokeWidth: "1.2"
  }), /*#__PURE__*/React.createElement("text", {
    x: n.x + n.w / 2,
    y: n.y + 24,
    textAnchor: "middle",
    fill: n.clr,
    fontFamily: "var(--ff-sans)",
    fontSize: "13",
    fontWeight: "700"
  }, n.label), /*#__PURE__*/React.createElement("text", {
    x: n.x + n.w / 2,
    y: n.y + 44,
    textAnchor: "middle",
    fill: "var(--fg-3)",
    fontFamily: "var(--ff-mono)",
    fontSize: "10"
  }, n.sub))), [[220, 90, 280, 90, 'click *gʷem-'], [440, 90, 500, 90, 'open in graph'], [660, 90, 720, 90, 'click cognate'], [140, 120, 140, 200, 'click figure in fact'], [220, 230, 280, 230, 'figure detail'], [440, 230, 500, 230, 'discuss in chat'], [660, 230, 720, 230, 'accept insight'], [800, 130, 800, 200, 'chat follows card']].map((a, i) => /*#__PURE__*/React.createElement("g", {
    key: 'a' + i
  }, /*#__PURE__*/React.createElement("line", {
    x1: a[0],
    y1: a[1],
    x2: a[2],
    y2: a[3],
    stroke: "var(--fg-4)",
    strokeWidth: "1.2",
    markerEnd: "url(#ah)"
  }), /*#__PURE__*/React.createElement("text", {
    x: (a[0] + a[2]) / 2,
    y: (a[1] + a[3]) / 2 - 6,
    textAnchor: "middle",
    fill: "var(--fg-3)",
    fontFamily: "var(--ff-mono)",
    fontSize: "9",
    letterSpacing: "0.04em",
    style: {
      textTransform: 'uppercase'
    }
  }, a[4]))), /*#__PURE__*/React.createElement("text", {
    x: 460,
    y: 330,
    textAnchor: "middle",
    fill: "var(--fg-4)",
    fontFamily: "var(--ff-mono)",
    fontSize: "10"
  }, "INVARIANT \u2014 chat anchor stays on the current flashcard_id; Accept writes direct + audit row"))), /*#__PURE__*/React.createElement("h2", null, "4 \xB7 Component contracts"), /*#__PURE__*/React.createElement("h3", null, "4.1 \u2014 Unified shell"), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Region"), /*#__PURE__*/React.createElement("th", null, "Contents"), /*#__PURE__*/React.createElement("th", null, "Width / height"), /*#__PURE__*/React.createElement("th", null, "Persistence"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Topbar"), /*#__PURE__*/React.createElement("td", null, "Brand \xB7 primary nav \xB7 universal search \xB7 bookmark rail \xB7 role chip"), /*#__PURE__*/React.createElement("td", null, "56px fixed"), /*#__PURE__*/React.createElement("td", null, "Always visible")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Crumbs"), /*#__PURE__*/React.createElement("td", null, "Trail of current route"), /*#__PURE__*/React.createElement("td", null, "34px"), /*#__PURE__*/React.createElement("td", null, "Hide on Settings")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Center column"), /*#__PURE__*/React.createElement("td", null, "Word card or section content"), /*#__PURE__*/React.createElement("td", null, "1fr min 720px"), /*#__PURE__*/React.createElement("td", null, "Always visible")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Right rail"), /*#__PURE__*/React.createElement("td", null, "Panel stack (PIE, EFG, EM, RAG, AF); ordered & pinnable"), /*#__PURE__*/React.createElement("td", null, "420px fixed; collapses to 36px strips when stacked over 3 open"), /*#__PURE__*/React.createElement("td", null, "Per-card preference + global default")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Chat dock"), /*#__PURE__*/React.createElement("td", null, "Bottom-anchored. 56px collapsed, 460px expanded"), /*#__PURE__*/React.createElement("td", null, "1100px max, centered"), /*#__PURE__*/React.createElement("td", null, "Persists across sessions; height per-user")))), /*#__PURE__*/React.createElement("h3", null, "4.2 \u2014 PIE Explorer panel (unified)"), /*#__PURE__*/React.createElement("p", null, "The architectural integration: SF flashcards branch list + EFG ", /*#__PURE__*/React.createElement("code", null, "efg_pie_explorer_data"), " verbal / nominal / cognates prose, in one stack. ", /*#__PURE__*/React.createElement("strong", null, "Decision: stacked sections, not tabs."), "Tabs hide density behind clicks; this user wants a glance-able dense view, and the three prose blocks together total ~2900 chars \u2014 comfortably scannable in one column."), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Section"), /*#__PURE__*/React.createElement("th", null, "Source"), /*#__PURE__*/React.createElement("th", null, "Fallback"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Root hero"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "EFG.nodes.pie_ipa"), " + ", /*#__PURE__*/React.createElement("code", null, "pie_audio_url"), " (95% coverage)"), /*#__PURE__*/React.createElement("td", null, "SF ", /*#__PURE__*/React.createElement("code", null, "flashcards.pie_ipa"), " (70%) \xB7 TTS-on-demand if both null")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Atomic decomposition"), /*#__PURE__*/React.createElement("td", null, "Compound roots split by ", /*#__PURE__*/React.createElement("code", null, "+"), " separator (new field ", /*#__PURE__*/React.createElement("code", null, "flashcard_pie_roots.composition"), ")"), /*#__PURE__*/React.createElement("td", null, "Hidden if root is atomic")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Word branches strip"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "SF.flashcards WHERE pie_root = X"), " \u222A ", /*#__PURE__*/React.createElement("code", null, "EFG.nodes WHERE node_type='word' AND pie_root_id = root.id")), /*#__PURE__*/React.createElement("td", null, "SF-only if EFG join fails")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 9.5
    }
  }, "REV-1"), " Language paradigm (4 cols)"), /*#__PURE__*/React.createElement("td", null, "NEW: ", /*#__PURE__*/React.createElement("code", null, "EFG.efg_pie_explorer_data.language_paradigm"), " as structured JSON. Columns: ", /*#__PURE__*/React.createElement("strong", null, "Latin"), " \xB7 Greek \xB7 Sanskrit \xB7 French. Each form: ", /*#__PURE__*/React.createElement("code", null, `{form, gloss, class, linked_card?, exclude?}`), ". ", /*#__PURE__*/React.createElement("code", null, "linked_card"), " turns the form into an xlink to the matching SF flashcard."), /*#__PURE__*/React.createElement("td", null, "Hide a column if its array is empty; hide the section if all empty")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Verbal paradigm (prose)"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "EFG.efg_pie_explorer_data.verbal_paradigm")), /*#__PURE__*/React.createElement("td", null, "Hide section if NULL")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Nominal derivatives (prose)"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "EFG.efg_pie_explorer_data.nominal_derivatives")), /*#__PURE__*/React.createElement("td", null, "Hide section if NULL")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Modern cognates (prose)"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "EFG.efg_pie_explorer_data.modern_cognates")), /*#__PURE__*/React.createElement("td", null, "Hide section if NULL")))), /*#__PURE__*/React.createElement("div", {
    className: "rationale"
  }, /*#__PURE__*/React.createElement("strong", null, "REV item 2 \u2014 Latin as first-class column (REQ-024)."), " Latin was buried in the three prose blocks; this revision adds a structured ", /*#__PURE__*/React.createElement("code", null, "language_paradigm"), " JSON with Latin alongside French, Greek, and Sanskrit. Card-level ", /*#__PURE__*/React.createElement("em", null, "Etymology"), " text (AI-generated, narrative) is the word-history surface; this is the structural paradigm surface. ", /*#__PURE__*/React.createElement("em", null, "Complementary, not duplicate."), " Backend implication: add the column to ", /*#__PURE__*/React.createElement("code", null, "efg_pie_explorer_data"), "; backfill from the existing prose via a one-time AI extraction pass (TSK to be filed)."), /*#__PURE__*/React.createElement("div", {
    className: "rationale"
  }, /*#__PURE__*/React.createElement("strong", null, "Backend implication (unchanged)."), " ", /*#__PURE__*/React.createElement("code", null, "GET /api/flashcards/pie-explorer/", '{', "pie_root", '}'), " must merge a second query against ", /*#__PURE__*/React.createElement("code", null, "EtymologyGraph.efg_pie_explorer_data"), ". Per the BWTL02 finding the plumbing already exists (SF calls ", /*#__PURE__*/React.createElement("code", null, "_get_efg_connection()"), " on card create) \u2014 wire one read, merge in response builder. Closes ", /*#__PURE__*/React.createElement("strong", null, "BUG-045"), "."), /*#__PURE__*/React.createElement("h3", null, "4.3 \u2014 AI Chat sidecar ", /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 9.5
    }
  }, "REV-1")), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Aspect"), /*#__PURE__*/React.createElement("th", null, "Decision"), /*#__PURE__*/React.createElement("th", null, "Rationale"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Anchor type"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "flashcard_id"), " primary ", /*#__PURE__*/React.createElement("em", null, "only"), ". No ", /*#__PURE__*/React.createElement("code", null, "pie_root"), " fallback."), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, "REV-1."), " Natural chat questions are card-specific (the prototype's own example: \"Why is souvenir feminine in some texts?\" \u2014 about French gender, not ", /*#__PURE__*/React.createElement("code", null, "*g\u02B7em-"), "). With ", /*#__PURE__*/React.createElement("code", null, "flashcard_id"), " as the sole anchor, the 879 cards (30%) without a ", /*#__PURE__*/React.createElement("code", null, "pie_root"), " are a non-issue, not an edge case.")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Cross-card relevance"), /*#__PURE__*/React.createElement("td", null, "Surfaced via the ", /*#__PURE__*/React.createElement("em", null, "Promote"), " mechanism (\xA74.5) and the cross-app ", /*#__PURE__*/React.createElement("em", null, "Chat"), " tab. Not via anchor logic."), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, "REV-1."), " Decouples \"what is this conversation tied to\" from \"which other cards are related\" \u2014 those were entangled in the previous design.")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Anchor display"), /*#__PURE__*/React.createElement("td", null, "Persistent chip at left of chat header \u2014 purple ", /*#__PURE__*/React.createElement("code", null, "acc"), ", mode-tag ", /*#__PURE__*/React.createElement("code", null, "card"), ", word + card_id"), /*#__PURE__*/React.createElement("td", null, "User must always see which card their notes will save against.")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "History indicator"), /*#__PURE__*/React.createElement("td", null, "Thread-count pill in collapsed dock header \xB7 \"last: YYYY-MM-DD\""), /*#__PURE__*/React.createElement("td", null, "User knows there's existing history for this card.")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Thread switcher"), /*#__PURE__*/React.createElement("td", null, "Left rail when expanded, grouped by month"), /*#__PURE__*/React.createElement("td", null, "Threads are the navigable unit, not turns.")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Per-turn context snapshot ", /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 9
    }
  }, "REV-1")), /*#__PURE__*/React.createElement("td", null, "Each AI bubble has a small expander showing what the model received: ", /*#__PURE__*/React.createElement("code", null, `{card_fields, efg_node, figure, steering_applied, tokens_in, tokens_out}`)), /*#__PURE__*/React.createElement("td", null, "BWTL02 finding \u2014 AI chat is unreliable without full card context bundled per turn. Make that visible so users can trust (or distrust) any specific turn.")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Thread context editor ", /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 9
    }
  }, "REV-1")), /*#__PURE__*/React.createElement("td", null, "\"Context\" button in chat header opens a panel: toggleable card fields (12 keys), checkbox to attach EFG node / figure, free-text ", /*#__PURE__*/React.createElement("code", null, "steering"), " directive. Stored on the thread row."), /*#__PURE__*/React.createElement("td", null, "The ", /*#__PURE__*/React.createElement("em", null, "steering"), " string is the mechanism that prevents drift across long rabbit-hole threads. Without it, the AI silently wanders.")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Per-msg Accept dropdown ", /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 9
    }
  }, "REV-1")), /*#__PURE__*/React.createElement("td", null, "Each AI message with ", /*#__PURE__*/React.createElement("code", null, "promotable"), " set shows: target-field dropdown (16 keys, grouped by tier) + preview + Accept button. Writes directly. Appends one row to ", /*#__PURE__*/React.createElement("code", null, "chat_promotions"), "."), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, "REV item 4."), " Replaces the review-queue send. Modelled on the Verify PIE round-trip dialog. No second-party approval gate.")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Compose prompt chips"), /*#__PURE__*/React.createElement("td", null, "\"fun fact?\", \"conjugation\", \"false cognate\", \"linked figures\""), /*#__PURE__*/React.createElement("td", null, "The four most-traveled question patterns from BWTL01 logs.")))), /*#__PURE__*/React.createElement("h3", null, "4.4 \u2014 Chat tab (top-nav) ", /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 9.5
    }
  }, "REV-1")), /*#__PURE__*/React.createElement("p", null, "Renamed from ", /*#__PURE__*/React.createElement("em", null, "Theodoros"), ". Removes the approval-gate framing. Theodoros remains a power user via the permission matrix (\xA75), not via a dedicated surface. Four sub-tabs:"), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Sub-tab"), /*#__PURE__*/React.createElement("th", null, "Contents"), /*#__PURE__*/React.createElement("th", null, "Source"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, "Threads")), /*#__PURE__*/React.createElement("td", null, "Cross-app index of every chat thread, grouped by card. Click \u2192 study view with that thread active. Each thread shows its ", /*#__PURE__*/React.createElement("em", null, "context payload"), " read-only."), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "chat.threads"), " (anchored to ", /*#__PURE__*/React.createElement("code", null, "flashcard_id"), ")")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, "Audit log")), /*#__PURE__*/React.createElement("td", null, "Append-only table of every Accept action: ", /*#__PURE__*/React.createElement("em", null, "when \xB7 who \xB7 card \xB7 field \xB7 before \u2192 after \xB7 source thread"), ". Click the card name to jump into study."), /*#__PURE__*/React.createElement("td", null, "NEW table ", /*#__PURE__*/React.createElement("code", null, "chat_promotions(id, when, who, thread_id, message_idx, card, field, before, after)"))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, "New cards"), " ", /*#__PURE__*/React.createElement("span", {
    className: "src"
  }, "(was \"Author\")")), /*#__PURE__*/React.createElement("td", null, "Single-card sheet entry point + document-import deep link. Rename reflects actual purpose \u2014 this isn't \"review others' work\", it's authoring."), /*#__PURE__*/React.createElement("td", null, "Existing ", /*#__PURE__*/React.createElement("code", null, "POST /api/flashcards"), " + ", /*#__PURE__*/React.createElement("code", null, "POST /api/document/parse"))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("strong", null, "Batch jobs"), " ", /*#__PURE__*/React.createElement("span", {
    className: "src"
  }, "(was \"Batch\")")), /*#__PURE__*/React.createElement("td", null, "Monitor only. Batch results auto-apply and append audit rows \u2014 no approval gate. PL-only triggers, everyone can read."), /*#__PURE__*/React.createElement("td", null, "Same data as Admin \xB7 Batch jobs")))), /*#__PURE__*/React.createElement("div", {
    className: "rationale"
  }, /*#__PURE__*/React.createElement("strong", null, "REV item 5."), " The ", /*#__PURE__*/React.createElement("code", null, "review_items"), " table (previously in \xA710 GAP) is no longer needed as a queue. It simplifies to the audit log shape above. The \"PL/Theo auto-apply, others suggest\" rule from the previous \xA71.2.3 collapses to \"everyone Accepts via the dropdown\" \u2014 no role branching in the write path."), /*#__PURE__*/React.createElement("h3", null, "4.5 \u2014 Bookmark primitive"), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Kind"), /*#__PURE__*/React.createElement("th", null, /*#__PURE__*/React.createElement("code", null, "ref"), " resolves to"), /*#__PURE__*/React.createElement("th", null, "Visual"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "word")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "SF.flashcards.id")), /*#__PURE__*/React.createElement("td", null, "Word in sans serif, accent tag")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "pie_root")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "EFG.nodes.id"), " (pie_root type)"), /*#__PURE__*/React.createElement("td", null, "Root in Fraunces display, pie tag")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "figure")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "EM.mythological_figures.id")), /*#__PURE__*/React.createElement("td", null, "English name + Greek, myth tag")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "thread")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "chat.threads.id")), /*#__PURE__*/React.createElement("td", null, "Thread title, chat tag")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "collection")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", null, "bookmarks.collection_id"), " (new)"), /*#__PURE__*/React.createElement("td", null, "Ordered set of any of the above; sharable")))), /*#__PURE__*/React.createElement("h2", null, "5 \xB7 Role permission matrix ", /*#__PURE__*/React.createElement("span", {
    className: "pill ok",
    style: {
      fontSize: 9.5
    }
  }, "REV-1")), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-3)'
    }
  }, "Roles are permissions, not surfaces. Every role sees the same UI (the Chat tab is universal); what differs is what they can ", /*#__PURE__*/React.createElement("em", null, "write"), ". Theodoros's instructor power lives in the rows below, not in a separate surface."), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Capability"), /*#__PURE__*/React.createElement("th", null, "PL"), /*#__PURE__*/React.createElement("th", null, "Theodoros"), /*#__PURE__*/React.createElement("th", null, "Tutor"), /*#__PURE__*/React.createElement("th", null, "Learner"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Read all surfaces (Study, Chat, Bookmarks, \u2026)"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Bookmark / add to personal collection"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Chat with AI \xB7 personal threads"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Edit thread context payload (steering string)"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Create flashcard directly"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2717")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Edit any flashcard field"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "own only"), /*#__PURE__*/React.createElement("td", null, "\u2717")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Accept chat insight \u2192 card field (writes directly, audit-logged)"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "own cards only"), /*#__PURE__*/React.createElement("td", null, "\u2717")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Create / edit mythological figure (Etymython)"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2717"), /*#__PURE__*/React.createElement("td", null, "\u2717")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Trigger ArtForge video generation"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2717")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Edit EFG node / edge"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2717"), /*#__PURE__*/React.createElement("td", null, "\u2717"), /*#__PURE__*/React.createElement("td", null, "\u2717")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Run AI batch jobs (TSK-001 etc.)"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2717"), /*#__PURE__*/React.createElement("td", null, "\u2717"), /*#__PURE__*/React.createElement("td", null, "\u2717")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "View audit log of own promotions"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "n/a")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "View audit log of ", /*#__PURE__*/React.createElement("em", null, "all"), " users' promotions"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2717"), /*#__PURE__*/React.createElement("td", null, "\u2717")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Settings \xB7 audio voices"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "\u2713"), /*#__PURE__*/React.createElement("td", null, "view")))), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-3)'
    }
  }, "Top-bar role chip exposes a switcher in the prototype so each tier can be exercised. In production, role is set from ", /*#__PURE__*/React.createElement("code", null, "SF.users.role_tier"), " on login."), /*#__PURE__*/React.createElement("div", {
    className: "rationale"
  }, /*#__PURE__*/React.createElement("strong", null, "REV-1 \u2014 what changed."), " The row ", /*#__PURE__*/React.createElement("em", null, "\"Promote chat insight \u2192 review queue\""), " (PL/Theo auto-apply \xB7 others suggest) is gone. Replaced by ", /*#__PURE__*/React.createElement("em", null, "\"Accept chat insight \u2192 card field, writes directly, audit-logged\""), " \u2014 same capability for every role that can write to that card. The role gradient now lives in ", /*#__PURE__*/React.createElement("em", null, "which cards you can write to"), ", not in ", /*#__PURE__*/React.createElement("em", null, "whether your write needs approval"), "."), /*#__PURE__*/React.createElement("h2", null, "6 \xB7 ArtForge integration spec"), /*#__PURE__*/React.createElement("p", null, "Critical scope boundary: in this unified app, ArtForge appears ", /*#__PURE__*/React.createElement("strong", null, "only as a panel"), " for etymology-driven generation. The standalone destination at ", /*#__PURE__*/React.createElement("code", null, "artforge.rentyourcio.com"), " remains the home for non-etymology projects (Patagonia flyfishing, video stories, etc.) and is the subject of the sibling project ", /*#__PURE__*/React.createElement("code", null, "019e28ca-daa4-78aa-bde4-5fa2eb264603"), "."), /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "AF surface"), /*#__PURE__*/React.createElement("th", null, "Reachable from BWTL?"), /*#__PURE__*/React.createElement("th", null, "How"))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Video generation for current word"), /*#__PURE__*/React.createElement("td", null, "\u2713 inline"), /*#__PURE__*/React.createElement("td", null, "ArtForge panel \u2192 \"Generate\" button \u2192 ", /*#__PURE__*/React.createElement("code", null, "POST /api/external/generate-video"))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "From-figure storyboard"), /*#__PURE__*/React.createElement("td", null, "\u2713 inline"), /*#__PURE__*/React.createElement("td", null, "Etymython panel \u2192 \"From-figure storyboard\" \u2192 ", /*#__PURE__*/React.createElement("code", null, "POST /api/v1/stories/from-figure"))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Scene editor (etymology context only)"), /*#__PURE__*/React.createElement("td", null, "\u2713 inline (sub-modal)"), /*#__PURE__*/React.createElement("td", null, "ArtForge panel \u2192 \"Scene editor\"")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "Story enrichment with EM facts"), /*#__PURE__*/React.createElement("td", null, "\u2713 inline"), /*#__PURE__*/React.createElement("td", null, "Story-detail \xB7 \"Enrich\" \u2192 ", /*#__PURE__*/React.createElement("code", null, "POST /api/stories/", '{', "id", '}', "/enrich"))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "AF gallery / library"), /*#__PURE__*/React.createElement("td", null, "deep-link out"), /*#__PURE__*/React.createElement("td", null, "Settings \xB7 Source apps \xB7 \"Open ArtForge\" \u2192 opens artforge.rentyourcio.com in new tab")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "AF non-etymology projects"), /*#__PURE__*/React.createElement("td", null, "hidden"), /*#__PURE__*/React.createElement("td", null, "Not reachable from BWTL nav. Curated list at standalone AF only.")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "AF storyboard for fly-fishing / other"), /*#__PURE__*/React.createElement("td", null, "hidden"), /*#__PURE__*/React.createElement("td", null, "Same \u2014 these belong to AF, not BWTL")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, "AF mythology pipeline (internal)"), /*#__PURE__*/React.createElement("td", null, "hidden"), /*#__PURE__*/React.createElement("td", null, "Service-to-service only; users never see this trigger")))), /*#__PURE__*/React.createElement("h2", null, "7 \xB7 BWTL01 backlog reconciliation"), /*#__PURE__*/React.createElement("p", null, "Each row from ", /*#__PURE__*/React.createElement("code", null, "bwtl01_integration_inventory.md"), " placed against a unified-app surface. Status values: ", /*#__PURE__*/React.createElement("span", {
    className: "pill ok"
  }, "COVERED"), " ", /*#__PURE__*/React.createElement("span", {
    className: "pill accent"
  }, "CONSOLIDATED"), " ", /*#__PURE__*/React.createElement("span", {
    className: "pill err"
  }, "DEPRECATED"), " ", /*#__PURE__*/React.createElement("span", {
    className: "pill warn"
  }, "GAP"), "."), /*#__PURE__*/React.createElement("h3", null, "Section A \u2014 Super Flashcards"), /*#__PURE__*/React.createElement(BacklogTable, {
    rows: [['SF.flashcards (CRUD)', 'Study · word card + Chat · New cards (direct authoring)', 'COVERED'], ['SF.flashcard_pie_roots (multi-root junction)', 'PIE panel · atomic decomposition row', 'COVERED'], ['SF.flashcards.etymology_layer (0% filled — REQ-008)', 'Word card · Etymology section (rows by layer)', 'GAP'], ['SF GET /api/flashcards/pie-explorer/{pie_root}', 'PIE panel — SF+EFG merge + new language_paradigm column (REV-1)', 'GAP'], ['SF /api/ai/* (generate, batch)', 'Chat tab · Batch jobs (monitor) + per-field AI spark on word card', 'COVERED'], ['SF /api/study/* (SRS sessions)', 'Study · Today\'s queue', 'COVERED'], ['SF /api/document/parse', 'Chat tab · New cards · document import (deferred — not in prototype)', 'GAP'], ['SF /api/v1/pronunciation/*', 'Word card · IPA speaker button + Settings · voice clones', 'COVERED'], ['SF /api/admin/repair-pie-*', 'Admin · Batch jobs (auto-apply, audit-logged)', 'CONSOLIDATED'], ['SF /api/efg/backfill-pie-*', 'Admin · Batch jobs', 'CONSOLIDATED'], ['SF.flashcards.gender (0% filled — dead column)', 'n/a', 'DEPRECATED'], ['SF /api/v0/dcc.py (deprecated path)', 'n/a — replaced by /api/v1/cards/{id}/dcc', 'DEPRECATED'], ['SF iframe of EFG (?cardId=)', 'Replaced by xlink → PIE / EFG panels in same shell', 'CONSOLIDATED']]
  }), /*#__PURE__*/React.createElement("h3", null, "Section B \u2014 EFG / pie-network-graph"), /*#__PURE__*/React.createElement(BacklogTable, {
    rows: [['EFG /api/graph (full graph)', 'EFG panel · mini graph + deep-link to standalone graph editor', 'COVERED'], ['EFG /api/words?include_dcc=true', 'Used internally by SF dcc.py; surfaced as DCC rank pill on word card', 'COVERED'], ['EFG /api/pie-explorer/{root} (rich)', 'PIE panel · 3 prose blocks (verbal/nominal/modern)', 'COVERED'], ['EFG /api/pie-explorer/generate/{root}', 'Admin · Batch jobs (gen for 65 roots missing data)', 'COVERED'], ['EFG /api/rag-query, /api/rag/search', 'Portfolio RAG panel · scholarly entry block', 'CONSOLIDATED'], ['EFG /api/dictionary/search (Beekes viewer)', 'RAG panel takes over; standalone Beekes viewer remains', 'CONSOLIDATED'], ['EFG /api/admin/stats, /api/dcc/stats', 'Settings · health dashboard (not in prototype)', 'GAP'], ['EFG sf_url iframe overlay', 'Replaced by intrinsic word card in unified shell', 'DEPRECATED'], ['EFG.nodes.pie_audio_url (95% filled · 52 missing)', 'PIE panel falls back to TTS-on-demand for the 52', 'GAP'], ['EFG node CRUD (PATCH/DELETE)', 'PL only · admin sub-route (links to standalone graph editor)', 'COVERED']]
  }), /*#__PURE__*/React.createElement("h3", null, "Section C \u2014 Etymython"), /*#__PURE__*/React.createElement(BacklogTable, {
    rows: [['EM /api/v1/figures (CRUD)', 'Etymython panel + Chat · New cards (direct authoring)', 'COVERED'], ['EM /api/v1/cognates/lookup', 'Word card · cognates strip (already SF→EM cross-link)', 'COVERED'], ['EM /api/v1/figures/{id}/mythology-data', 'Used by ArtForge from-figure flow (server-side)', 'COVERED'], ['EM /api/v1/figures/{id}/artforge-story', 'Etymython panel · "From-figure storyboard" button', 'COVERED'], ['EM.mythological_figures.ipa_transcription (38% filled)', 'Etymython panel · IPA row · AI batch backfill', 'GAP'], ['EM.mythological_figures.pronunciation_audio_url (39% filled)', 'Admin · Batch jobs (auto-apply, audit-logged) — REV-1 retires the review row', 'GAP'], ['EM.fun_facts (1012 rows)', 'Word card · Fun facts section', 'COVERED'], ['EM.figure_relationships', 'Etymython panel · Relations list', 'COVERED'], ['EM.perseus_citations', 'Etymython panel · "Sources" footer (not in prototype)', 'GAP'], ['EM.cognate_greek_roots (2 rows)', 'Effectively unused', 'DEPRECATED'], ['EM.equivalent_figure_id (cross-myth)', 'Etymython panel · Relations · "equivalent" rel type', 'COVERED'], ['EM /api/v1/admin/migrate-sf-links', 'Admin · Batch jobs', 'CONSOLIDATED'], ['EM URL link to EFG (no API)', 'Replaced by intra-shell xlink to PIE panel', 'DEPRECATED']]
  }), /*#__PURE__*/React.createElement("h3", null, "Section D \u2014 Portfolio RAG"), /*#__PURE__*/React.createElement(BacklogTable, {
    rows: [['RAG /search, /semantic, /query', 'RAG panel + universal topbar search (etymology collection)', 'COVERED'], ['RAG /search/etymology', 'RAG panel · explicit scope', 'COVERED'], ['RAG /api/coverage*', 'Settings · health dashboard (not in prototype)', 'GAP'], ['RAG /ingest/* (admin)', 'PL only · admin sub-route', 'COVERED'], ['RAG /mcp (MCP protocol)', 'Service-to-service; no user surface', 'COVERED'], ['RAG `code` collection', 'Use MetaPM SQL code_files', 'DEPRECATED']]
  }), /*#__PURE__*/React.createElement("h3", null, "Section E \u2014 PIE Explorer (cross-app)"), /*#__PURE__*/React.createElement(BacklogTable, {
    rows: [['SF PIE Panel response shape', 'Merged into unified PIE panel response', 'CONSOLIDATED'], ['EFG PIE Panel response shape', 'Merged into unified PIE panel response', 'CONSOLIDATED'], ['"SF panel never reads from EFG"', 'Closed — unified endpoint reads both', 'GAP'], ['BUG-045 (modal shows stale data)', 'Closed — single endpoint, no stale cache split', 'GAP'], ['65 EFG PIE nodes with no explorer_data entry', 'Admin · Batch jobs · run EFG /api/pie-explorer/generate for 65 roots', 'GAP'], ['flashcard_pie_roots not queried by PIE endpoint', 'Closed — unified endpoint queries junction', 'GAP']]
  }), /*#__PURE__*/React.createElement("h3", null, "Section F \u2014 ArtForge"), /*#__PURE__*/React.createElement(BacklogTable, {
    rows: [['AF /api/external/generate-video (SF→AF)', 'ArtForge panel · Generate', 'COVERED'], ['AF /api/external/jobs/{id}', 'ArtForge panel · job status row', 'COVERED'], ['AF /api/v1/stories/from-figure (EM→AF)', 'Etymython panel · From-figure storyboard', 'COVERED'], ['AF /api/stories/{id}/enrich (etymology embed)', 'ArtForge panel · enrich row', 'COVERED'], ['AF galleries, library, non-etymology projects', 'Out of scope — deep-link to standalone', 'CONSOLIDATED'], ['AF /api/v1/mythology/figures (internal)', 'Service-to-service only', 'COVERED']]
  }), /*#__PURE__*/React.createElement("h3", null, "Cross-cutting \xB7 AI-healable fields (16)"), /*#__PURE__*/React.createElement(BacklogTable, {
    rows: [['SF.pie_audio_url (88% missing · TSK-001)', 'Admin · Batch jobs (TSK-001 tracker)', 'GAP'], ['EM figure IPA/audio (62%/61% missing)', 'Admin · Batch jobs + Chat · Audit log (REV-1)', 'GAP'], ['EM cognate PIE audio (49% missing)', 'Admin · Batch jobs', 'GAP'], ['EFG node PIE IPA/audio (5% missing · REQ-011)', 'PIE panel · fallback path; Admin · Batch jobs', 'GAP'], ['SF etymology text (10% missing)', 'Chat · Accept (per-card) + Admin · Batch jobs (bulk)', 'GAP'], ['SF english_cognates (25% missing)', 'Chat · Accept (per-card) + Admin · Batch jobs (bulk)', 'GAP'], ['SF pie_root (30% missing · TSK-008)', 'Admin · Batch jobs (TSK-008 tracker)', 'GAP'], ['SF pie_ipa (30% missing · TSK-001)', 'Admin · Batch jobs (TSK-001 tracker)', 'GAP'], ['EM cognate PIE root (7% missing)', 'Chat · Accept + Admin · Batch jobs', 'GAP'], ['EM origin_story (5% missing)', 'Chat · Accept (per-figure) + Admin · Batch jobs', 'GAP'], ['EM etymologies.notes (unknown)', 'Chat · Accept + Admin · Batch jobs', 'GAP'], ['flashcard_pie_roots.etymology_layer (0% · REQ-008)', 'Word card · Etymology section assumes filled values', 'GAP'], ['SF efg_node_id (27% missing · REQ-015)', 'EFG panel · prompts node-link create', 'GAP'], ['EFG nodes.sf_url (4% missing · REQ-015)', 'PL only · admin', 'GAP']]
  }), /*#__PURE__*/React.createElement("h3", null, "Cross-cutting \xB7 Missing capabilities"), /*#__PURE__*/React.createElement(BacklogTable, {
    rows: [['Cross-app PIE join API (HIGH)', 'Unified PIE endpoint specified in §4.2', 'GAP'], ['SF PIE panel reads flashcards only (HIGH)', 'Same — closed by §4.2', 'GAP'], ['Latin as structured paradigm column (REQ-024)', '§4.2 — new efg_pie_explorer_data.language_paradigm JSON, Latin first-class alongside Greek/Sanskrit/French (REV-1)', 'GAP'], ['etymology_layer all NULL (HIGH)', 'Word card · Etymology depends on field; backfill via Admin · Batch jobs', 'GAP'], ['PIE audio 88% missing (HIGH)', 'TSK-001 tracker · Admin · Batch jobs', 'GAP'], ['EM↔EFG: no API link', 'NEW: EM.etymologies.efg_node_id column proposed', 'GAP'], ['No non_pie_reason field (308 cards)', 'NEW: SF.flashcards.non_pie_reason column proposed', 'GAP'], ['Chat anchor primitive', 'NEW: chat_threads table proposed (anchor = flashcard_id only, messages JSON, context JSON) — REV-1 inverted', 'GAP'], ['Chat context payload visibility / steering (REV-1)', 'NEW: chat_threads.context JSON {fields[], efg_node, figure, steering}; per-msg snapshot in messages[].context_snapshot', 'GAP'], ['Chat-promotion audit (REV-1)', 'NEW: chat_promotions(id, when, who, thread_id, message_idx, card, field, before, after) — replaces review_items', 'GAP'], ['review_items table (planned)', 'RETIRED per REV-1 — collapsed to chat_promotions audit log', 'DEPRECATED'], ['Bookmark primitive', 'NEW: bookmarks polymorphic table proposed', 'GAP'], ['Role tiers', 'NEW: SF.users.role_tier column proposed', 'GAP']]
  }), /*#__PURE__*/React.createElement("div", {
    className: "rationale",
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Reconciliation contract."), " Every line above is one of (COVERED / CONSOLIDATED / DEPRECATED / GAP). The engineering agent should match this 1:1 against ", /*#__PURE__*/React.createElement("code", null, "bwtl01_integration_inventory.md"), ". Anything missing here = additional GAP. Anything in BWTL01 not in this table = please flag back for design pass."));
}
function BacklogTable({
  rows
}) {
  const stat = s => {
    if (s === 'COVERED') return /*#__PURE__*/React.createElement("span", {
      className: "pill ok"
    }, /*#__PURE__*/React.createElement("span", {
      className: "dot ok"
    }), s);
    if (s === 'CONSOLIDATED') return /*#__PURE__*/React.createElement("span", {
      className: "pill accent"
    }, s);
    if (s === 'DEPRECATED') return /*#__PURE__*/React.createElement("span", {
      className: "pill err"
    }, s);
    if (s === 'GAP') return /*#__PURE__*/React.createElement("span", {
      className: "pill warn"
    }, s);
    return s;
  };
  return /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: '38%'
    }
  }, "Inventory row"), /*#__PURE__*/React.createElement("th", null, "Unified-app surface"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: '14%'
    }
  }, "Status"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("code", {
    style: {
      fontSize: 11.5
    }
  }, r[0])), /*#__PURE__*/React.createElement("td", null, r[1]), /*#__PURE__*/React.createElement("td", null, stat(r[2]))))));
}
window.SpecDoc = SpecDoc;

// ─── tweaks.jsx ───
// Tweaks panel — exposes the most interesting design knobs the user might want
// to play with: layout, panel ordering, chat dock position, accent hue,
// AND a few NEW interesting variations (xlink style, etymology layout, fun-fact density).

function BwtlTweaks({
  tweaks,
  setTweak
}) {
  return /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    title: "Layout"
  }, /*#__PURE__*/React.createElement(TweakRadio, {
    tweak: "density",
    label: "Density",
    options: [['compact', 'Compact'], ['regular', 'Regular'], ['comfy', 'Comfy']],
    value: tweaks.density,
    onChange: v => setTweak('density', v)
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    tweak: "railWidth",
    label: "Right rail width",
    options: [['narrow', 'Narrow'], ['standard', 'Standard'], ['wide', 'Wide']],
    value: tweaks.railWidth,
    onChange: v => setTweak('railWidth', v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    tweak: "railVisible",
    label: "Show right rail",
    value: tweaks.railVisible,
    onChange: v => setTweak('railVisible', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    title: "Chat dock"
  }, /*#__PURE__*/React.createElement(TweakRadio, {
    tweak: "chatPosition",
    label: "Chat dock position",
    options: [['bottom-center', 'Bottom (center)'], ['bottom-right', 'Bottom-right'], ['side-right', 'Right side']],
    value: tweaks.chatPosition,
    onChange: v => setTweak('chatPosition', v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    tweak: "chatPersistThreads",
    label: "Show thread rail when expanded",
    value: tweaks.chatPersistThreads,
    onChange: v => setTweak('chatPersistThreads', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    title: "Cross-app integration cues"
  }, /*#__PURE__*/React.createElement(TweakRadio, {
    tweak: "xlinkStyle",
    label: "Drill-down link style",
    options: [['tinted', 'Tinted bg'], ['underline', 'Underline only'], ['tag-pill', 'Source-tag pill']],
    value: tweaks.xlinkStyle,
    onChange: v => setTweak('xlinkStyle', v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    tweak: "panelGlow",
    label: "Panel glow on drill-down",
    value: tweaks.panelGlow,
    onChange: v => setTweak('panelGlow', v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    tweak: "showSourceTags",
    label: "Source tags inside xlinks (PIE / EM / RAG \u2026)",
    value: tweaks.showSourceTags,
    onChange: v => setTweak('showSourceTags', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    title: "Theme"
  }, /*#__PURE__*/React.createElement(TweakColor, {
    tweak: "accent",
    label: "Primary accent",
    value: tweaks.accent,
    onChange: v => setTweak('accent', v),
    options: ['oklch(70% 0.17 295)',
    // default purple
    'oklch(72% 0.16 230)',
    // blue
    'oklch(74% 0.15 65)',
    // amber
    'oklch(74% 0.14 175)',
    // teal
    'oklch(72% 0.18 350)' // magenta
    ]
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    tweak: "theme",
    label: "Theme",
    options: [['dark', 'Dark'], ['light', 'Light (preview)']],
    value: tweaks.theme,
    onChange: v => setTweak('theme', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    title: "Word card variations"
  }, /*#__PURE__*/React.createElement(TweakRadio, {
    tweak: "etymologyLayout",
    label: "Etymology rendering",
    options: [['layered', 'Layered rows'], ['narrative', 'Narrative prose'], ['tree', 'Vertical tree']],
    value: tweaks.etymologyLayout,
    onChange: v => setTweak('etymologyLayout', v)
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    tweak: "funfactDensity",
    label: "Fun-fact density",
    options: [['stacked', 'Stacked cards'], ['carousel', 'Carousel']],
    value: tweaks.funfactDensity,
    onChange: v => setTweak('funfactDensity', v)
  })));
}
window.BwtlTweaks = BwtlTweaks;

// ─── app.jsx ───
// Top-level app — shell, primary nav, role-aware routing, tweak-aware styling.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "regular",
  "railWidth": "standard",
  "railVisible": true,
  "chatPosition": "bottom-center",
  "chatPersistThreads": true,
  "xlinkStyle": "tag-pill",
  "panelGlow": true,
  "showSourceTags": true,
  "accent": "oklch(70% 0.17 295)",
  "theme": "dark",
  "etymologyLayout": "layered",
  "funfactDensity": "stacked"
} /*EDITMODE-END*/;
function computeCardSpine(cardFilter) {
  let cards = Object.values(window.BWTL.FLASHCARDS || {});
  if (cardFilter.chips.includes('bookmarked')) cards = cards.filter(c => c.bookmarked);
  if (cardFilter.chips.includes('has_video')) cards = cards.filter(c => c.has_video);
  if (cardFilter.chips.includes('missing_data')) cards = cards.filter(c => !c.pie_root && !(c.pie_roots && c.pie_roots.length));
  if (cardFilter.language) {
    const langName = (window.BWTL.LANGUAGE_FILTERS || []).find(l => l.code === cardFilter.language)?.name;
    if (langName) cards = cards.filter(c => c.language === langName);
  }
  if (cardFilter.q) {
    const q = cardFilter.q.toLowerCase();
    cards = cards.filter(c => ((c.word_or_phrase || c.word || '') + ' ' + (c.definition || '')).toLowerCase().includes(q));
  }
  if (cardFilter.sort === 'alpha') {
    cards.sort((a, b) => (a.word_or_phrase || a.word || '').localeCompare(b.word_or_phrase || b.word || ''));
  }
  return cards.map(c => c.id);
}
function buildTrail(section, detailCardId) {
  if (section === 'browse') {
    if (detailCardId) {
      const c = window.BWTL.FLASHCARDS && window.BWTL.FLASHCARDS[detailCardId];
      return [{
        label: 'Browse',
        go: {
          section: 'browse',
          clearDetail: true
        }
      }, {
        label: c?.word_or_phrase || c?.word || detailCardId,
        here: true
      }];
    }
    return [{
      label: 'Browse',
      here: true
    }];
  }
  if (section === 'generate') return [{
    label: 'Generate',
    here: true
  }];
  if (section === 'theodoros') return [{
    label: 'Chat',
    here: true
  }];
  if (section === 'admin') return [{
    label: 'Admin',
    here: true
  }];
  if (section === 'settings') return [{
    label: 'Settings',
    here: true
  }];
  return [];
}
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [mode, setMode] = React.useState('proto'); // proto | spec
  const [role, setRole] = React.useState('pl');
  const [section, setSection] = React.useState('browse');
  const [browseTab, setBrowseTab] = React.useState('cards');
  const [detailCardId, setDetailCardId] = React.useState(null);
  const [detailMode, setDetailMode] = React.useState('study');

  // BWTLGO5 (BUG-128): passphrase modal state
  const [authRequired, setAuthRequired] = React.useState(!window.BWTL._getToken());
  const [passphraseInput, setPassphraseInput] = React.useState('');
  const [passphraseError, setPassphraseError] = React.useState('');
  const [passphraseLoading, setPassphraseLoading] = React.useState(false);
  React.useEffect(() => {
    const handler = () => setAuthRequired(true);
    window.addEventListener('bwtl:auth-required', handler);
    return () => window.removeEventListener('bwtl:auth-required', handler);
  }, []);
  const handlePassphraseSubmit = async e => {
    e.preventDefault();
    setPassphraseLoading(true);
    setPassphraseError('');
    try {
      await window.BWTL.bwtlLogin(passphraseInput);
      setAuthRequired(false);
      setPassphraseInput('');
    } catch (err) {
      setPassphraseError('Incorrect passphrase — try again.');
    } finally {
      setPassphraseLoading(false);
    }
  };
  // Show passphrase modal if no token — nothing else renders until auth
  if (authRequired) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-0)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "card card-body",
      style: {
        padding: 32,
        maxWidth: 360,
        width: '100%',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "display",
      style: {
        fontSize: 22,
        marginBottom: 6
      }
    }, "BWTL"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: 'var(--fg-3)',
        marginBottom: 24
      }
    }, "Enter the session passphrase to continue."), /*#__PURE__*/React.createElement("form", {
      onSubmit: handlePassphraseSubmit,
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "password",
      value: passphraseInput,
      onChange: e => setPassphraseInput(e.target.value),
      placeholder: "Passphrase",
      autoFocus: true,
      style: {
        padding: '10px 14px',
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        color: 'var(--fg)',
        fontSize: 14,
        outline: 'none'
      }
    }), passphraseError && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--danger, #e55)'
      }
    }, passphraseError), /*#__PURE__*/React.createElement("button", {
      className: "btn primary",
      type: "submit",
      disabled: !passphraseInput || passphraseLoading
    }, passphraseLoading ? 'Authenticating…' : 'Continue →'))));
  }
  const [cardFilter, setCardFilter] = React.useState({
    chips: [],
    language: null,
    sort: 'modified',
    q: ''
  });
  const [createOpen, setCreateOpen] = React.useState(false);
  const [flashcardsVersion, setFlashcardsVersion] = React.useState(0);
  React.useEffect(() => {
    const onLoaded = () => setFlashcardsVersion(v => v + 1);
    window.addEventListener('bwtl:flashcards-loaded', onLoaded);
    return () => window.removeEventListener('bwtl:flashcards-loaded', onLoaded);
  }, []);
  const cardSpine = React.useMemo(() => computeCardSpine(cardFilter), [cardFilter, flashcardsVersion]);

  // ── URL-based routing on mount ───────────────────────────────────────────
  React.useEffect(() => {
    const path = window.location.pathname;
    const cardMatch = path.match(/^\/bwtl\/browse\/card\/([^/]+)/);
    if (cardMatch) {
      openCard(cardMatch[1]);
    } else if (/^\/bwtl\/browse/.test(path)) {
      setSection('browse');
    } else if (/^\/bwtl\/generate/.test(path)) {
      setSection('generate');
    } else if (/^\/bwtl\/admin/.test(path)) {
      setSection('admin');
    } else if (/^\/bwtl\/theodoros/.test(path)) {
      setSection('theodoros');
    } else if (/^\/bwtl\/settings/.test(path)) {
      setSection('settings');
    }
  }, []);

  // ── prefetch languages on boot; cards are loaded on-demand by CardsTab ──
  // REQ-019: removed startup fetchCards() prefetch — cards load on-demand only
  React.useEffect(() => {
    if (!window.BWTL.fetchLanguages) return;
    window.BWTL.fetchLanguages().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── workspace UI state ───────────────────────────────────────────────────
  const [panelState, setPanelState] = React.useState({
    pie: 'open',
    graph: 'open',
    myth: 'closed',
    rag: 'collapsed',
    forge: 'collapsed'
  });
  const [glowedPanel, setGlowedPanel] = React.useState(null);
  const triggerGlow = p => {
    if (!t.panelGlow) return;
    setGlowedPanel(p);
    setTimeout(() => setGlowedPanel(null), 1400);
  };
  const [expandedChat, setExpandedChat] = React.useState(false);
  const [activeThreadId, setActiveThreadId] = React.useState(null);

  // role switcher
  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);

  // ── apply tweaks ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    document.documentElement.style.setProperty('--acc', t.accent);
    document.documentElement.style.setProperty('--acc-2', t.accent);
    // Rail width
    const w = {
      narrow: 360,
      standard: 420,
      wide: 520
    }[t.railWidth] || 420;
    document.documentElement.style.setProperty('--rail-w', w + 'px');
    // density
    document.documentElement.style.setProperty('--ws-pad', t.density === 'compact' ? '12px' : t.density === 'comfy' ? '28px' : '18px');
  }, [t.accent, t.railWidth, t.density]);

  // ── open card detail (REV-3) ──────────────────────────────────────────────
  const openCard = cardId => {
    if (!cardId) return;
    setSection('browse');
    setDetailCardId(cardId);
    setDetailMode('study');
    setPanelState(p => ({
      ...p,
      pie: 'open'
    }));
    setActiveThreadId(null);
  };
  const backToBrowse = () => setDetailCardId(null);
  const navByDelta = delta => {
    const idx = cardSpine.indexOf(detailCardId);
    if (idx === -1) return;
    const nxt = cardSpine[idx + delta];
    if (nxt) openCard(nxt);
  };

  // ── open figure detail (drill from fun fact) ─────────────────────────────
  const openFigure = figureId => {
    setPanelState(p => ({
      ...p,
      myth: 'open'
    }));
  };

  // BUG-121: Accept writes to chat_promotions via POST /api/chat/promotions.
  // payload: { card: card_id, field: target_field, preview: proposed_value, msgId? }
  const onPromote = payload => {
    const fieldMeta = window.BWTL.PROMOTE_FIELDS.find(f => f.key === payload.field);
    window.BWTL.promoteField({
      chat_message_id: payload.msgId || 'unknown',
      card_id: payload.card,
      target_field: payload.field,
      before_value: null,
      after_value: payload.preview || '',
      accepted_by: role
    }).then(() => {
      showToast(`Accepted → ${window.BWTL.FLASHCARDS[payload.card]?.word || payload.card} · ${fieldMeta?.label || payload.field}`);
    }).catch(err => {
      console.error('[onPromote]', err);
      showToast(`Accepted (local only — audit write failed)`);
    });
  };

  // REQ-039: card deleted — evict from spine and go back to browse
  // BUG-115: cardSpine is derived via useMemo; there is no setCardSpine setter.
  // Bumping flashcardsVersion forces recompute; the card was already evicted from
  // window.BWTL.FLASHCARDS before onCardDeleted is called.
  const onCardDeleted = cardId => {
    setFlashcardsVersion(v => v + 1);
    setDetailCardId(null);
    setSection('browse');
    showToast('Card deleted');
  };

  // ── toast (lightweight) ──────────────────────────────────────────────────
  const [toast, setToast] = React.useState(null);
  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  // Global event hooks — StudyToolbar and AiEditButton dispatch these.
  React.useEffect(() => {
    const onCreate = () => setCreateOpen(true);
    const onToast = e => showToast(e.detail);
    const onCardReload = e => {
      if (e.detail) openCard(e.detail);
    };
    window.addEventListener('bwtl:open-create', onCreate);
    window.addEventListener('bwtl:toast', onToast);
    window.addEventListener('bwtl:card-reload', onCardReload);
    return () => {
      window.removeEventListener('bwtl:open-create', onCreate);
      window.removeEventListener('bwtl:toast', onToast);
      window.removeEventListener('bwtl:card-reload', onCardReload);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const trail = buildTrail(section, detailCardId);

  // Role gates — Chat tab is visible to all roles (REV item 5).
  // Theodoros power-user status is now permission-based (edit any card, run
  // batch jobs, edit EFG nodes), not a separate UI surface.
  const canSeeAdmin = role === 'pl';
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, mode === 'proto' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TopBar, {
    section: section,
    setSection: s => {
      setSection(s);
      if (s !== 'browse') setDetailCardId(null);
    },
    role: role,
    setRole: setRole,
    canSeeAdmin: canSeeAdmin,
    roleMenuOpen: roleMenuOpen,
    setRoleMenuOpen: setRoleMenuOpen,
    cardFilter: cardFilter,
    setCardFilter: setCardFilter
  }), trail.length > 0 && /*#__PURE__*/React.createElement(Crumbs, {
    trail: trail,
    go: g => {
      if (g.section) setSection(g.section);
      if (g.clearDetail) setDetailCardId(null);
    }
  }), /*#__PURE__*/React.createElement("main", {
    className: "main-area"
  }, section === 'browse' && !detailCardId && /*#__PURE__*/React.createElement(BrowseView, {
    onOpenCard: openCard,
    onOpenFigure: openFigure,
    role: role,
    browseTab: browseTab,
    setBrowseTab: setBrowseTab,
    cardFilter: cardFilter,
    setCardFilter: setCardFilter,
    spine: cardSpine
  }), section === 'browse' && detailCardId && /*#__PURE__*/React.createElement(CardDetail, {
    cardId: detailCardId,
    role: role,
    spine: cardSpine,
    mode: detailMode,
    setMode: setDetailMode,
    onBack: backToBrowse,
    onNavByDelta: navByDelta,
    onOpenCard: openCard,
    onOpenFigure: openFigure,
    panelState: panelState,
    setPanelState: setPanelState,
    glowedPanel: glowedPanel,
    triggerGlow: triggerGlow,
    expandedChat: expandedChat,
    setExpandedChat: setExpandedChat,
    activeThreadId: activeThreadId,
    setActiveThreadId: setActiveThreadId,
    onPromote: onPromote,
    onCardDeleted: onCardDeleted
  }), section === 'generate' && /*#__PURE__*/React.createElement(GenerateView, {
    cardId: detailCardId || 'fc_souvenir',
    role: role
  }), section === 'theodoros' && /*#__PURE__*/React.createElement(TheodorosView, {
    onAccept: item => showToast(`Accepted · ${item.field}`),
    onReject: item => showToast(`Rejected · ${item.id}`),
    onNavigateWord: openCard
  }), section === 'admin' && canSeeAdmin && /*#__PURE__*/React.createElement(AdminView, {
    role: role
  }), section === 'admin' && !canSeeAdmin && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 40,
      color: 'var(--fg-3)'
    }
  }, "Admin surfaces are PL-only."), section === 'settings' && /*#__PURE__*/React.createElement(SettingsView, {
    role: role
  }), section === 'bookmarks' && window.BookmarksView && /*#__PURE__*/React.createElement(window.BookmarksView, {
    go: g => {
      if (g.section) setSection(g.section);
    },
    onOpenCard: id => {
      setSection('browse');
      openCard(id);
    },
    onOpenFigure: openFigure
  }))) : /*#__PURE__*/React.createElement(SpecDoc, null)), /*#__PURE__*/React.createElement("div", {
    className: "mode-toggle"
  }, /*#__PURE__*/React.createElement("button", {
    className: mode === 'proto' ? 'active' : '',
    onClick: () => setMode('proto')
  }, /*#__PURE__*/React.createElement(Ic.grid, null), " Prototype"), /*#__PURE__*/React.createElement("button", {
    className: mode === 'spec' ? 'active' : '',
    onClick: () => setMode('spec')
  }, /*#__PURE__*/React.createElement(Ic.doc, null), " Spec")), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 90,
      right: 18,
      zIndex: 200,
      background: 'var(--bg-3)',
      border: '1px solid var(--acc-ring)',
      padding: '10px 14px',
      borderRadius: 10,
      color: 'var(--fg)',
      fontSize: 13,
      boxShadow: '0 10px 30px -10px rgba(0,0,0,.6)',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Ic.check, {
    style: {
      color: 'var(--ok)'
    }
  }), " ", toast), /*#__PURE__*/React.createElement(BwtlTweaks, {
    tweaks: t,
    setTweak: setTweak
  }), createOpen && /*#__PURE__*/React.createElement(NewCardSheet, {
    role: role,
    onClose: () => setCreateOpen(false),
    onCreated: (word, lang) => {
      setCreateOpen(false);
      showToast(`Created \u201c${word}\u201d in ${lang}`);
    }
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Topbar — brand · primary nav · search · bookmark rail · role chip
// ─────────────────────────────────────────────────────────────────────────────

function TopBar({
  section,
  setSection,
  role,
  setRole,
  canSeeAdmin,
  roleMenuOpen,
  setRoleMenuOpen,
  cardFilter,
  setCardFilter
}) {
  const r = window.BWTL.ROLES[role];
  const [bmCount, setBmCount] = React.useState(() => (window.BWTL.BOOKMARKS || []).length);
  React.useEffect(() => {
    const onBmChanged = () => setBmCount((window.BWTL.BOOKMARKS || []).length);
    window.addEventListener('bwtl:bookmarks-changed', onBmChanged);
    return () => window.removeEventListener('bwtl:bookmarks-changed', onBmChanged);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "topbar-inner"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-mark"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, "Bring Words to Life"), /*#__PURE__*/React.createElement("div", {
    className: "brand-sub"
  }, "Unified \xB7 BWTL01 \xB7 v0.3 \xB7 REV-3"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 2,
      padding: 4,
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      borderRadius: 10
    }
  }, [['browse', 'Browse', /*#__PURE__*/React.createElement(Ic.grid, null), null], ['generate', 'Generate', /*#__PURE__*/React.createElement(Ic.film, null), null], ['theodoros', 'Chat', /*#__PURE__*/React.createElement(Ic.chat, null), Object.values(window.BWTL.CHAT_THREADS).reduce((a, x) => a + x.length, 0)], canSeeAdmin ? ['admin', 'Admin', /*#__PURE__*/React.createElement(Ic.spark, null), null] : null, ['settings', 'Settings', null, null]].filter(Boolean).map(([k, lab, icon, badge]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setSection(k),
    style: {
      appearance: 'none',
      border: 0,
      background: section === k ? 'linear-gradient(180deg, var(--bg-4), var(--bg-3))' : 'transparent',
      color: section === k ? 'var(--fg)' : 'var(--fg-3)',
      padding: '6px 14px',
      borderRadius: 7,
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      boxShadow: section === k ? '0 1px 0 rgba(255,255,255,.05) inset' : 'none',
      position: 'relative'
    }
  }, icon, " ", lab, badge > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--acc)',
      color: '#0b0918',
      fontSize: 9.5,
      fontWeight: 800,
      fontFamily: 'var(--ff-mono)',
      padding: '1px 5px',
      borderRadius: 99,
      marginLeft: 2
    }
  }, badge))))), /*#__PURE__*/React.createElement("div", {
    className: "search"
  }, /*#__PURE__*/React.createElement(Ic.search, null), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search cards\u2026",
    value: cardFilter?.q || '',
    onChange: e => setCardFilter(f => ({
      ...f,
      q: e.target.value
    }))
  }), cardFilter?.q && /*#__PURE__*/React.createElement("button", {
    title: "Clear search",
    onClick: () => setCardFilter(f => ({
      ...f,
      q: ''
    })),
    style: {
      appearance: 'none',
      background: 'transparent',
      border: 0,
      color: 'var(--fg-3)',
      cursor: 'pointer',
      padding: '2px 4px',
      display: 'flex',
      alignItems: 'center',
      borderRadius: 4
    }
  }, "\u2715"), /*#__PURE__*/React.createElement("span", {
    className: "kbd"
  }, "\u2318K")), /*#__PURE__*/React.createElement("div", {
    className: "right-cluster"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm primary",
    title: "Create a new flashcard \xB7 POST /api/flashcards",
    onClick: () => window.dispatchEvent(new CustomEvent('bwtl:open-create'))
  }, /*#__PURE__*/React.createElement(Ic.plus, null), " New card"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost",
    title: "Bookmarks rail",
    onClick: () => setSection('bookmarks')
  }, /*#__PURE__*/React.createElement(Ic.bookmark, null), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-3)'
    }
  }, bmCount)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: `role-chip ${role === 'theo' ? 'theo' : role === 'learner' ? 'learner' : ''}`,
    onClick: () => setRoleMenuOpen(o => !o)
  }, /*#__PURE__*/React.createElement("div", {
    className: "av"
  }, r.initials), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      lineHeight: 1.1
    }
  }, /*#__PURE__*/React.createElement("span", null, r.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: 'var(--fg-4)',
      fontWeight: 500
    }
  }, r.sub)), /*#__PURE__*/React.createElement(Ic.caret_d, {
    style: {
      color: 'var(--fg-4)'
    }
  })), roleMenuOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      borderRadius: 10,
      padding: 6,
      minWidth: 220,
      zIndex: 90,
      boxShadow: '0 20px 50px -10px rgba(0,0,0,.6)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 10px',
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--fg-4)',
      letterSpacing: '0.07em',
      textTransform: 'uppercase'
    }
  }, "Switch role (prototype only)"), Object.values(window.BWTL.ROLES).map(R => /*#__PURE__*/React.createElement("div", {
    key: R.id,
    onClick: () => {
      setRole(R.id);
      setRoleMenuOpen(false);
    },
    style: {
      padding: '8px 10px',
      borderRadius: 6,
      cursor: 'pointer',
      background: role === R.id ? 'var(--bg-3)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "av",
    style: {
      width: 22,
      height: 22,
      borderRadius: 99,
      background: R.id === 'theo' ? 'linear-gradient(135deg, var(--myth), var(--forge))' : R.id === 'learner' ? 'linear-gradient(135deg, var(--graph), var(--pie))' : R.id === 'tutor' ? 'linear-gradient(135deg, var(--acc), var(--graph))' : 'linear-gradient(135deg, var(--acc), var(--pie))',
      display: 'grid',
      placeItems: 'center',
      fontSize: 10,
      color: '#0b0918',
      fontWeight: 800
    }
  }, R.initials), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, R.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, R.sub)), role === R.id && /*#__PURE__*/React.createElement(Ic.check, {
    style: {
      color: 'var(--ok)'
    }
  }))))))));
}
function Crumbs({
  trail,
  go
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "crumbs"
  }, trail.map((c, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    className: "sep"
  }, "/"), c.here ? /*#__PURE__*/React.createElement("span", {
    className: "here"
  }, c.label) : c.go ? /*#__PURE__*/React.createElement("a", {
    onClick: () => go(c.go),
    style: {
      cursor: 'pointer'
    }
  }, c.label) : /*#__PURE__*/React.createElement("span", null, c.label))));
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings — basic skeleton
// ─────────────────────────────────────────────────────────────────────────────

function SettingsView({
  role
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 20px',
      maxWidth: 900,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "display",
    style: {
      fontSize: 32,
      margin: 0
    }
  }, "Settings"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--fg-3)',
      marginTop: 6
    }
  }, "Identity, audio voices, and deep-links out to standalone source apps."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 12,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(SettingsRow, {
    title: "Identity"
  }, /*#__PURE__*/React.createElement("div", null, "You are ", /*#__PURE__*/React.createElement("strong", null, window.BWTL.ROLES[role].label), " \xB7 ", window.BWTL.ROLES[role].sub), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--fg-3)',
      fontSize: 12,
      marginTop: 4
    }
  }, "Role tier controls Theodoros visibility and AI-correction approval rights. See the role matrix in Spec.")), /*#__PURE__*/React.createElement(SettingsRow, {
    title: "Audio voices"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill ghost"
  }, "ElevenLabs \xB7 default"), /*#__PURE__*/React.createElement("span", {
    className: "pill ghost"
  }, "Eleni (your clone) \xB7 Greek"), /*#__PURE__*/React.createElement("span", {
    className: "pill ghost"
  }, "Marcus \xB7 Latin restored")), window.BWTL_DEBUG_VOICE && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: 8,
      background: 'var(--bg-2)',
      border: '1px dashed var(--warn)',
      borderRadius: 6,
      fontSize: 11,
      color: 'var(--fg-3)',
      fontFamily: 'var(--ff-mono)'
    }
  }, "[voice-trace] BWTL_DEBUG_VOICE active \xB7 clones: ", Object.keys(window.BWTL.VOICE_CLONES || {}).length, " \xB7 fetchVoiceClones available: ", typeof window.BWTL.fetchVoiceClones === 'function' ? 'yes' : 'no')), /*#__PURE__*/React.createElement(SettingsRow, {
    title: "Source apps \xB7 deep-link out"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(DeepLink, {
    name: "ArtForge (full)",
    url: "artforge.rentyourcio.com",
    purpose: "Non-etymology projects, galleries, full library."
  }), /*#__PURE__*/React.createElement(DeepLink, {
    name: "EFG graph editor",
    url: "efg.rentyourcio.com",
    purpose: "Admin node/edge management."
  }), /*#__PURE__*/React.createElement(DeepLink, {
    name: "Etymython admin",
    url: "etymython.rentyourcio.com/admin",
    purpose: "Figure CMS for instructor authoring."
  }), /*#__PURE__*/React.createElement(DeepLink, {
    name: "Portfolio RAG console",
    url: "rag.rentyourcio.com",
    purpose: "Ingestion + collection management (PL only)."
  }))), /*#__PURE__*/React.createElement(SettingsRow, {
    title: "Data health \xB7 BWTL01 snapshot"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 6,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement(HealthRow, {
    label: "SF pie_audio_url filled",
    filled: 0.12,
    target: 0.95,
    pill: "warn",
    sub: "TSK-001 in progress \u2014 2581 missing"
  }), /*#__PURE__*/React.createElement(HealthRow, {
    label: "EFG nodes.pie_audio_url",
    filled: 0.95,
    target: 1.0,
    pill: "ok",
    sub: "52 missing (REQ-011)"
  }), /*#__PURE__*/React.createElement(HealthRow, {
    label: "EM figure audio",
    filled: 0.39,
    target: 0.95,
    pill: "warn",
    sub: "111 missing \u2014 no in-flight requirement"
  }), /*#__PURE__*/React.createElement(HealthRow, {
    label: "SF pie_root filled",
    filled: 0.70,
    target: 0.85,
    pill: "warn",
    sub: "879 missing \u2014 440 backfill-pending (TSK-008)"
  }), /*#__PURE__*/React.createElement(HealthRow, {
    label: "flashcard_pie_roots.etymology_layer",
    filled: 0.0,
    target: 0.95,
    pill: "err",
    sub: "2922 rows \xB7 0% filled (REQ-008)"
  })))));
}
function SettingsRow({
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, title)), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, children));
}
function DeepLink({
  name,
  url,
  purpose
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 8,
      alignItems: 'center',
      padding: '8px 10px',
      borderRadius: 6,
      background: 'var(--bg-2)',
      border: '1px solid var(--line-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, name, " ", /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--fg-4)',
      fontSize: 11,
      marginLeft: 6
    }
  }, url)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--fg-3)',
      marginTop: 2
    }
  }, purpose)), /*#__PURE__*/React.createElement("button", {
    className: "btn sm ghost"
  }, /*#__PURE__*/React.createElement(Ic.link, null), " Open"));
}
function HealthRow({
  label,
  filled,
  target,
  pill,
  sub
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      color: 'var(--fg-2)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    className: `pill ${pill}`,
    style: {
      fontSize: 10
    }
  }, (filled * 100).toFixed(0), "% / ", (target * 100).toFixed(0), "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 6,
      background: 'var(--bg-3)',
      borderRadius: 99,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: filled * 100 + '%',
      background: pill === 'ok' ? 'var(--ok)' : pill === 'warn' ? 'var(--warn)' : 'var(--err)',
      borderRadius: 99
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: target * 100 + '%',
      top: -2,
      bottom: -2,
      width: 1.5,
      background: 'var(--fg-3)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-4)',
      marginTop: 2
    }
  }, sub));
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW CARD SHEET — surfaces SF /api/flashcards + /api/ai/ai_generate
// BUG-101: One-click AI add — no multi-step setup dialog before card.
// BUG-108: Inline validation on empty/invalid required input.
// BV-09: Manual Entry path creates card from typed fields.
// ─────────────────────────────────────────────────────────────────────────────

function NewCardSheet({
  role,
  onClose,
  onCreated
}) {
  // step: 'input' | 'generating' | 'manual'
  const [step, setStep] = React.useState('input');
  const [word, setWord] = React.useState('');
  const [wordError, setWordError] = React.useState(''); // BUG-108: inline validation
  const [lang, setLang] = React.useState('Greek');
  const [aiError, setAiError] = React.useState('');
  const [createdCard, setCreatedCard] = React.useState(null);
  // Manual entry state
  const [manualDef, setManualDef] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [manualError, setManualError] = React.useState('');

  // Ensure LANGUAGES are loaded (real objects with .id)
  React.useEffect(() => {
    const langs = window.BWTL.LANGUAGES;
    if (!Array.isArray(langs) || typeof langs[0] === 'string' || !langs[0]?.id) {
      window.BWTL.fetchLanguages().catch(() => {});
    }
  }, []);
  const langs = window.BWTL.LANGUAGES;

  // Resolve language UUID from current lang name
  const _getLangId = () => {
    const langsArr = window.BWTL.LANGUAGES;
    if (Array.isArray(langsArr) && langsArr[0]?.id) {
      const match = langsArr.find(l => l.name === lang || l.code === lang);
      return match?.id || null;
    }
    return null;
  };

  // BUG-101: Start AI immediately when user confirms word + language
  const startAi = async () => {
    if (step !== 'input') return; // BUG-101: guard against double-submit
    const trimmed = word.trim();
    if (!trimmed) {
      setWordError('Word or phrase is required.'); // BUG-108: inline validation
      return;
    }
    setWordError('');
    setAiError('');
    setStep('generating');
    const langId = _getLangId();
    if (!langId) {
      try {
        await window.BWTL.fetchLanguages();
      } catch (_) {}
    }
    const resolvedId = _getLangId();
    if (!resolvedId) {
      setAiError('Language not found. Please try again.');
      setStep('input');
      return;
    }
    try {
      const card = await window.BWTL._apiFetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          word_or_phrase: trimmed,
          language_id: resolvedId
        })
      });
      setCreatedCard(card);
      window.BWTL.FLASHCARDS[card.id] = card; // BUG-101: seed cache before reload event
      window.dispatchEvent(new CustomEvent('bwtl:card-reload', {
        detail: card.id
      }));
      onCreated(card.word_or_phrase || trimmed, lang);
    } catch (err) {
      setAiError(`AI generation failed: ${err.message}. You can try Manual Entry instead.`);
      setStep('input');
    }
  };

  // BV-09: Manual entry — POST minimal card from typed fields
  const submitManual = async () => {
    const trimmed = word.trim();
    if (!trimmed) {
      setManualError('Word or phrase is required.');
      return;
    }
    setManualError('');
    setIsSubmitting(true);
    try {
      const langId = _getLangId();
      if (!langId) {
        await window.BWTL.fetchLanguages().catch(() => {});
      }
      const resolvedId = _getLangId();
      if (!resolvedId) throw new Error('Language not found');
      await window.BWTL._apiFetch('/api/flashcards/', {
        method: 'POST',
        body: JSON.stringify({
          word_or_phrase: trimmed,
          definition: manualDef.trim() || undefined,
          language_id: resolvedId
        })
      });
      window.dispatchEvent(new CustomEvent('bwtl:card-reload'));
      onCreated(trimmed, lang);
    } catch (err) {
      setManualError(`Save failed: ${err.message}`);
      setIsSubmitting(false);
    }
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "sheet-backdrop",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "sheet",
    style: {
      top: '8vh',
      bottom: 'auto',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(600px, calc(100vw - 40px))',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      borderBottom: '1px solid var(--line-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--ff-display)',
      fontSize: 20,
      fontWeight: 500
    }
  }, step === 'manual' ? 'Manual entry' : 'New flashcard'), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      appearance: 'none',
      background: 'transparent',
      border: 0,
      color: 'var(--fg-3)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Ic.x, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 22px'
    }
  }, step === 'input' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      display: 'block',
      marginBottom: 8
    }
  }, "Word or phrase"), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: word,
    onChange: e => {
      setWord(e.target.value);
      if (wordError) setWordError('');
    },
    onKeyDown: e => {
      if (e.key === 'Enter') startAi();
    },
    placeholder: lang === 'Greek' ? 'e.g. ἀναμιμνῄσκω' : lang === 'French' ? 'e.g. souvenir' : 'e.g. memory',
    style: {
      width: '100%',
      padding: '12px 16px',
      boxSizing: 'border-box',
      background: wordError ? 'color-mix(in oklch, var(--err) 5%, var(--bg-1))' : 'var(--bg-1)',
      border: '1px solid ' + (wordError ? 'var(--err)' : 'var(--line)'),
      borderRadius: 'var(--r)',
      color: 'var(--fg)',
      font: 'inherit',
      fontFamily: 'var(--ff-display)',
      fontSize: 22
    }
  }), wordError && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--err)',
      marginTop: 5,
      display: 'flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(Ic.spark, {
    style: {
      width: 12,
      height: 12
    }
  }), " ", wordError), aiError && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--warn)',
      marginTop: 5
    }
  }, aiError)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      display: 'block',
      marginBottom: 8
    }
  }, "Language"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: 6
    }
  }, langs.map(l => /*#__PURE__*/React.createElement("button", {
    key: l.code,
    onClick: () => setLang(l.name),
    style: {
      appearance: 'none',
      cursor: 'pointer',
      border: '1px solid ' + (lang === l.name ? 'var(--acc-ring)' : 'var(--line)'),
      background: lang === l.name ? 'var(--acc-bg)' : 'var(--bg-1)',
      color: lang === l.name ? 'var(--fg)' : 'var(--fg-2)',
      padding: '8px 10px',
      borderRadius: 8,
      fontFamily: 'inherit',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, l.name))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => {
      if (!word.trim()) {
        setWordError('Word or phrase is required.');
        return;
      }
      setWordError('');
      setStep('manual');
    }
  }, "Manual entry"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    style: {
      marginLeft: 'auto'
    },
    onClick: startAi
  }, /*#__PURE__*/React.createElement(Ic.spark, null), " Add with AI"))), step === 'generating' && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '32px 0',
      display: 'grid',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "display",
    style: {
      fontSize: 32,
      color: 'var(--fg)'
    }
  }, word), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--fg-3)',
      marginTop: 4
    }
  }, lang)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      fontSize: 14,
      color: 'var(--fg-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot warn"
  }), " Using AI generation\u2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--fg-4)'
    }
  }, "Generating etymology, PIE root, IPA, cognates and wiring to EFG. This takes ~10s.")), step === 'manual' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      display: 'block',
      marginBottom: 6
    }
  }, "Word or phrase"), /*#__PURE__*/React.createElement("input", {
    value: word,
    onChange: e => {
      setWord(e.target.value);
      if (manualError) setManualError('');
    },
    placeholder: "Enter word or phrase",
    style: {
      width: '100%',
      padding: '10px 12px',
      boxSizing: 'border-box',
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 6,
      color: 'var(--fg)',
      font: 'inherit',
      fontSize: 18
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      display: 'block',
      marginBottom: 6
    }
  }, "Definition (optional)"), /*#__PURE__*/React.createElement("textarea", {
    value: manualDef,
    onChange: e => setManualDef(e.target.value),
    rows: 3,
    placeholder: "Enter definition",
    style: {
      width: '100%',
      padding: '10px 12px',
      boxSizing: 'border-box',
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 6,
      color: 'var(--fg)',
      font: 'inherit',
      fontSize: 14,
      resize: 'vertical'
    }
  })), manualError && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--err)'
    }
  }, manualError), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: () => {
      setStep('input');
      setManualError('');
    }
  }, "\u2190 Back"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    style: {
      marginLeft: 'auto'
    },
    disabled: isSubmitting,
    onClick: submitManual
  }, /*#__PURE__*/React.createElement(Ic.check, null), " ", isSubmitting ? 'Saving…' : 'Create card'))))));
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(/*#__PURE__*/React.createElement(App, null));