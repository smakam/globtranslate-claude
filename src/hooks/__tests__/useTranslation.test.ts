import { renderHook, act, waitFor } from '@testing-library/react';
import { useTranslation } from '../useTranslation';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock environment variable
const originalEnv = process.env;

describe('useTranslation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  test('should initialize with isTranslating false', () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.isTranslating).toBe(false);
  });

  test('should return original text when languages are the same', async () => {
    const { result } = renderHook(() => useTranslation());
    
    const translatedText = await act(async () => {
      return await result.current.translateText('Hello', 'en', 'en');
    });

    expect(translatedText).toBe('Hello');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.isTranslating).toBe(false);
  });

  test('should successfully translate text', async () => {
    const mockResponse = {
      data: {
        translations: [
          { translatedText: 'Hola' }
        ]
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response);

    const { result } = renderHook(() => useTranslation());
    
    let translatedText: string = '';
    await act(async () => {
      translatedText = await result.current.translateText('Hello', 'en', 'es');
    });

    expect(translatedText).toBe('Hola');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://translation.googleapis.com/language/translate/v2'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Hello')
      })
    );
    expect(result.current.isTranslating).toBe(false);
  });

  test('should handle API error gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request'
    } as Response);

    const { result } = renderHook(() => useTranslation());
    
    let translatedText: string = '';
    await act(async () => {
      translatedText = await result.current.translateText('Hello', 'en', 'es');
    });

    // Should return original text as fallback when API fails
    expect(translatedText).toBe('Hello');
    expect(result.current.error).toBe('Invalid translation request. Please check the input.');
    expect(result.current.isTranslating).toBe(false);
  });

  test('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTranslation());
    
    let translatedText: string = '';
    await act(async () => {
      translatedText = await result.current.translateText('Hello', 'en', 'es');
    });

    // Should return original text as fallback when network fails
    expect(translatedText).toBe('Hello');
    expect(result.current.error).toBe('Network error');
    expect(result.current.isTranslating).toBe(false);
  });

  test('should handle missing API key', async () => {
    delete process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY;

    const { result } = renderHook(() => useTranslation());
    
    let translatedText: string = '';
    await act(async () => {
      translatedText = await result.current.translateText('Hello', 'en', 'es');
    });

    // Should return original text as fallback when API key is missing
    expect(translatedText).toBe('Hello');
    expect(result.current.error).toBe('Google Translate API key not configured');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.isTranslating).toBe(false);
  });

  test('should handle empty response', async () => {
    const mockResponse = {
      data: {
        translations: []
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response);

    const { result } = renderHook(() => useTranslation());
    
    let translatedText: string = '';
    await act(async () => {
      translatedText = await result.current.translateText('Hello', 'en', 'es');
    });

    // Should return original text as fallback when no translation received
    expect(translatedText).toBe('Hello');
    expect(result.current.error).toBe('No translation received from API');
    expect(result.current.isTranslating).toBe(false);
  });

  test('should handle malformed response', async () => {
    const mockResponse = {
      data: {}
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response);

    const { result } = renderHook(() => useTranslation());
    
    let translatedText: string = '';
    await act(async () => {
      translatedText = await result.current.translateText('Hello', 'en', 'es');
    });

    // Should return original text as fallback when response is malformed
    expect(translatedText).toBe('Hello');
    expect(result.current.error).toBe('No translation received from API');
    expect(result.current.isTranslating).toBe(false);
  });

  test('should set isTranslating to true during translation', async () => {
    let resolvePromise: (value: any) => void;
    const translationPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockImplementationOnce(() => translationPromise as Promise<Response>);

    const { result } = renderHook(() => useTranslation());
    
    act(() => {
      result.current.translateText('Hello', 'en', 'es');
    });

    expect(result.current.isTranslating).toBe(true);

    // Resolve the promise
    act(() => {
      resolvePromise!({
        ok: true,
        json: async () => ({
          data: {
            translations: [{ translatedText: 'Hola' }]
          }
        })
      });
    });

    await waitFor(() => {
      expect(result.current.isTranslating).toBe(false);
    });
  });

  test('should handle special characters and emojis', async () => {
    const specialText = 'Hello! 👋 How are you? 🤔';
    const translatedText = 'Hola! 👋 ¿Cómo estás? 🤔';

    const mockResponse = {
      data: {
        translations: [
          { translatedText }
        ]
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response);

    const { result } = renderHook(() => useTranslation());
    
    let result_text: string = '';
    await act(async () => {
      result_text = await result.current.translateText(specialText, 'en', 'es');
    });

    expect(result_text).toBe(translatedText);
  });
});