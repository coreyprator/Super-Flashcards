# INTENT.md -- Super Flashcards

## Primary Intent
A language research and connection discovery tool that leverages etymology, visual learning, and pronunciation practice to accelerate Corey's ability to learn any European language by understanding words at their atomic level: PIE origins.

## Success Is
- Corey can trace any word back to its PIE origin and see related words across languages.
- Pronunciation evaluation gives honest, accurate feedback. A language teacher in his pocket 24/7.
- Visual images on cards help Corey remember words through visual association, not rote repetition.
- The app is useful enough that a Greek professor considers using it with his students.
- New languages are easier to learn because the etymological connections reveal patterns.

## Success Is NOT
- A Duolingo or Babbel clone. Traditional flashcard drilling is an ineffective learning method.
- Maximizing card count in the database. Research depth per card matters more than volume.
- Gamification, streaks, or engagement tricks. The learning itself is the motivation.
- Progress tracking dashboards. Corey uses SF for research, not practice metrics. Low priority.
- Multi-user features for users who don't exist yet. Build for Corey and his professor first.

## Decision Boundaries
- Pronunciation evaluation, etymology connections, and visual learning are the three pillars. Every feature should strengthen at least one.
- If a feature exists in Duolingo but not in SF, that's probably fine. SF is deliberately different.
- When adding new languages (PIE, Latin), the goal is cross-language navigation (Greek to PIE to English), not just more vocabulary.
- Bug fixes on core CRUD (SF-019, SF-020) take priority over new features. Broken basics undermine everything.
- The Unicode normalization fix (NFC/NFD) must be applied before any future bulk imports.

## Anti-Goals
- Rote repetition mechanics. If it feels like drilling, it's wrong.
- Adding terms nobody reviews. Quality of content over quantity.
- Building spaced repetition (SRS/SM-2) as a primary feature. It's on the roadmap but low priority given Corey's research-first usage pattern.
- Optimizing for scale. One user (maybe two) for now.

## This Project Serves Portfolio Intents
- Personal learning outcomes: Directly improves Corey's French, Greek, and future language skills.
- Cognitive vitality: Understanding words at the PIE level is an intellectual pursuit that keeps neurons firing.
- Creative exploration: The Etymology Graph integration, pronunciation AI, and cross-language navigation are all frontier features no commercial app offers.

## Communication Standards
8th grade reading level. Short sentences. No em dashes. No filler. Direct.

## Historical Context
Built during the tail end of Corey's six months in Paris. Evolved from simple flashcards to a language research platform. The "aha moment" with the Greek professor was that PIE is the key to understanding any European language. That's where this thing is going. The pronunciation evaluation feature (analyzing voice recordings, IPA comparison, percent-correct scoring) has been validated by both professors and is the most differentiated capability.

## Key Integrations
- Etymython: 342 cognates linked. Natural connection from mythology figures to vocabulary.
- PIE Network Graph microservice: Future backend for cross-language word origin navigation.
- Etymology Graph visualization: SF cards as nodes in the graph network.

## Current Stats
2,210 total cards. Greek: 1,105. English: 414. French: 357. Spanish: 147. Italian: 74. German: 69. Portuguese: 44.
