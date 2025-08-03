import { useState, useRef, useCallback, useEffect } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Function to detect if we're on iOS
const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Function to detect if we're on iOS Chrome
const isIOSChrome = () => {
  return isIOSDevice() && /CriOS/.test(navigator.userAgent);
};

// Function to detect if we're on iOS Safari
const isIOSSafari = () => {
  return isIOSDevice() && /Safari/.test(navigator.userAgent) && !/CriOS/.test(navigator.userAgent);
};

// Function to get browser-specific error message
const getBrowserSpecificMessage = () => {
  if (isIOSChrome()) {
    return 'Voice input is not supported in Chrome on iOS. Please use Safari for voice features.';
  }
  if (isIOSSafari()) {
    return 'Voice input may have limited support on iOS Safari. Please allow microphone permissions when prompted.';
  }
  if (isIOSDevice()) {
    return 'Voice input may not work properly on this iOS browser. Try using Safari instead.';
  }
  return 'Speech recognition is not supported in this browser.';
};

export const useSpeechRecognition = (language: string = 'en') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      // Check for specific iOS Chrome case (completely unsupported)
      if (isIOSChrome()) {
        setIsSupported(false);
        setError(getBrowserSpecificMessage());
        return;
      }
      
      setIsSupported(!!SpeechRecognition);
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language;

        recognitionRef.current.onresult = (event: any) => {
          console.log('🎤 Speech onresult event:', {
            resultIndex: event.resultIndex,
            resultsLength: event.results.length,
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
          });

          let interimTranscript = '';
          let newFinalTranscript = '';

          // Process only the new results since the last event
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const isFinal = event.results[i].isFinal;
            
            console.log(`🎤 Result ${i}:`, {
              transcript,
              isFinal,
              confidence: event.results[i][0].confidence
            });

            if (isFinal) {
              newFinalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(interimTranscript);
          
          // Only set final transcript if we have new final results
          if (newFinalTranscript.trim()) {
            console.log('🎤 Setting final transcript:', newFinalTranscript.trim());
            setFinalTranscript(newFinalTranscript.trim());
          }
        };

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          
          let errorMessage = '';
          switch (event.error) {
            case 'not-allowed':
              errorMessage = isIOSDevice() 
                ? getBrowserSpecificMessage()
                : 'Microphone access denied. Please allow microphone permissions.';
              break;
            case 'service-not-allowed':
              errorMessage = getBrowserSpecificMessage();
              break;
            case 'network':
              errorMessage = 'Network error. Please check your internet connection.';
              break;
            case 'no-speech':
              errorMessage = 'No speech detected. Please try again.';
              break;
            default:
              errorMessage = isIOSDevice() 
                ? getBrowserSpecificMessage()
                : `Speech recognition error: ${event.error}`;
          }
          
          setError(errorMessage);
          setIsListening(false);
        };
      }
    }
  }, [language]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setFinalTranscript('');
      setError(null);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    finalTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  };
};