# GlobTranslate

A real-time chat application with automatic translation capabilities built with React and Firebase. Connect with friends via QR codes and chat in different languages with seamless translation.

🌐 **Live Demo**: [https://trans-claude.web.app](https://trans-claude.web.app)

## Features

- **Real-time Chat**: Instant messaging powered by Firebase Firestore
- **Automatic Translation**: Chat in different languages with Google Translate API
- **QR Code Connection**: Easy friend connection via QR code scanning
- **Multi-language Support**: English, Hindi, Telugu, Tamil, Kannada, French
- **Dark/Light Theme**: Toggle between themes for better user experience
- **Anonymous Authentication**: Quick start with Firebase Anonymous Auth
- **Mobile Responsive**: Works seamlessly on mobile and desktop

## Technology Stack

- **Frontend**: React 19.1.0 with TypeScript
- **Database**: Firebase Firestore (real-time)
- **Authentication**: Firebase Anonymous Auth
- **Translation**: Google Translate API
- **Hosting**: Firebase Hosting
- **Testing**: Jest + React Testing Library
- **QR Codes**: qrcode.js + qr-scanner

## Quick Start

### Prerequisites

- Node.js (16+ recommended)
- Firebase account
- Google Cloud account (for Translate API)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/smakam/globtranslate-claude.git
cd globtranslate-claude
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_GOOGLE_TRANSLATE_API_KEY=your_translate_api_key
```

5. Start the development server:
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Available Scripts

### `npm start`
Runs the app in development mode on [http://localhost:3000](http://localhost:3000).

### `npm test`
Launches the test runner with 85+ comprehensive test cases covering:
- Component functionality
- Hook behavior
- Integration workflows
- Edge cases and error handling

### `npm run build`
Builds the app for production to the `build` folder with optimized React bundle.

### `firebase deploy`
Deploys the application to Firebase hosting (requires Firebase CLI setup).

## How It Works

1. **User Onboarding**: Set username and preferred language
2. **QR Connection**: Generate/scan QR codes to connect with friends
3. **Real-time Chat**: Send messages with automatic translation
4. **Multi-language**: Messages appear in each user's preferred language

## Architecture

### Core Components
- **App.tsx**: Main state management and routing
- **Home.tsx**: QR code display and friend connections
- **Chat.tsx**: Real-time messaging with translation
- **Onboarding.tsx**: User setup and language selection

### Custom Hooks
- **useAuth**: Firebase authentication management
- **useChat**: Real-time Firestore chat functionality
- **useTranslation**: Google Translate API integration with rate limiting
- **useTheme**: Dark/light mode state management

### Security Features
- Environment variable protection for API keys
- Rate limiting for translation requests (10/minute)
- Input validation and sanitization
- Error boundary protection

## Testing

The project includes comprehensive testing with 85+ test cases:

```bash
npm test                    # Run all tests
npm test -- --coverage     # Run with coverage report
npm test -- --watchAll     # Run in watch mode
```

Test coverage includes:
- Unit tests for all components and hooks
- Integration tests for user workflows
- Edge case testing for error scenarios
- Mock implementations for external APIs

## Deployment

### Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login and initialize:
```bash
firebase login
firebase init hosting
```

3. Build and deploy:
```bash
npm run build
firebase deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## Environment Setup

### Firebase Configuration
1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Anonymous) and Firestore Database
3. Copy your config from Project Settings > General > Your apps

### Google Translate API
1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Google Translate API
3. Create credentials (API Key)
4. Add the API key to your environment variables

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or issues, please open an issue on GitHub or contact the maintainer.

---

Built with ❤️ using React, Firebase, and Google Translate API