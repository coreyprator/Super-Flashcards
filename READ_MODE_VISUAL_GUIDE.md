# Read Mode - Visual Guide

## What You'll See

### Mode Selector (Top Navigation)
```
┌─────────────────────────────────────────┐
│  📚 Study  │ 📄 Read │ 📖 Browse       │
│  (active)  │         │                  │
└─────────────────────────────────────────┘
```

### Read Mode Card Layout

```
╔════════════════════════════════════════════════════════════╗
║                     READ MODE CARD                         ║
║                                                            ║
║  ┌─────────┐  ┌──────────────────────────────────┐       ║
║  │         │  │  sobremesa                       │ ✏️Edit║
║  │  Image  │  │  Spanish                         │       ║
║  │  128x128│  │  🔊 Play Audio                   │       ║
║  │         │  │  [soh-breh-MEH-sah]             │       ║
║  └─────────┘  │  🤖 AI Generated • Reviewed 3×   │       ║
║               └──────────────────────────────────┘       ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                            ║
║  📖 DEFINITION                                             ║
║  The time spent sitting at the table after a meal,        ║
║  talking and enjoying company. A cherished Spanish        ║
║  social tradition with no English equivalent.             ║
║                                                            ║
║  🌱 ETYMOLOGY                                              ║
║  From 'sobre' (over) + 'mesa' (table). Literally         ║
║  'over the table' - staying at table after eating.       ║
║                                                            ║
║  💬 EXAMPLE SENTENCES                                      ║
║  "La sobremesa duró dos horas"                           ║
║  The sobremesa lasted two hours                           ║
║                                                            ║
║  🔀 RELATED WORDS                                          ║
║  ┌───────────┐ ┌──────────┐ ┌─────────┐                 ║
║  │ conversación│ │tertulia │ │convivir │                 ║
║  └───────────┘ └──────────┘ └─────────┘                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

      ┌────────────┐    ┌─────────┐    ┌──────────┐
      │ ← Previous │    │ 5 of 755│    │  Next →  │
      └────────────┘    └─────────┘    └──────────┘
```

## Key Features

### 1. Image Thumbnail
- **Size**: 128x128 pixels (larger than originally specified for better visibility)
- **Position**: Top-left corner of card header
- **Fallback**: If no image, shows a 📚 emoji on gradient background
- **Style**: Rounded corners with shadow and white border

### 2. Card Header
- **Word/Phrase**: Large, bold display (text-3xl)
- **Language**: Small subtitle below word
- **Audio**: Play button with icon
- **IPA**: Pronunciation guide if available
- **Stats**: Source (AI/Manual) and review count
- **Edit Button**: Quick access to edit mode

### 3. Content Sections
Each section has an emoji icon for quick visual scanning:
- 📖 **Definition**: Primary meaning and usage
- 🌱 **Etymology**: Word origins and roots
- 🔗 **English Cognates**: Related English words
- 💬 **Example Sentences**: Usage in context
- 🔀 **Related Words**: Similar vocabulary as pills/tags

### 4. Navigation
- **Buttons**: Large, accessible Previous/Next
- **Counter**: Shows current position
- **Keyboard**: 
  - ← Left Arrow: Previous card
  - → Right Arrow or Space: Next card
- **Touch**: Swipe left/right on mobile

### 5. Visual Design
- **Background**: Gradient from indigo-50 to purple-50
- **Shadows**: 2xl shadow for depth
- **Spacing**: Generous padding and gaps (space-y-6)
- **Borders**: Subtle indigo borders for sections
- **Typography**: Clear hierarchy with varied sizes

## Comparison with Study Mode

| Feature | Study Mode | Read Mode |
|---------|-----------|-----------|
| **Interaction** | Click to flip card | Scroll to read |
| **Front Side** | Large word + image | Thumbnail only |
| **Back Side** | Hidden until flip | Always visible |
| **Image** | Full size | Thumbnail (128px) |
| **Navigation** | After flipping | Anytime |
| **Use Case** | Active recall | Passive review |
| **Best For** | Testing knowledge | Learning content |

## Mobile Experience

```
┌────────────────────────┐
│  📚 Study 📄 Read      │ ← Compact tabs
├────────────────────────┤
│ ┌────┐  sobremesa     │ ← Image + word
│ │IMG │  Spanish       │
│ └────┘  🔊 Audio      │
├────────────────────────┤
│ 📖 Definition          │ ← Content
│ The time spent...      │   sections
│                        │   stack
│ 🌱 Etymology          │   vertically
│ From sobre + mesa...   │
├────────────────────────┤
│ ← Prev   5/755   Next→│ ← Nav controls
└────────────────────────┘
    ↕️ Swipe gestures
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ← | Previous card |
| → | Next card |
| Space | Next card |
| 1 | Switch to Study mode |
| 2 | Switch to Read mode |
| 3 | Switch to Browse mode |

## Usage Tips

1. **Learning New Words**: Use Read mode to absorb all information first
2. **Quick Review**: Navigate quickly through cards to refresh memory
3. **Deep Study**: Spend time reading etymology and examples
4. **Mobile Learning**: Swipe through cards on phone/tablet
5. **Reference**: Use as a mini-dictionary for looking up details

## Technical Notes

- **Performance**: Cards render instantly (no flip animation)
- **Smooth Scrolling**: Auto-scrolls to top on navigation
- **Responsive**: Adapts to screen size
- **Offline**: Works fully offline once cards are cached
- **State Preservation**: Card position maintained when switching modes
