import { useState, useCallback, useEffect } from 'react';

// Function to clean text for better speech synthesis
const cleanTextForSpeech = (text: string): string => {
  return text
    // Replace periods with natural pauses (keep at end of sentences)
    .replace(/\.+/g, '.')
    // Replace multiple punctuation marks but keep some for natural flow
    .replace(/[,;:]+/g, ',')
    // Replace exclamation and question marks but keep meaning
    .replace(/!+/g, '!')
    .replace(/\?+/g, '?')
    // Remove quotation marks and brackets that get read aloud
    .replace(/["'`()[\]{}]/g, '')
    // Replace dashes and underscores with spaces
    .replace(/[-_]+/g, ' ')
    // Replace line breaks with comma for natural pause
    .replace(/\n+/g, ', ')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
};

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text: string, language: string = 'en') => {
    if (!isSupported || !text.trim()) {
      console.log('🔊 TTS not supported or empty text:', { isSupported, text });
      return;
    }

    // Cancel any current speech
    speechSynthesis.cancel();

    // Clean the text to prevent punctuation from being read aloud
    const cleanedText = cleanTextForSpeech(text);
    console.log('🔊 TTS Original:', text);
    console.log('🔊 TTS Cleaned:', cleanedText);
    console.log('🔊 TTS Language:', language);
    console.log('🔊 Available voices:', voices.length);
    
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Find a voice for the specified language
    const voice = voices.find(v => v.lang.startsWith(language)) || voices[0];
    console.log('🔊 Selected voice:', voice ? `${voice.name} (${voice.lang})` : 'none');
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      console.log('🔊 TTS started');
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      console.log('🔊 TTS ended');
      setIsSpeaking(false);
    };
    utterance.onerror = (event) => {
      console.error('🔊 TTS error:', event);
      setIsSpeaking(false);
    };

    console.log('🔊 Speaking utterance...');
    speechSynthesis.speak(utterance);
  }, [isSupported, voices]);

  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const getVoicesForLanguage = useCallback((language: string) => {
    return voices.filter(voice => voice.lang.startsWith(language));
  }, [voices]);

  return {
    isSpeaking,
    voices,
    isSupported,
    speak,
    stop,
    getVoicesForLanguage
  };
};