import { useState } from 'react';

// Simple rate limiting
const rateLimiter = {
  requests: [] as number[],
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  },
  
  addRequest(): void {
    this.requests.push(Date.now());
  }
};

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateText = async (
    text: string, 
    fromLanguage: string, 
    toLanguage: string
  ): Promise<string> => {
    // If languages are the same, return original text
    if (fromLanguage === toLanguage) {
      return text;
    }

    setIsTranslating(true);
    setError(null);
    
    // Check rate limiting
    if (!rateLimiter.canMakeRequest()) {
      setIsTranslating(false);
      const rateLimitError = 'Rate limit exceeded. Please wait before making another translation request.';
      setError(rateLimitError);
      throw new Error(rateLimitError);
    }
    
    try {
      const API_KEY = process.env.REACT_APP_GOOGLE_TRANSLATE_API_KEY;
      
      if (!API_KEY) {
        throw new Error('Google Translate API key not configured');
      }
      
      // Add to rate limiter
      rateLimiter.addRequest();
      
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: fromLanguage,
          target: toLanguage,
          format: 'text'
        })
      });
      
      if (!response.ok) {
        let errorMessage = `Translation failed: ${response.status} ${response.statusText}`;
        
        if (response.status === 429) {
          errorMessage = 'Translation API rate limit exceeded. Please try again later.';
        } else if (response.status === 403) {
          errorMessage = 'Translation API access denied. Please check your API key.';
        } else if (response.status === 400) {
          errorMessage = 'Invalid translation request. Please check the input.';
        }
        
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data.data || !data.data.translations || data.data.translations.length === 0) {
        throw new Error('No translation received from API');
      }
      
      const translatedText = data.data.translations[0].translatedText;
      
      // Decode HTML entities that might be returned by the API
      const textArea = document.createElement('textarea');
      textArea.innerHTML = translatedText;
      const decodedText = textArea.value;
      
      console.log('🔧 Translation API response:', {
        originalText: text,
        rawTranslatedText: translatedText,
        decodedTranslatedText: decodedText,
        fromLanguage,
        toLanguage
      });
      
      return decodedText;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown translation error';
      console.error('Translation failed:', errorMessage);
      setError(errorMessage);
      
      // Fallback to original text if translation fails
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  const clearError = () => setError(null);

  return {
    translateText,
    isTranslating,
    error,
    clearError
  };
};