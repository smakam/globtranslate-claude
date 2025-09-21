import React from 'react';
import { render, RenderOptions, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  createFirebaseMocks, 
  lucideMocks, 
  componentMocks, 
  serviceMocks,
  utilityMocks,
  constantMocks,
  webApiMocks 
} from './globalMocks';

// =============================================================================
// GLOBAL TEST SETUP UTILITIES
// =============================================================================

export class TestEnvironment {
  private mocks: any = {};
  
  constructor() {
    this.setupBasicMocks();
  }

  private setupBasicMocks() {
    // Web API mocks
    Object.defineProperty(window, 'localStorage', { value: webApiMocks.localStorage });
    Object.defineProperty(window, 'matchMedia', { value: webApiMocks.matchMedia });
    global.IntersectionObserver = webApiMocks.IntersectionObserver as any;
    global.ResizeObserver = webApiMocks.ResizeObserver as any;
    
    // Suppress console output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  }

  // Mock specific modules
  mockModule(modulePath: string, mockImplementation: any) {
    jest.doMock(modulePath, () => mockImplementation);
    this.mocks[modulePath] = mockImplementation;
    return this;
  }

  // Setup Firebase mocks
  setupFirebase() {
    const { mockAuth, mockFirestore } = createFirebaseMocks();
    
    this.mockModule('firebase/auth', () => ({
      onAuthStateChanged: mockAuth.onAuthStateChanged,
      signInAnonymously: mockAuth.signInAnonymously,
      signOut: mockAuth.signOut
    }));
    
    this.mockModule('firebase/firestore', () => mockFirestore);
    
    this.mockModule('../config/firebase', () => ({
      auth: mockAuth,
      db: {}
    }));
    
    return this;
  }

  // Setup external library mocks
  setupExternalLibs() {
    this.mockModule('lucide-react', () => lucideMocks);
    this.mockModule('qrcode.react', () => ({ QRCodeSVG: (props: any) => <div data-testid="qr-code" {...props} /> }));
    this.mockModule('html5-qrcode', () => ({ Html5QrcodeScanner: jest.fn() }));
    return this;
  }

  // Setup service mocks
  setupServices() {
    this.mockModule('../services/userService', () => ({ userService: serviceMocks.userService }));
    this.mockModule('../utils/idGenerator', () => utilityMocks.idGenerator);
    this.mockModule('../constants/languages', () => constantMocks);
    return this;
  }

  // Get mock for testing
  getMock(modulePath: string) {
    return this.mocks[modulePath];
  }

  // Reset all mocks
  reset() {
    jest.clearAllMocks();
    jest.resetAllMocks();
    return this;
  }

  // Clean up
  cleanup() {
    jest.restoreAllMocks();
    return this;
  }
}

// =============================================================================
// COMPONENT TEST UTILITIES
// =============================================================================

export interface TestComponentProps {
  user?: {
    id: string;
    username: string;
    language?: string;
    isOnline?: boolean;
  };
  onConnectFriend?: jest.Mock;
  onToggleDarkMode?: jest.Mock;
  onSignOut?: jest.Mock;
  showToast?: jest.Mock;
  onComplete?: jest.Mock;
  isDarkMode?: boolean;
}

export const createDefaultProps = (overrides: Partial<TestComponentProps> = {}): TestComponentProps => ({
  user: {
    id: 'test-user-123',
    username: 'testuser',
    language: 'en',
    isOnline: true
  },
  onConnectFriend: jest.fn(),
  onToggleDarkMode: jest.fn(),
  onSignOut: jest.fn(),
  showToast: jest.fn(),
  onComplete: jest.fn(),
  isDarkMode: false,
  ...overrides
});

// Enhanced render function with automatic cleanup
export const renderWithTestEnvironment = (
  ui: React.ReactElement,
  options?: RenderOptions & { testEnv?: TestEnvironment }
) => {
  const testEnv = options?.testEnv || new TestEnvironment();
  
  const result = render(ui, options);
  
  // Return enhanced result with utilities
  return {
    ...result,
    testEnv,
    user: userEvent,
    // Utility functions
    findByTestId: (testId: string) => screen.findByTestId(testId),
    queryByTestId: (testId: string) => screen.queryByTestId(testId),
    getByTestId: (testId: string) => screen.getByTestId(testId),
    // Async utilities
    waitForElement: (testId: string, timeout = 5000) => 
      waitFor(() => screen.getByTestId(testId), { timeout }),
    waitForText: (text: string, timeout = 5000) =>
      waitFor(() => screen.getByText(text), { timeout }),
    // Event utilities
    clickButton: async (buttonText: string) => {
      const button = screen.getByRole('button', { name: new RegExp(buttonText, 'i') });
      await userEvent.click(button);
      return button;
    },
    typeInInput: async (labelText: string, value: string) => {
      const input = screen.getByLabelText(new RegExp(labelText, 'i'));
      await userEvent.type(input, value);
      return input;
    }
  };
};

// =============================================================================
// HOOK TEST UTILITIES
// =============================================================================

export const createHookTestEnvironment = () => {
  const testEnv = new TestEnvironment();
  
  return {
    testEnv,
    setupMocks: (mockConfig: {
      firebase?: boolean;
      services?: boolean;
      externals?: boolean;
    }) => {
      if (mockConfig.firebase) testEnv.setupFirebase();
      if (mockConfig.services) testEnv.setupServices();
      if (mockConfig.externals) testEnv.setupExternalLibs();
      return testEnv;
    },
  };
};

// =============================================================================
// ASSERTION UTILITIES
// =============================================================================

export const assertions = {
  // Component rendering assertions
  expectComponentToRender: (testId: string) => {
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  },
  
  expectComponentNotToRender: (testId: string) => {
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
  },
  
  // Text content assertions
  expectTextToBeVisible: (text: string) => {
    expect(screen.getByText(text)).toBeInTheDocument();
  },
  
  // User interaction assertions
  expectFunctionToBeCalled: (mockFn: jest.Mock, times = 1) => {
    expect(mockFn).toHaveBeenCalledTimes(times);
  },
  
  expectFunctionToBeCalledWith: (mockFn: jest.Mock, ...args: any[]) => {
    expect(mockFn).toHaveBeenCalledWith(...args);
  },
  
  // Async assertions
  expectEventuallyVisible: async (testId: string, timeout = 5000) => {
    await waitFor(() => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    }, { timeout });
  },
  
  // Error boundary assertions
  expectNoErrorsThrown: (renderFn: () => void) => {
    expect(renderFn).not.toThrow();
  }
};

// =============================================================================
// TEST SCENARIO BUILDERS
// =============================================================================

export class TestScenario {
  private steps: Array<() => Promise<void> | void> = [];
  
  // Add setup step
  setup(setupFn: () => Promise<void> | void) {
    this.steps.push(setupFn);
    return this;
  }
  
  // Add action step
  action(actionFn: () => Promise<void> | void) {
    this.steps.push(actionFn);
    return this;
  }
  
  // Add assertion step
  assert(assertFn: () => Promise<void> | void) {
    this.steps.push(assertFn);
    return this;
  }
  
  // Execute all steps
  async execute() {
    for (const step of this.steps) {
      await step();
    }
  }
}

// =============================================================================
// COMMON TEST PATTERNS
// =============================================================================

export const testPatterns = {
  // Test component renders without crashing
  componentRenders: (Component: React.ComponentType<any>, props: any = {}) => {
    return () => {
      expect(() => {
        renderWithTestEnvironment(<Component {...props} />);
      }).not.toThrow();
    };
  },
  
  // Test component displays expected content
  componentDisplaysContent: (Component: React.ComponentType<any>, props: any, expectedTexts: string[]) => {
    return () => {
      renderWithTestEnvironment(<Component {...props} />);
      expectedTexts.forEach(text => {
        assertions.expectTextToBeVisible(text);
      });
    };
  },
  
  // Test button click functionality
  buttonClickWorks: (Component: React.ComponentType<any>, props: any, buttonText: string, mockFn: jest.Mock) => {
    return async () => {
      const { clickButton } = renderWithTestEnvironment(<Component {...props} />);
      await clickButton(buttonText);
      assertions.expectFunctionToBeCalled(mockFn);
    };
  },
  
  // Test form submission
  formSubmission: (Component: React.ComponentType<any>, props: any, inputLabel: string, inputValue: string, submitText: string, mockFn: jest.Mock) => {
    return async () => {
      const { typeInInput, clickButton } = renderWithTestEnvironment(<Component {...props} />);
      await typeInInput(inputLabel, inputValue);
      await clickButton(submitText);
      assertions.expectFunctionToBeCalled(mockFn);
    };
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export { act, waitFor, screen };
export * from '@testing-library/react';
export { userEvent };

// Re-export everything for convenience
export {
  TestEnvironment,
  createDefaultProps,
  renderWithTestEnvironment as render,
  assertions as expect,
  testPatterns,
  TestScenario
};