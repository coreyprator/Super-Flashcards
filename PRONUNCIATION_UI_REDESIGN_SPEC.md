# Pronunciation Recording UI Redesign Spec

**Created**: 2026-01-31
**Status**: Approved (implement after bug fixes)

---

## Problems
- Recording controls buried at bottom of Study screen
- Mouse click doesn't stop recording (BUG-007)
- Timer takes separate space
- My Voice vs Reference audio not clearly differentiated
- Desktop vs iPhone inconsistent

## Design

### Recording Bar Location
Top of Read view, below nav tabs, above card content.

### Layout
```
[🎤 Start Recording (Space/Enter)] 00:00  [▶ My Voice] [▶ Reference] [🚫]
```

### Button States
| State | Text | Keyboard | Mouse |
|-------|------|----------|-------|
| Ready | 🎤 Start Recording | Space/Enter | Click |
| Recording | ⏹ Stop Recording | Space/Enter | Click |
| Has Recording | 🎤 Re-record | Space/Enter | Click |

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Space/Enter | Start/Stop |
| Escape | Cancel |
| P | Play reference |
| R | Play my recording |

### Cancel Button
- Icon: 🚫 or ✕ (not red square)
- Escape key also cancels

## Priority
1. BUG-007 fix first
2. Then UI changes

## Files Affected
- frontend/pronunciation-recorder.js
- frontend/index.html (study/read template area)
- frontend/styles or inline styles
