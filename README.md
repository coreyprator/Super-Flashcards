# 🌍 Super-Flashcards - AI-Powered Language Learning

> **Intelligent flashcard system with AI-generated content, pronunciation audio, and adaptive learning**

[![Language Support](https://img.shields.io/badge/Languages-Greek%20%7C%20French-blue)](https://github.com/coreyprator/Super-Flashcards)
[![AI Powered](https://img.shields.io/badge/AI-OpenAI%20%7C%20Google%20TTS-green)](https://github.com/coreyprator/Super-Flashcards)
[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)](https://github.com/coreyprator/Super-Flashcards)

## ✨ Key Features

### 🎯 **Core Learning System**
- **Multi-language Support** - Greek, French with expansion capability
- **AI-Generated Content** - Definitions, etymology, contextual examples
- **Audio Pronunciation** - Google TTS with regeneration capability
- **Visual Learning** - AI-generated contextual images
- **Smart Search** - Full-text search across all card fields

### 🧠 **AI Integration**
- **OpenAI GPT-4** - Intelligent content generation
- **Google TTS** - High-quality pronunciation audio
- **DALL-E** - Contextual image generation
- **Smart Definitions** - Etymological insights and cognates

### 📊 **Data Management**
- **Import/Export** - CSV, JSON batch processing
- **MSSQL Database** - Robust data persistence
- **Batch Operations** - Process hundreds of cards efficiently
- **Version Control** - Git-tracked development

### 🎨 **User Experience**
- **Responsive Design** - Works on desktop and mobile
- **Edit Capabilities** - Modify cards with inline editing
- **Language Persistence** - Remembers user preferences
- **Progressive Web App** - Full offline-first architecture
- **Cross-Device Sync** - Seamless synchronization between devices
- **Offline-First** - Works completely offline with IndexedDB storage

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** with pip
- **MSSQL Server** (local or remote)
- **Google Cloud TTS API** credentials
- **OpenAI API** key

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/coreyprator/Super-Flashcards.git
   cd Super-Flashcards
   ```

2. **Setup Environment**
   ```powershell
   # Windows PowerShell (recommended)
   .\runui.ps1
   ```

3. **Configure APIs**
   - Set up Google Cloud TTS credentials
   - Add OpenAI API key to environment
   - Configure MSSQL connection string

4. **Launch Application**
   - Navigate to http://localhost:8000
   - Start learning! 🎉

## 📱 Usage Guide

### Creating Flashcards
1. **Manual Entry** - Add cards through the web interface
2. **AI Generation** - Let AI create definitions and images
3. **Batch Import** - Upload CSV files for bulk creation
4. **Audio Generation** - Automatic pronunciation for all cards

### Study Features
- **Browse Mode** - Review all cards with search/filter
- **Edit Functions** - Modify content on-the-fly
- **Audio Playback** - Listen to native pronunciation
- **Multi-language** - Switch between language sets

### Search & Organization
- **Full-text Search** - Find cards by word, definition, or etymology
- **Language Filtering** - Focus on specific language study
- **Quick Navigation** - Tab-based interface for efficiency

## 🏗️ Architecture

### Backend (`/backend/`)
```
├── app/
│   ├── main.py              # FastAPI application entry
│   ├── models.py            # Database schema
│   ├── crud.py              # Database operations
│   ├── routers/             # API endpoints
│   └── services/            # AI and audio services
```

### Frontend (`/frontend/`)
```
├── index.html               # Main application page
├── app.js                   # Core application logic
├── audio-player.js          # TTS audio management
└── styles.css               # UI styling
```

### Key Technologies
- **Backend:** FastAPI, SQLAlchemy, Google Cloud TTS, OpenAI
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Database:** Microsoft SQL Server
- **AI Services:** OpenAI GPT-4, DALL-E, Google TTS

## 🎯 Current Status

### ✅ **Fully Implemented**
- Multi-language flashcard management
- AI-powered content generation
- Google TTS audio with regeneration
- Full-text search functionality
- Import/export capabilities
- Responsive web interface
- Edit functionality
- Language preference persistence
- **Offline-First Architecture** - Complete IndexedDB integration
- **Cross-Device Synchronization** - Real-time sync between devices
- **Progressive Web App** - Works fully offline with sync recovery

### 🔧 **Recently Completed** (October 2025 - Sprint 5 Phase 1)
- **✅ Offline-First Architecture** - IndexedDB storage with API fallbacks
- **✅ Cross-Device Sync** - Verified laptop ↔ iPhone synchronization
- **✅ Network Resilience** - Graceful offline/online transitions
- **✅ Search Optimization** - Fixed UUID language filtering
- **✅ Windows Firewall Config** - Cross-device network access
- **✅ Sync Manager** - Background synchronization with conflict resolution

### 🚀 **Next Development Phase** (Sprint 5 Phase 2)
- **Audio Caching** - Store TTS files in IndexedDB for full offline experience
- **PWA Installation** - Home screen installation capability
- **Background Sync** - Service worker integration for automatic sync
- **Mobile Optimizations** - Touch gestures and responsive enhancements
- **Learning Analytics** - Progress tracking and spaced repetition

## 📊 Performance & Scale

### **Current Metrics**
- **Startup Time:** ~35 seconds (measured accurately)
- **Search Performance:** Sub-second response times
- **Audio Generation:** 2-3 seconds per card
- **Content Volume:** 300+ cards with multimedia

### **Scalability Features**
- Service-oriented architecture
- Batch processing capabilities
- Efficient database indexing
- Modular AI service integration

## 🤝 Contributing

### Development Workflow
1. **Fork & Clone** - Standard GitHub workflow
2. **Feature Branches** - Create focused branches for features
3. **Testing** - Verify changes with manual and automated testing
4. **Documentation** - Update relevant docs
5. **Pull Request** - Submit with clear description

### Code Standards
- **Python:** Follow PEP 8 with FastAPI patterns
- **JavaScript:** ES6+ with clear function naming
- **Documentation:** Comprehensive commit messages and inline comments
- **Testing:** Manual verification and user feedback integration

## 📚 Documentation

### **Quick References**
- [Sprint Summary](docs/SPRINT_SUMMARY.md) - Latest development achievements
- [Handoff Guide](docs/HANDOFF_CLAUDE.md) - Development context for new contributors
- [Next Sprint Roadmap](docs/NEXT_SPRINT_ROADMAP.md) - Feature priorities and file references
- [Setup Instructions](SETUP_INSTRUCTIONS.md) - Detailed installation guide

### **Technical Details**
- [API Documentation](http://localhost:8000/docs) - Interactive API explorer
- [Database Schema](backend/app/models.py) - Complete data model
- [Service Architecture](backend/app/services/) - AI and audio integration

### **File Structure for Claude Handoff**
For optimal Claude integration with message limits, use these file selections:

**Essential Documentation (4 files):**
```
docs/HANDOFF_CLAUDE.md, docs/NEXT_SPRINT_ROADMAP.md, docs/SPRINT_SUMMARY.md, README.md
```

**Core Development Files (6 additional):**
```
backend/app/main.py, backend/app/models.py, backend/app/crud.py, 
frontend/app.js, frontend/index.html, runui.ps1
```

**Complete Package (15 total files)** - See handoff documentation for full list.

## 🏆 Success Stories

### **User Impact**
- **Effective Learning** - Users successfully learning Greek and French
- **AI Enhancement** - 90% of content AI-generated with high quality
- **Audio Quality** - Google TTS preferred over alternatives
- **Search Utility** - Full-text search significantly improves card discovery

### **Technical Achievements**
- **Stable Architecture** - Service-oriented design enables feature expansion
- **Performance Optimization** - Accurate monitoring enables continuous improvement
- **User Experience** - Responsive design works across devices
- **AI Integration** - Seamless content generation workflow

## 📞 Support & Contact

### **Getting Help**
- **Issues:** Create GitHub issue with detailed description
- **Documentation:** Check existing docs and handoff guides
- **Development:** Review git commit history for context

### **Project Status**
- **Active Development** - Regular improvements and new features
- **User Tested** - Real-world usage validation
- **Production Ready** - Stable core functionality
- **Open Source** - Community contributions welcome

---

## 🎉 **Ready to Start Learning?**

```powershell
# Clone and launch in one command
git clone https://github.com/coreyprator/Super-Flashcards.git
cd Super-Flashcards
.\runui.ps1
```

**Visit:** http://localhost:8000 and start your language learning journey! 🌟

---

*Built with ❤️ for language learners worldwide*  
*Last Updated: October 16, 2025 - Sprint 5 Phase 1 Complete*