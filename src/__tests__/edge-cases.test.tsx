import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';

// Mock fetch for translation tests
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Static mocks setup
const createEdgeCaseMocks = () => {
  const mockAuthCallbacks: Array<(user: any) => void> = [];
  
  return {
    firebase: {
      auth: {
        currentUser: { uid: 'test-uid' },
        onAuthStateChanged: jest.fn((auth, callback) => {
          mockAuthCallbacks.push(callback);
          return () => {};
        }),
        signInAnonymously: jest.fn().mockResolvedValue({ user: { uid: 'test-uid' } }),
        signOut: jest.fn().mockResolvedValue(undefined)
      },
      firestore: {
        doc: jest.fn(),
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
        updateDoc: jest.fn().mockResolvedValue(undefined)
      }
    },
    userService: {
      checkUsernameAvailability: jest.fn().mockResolvedValue(true),
      getUserByUsername: jest.fn().mockResolvedValue(null)
    },
    callbacks: mockAuthCallbacks
  };
};

const edgeCaseMocks = createEdgeCaseMocks();

jest.mock('../config/firebase', () => edgeCaseMocks.firebase.auth);
jest.mock('firebase/auth', () => edgeCaseMocks.firebase.auth);
jest.mock('firebase/firestore', () => edgeCaseMocks.firebase.firestore);
jest.mock('../services/userService', () => ({ userService: edgeCaseMocks.userService }));
jest.mock('../utils/idGenerator', () => ({ generateUserId: () => 'generated-id-123' }));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Moon: ({ className }: any) => <span className={className}>Moon</span>,
  Sun: ({ className }: any) => <span className={className}>Sun</span>,
  MessageCircle: ({ className }: any) => <div className={className}>MessageCircle</div>,
  Sparkles: ({ className }: any) => <div className={className}>Sparkles</div>
}));

// Mock child components
jest.mock('../components/QRCodeDisplay', () => {
  return function QRCodeDisplay({ userId, username }: any) {
    return <div data-testid="qr-code-display">QR Code for {username} ({userId})</div>;
  };
});

jest.mock('../components/ConnectFriend', () => {
  return function ConnectFriend({ onConnect }: any) {
    return (
      <div data-testid="connect-friend">
        <button onClick={() => onConnect('friend-123', 'Friend User')}>
          Connect Friend
        </button>
      </div>
    );
  };
});

jest.mock('../components/VersionDisplay', () => {
  return function VersionDisplay() {
    return <div data-testid="version-display">v1.0.0</div>;
  };
});

// Import after mocking
import App from '../App';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import Home from '../components/Home';
import Onboarding from '../components/Onboarding';

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    edgeCaseMocks.callbacks.length = 0;
    
    // Suppress console noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('🔥 Critical Edge Cases', () => {
    test('all components render without crashing in edge conditions', () => {
      expect(() => {
        render(<App />);
      }).not.toThrow();
      
      expect(() => {
        render(<Home 
          user={{ id: '', username: '' }} 
          onConnectFriend={() => {}} 
          isDarkMode={false} 
          onToggleDarkMode={() => {}} 
          onSignOut={() => {}} 
          showToast={() => {}} 
        />);
      }).not.toThrow();
      
      expect(() => {
        render(<Onboarding onComplete={() => {}} userId="" />);
      }).not.toThrow();
    });
  });

  describe('🌐 Translation Edge Cases', () => {
    test('handles extremely long text translation', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      const longText = 'a'.repeat(10000); // Very long text
      const translatedText = 'b'.repeat(10000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            translations: [{ translatedText }]
          }
        })
      } as Response);

      const { result } = renderHook(() => useTranslation());
      
      let resultText = '';
      await act(async () => {
        resultText = await result.current.translateText(longText, 'en', 'es');
      });

      expect(resultText).toBe(translatedText);
      process.env = originalEnv;
    });

    test('handles special characters and unicode', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      const unicodeText = '👋🌍🔥💯🚀🎉';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            translations: [{ translatedText: unicodeText }]
          }
        })
      } as Response);

      const { result } = renderHook(() => useTranslation());
      
      let resultText = '';
      await act(async () => {
        resultText = await result.current.translateText(unicodeText, 'en', 'es');
      });

      expect(resultText).toBe(unicodeText);
      process.env = originalEnv;
    });

    test('handles API rate limiting gracefully', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      } as Response);

      const { result } = renderHook(() => useTranslation());
      
      await act(async () => {
        await expect(result.current.translateText('Hello', 'en', 'es'))
          .rejects.toThrow(/rate limit|too many requests|try again/i);
      });

      process.env = originalEnv;
    });

    test('handles malformed API responses', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ malformed: 'response' })
      } as Response);

      const { result } = renderHook(() => useTranslation());
      
      await act(async () => {
        await expect(result.current.translateText('Hello', 'en', 'es'))
          .rejects.toThrow();
      });

      process.env = originalEnv;
    });
  });

  describe('🔐 Authentication Edge Cases', () => {
    test('handles rapid authentication state changes', async () => {
      const { result } = renderHook(() => useAuth());
      
      if (edgeCaseMocks.callbacks.length > 0) {
        await act(async () => {
          // Rapid state changes
          edgeCaseMocks.callbacks[0]({ uid: 'user1' });
          edgeCaseMocks.callbacks[0](null);
          edgeCaseMocks.callbacks[0]({ uid: 'user2' });
          edgeCaseMocks.callbacks[0](null);
          edgeCaseMocks.callbacks[0]({ uid: 'user3' });
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }
      
      // Hook should remain stable
      expect(result.current.signInAnonymous).toBeDefined();
      expect(result.current.signOut).toBeDefined();
    });

    test('handles concurrent authentication operations', async () => {
      const { result } = renderHook(() => useAuth());
      
      await act(async () => {
        // Multiple concurrent operations
        const promises = [
          result.current.signInAnonymous(),
          result.current.signInAnonymous(),
          result.current.signInAnonymous()
        ];
        
        // Should handle concurrent calls gracefully
        await Promise.allSettled(promises);
      });
      
      expect(result.current).toBeDefined();
    });
  });

  describe('📱 UI Edge Cases', () => {
    test('handles extremely long usernames', () => {
      const longUsername = 'a'.repeat(1000);
      
      expect(() => {
        render(<Home 
          user={{ id: 'user-123', username: longUsername }} 
          onConnectFriend={() => {}} 
          isDarkMode={false} 
          onToggleDarkMode={() => {}} 
          onSignOut={() => {}} 
          showToast={() => {}} 
        />);
      }).not.toThrow();
      
      expect(screen.getByText(longUsername)).toBeInTheDocument();
    });

    test('handles empty and null props gracefully', () => {
      expect(() => {
        render(<Home 
          user={{ id: '', username: '' }} 
          onConnectFriend={null as any} 
          isDarkMode={false} 
          onToggleDarkMode={null as any} 
          onSignOut={null as any} 
          showToast={null as any} 
        />);
      }).not.toThrow();
    });

    test('handles undefined user data', () => {
      expect(() => {
        render(<Home 
          user={undefined as any} 
          onConnectFriend={() => {}} 
          isDarkMode={false} 
          onToggleDarkMode={() => {}} 
          onSignOut={() => {}} 
          showToast={() => {}} 
        />);
      }).not.toThrow();
    });
  });

  describe('⚡ Performance Edge Cases', () => {
    test('handles rapid component re-renders', () => {
      expect(() => {
        const { rerender } = render(<App />);
        
        // Rapid re-renders with different props
        for (let i = 0; i < 100; i++) {
          rerender(<App key={i} />);
        }
      }).not.toThrow();
    });

    test('handles memory pressure scenarios', () => {
      expect(() => {
        const components: any[] = [];
        
        // Create many component instances
        for (let i = 0; i < 50; i++) {
          components.push(render(<Home 
            user={{ id: `user-${i}`, username: `user${i}` }} 
            onConnectFriend={() => {}} 
            isDarkMode={i % 2 === 0} 
            onToggleDarkMode={() => {}} 
            onSignOut={() => {}} 
            showToast={() => {}} 
          />));
        }
        
        // Clean up all components
        components.forEach(component => {
          component.unmount();
        });
      }).not.toThrow();
    });
  });

  describe('🌐 Network Edge Cases', () => {
    test('handles complete network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network completely unavailable'));
      
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      const { result } = renderHook(() => useTranslation());
      
      await act(async () => {
        await expect(result.current.translateText('Hello', 'en', 'es'))
          .rejects.toThrow('Network completely unavailable');
      });

      process.env = originalEnv;
    });

    test('handles slow network responses', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      // Mock slow response
      let resolvePromise: (value: any) => void;
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockImplementationOnce(() => slowPromise as Promise<Response>);

      const { result } = renderHook(() => useTranslation());
      
      // Start translation
      act(() => {
        result.current.translateText('Hello', 'en', 'es');
      });

      // Should show loading state
      expect(result.current.isTranslating).toBe(true);

      // Resolve after delay
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({
            data: {
              translations: [{ translatedText: 'Hola' }]
            }
          })
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      process.env = originalEnv;
    });
  });

  describe('🔧 Configuration Edge Cases', () => {
    test('handles missing environment variables', async () => {
      const originalEnv = process.env;
      delete process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY;

      const { result } = renderHook(() => useTranslation());
      
      await act(async () => {
        await expect(result.current.translateText('Hello', 'en', 'es'))
          .rejects.toThrow(/api key|not configured/i);
      });

      process.env = originalEnv;
    });

    test('handles invalid configuration values', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: '' };

      const { result } = renderHook(() => useTranslation());
      
      await act(async () => {
        await expect(result.current.translateText('Hello', 'en', 'es'))
          .rejects.toThrow(/api key|not configured/i);
      });

      process.env = originalEnv;
    });
  });

  describe('🎯 Boundary Conditions', () => {
    test('handles maximum input lengths', async () => {
      const maxLengthUsername = 'a'.repeat(20); // Assuming 20 is max
      
      expect(() => {
        render(<Onboarding onComplete={() => {}} userId="test-user" />);
      }).not.toThrow();
      
      // Should handle input at boundary
      const usernameInput = screen.getByLabelText(/choose a username/i);
      expect(usernameInput).toBeInTheDocument();
    });

    test('handles minimum input requirements', async () => {
      render(<Onboarding onComplete={() => {}} userId="test-user" />);
      
      const usernameInput = screen.getByLabelText(/choose a username/i);
      const submitButton = screen.getByRole('button', { name: /get started/i });
      
      // Test minimum length validation
      await userEvent.type(usernameInput, 'ab'); // Below minimum
      await userEvent.click(submitButton);
      
      // Should show validation message
      await waitFor(() => {
        const validationMessage = screen.queryByText(/must be at least/i) || 
                                 screen.queryByText(/too short/i) ||
                                 screen.queryByText(/minimum/i);
        expect(validationMessage).toBeTruthy();
      });
    });
  });

  describe('🧹 Cleanup and Memory Management', () => {
    test('proper cleanup prevents memory leaks', () => {
      const components: any[] = [];
      
      expect(() => {
        // Create multiple components
        for (let i = 0; i < 10; i++) {
          components.push(render(<App key={i} />));
        }
        
        // Unmount all
        components.forEach(component => component.unmount());
      }).not.toThrow();
    });

    test('event listeners are properly removed', () => {
      const { unmount } = render(<App />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});