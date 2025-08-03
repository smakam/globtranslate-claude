import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock Firebase completely for integration tests
jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-uid' },
    onAuthStateChanged: jest.fn(),
    signInAnonymously: jest.fn(),
    signOut: jest.fn()
  },
  db: {}
}));

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

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInAnonymously: jest.fn(),
  signOut: jest.fn()
}));

// Mock userService
jest.mock('../services/userService', () => ({
  userService: {
    checkUsernameAvailability: jest.fn(),
    getUserByUsername: jest.fn(),
    getUserByFirebaseUid: jest.fn()
  }
}));

const mockFirebaseAuth = require('firebase/auth');
const mockFirestore = require('firebase/firestore');
const mockUserService = require('../services/userService').userService;

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console to reduce noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('complete user flow: loading -> onboarding -> home', async () => {
    let authCallback: (user: any) => void;
    
    // Mock auth state changes
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return () => {};
    });

    // Mock document operations
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => false
    });
    mockFirestore.setDoc.mockResolvedValue(undefined);
    mockFirestore.updateDoc.mockResolvedValue(undefined);

    // Mock username availability
    mockUserService.checkUsernameAvailability.mockResolvedValue(true);

    render(<App />);
    
    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Simulate user authentication
    await act(async () => {
      authCallback!({ uid: 'test-uid' });
    });
    
    // Should show onboarding
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-component')).toBeInTheDocument();
    });
    
    // Complete onboarding
    const user = userEvent.setup();
    const usernameInput = screen.getByLabelText(/choose a username/i);
    const submitButton = screen.getByRole('button', { name: /get started/i });
    
    await user.type(usernameInput, 'testuser');
    
    // Mock successful user creation
    mockFirestore.updateDoc.mockResolvedValue(undefined);
    
    await user.click(submitButton);
    
    // Should navigate to home
    await waitFor(() => {
      expect(screen.getByTestId('home-component')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('existing user flow: loading -> home (skip onboarding)', async () => {
    let authCallback: (user: any) => void;
    
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return () => {};
    });

    // Mock existing user data
    const existingUser = {
      id: 'user-123',
      username: 'existinguser',
      language: 'en',
      isOnline: true
    };

    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => existingUser
    });
    mockFirestore.updateDoc.mockResolvedValue(undefined);

    render(<App />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await act(async () => {
      authCallback!({ uid: 'test-uid' });
    });
    
    // Should skip onboarding and go directly to home
    await waitFor(() => {
      expect(screen.getByTestId('home-component')).toBeInTheDocument();
    });
    
    expect(screen.getByText('existinguser')).toBeInTheDocument();
  });

  test('error handling during authentication', async () => {
    let authCallback: (user: any) => void;
    
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return () => {};
    });

    mockFirestore.getDoc.mockRejectedValue(new Error('Firestore error'));

    render(<App />);
    
    await act(async () => {
      authCallback!({ uid: 'test-uid' });
    });
    
    // Should handle error gracefully and remain in loading or show appropriate state
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  test('sign out flow', async () => {
    let authCallback: (user: any) => void;
    
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return () => {};
    });

    const existingUser = {
      id: 'user-123',
      username: 'testuser',
      language: 'en',
      isOnline: true
    };

    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => existingUser
    });
    mockFirestore.updateDoc.mockResolvedValue(undefined);
    mockFirebaseAuth.signOut.mockResolvedValue(undefined);

    render(<App />);
    
    // Authenticate user
    await act(async () => {
      authCallback!({ uid: 'test-uid' });
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('home-component')).toBeInTheDocument();
    });
    
    // Click sign out
    const user = userEvent.setup();
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    
    await user.click(signOutButton);
    
    // Should call signOut
    expect(mockFirebaseAuth.signOut).toHaveBeenCalled();
  });

  test('theme persistence across components', async () => {
    let authCallback: (user: any) => void;
    
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return () => {};
    });

    const existingUser = {
      id: 'user-123',
      username: 'testuser',
      language: 'en',
      isOnline: true
    };

    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => existingUser
    });
    mockFirestore.updateDoc.mockResolvedValue(undefined);

    // Mock localStorage for theme
    const mockLocalStorage = {
      getItem: jest.fn().mockReturnValue('dark'),
      setItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage
    });

    render(<App />);
    
    await act(async () => {
      authCallback!({ uid: 'test-uid' });
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('home-component')).toBeInTheDocument();
    });
    
    // Theme should be persisted
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme');
  });

  test('network failure during onboarding', async () => {
    let authCallback: (user: any) => void;
    
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return () => {};
    });

    mockFirestore.getDoc.mockResolvedValue({
      exists: () => false
    });
    
    // Mock network failure
    mockUserService.checkUsernameAvailability.mockRejectedValue(new Error('Network error'));
    mockFirestore.updateDoc.mockRejectedValue(new Error('Network error'));

    render(<App />);
    
    await act(async () => {
      authCallback!({ uid: 'test-uid' });
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('onboarding-component')).toBeInTheDocument();
    });
    
    const user = userEvent.setup();
    const usernameInput = screen.getByLabelText(/choose a username/i);
    const submitButton = screen.getByRole('button', { name: /get started/i });
    
    await user.type(usernameInput, 'testuser');
    await user.click(submitButton);
    
    // Should handle network error gracefully
    await waitFor(() => {
      expect(screen.getByText(/failed to complete setup/i)).toBeInTheDocument();
    });
  });

  test('rapid state changes', async () => {
    let authCallback: (user: any) => void;
    
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      authCallback = callback;
      return () => {};
    });

    render(<App />);
    
    // Rapid authentication state changes
    await act(async () => {
      authCallback!(null);
    });
    
    await act(async () => {
      authCallback!({ uid: 'test-uid' });
    });
    
    await act(async () => {
      authCallback!(null);
    });
    
    // Should handle rapid changes gracefully
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('memory leak prevention', async () => {
    const unsubscribeMock = jest.fn();
    mockFirebaseAuth.onAuthStateChanged.mockReturnValue(unsubscribeMock);

    const { unmount } = render(<App />);
    
    // Unmount component
    unmount();
    
    // Should call unsubscribe to prevent memory leaks
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});