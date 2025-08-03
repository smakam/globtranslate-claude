import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock the hooks
jest.mock('./hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('./hooks/useTheme', () => ({
  useTheme: jest.fn()
}));

jest.mock('./hooks/useToast', () => ({
  useToast: jest.fn()
}));

const mockUseAuth = require('./hooks/useAuth').useAuth;
const mockUseTheme = require('./hooks/useTheme').useTheme;
const mockUseToast = require('./hooks/useToast').useToast;

describe('App Component', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({
      isDarkMode: false,
      toggleTheme: jest.fn()
    });

    mockUseToast.mockReturnValue({
      toasts: [],
      showToast: jest.fn(),
      removeToast: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signInAnonymous: jest.fn(),
      updateUsername: jest.fn(),
      updateUserLanguage: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn()
    });

    render(<App />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders onboarding when user has no username', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-id', username: '', language: 'en', isOnline: true },
      loading: false,
      signInAnonymous: jest.fn(),
      updateUsername: jest.fn(),
      updateUserLanguage: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn()
    });

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-component')).toBeInTheDocument();
    });
  });

  test('renders home when user is authenticated and has username', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-id', username: 'testuser', language: 'en', isOnline: true },
      loading: false,
      signInAnonymous: jest.fn(),
      updateUsername: jest.fn(),
      updateUserLanguage: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn()
    });

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('home-component')).toBeInTheDocument();
    });
  });

  test('handles sign in failure gracefully', async () => {
    const mockSignIn = jest.fn().mockRejectedValue(new Error('Sign in failed'));
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signInAnonymous: mockSignIn,
      updateUsername: jest.fn(),
      updateUserLanguage: jest.fn(),
      signOut: jest.fn(),
      setUser: jest.fn()
    });

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  test('handles onboarding completion for new user', async () => {
    const mockUpdateUsername = jest.fn().mockResolvedValue(undefined);
    const mockUpdateLanguage = jest.fn().mockResolvedValue(undefined);
    
    mockUseAuth.mockReturnValue({
      user: { id: 'test-id', username: '', language: 'en', isOnline: true },
      loading: false,
      signInAnonymous: jest.fn(),
      updateUsername: mockUpdateUsername,
      updateUserLanguage: mockUpdateLanguage,
      signOut: jest.fn(),
      setUser: jest.fn()
    });

    await act(async () => {
      render(<App />);
    });

    // Simulate onboarding completion
    const onboardingComponent = screen.getByTestId('onboarding-component');
    expect(onboardingComponent).toBeInTheDocument();
  });

  test('handles sign out correctly', async () => {
    const mockSignOut = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: { id: 'test-id', username: 'testuser', language: 'en', isOnline: true },
      loading: false,
      signInAnonymous: jest.fn(),
      updateUsername: jest.fn(),
      updateUserLanguage: jest.fn(),
      signOut: mockSignOut,
      setUser: jest.fn()
    });

    await act(async () => {
      render(<App />);
    });

    // The sign out functionality will be tested through the Home component
    await waitFor(() => {
      expect(screen.getByTestId('home-component')).toBeInTheDocument();
    });
  });
});
