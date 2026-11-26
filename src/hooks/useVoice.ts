import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export const SUPPORTED_VOICE_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'ja-JP', label: '日本語' },
];

export function useVoice(defaultLang = 'en-US') {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [language, setLanguage] = useState(defaultLang);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onFinalCallbackRef = useRef<((text: string) => void) | null>(null);

  const isSttSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor })
          .webkitSpeechRecognition
    );

  const isTtsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isTtsSupported || !text.trim()) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 1.02;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [isTtsSupported, language]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop errors when already stopped
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (onFinalTranscript?: (finalText: string) => void) => {
      setVoiceError(null);
      // Interrupt AI speech immediately when user starts speaking
      stopSpeaking();

      if (!isSttSupported) {
        setVoiceError(
          'Browser Speech Recognition is unavailable in this browser. Type your command below or try Chrome/Edge.'
        );
        return;
      }

      const Ctor =
        (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor })
          .webkitSpeechRecognition;
      if (!Ctor) return;

      onFinalCallbackRef.current = onFinalTranscript || null;
      setTranscript('');
      setInterimTranscript('');

      const recognition = new Ctor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;

      let accumulatedFinal = '';

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            accumulatedFinal += (accumulatedFinal ? ' ' : '') + piece.trim();
          } else {
            interim += piece;
          }
        }
        setTranscript(accumulatedFinal);
        setInterimTranscript(interim);
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          setVoiceError(
            'Microphone access was denied. Allow microphone permissions in your browser settings to use voice commands.'
          );
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech detected. Click the microphone and speak clearly.');
        } else if (event.error !== 'aborted') {
          setVoiceError(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        const finalCombined = accumulatedFinal.trim();
        if (finalCombined && onFinalCallbackRef.current) {
          onFinalCallbackRef.current(finalCombined);
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        setVoiceError(err instanceof Error ? err.message : 'Unable to start microphone.');
        setIsListening(false);
      }
    },
    [isSttSupported, language, stopSpeaking]
  );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    voiceError,
    language,
    setLanguage,
    isSttSupported,
    isTtsSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearVoiceError: () => setVoiceError(null),
  };
}
