# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GlobTranslate is a React-based real-time chat application with automatic translation capabilities. Users can connect via QR codes and chat in different languages with automatic translation powered by Google Translate API.

## Development Commands

- `npm start` - Start development server on http://localhost:3000
- `npm test` - Run tests in watch mode
- `npm run build` - Build for production
- `firebase deploy` - Deploy to Firebase hosting (requires Firebase CLI)

## Architecture

### Core Application Flow
The app uses a state-based architecture with four main states managed in `src/App.tsx`:
- `loading` - Initial authentication state
- `onboarding` - New user setup (username and language selection)
- `home` - Main screen with QR code and friend connections
- `chat` - Active chat session with translation

### Key Components Structure
- **App.tsx** - Main state management and routing logic
- **components/Home.tsx** - QR code display, scanning, and friend connections
- **components/Chat.tsx** - Real-time chat with translation
- **components/Onboarding.tsx** - User setup flow

### Firebase Integration
- **Authentication**: Anonymous auth for user sessions
- **Firestore**: Real-time chat messages and user data
- **Config**: Firebase credentials in `src/config/firebase.ts` (✅ SECURE: Uses environment variables)

### Translation System
- Uses Google Translate API via `src/hooks/useTranslation.ts`
- ✅ SECURE: API key loaded from environment variables with validation
- ✅ SECURE: Rate limiting implemented (10 requests per minute)
- ✅ SECURE: Enhanced error handling for API failures
- Supports: English, Hindi, Telugu, Tamil, Kannada, French
- Language definitions in `src/constants/languages.ts`

### Data Flow
1. User authentication → Firebase Anonymous Auth
2. QR code generation/scanning → Friend connection via unique IDs
3. Chat messages → Firestore realtime listeners
4. Translation → Google Translate API calls

### Custom Hooks
- `useAuth` - Firebase authentication and user management
- `useChat` - Real-time chat functionality with Firestore
- `useTranslation` - Google Translate API integration
- `useTheme` - Dark/light mode management

### Storage
- Local storage utilities in `src/utils/storage.ts` for recent friends
- User preferences stored in localStorage

## Security Notes

✅ **SECURITY IMPLEMENTED**: All API keys are now properly secured:
- ✅ Firebase config uses environment variables with validation (`src/config/firebase.ts`)
- ✅ Google Translate API key uses environment variables (`src/hooks/useTranslation.ts`)
- ✅ Environment variable validation prevents missing/invalid keys
- ✅ Rate limiting implemented for translation API
- ✅ Enhanced error handling and security warnings
- ✅ `.env` file is gitignored to prevent key exposure
- ✅ `.env.example` provides secure template without real keys

### Setup Instructions
1. Copy `.env.example` to `.env`
2. Replace placeholder values with your actual API keys
3. See `SECURITY.md` for detailed setup instructions
4. The app will validate all environment variables on startup

## Deployment

The project is configured for Firebase hosting. Build output goes to `build/` directory and is deployed via `firebase deploy`.