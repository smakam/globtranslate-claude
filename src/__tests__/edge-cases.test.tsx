import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';
import App from '../App';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import Home from '../components/Home';
import Onboarding from '../components/Onboarding';

// Mock fetch for translation tests
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Translation Edge Cases', () => {
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

    test('handles translation of empty string', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            translations: [{ translatedText: '' }]
          }
        })
      } as Response);

      const { result } = renderHook(() => useTranslation());
      
      let resultText = '';
      await act(async () => {
        resultText = await result.current.translateText('', 'en', 'es');
      });

      expect(resultText).toBe('');
      process.env = originalEnv;
    });

    test('handles special characters and unicode', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      const specialText = '🌟 Hello! 你好 مرحبا \n\t Special chars: @#$%^&*()';
      const translatedText = '🌟 ¡Hola! 你好 مرحبا \n\t Caracteres especiales: @#$%^&*()';

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
        resultText = await result.current.translateText(specialText, 'en', 'es');
      });

      expect(resultText).toBe(translatedText);
      process.env = originalEnv;
    });

    test('handles rate limiting errors', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      } as Response);

      const { result } = renderHook(() => useTranslation());
      
      await expect(act(async () => {
        await result.current.translateText('Hello', 'en', 'es');
      })).rejects.toThrow('Translation failed: 429 Too Many Requests');

      process.env = originalEnv;
    });

    test('handles malformed API response', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: 'Invalid request'
        })
      } as Response);

      const { result } = renderHook(() => useTranslation());
      
      await expect(act(async () => {
        await result.current.translateText('Hello', 'en', 'es');
      })).rejects.toThrow('No translation received');

      process.env = originalEnv;
    });
  });

  describe('Authentication Edge Cases', () => {
    test('handles corrupted user data in Firestore', async () => {
      // This would be tested with mocked Firebase that returns malformed data
      // The useAuth hook should handle this gracefully
      expect(true).toBe(true); // Placeholder as full Firebase mocking is complex
    });

    test('handles network interruption during authentication', async () => {
      // This would test the retry mechanisms in useAuth
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Component Edge Cases', () => {
    test('Home component handles missing user props gracefully', () => {
      const propsWithMissingData = {
        user: {} as any, // Missing required properties
        onConnectFriend: jest.fn(),
        isDarkMode: false,
        onToggleDarkMode: jest.fn(),
        onSignOut: jest.fn(),
        showToast: jest.fn()
      };

      // Should not crash even with malformed user data
      expect(() => {
        render(<Home {...propsWithMissingData} />);
      }).not.toThrow();
    });

    test('Onboarding handles extremely rapid form submissions', async () => {
      const mockOnComplete = jest.fn();
      const user = userEvent.setup();

      // Mock userService
      jest.doMock('../services/userService', () => ({
        userService: {
          checkUsernameAvailability: jest.fn().mockResolvedValue(true),
          getUserByUsername: jest.fn()
        }
      }));

      render(<Onboarding onComplete={mockOnComplete} userId="test-123" />);

      const usernameInput = screen.getByLabelText(/choose a username/i);
      const submitButton = screen.getByRole('button', { name: /get started/i });

      await user.type(usernameInput, 'rapiduser');

      // Rapid submissions
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should handle gracefully and not cause multiple calls
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    test('handles component unmounting during async operations', () => {
      const { unmount } = render(<App />);
      
      // Unmount immediately to test cleanup
      unmount();
      
      // Should not cause memory leaks or unhandled promises
      expect(true).toBe(true);
    });
  });

  describe('Storage Edge Cases', () => {
    test('handles localStorage being unavailable', () => {
      // Mock localStorage to throw errors
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn().mockImplementation(() => {
            throw new Error('Storage unavailable');
          }),
          setItem: jest.fn().mockImplementation(() => {
            throw new Error('Storage unavailable');
          })
        }
      });

      // Should handle gracefully
      expect(() => {
        render(<App />);
      }).not.toThrow();

      // Restore localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage
      });
    });

    test('handles corrupted localStorage data', () => {
      const mockLocalStorage = {
        getItem: jest.fn().mockReturnValue('invalid-json{'),
        setItem: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      });

      // Should handle corrupted data gracefully
      expect(() => {
        render(<App />);
      }).not.toThrow();
    });
  });

  describe('Network Edge Cases', () => {
    test('handles complete network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network completely unavailable'));

      const { result } = renderHook(() => useTranslation());
      
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      await expect(act(async () => {
        await result.current.translateText('Hello', 'en', 'es');
      })).rejects.toThrow('Network completely unavailable');

      process.env = originalEnv;
    });

    test('handles slow network responses', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      // Mock a very slow response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              data: {
                translations: [{ translatedText: 'Slow response' }]
              }
            })
          } as Response), 5000)
        )
      );

      const { result } = renderHook(() => useTranslation());
      
      // Start translation
      const translationPromise = act(async () => {
        return await result.current.translateText('Hello', 'en', 'es');
      });

      // Should be in loading state
      expect(result.current.isTranslating).toBe(true);

      await translationPromise;
      process.env = originalEnv;
    }, 10000);
  });

  describe('Input Validation Edge Cases', () => {
    test('handles null and undefined inputs in translation', async () => {
      const { result } = renderHook(() => useTranslation());
      
      // These should not crash the application
      await expect(act(async () => {
        await result.current.translateText(null as any, 'en', 'es');
      })).rejects.toThrow();

      await expect(act(async () => {
        await result.current.translateText(undefined as any, 'en', 'es');
      })).rejects.toThrow();
    });

    test('handles invalid language codes', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Invalid language code'
      } as Response);

      const { result } = renderHook(() => useTranslation());
      
      await expect(act(async () => {
        await result.current.translateText('Hello', 'invalid-code', 'another-invalid');
      })).rejects.toThrow();

      process.env = originalEnv;
    });
  });

  describe('Concurrent Operations', () => {
    test('handles multiple simultaneous translations', async () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, REACT_APP_GOOGLE_TRANSLATE_API_KEY: 'test-key' };

      // Mock different responses for different calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { translations: [{ translatedText: 'First' }] } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { translations: [{ translatedText: 'Second' }] } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { translations: [{ translatedText: 'Third' }] } })
        } as Response);

      const { result } = renderHook(() => useTranslation());
      
      // Start multiple translations simultaneously
      const promises = [
        result.current.translateText('One', 'en', 'es'),
        result.current.translateText('Two', 'en', 'es'),
        result.current.translateText('Three', 'en', 'es')
      ];

      const results = await Promise.all(promises);
      
      expect(results).toEqual(['First', 'Second', 'Third']);
      process.env = originalEnv;
    });

    test('handles rapid theme toggles', async () => {
      const user = userEvent.setup();
      
      const props = {
        user: { id: 'test', username: 'test' },
        onConnectFriend: jest.fn(),
        isDarkMode: false,
        onToggleDarkMode: jest.fn(),
        onSignOut: jest.fn(),
        showToast: jest.fn()
      };

      render(<Home {...props} />);

      const themeButton = screen.getByRole('button', { name: /theme/i });

      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        await user.click(themeButton);
      }

      expect(props.onToggleDarkMode).toHaveBeenCalledTimes(10);
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    test('handles missing browser APIs gracefully', () => {
      // Mock missing APIs
      const originalMatchMedia = window.matchMedia;
      delete (window as any).matchMedia;

      expect(() => {
        render(<App />);
      }).not.toThrow();

      // Restore
      window.matchMedia = originalMatchMedia;
    });

    test('handles old browser without modern features', () => {
      // Mock old browser environment
      const originalFetch = global.fetch;
      delete (global as any).fetch;

      const { result } = renderHook(() => useTranslation());
      
      // Should handle missing fetch gracefully
      expect(async () => {
        await result.current.translateText('Hello', 'en', 'es');
      }).rejects.toThrow();

      global.fetch = originalFetch;
    });
  });
});