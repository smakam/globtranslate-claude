import '@testing-library/jest-dom';
const React = require('react');

// Mock Firebase
jest.mock('./config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInAnonymously: jest.fn(),
    signOut: jest.fn()
  },
  db: {},
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn()
}));

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn()
}));

// Mock Firebase Auth functions
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInAnonymously: jest.fn(),
  signOut: jest.fn()
}));

// Mock QR Code libraries
jest.mock('qrcode.react', () => {
  return function QRCode({ value }: { value: string }) {
    const mockReact = require('react');
    return mockReact.createElement('div', { 'data-testid': 'qr-code' }, value);
  };
});

jest.mock('html5-qrcode', () => ({
  Html5QrcodeScanner: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    clear: jest.fn()
  }))
}));

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};

// Mock all child components
jest.mock('./components/Home', () => {
  return function MockHome() {
    const mockReact = require('react');
    return mockReact.createElement('div', { 'data-testid': 'home-component' }, 'Home Component');
  };
});

jest.mock('./components/Chat', () => {
  return function MockChat() {
    const mockReact = require('react');
    return mockReact.createElement('div', { 'data-testid': 'chat-component' }, 'Chat Component');
  };
});

jest.mock('./components/Onboarding', () => {
  return function MockOnboarding() {
    const mockReact = require('react');
    return mockReact.createElement('div', { 'data-testid': 'onboarding-component' }, 'Onboarding Component');
  };
});

jest.mock('./components/VersionDisplay', () => {
  return function MockVersionDisplay() {
    const mockReact = require('react');
    return mockReact.createElement('div', { 'data-testid': 'version-display' }, 'Version Display');
  };
});

jest.mock('./components/ToastContainer', () => {
  return function MockToastContainer() {
    const mockReact = require('react');
    return mockReact.createElement('div', { 'data-testid': 'toast-container' }, 'Toast Container');
  };
});
