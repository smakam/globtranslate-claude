// Centralized mock factory system - All mocks in one place
import React from 'react';

// =============================================================================
// EXTERNAL LIBRARY MOCKS
// =============================================================================

// Lucide React Icons - Complete mock factory
export const createLucideIconMock = (iconName: string) => {
  return ({ size, className, onClick, ...props }: any) => 
    React.createElement('div', {
      'data-testid': `${iconName.toLowerCase()}-icon`,
      className,
      onClick,
      ...props
    }, iconName);
};

export const lucideMocks = {
  Moon: createLucideIconMock('Moon'),
  Sun: createLucideIconMock('Sun'),
  MessageCircle: createLucideIconMock('MessageCircle'),
  Sparkles: createLucideIconMock('Sparkles'),
  QrCode: createLucideIconMock('QrCode'),
  Copy: createLucideIconMock('Copy'),
  Camera: createLucideIconMock('Camera'),
  UserPlus: createLucideIconMock('UserPlus'),
  Send: createLucideIconMock('Send'),
  Mic: createLucideIconMock('Mic'),
  MicOff: createLucideIconMock('MicOff'),
};

// QR Code libraries
export const qrCodeMocks = {
  QRCodeSVG: ({ value, size = 128, ...props }: any) => 
    React.createElement('div', {
      'data-testid': 'qr-code-svg',
      'data-value': value,
      style: { width: size, height: size },
      ...props
    }, `QR: ${value}`),
    
  Html5QrcodeScanner: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    clear: jest.fn(),
    getState: jest.fn().mockReturnValue('NOT_STARTED')
  }))
};

// =============================================================================
// FIREBASE MOCKS - Comprehensive and reusable
// =============================================================================

export const createFirebaseMocks = () => {
  const mockUser = {
    uid: 'test-uid-123',
    email: null,
    displayName: null,
    isAnonymous: true
  };

  const mockFirestore = {
    collection: jest.fn(),
    doc: jest.fn(() => ({
      id: 'mock-doc-id',
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      onSnapshot: jest.fn()
    })),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    getDoc: jest.fn(() => Promise.resolve({
      exists: () => true,
      data: () => ({
        id: 'user-123',
        username: 'testuser',
        language: 'en',
        isOnline: true
      })
    })),
    setDoc: jest.fn(),
    onSnapshot: jest.fn(),
    query: jest.fn(),
    orderBy: jest.fn(),
    where: jest.fn(),
    serverTimestamp: jest.fn(() => new Date()),
  };

  const mockAuth = {
    currentUser: mockUser,
    onAuthStateChanged: jest.fn((callback) => {
      // Simulate successful auth
      setTimeout(() => callback(mockUser), 0);
      return () => {}; // unsubscribe function
    }),
    signInAnonymously: jest.fn(() => Promise.resolve({ user: mockUser })),
    signOut: jest.fn(() => Promise.resolve()),
  };

  return { mockAuth, mockFirestore, mockUser };
};

// =============================================================================
// COMPONENT MOCKS - Standardized component mocking
// =============================================================================

export const createComponentMock = (componentName: string, additionalProps?: any) => {
  return function MockComponent(props: any) {
    return React.createElement('div', {
      'data-testid': `${componentName.toLowerCase()}-component`,
      'data-component': componentName,
      ...additionalProps
    }, `${componentName} Component`);
  };
};

// Specific component mocks with behavior
export const componentMocks = {
  Home: (props: any) => React.createElement('div', {
    'data-testid': 'home-component'
  }, [
    React.createElement('h1', { key: 'title' }, 'GlobalTranslate'),
    React.createElement('p', { key: 'welcome' }, `Welcome back, ${props?.user?.username || ''}`),
    React.createElement('button', { 
      key: 'theme-btn',
      onClick: props?.onToggleDarkMode,
      'aria-label': `Switch to ${props?.isDarkMode ? 'light' : 'dark'} theme`
    }, props?.isDarkMode ? 'Sun' : 'Moon'),
    React.createElement('button', {
      key: 'signout-btn', 
      onClick: props?.onSignOut
    }, 'Sign Out'),
    React.createElement('div', { 
      key: 'qr',
      'data-testid': 'qr-code-display' 
    }, `QR Code for ${props?.user?.username} (${props?.user?.id})`),
    React.createElement('div', { 
      key: 'connect',
      'data-testid': 'connect-friend' 
    }, React.createElement('button', {
      onClick: () => props?.onConnectFriend?.('friend-123', 'Friend User')
    }, 'Connect Friend'))
  ]),

  Onboarding: (props: any) => React.createElement('div', {
    'data-testid': 'onboarding-component'
  }, [
    React.createElement('h1', { key: 'title' }, 'Welcome to GlobalTranslate'),
    React.createElement('p', { key: 'subtitle' }, 'Set up your profile to start chatting'),
    React.createElement('input', {
      key: 'username-input',
      'aria-label': 'Choose a username',
      placeholder: 'Enter username',
      onChange: (e: any) => props?.onUsernameChange?.(e.target.value)
    }),
    React.createElement('button', {
      key: 'submit-btn',
      onClick: () => props?.onComplete?.('testuser', 'en')
    }, 'Get Started'),
    React.createElement('div', { 
      key: 'version',
      'data-testid': 'version-display' 
    }, 'Version Display')
  ]),

  Chat: createComponentMock('Chat'),
  VersionDisplay: createComponentMock('VersionDisplay'),
  ToastContainer: createComponentMock('ToastContainer'),
  QRCodeDisplay: (props: any) => React.createElement('div', {
    'data-testid': 'qr-code-display'
  }, `QR Code for ${props?.username} (${props?.userId})`),
  ConnectFriend: (props: any) => React.createElement('div', {
    'data-testid': 'connect-friend'
  }, React.createElement('button', {
    onClick: () => props?.onConnect?.('friend-123', 'Friend User')
  }, 'Connect Friend'))
};

// =============================================================================
// SERVICE MOCKS
// =============================================================================

export const serviceMocks = {
  userService: {
    checkUsernameAvailability: jest.fn().mockResolvedValue(true),
    getUserByUsername: jest.fn().mockResolvedValue(null),
    getUserByFirebaseUid: jest.fn().mockResolvedValue(null),
    createUser: jest.fn().mockResolvedValue({ id: 'user-123' }),
    updateUser: jest.fn().mockResolvedValue(undefined)
  },
  
  translationService: {
    translateText: jest.fn().mockResolvedValue('Translated text'),
    getSupportedLanguages: jest.fn().mockReturnValue(['en', 'es', 'fr'])
  }
};

// =============================================================================
// UTILITY MOCKS
// =============================================================================

export const utilityMocks = {
  idGenerator: {
    generateUserId: jest.fn().mockReturnValue('generated-id-123'),
    generateChatId: jest.fn().mockReturnValue('chat-id-123')
  },
  
  storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
};

// =============================================================================
// CONSTANTS MOCKS
// =============================================================================

export const constantMocks = {
  SUPPORTED_LANGUAGES: [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },  
    { code: 'fr', name: 'French' },
    { code: 'hi', name: 'Hindi' },
    { code: 'te', name: 'Telugu' }
  ]
};

// =============================================================================
// WEB API MOCKS
// =============================================================================

export const webApiMocks = {
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(), 
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  
  matchMedia: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
  
  IntersectionObserver: class {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  },
  
  ResizeObserver: class {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  }
};