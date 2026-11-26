import { useCallback, useEffect, useRef, useState } from 'react';
import { apiPostJson } from '../lib/api';

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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read recorded audio.'));
    reader.readAsDataURL(blob);
  });
}

function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export function useVoice(defaultLang = 'en-US') {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [language, setLanguage] = useState(defaultLang);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const onFinalCallbackRef = useRef<((text: string) => void) | null>(null);
  const preferMediaRecorderRef = useRef<boolean>(false);

  const isSttSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor })
          .webkitSpeechRecognition
    );

  const isMediaRecorderSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined';

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

  const releaseMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore stop errors when already stopped
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const startMediaRecording = useCallback(
    async (onFinalTranscript?: (finalText: string) => void) => {
      if (!isMediaRecorderSupported) {
        setVoiceError(
          'Microphone recording is not supported in this browser. Please type your command below.'
        );
        return;
      }

      onFinalCallbackRef.current = onFinalTranscript || null;
      setTranscript('');
      setInterimTranscript('Recording audio... Click Stop when finished.');
      audioChunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const mimeType = getSupportedAudioMimeType();
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          setIsListening(false);
          releaseMediaStream();
          const chunks = audioChunksRef.current;
          audioChunksRef.current = [];

          if (chunks.length === 0) {
            setInterimTranscript('');
            return;
          }

          const resolvedMime = recorder.mimeType || mimeType || 'audio/webm';
          const audioBlob = new Blob(chunks, { type: resolvedMime });

          if (audioBlob.size < 800) {
            setInterimTranscript('');
            setVoiceError('Recording was too short. Tap the mic, speak clearly, then tap Stop.');
            return;
          }

          setIsTranscribing(true);
          setInterimTranscript('Transcribing your voice command...');
          try {
            const audioBase64 = await blobToBase64(audioBlob);
            const res = await apiPostJson<{ transcript: string }>('/api/ai/transcribe', {
              audioBase64,
              mimeType: resolvedMime,
              language,
            });
            const text = (res.transcript || '').trim();
            setInterimTranscript('');
            if (!text) {
              setVoiceError('No speech detected in the recording. Please try again.');
              return;
            }
            setTranscript(text);
            if (onFinalCallbackRef.current) {
              onFinalCallbackRef.current(text);
            }
          } catch (err) {
            setInterimTranscript('');
            setVoiceError(
              err instanceof Error ? err.message : 'Failed to transcribe voice recording.'
            );
          } finally {
            setIsTranscribing(false);
          }
        };

        recorder.start();
        setIsListening(true);
      } catch (err) {
        releaseMediaStream();
        setInterimTranscript('');
        setIsListening(false);
        const msg = err instanceof Error ? err.message : '';
        if (msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('notallowed')) {
          setVoiceError(
            'Microphone access was denied. Allow microphone permissions in your browser settings.'
          );
        } else {
          setVoiceError('Could not access microphone. Check your audio input device and permissions.');
        }
      }
    },
    [isMediaRecorderSupported, language, releaseMediaStream]
  );

  const startListening = useCallback(
    (onFinalTranscript?: (finalText: string) => void) => {
      setVoiceError(null);
      stopSpeaking();

      const isBrave =
        typeof navigator !== 'undefined' &&
        Boolean((navigator as unknown as { brave?: unknown }).brave);

      // Brave blocks Google's Web Speech API servers; use MediaRecorder + Gemini transcription directly
      if (isBrave || preferMediaRecorderRef.current || !isSttSupported) {
        void startMediaRecording(onFinalTranscript);
        return;
      }

      const Ctor =
        (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor })
          .webkitSpeechRecognition;
      if (!Ctor) {
        void startMediaRecording(onFinalTranscript);
        return;
      }

      onFinalCallbackRef.current = onFinalTranscript || null;
      setTranscript('');
      setInterimTranscript('');

      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      let accumulatedFinal = '';
      let latestInterim = '';
      let fellBackToRecorder = false;

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
        latestInterim = interim.trim();
        setTranscript(accumulatedFinal);
        setInterimTranscript(interim);
      };

      recognition.onerror = (event) => {
        if (
          (event.error === 'network' || event.error === 'service-not-allowed') &&
          isMediaRecorderSupported
        ) {
          // Browser blocked Web Speech network service — seamlessly fall back to MediaRecorder
          fellBackToRecorder = true;
          preferMediaRecorderRef.current = true;
          try {
            recognition.abort();
          } catch {
            // ignore
          }
          void startMediaRecording(onFinalTranscript);
          return;
        }

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
        if (fellBackToRecorder) return;
        setIsListening(false);
        const finalCombined = [accumulatedFinal.trim(), latestInterim].filter(Boolean).join(' ').trim();
        setInterimTranscript('');
        if (finalCombined) {
          setTranscript(finalCombined);
          if (onFinalCallbackRef.current) {
            onFinalCallbackRef.current(finalCombined);
          }
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch {
        void startMediaRecording(onFinalTranscript);
      }
    },
    [isMediaRecorderSupported, isSttSupported, language, startMediaRecording, stopSpeaking]
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      releaseMediaStream();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [releaseMediaStream]);

  return {
    isListening,
    isTranscribing,
    isSpeaking,
    transcript,
    interimTranscript,
    voiceError,
    language,
    setLanguage,
    isSttSupported: isSttSupported || isMediaRecorderSupported,
    isTtsSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearVoiceError: () => setVoiceError(null),
  };
}
