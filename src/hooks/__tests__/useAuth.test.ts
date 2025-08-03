import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import * as firebaseAuth from 'firebase/auth';
import * as firestore from 'firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  signInAnonymously: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn()
}));

jest.mock('../config/firebase', () => ({
  auth: { currentUser: null },
  db: {}
}));

const mockOnAuthStateChanged = firebaseAuth.onAuthStateChanged as jest.Mock;
const mockSignInAnonymously = firebaseAuth.signInAnonymously as jest.Mock;
const mockSignOut = firebaseAuth.signOut as jest.Mock;
const mockGetDoc = firestore.getDoc as jest.Mock;
const mockSetDoc = firestore.setDoc as jest.Mock;
const mockUpdateDoc = firestore.updateDoc as jest.Mock;

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to avoid test output noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should initialize with loading state', () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // Don't call callback immediately to simulate loading
      return () => {};
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  test('should handle successful anonymous sign in', async () => {
    const mockUser = { uid: 'test-uid' };
    mockSignInAnonymously.mockResolvedValue({ user: mockUser });

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(null), 0);
      return () => {};
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInAnonymous();
    });

    expect(mockSignInAnonymously).toHaveBeenCalled();
  });

  test('should handle sign in error', async () => {
    const error = new Error('Sign in failed');
    mockSignInAnonymously.mockRejectedValue(error);

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(null), 0);
      return () => {};
    });

    const { result } = renderHook(() => useAuth());

    await expect(result.current.signInAnonymous()).rejects.toThrow('Sign in failed');
  });

  test('should handle existing user authentication', async () => {
    const mockFirebaseUser = { uid: 'test-uid' };
    const mockUserData = {
      id: 'user-123',
      username: 'testuser',
      language: 'en',
      isOnline: true
    };

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUserData
    });
    mockUpdateDoc.mockResolvedValue(undefined);

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(mockFirebaseUser), 0);
      return () => {};
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUserData);
    expect(mockUpdateDoc).toHaveBeenCalled();
  });

  test('should handle username update', async () => {
    const mockFirebaseUser = { uid: 'test-uid' };
    const initialUserData = {
      id: 'user-123',
      username: '',
      language: 'en',
      isOnline: true
    };

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => initialUserData
    });
    mockUpdateDoc.mockResolvedValue(undefined);

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(mockFirebaseUser), 0);
      return () => {};
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateUsername('newusername');
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        username: 'newusername'
      })
    );
  });

  test('should handle language update', async () => {
    const mockFirebaseUser = { uid: 'test-uid' };
    const initialUserData = {
      id: 'user-123',
      username: 'testuser',
      language: 'en',
      isOnline: true
    };

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => initialUserData
    });
    mockUpdateDoc.mockResolvedValue(undefined);

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(mockFirebaseUser), 0);
      return () => {};
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateUserLanguage('es');
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        language: 'es'
      })
    );
  });

  test('should handle sign out', async () => {
    mockSignOut.mockResolvedValue(undefined);

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      return () => {};
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  test('should handle user creation for new user', async () => {
    const mockFirebaseUser = { uid: 'test-uid' };

    mockGetDoc.mockResolvedValue({
      exists: () => false
    });
    mockSetDoc.mockResolvedValue(undefined);

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(mockFirebaseUser), 0);
      return () => {};
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockSetDoc).toHaveBeenCalled();
  });

  test('should handle Firestore errors gracefully', async () => {
    const mockFirebaseUser = { uid: 'test-uid' };
    
    mockGetDoc.mockRejectedValue(new Error('Firestore error'));

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(mockFirebaseUser), 0);
      return () => {};
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });
});