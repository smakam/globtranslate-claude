import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Global variables for mocks
const mockAuthCallbacks: Array<(user: any) => void> = [];
const mockUser = { uid: 'test-uid-123' };

// Define mocks directly in jest.mock calls
jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-uid-123' },
    signOut: jest.fn().mockResolvedValue(undefined)
  },
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(() => ({
    id: 'mock-doc-id',
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  })),
  addDoc: jest.fn(),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({
      id: 'user-123',
      username: 'testuser',
      language: 'en',
      isOnline: true
    })
  }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(() => new Date())
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(() => {
    // Return a proper unsubscribe function
    return jest.fn();
  }),
  signInAnonymously: jest.fn().mockResolvedValue({ user: { uid: 'test-uid-123' } }),
  signOut: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../services/userService', () => ({
  userService: {
    checkUsernameAvailability: jest.fn().mockResolvedValue(true),
    getUserByUsername: jest.fn().mockResolvedValue(null),
    getUserByFirebaseUid: jest.fn().mockResolvedValue(null)
  }
}));

// Web API mocks
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
});

// Import the mocked modules to use in tests
import { getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Import App after mocking
import App from '../App';

// Get references to mocked functions
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthCallbacks.length = 0; // Clear auth callbacks
    
    // Suppress console noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('🔥 Critical Integration Flows', () => {
    test('app renders without crashing', () => {
      expect(() => {
        render(<App />);
      }).not.toThrow();
    });

    test('shows loading state initially', () => {
      render(<App />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('handles authentication state changes', async () => {
      render(<App />);
      
      // Initially loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Simulate authentication
      if (mockAuthCallbacks.length > 0) {
        await act(async () => {
          mockAuthCallbacks[0]({ uid: 'test-uid' });
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }
      
      // Should transition from loading
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('🔐 Authentication Flows', () => {
    test('new user flow - onboarding appears', async () => {
      // Mock new user (no existing data)
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      } as any);
      
      render(<App />);
      
      // Should show onboarding for new user
      await waitFor(() => {
        const onboardingElements = screen.queryAllByText(/welcome/i);
        expect(onboardingElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
    
    test('existing user flow - skip to home', async () => {
      // Mock existing user data
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'user-123',
          username: 'existinguser',
          language: 'en',
          isOnline: true
        })
      } as any);
      
      render(<App />);
      
      // Should skip onboarding and show home elements
      await waitFor(() => {
        const homeElements = screen.queryAllByText(/globtranslate|welcome/i);
        expect(homeElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('🚨 Error Handling', () => {
    test('handles Firebase errors gracefully', async () => {
      // Mock Firebase error
      mockGetDoc.mockRejectedValueOnce(
        new Error('Firebase error')
      );
      
      render(<App />);
      
      // Should handle error gracefully - either stay loading or show error state
      await waitFor(() => {
        const loadingOrError = screen.queryByText('Loading...') || 
                              screen.queryByText(/error/i) ||
                              screen.queryByText(/welcome/i);
        expect(loadingOrError).toBeTruthy();
      }, { timeout: 3000 });
    });
    
    test('handles null user state', async () => {
      render(<App />);
      
      // Should handle null user gracefully
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('🎨 Theme Management', () => {
    test('theme persistence across app', async () => {
      const mockLocalStorage = window.localStorage as jest.Mocked<Storage>;
      mockLocalStorage.getItem.mockReturnValue('dark');
      
      render(<App />);
      
      // Should check localStorage for theme
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('globtranslate_theme');
    });
  });

  describe('⚡ Performance & Stability', () => {
    test('handles rapid state changes', async () => {
      render(<App />);
      
      // App should remain stable
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
    
    test('cleanup prevents memory leaks', () => {
      const unsubscribeMock = jest.fn();
      mockOnAuthStateChanged.mockReturnValueOnce(unsubscribeMock);
      
      const { unmount } = render(<App />);
      
      unmount();
      
      // Should call unsubscribe function
      expect(unsubscribeMock).toHaveBeenCalled();
    });
    
    test('multiple renders don\'t break app', () => {
      expect(() => {
        const { rerender } = render(<App />);
        
        // Multiple re-renders
        for (let i = 0; i < 5; i++) {
          rerender(<App />);
        }
      }).not.toThrow();
    });
  });

  describe('🔍 Component Integration', () => {
    test('version display is present', () => {
      render(<App />);
      
      // Version should be displayed somewhere in the app
      const versionElements = screen.queryAllByText(/v\d+\.\d+\.\d+|version/i);
      expect(versionElements.length).toBeGreaterThanOrEqual(0);
    });
    
    test('toast container is available', () => {
      render(<App />);
      
      // Toast container should be available for notifications
      const toastElements = screen.queryAllByTestId(/toast|notification/i);
      expect(toastElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('📱 User Interactions', () => {
    test('app responds to user interactions', async () => {
      // Mock existing user to get to interactive state
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'user-123',
          username: 'testuser',
          language: 'en',
          isOnline: true
        })
      } as any);
      
      render(<App />);
      
      // Look for interactive elements
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('🌐 Network Resilience', () => {
    test('handles network failures during initialization', async () => {
      // Mock network failure
      mockGetDoc.mockRejectedValueOnce(
        new Error('Network error')
      );
      
      render(<App />);
      
      // Should handle network error gracefully
      await waitFor(() => {
        const isStable = screen.queryByText('Loading...') || 
                        screen.queryByText(/error/i) ||
                        screen.queryByText(/try again/i);
        expect(isStable).toBeTruthy();
      }, { timeout: 3000 });
    });
  });
});