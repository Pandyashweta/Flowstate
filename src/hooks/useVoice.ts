import { useCallback, useEffect, useRef, useState } from 'react';
import { apiPostFormData, apiPostJson } from '../lib/api';

export const SUPPORTED_VOICE_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'ja-JP', label: '日本語' },
];

export const GEMINI_TTS_VOICES = [
  { id: 'Kore', label: 'Kore (Clear)' },
  { id: 'Puck', label: 'Puck (Upbeat)' },
  { id: 'Charon', label: 'Charon (Deep)' },
  { id: 'Fenrir', label: 'Fenrir (Direct)' },
  { id: 'Zephyr', label: 'Zephyr (Calm)' },
] as const;

export type GeminiTtsVoice = (typeof GEMINI_TTS_VOICES)[number]['id'];

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

function getFileExtensionForMime(mimeType: string): string {
  const clean = mimeType.split(';')[0].toLowerCase();
  if (clean.includes('mp4') || clean.includes('m4a')) return 'm4a';
  if (clean.includes('ogg')) return 'ogg';
  if (clean.includes('wav')) return 'wav';
  if (clean.includes('mpeg') || clean.includes('mp3')) return 'mp3';
  return 'webm';
}

export function useVoice(defaultLang = 'en-US') {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSynthesizingSpeech, setIsSynthesizingSpeech] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [language, setLanguage] = useState(defaultLang);
  const [ttsVoice, setTtsVoice] = useState<GeminiTtsVoice>('Kore');
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const onFinalCallbackRef = useRef<((text: string) => void) | null>(null);
  const cancelRecordingRef = useRef<boolean>(false);

  // AudioContext visualizer refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // Active TTS playback refs
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsRequestSeqRef = useRef<number>(0);

  const isMediaRecorderSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined';

  const isTtsSupported = typeof window !== 'undefined';

  const cleanupVisualizer = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    analyserRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setAudioLevel(0);
    setRecordingSeconds(0);
  }, []);

  const releaseMediaStream = useCallback(() => {
    cleanupVisualizer();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, [cleanupVisualizer]);

  const stopSpeaking = useCallback(() => {
    ttsRequestSeqRef.current += 1;
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current.src = '';
      } catch {
        // ignore
      }
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setIsSynthesizingSpeech(false);
    setIsSpeaking(false);
  }, []);

  const speakWithBrowserFallback = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = 1.02;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeaking(false);
      }
    },
    [language]
  );

  // Neural TTS powered by Gemini 3.8 Flash-Lite TTS (WAV playback across all domains/browsers)
  const speak = useCallback(
    async (text: string) => {
      const clean = text.replace(/[*_`#]+/g, '').trim();
      if (!clean) return;
      stopSpeaking();

      const seq = ttsRequestSeqRef.current;
      setIsSynthesizingSpeech(true);

      try {
        const res = await apiPostJson<{ audioBase64: string; mimeType: string }>('/api/ai/tts', {
          text: clean.slice(0, 1100),
          voiceName: ttsVoice,
        });

        if (seq !== ttsRequestSeqRef.current) return;

        if (!res.audioBase64) {
          setIsSynthesizingSpeech(false);
          speakWithBrowserFallback(clean);
          return;
        }

        const audio = new Audio(`data:${res.mimeType || 'audio/wav'};base64,${res.audioBase64}`);
        activeAudioRef.current = audio;

        audio.onplay = () => {
          if (seq === ttsRequestSeqRef.current) {
            setIsSynthesizingSpeech(false);
            setIsSpeaking(true);
          }
        };
        audio.onended = () => {
          if (seq === ttsRequestSeqRef.current) {
            setIsSpeaking(false);
            activeAudioRef.current = null;
          }
        };
        audio.onerror = () => {
          if (seq === ttsRequestSeqRef.current) {
            setIsSynthesizingSpeech(false);
            setIsSpeaking(false);
            activeAudioRef.current = null;
          }
        };

        await audio.play();
      } catch {
        if (seq !== ttsRequestSeqRef.current) return;
        setIsSynthesizingSpeech(false);
        speakWithBrowserFallback(clean);
      }
    },
    [stopSpeaking, ttsVoice, speakWithBrowserFallback]
  );

  const transcribeAudioBlob = useCallback(
    async (audioBlob: Blob, resolvedMime: string, onFinalTranscript?: (finalText: string) => void) => {
      setIsTranscribing(true);
      setInterimTranscript('Transcribing with Gemini 3.5 Transcribe...');
      setVoiceError(null);

      try {
        const ext = getFileExtensionForMime(resolvedMime);
        const formData = new FormData();
        formData.append('audio', audioBlob, `voice-command.${ext}`);
        formData.append('mimeType', resolvedMime);
        formData.append('language', language);

        const res = await apiPostFormData<{ transcript: string }>('/api/ai/transcribe', formData);
        const text = (res.transcript || '').trim();
        setInterimTranscript('');

        if (!text) {
          setVoiceError('No clear speech detected in the audio. Try speaking closer to the microphone.');
          return '';
        }

        setTranscript(text);
        if (onFinalTranscript) {
          onFinalTranscript(text);
        }
        return text;
      } catch (err) {
        setInterimTranscript('');
        const msg = err instanceof Error ? err.message : 'Failed to transcribe audio.';
        setVoiceError(msg);
        return '';
      } finally {
        setIsTranscribing(false);
      }
    },
    [language]
  );

  const transcribeAudioFile = useCallback(
    async (file: File, onFinalTranscript?: (finalText: string) => void) => {
      setVoiceError(null);
      stopSpeaking();
      const mime = file.type || 'audio/mp3';
      return transcribeAudioBlob(file, mime, onFinalTranscript);
    },
    [stopSpeaking, transcribeAudioBlob]
  );

  const stopListening = useCallback(() => {
    cancelRecordingRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const cancelListening = useCallback(() => {
    cancelRecordingRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    releaseMediaStream();
    setIsListening(false);
    setInterimTranscript('');
    setVoiceError(null);
  }, [releaseMediaStream]);

  const startListening = useCallback(
    async (onFinalTranscript?: (finalText: string) => void) => {
      setVoiceError(null);
      stopSpeaking();

      if (!isMediaRecorderSupported) {
        setVoiceError(
          'Microphone capture is not supported in this browser. Upload an audio clip or type your command below.'
        );
        return;
      }

      onFinalCallbackRef.current = onFinalTranscript || null;
      cancelRecordingRef.current = false;
      setTranscript('');
      setInterimTranscript('Recording... click Stop & Send when finished.');
      audioChunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;

        // Live microphone volume meter via Web Audio API
        try {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioCtx();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          audioCtxRef.current = ctx;
          analyserRef.current = analyser;

          const dataArr = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteTimeDomainData(dataArr);
            let sum = 0;
            for (let i = 0; i < dataArr.length; i++) {
              const norm = (dataArr[i] - 128) / 128;
              sum += norm * norm;
            }
            const rms = Math.sqrt(sum / dataArr.length);
            setAudioLevel(Math.min(1, rms * 4.5));
            rafRef.current = window.requestAnimationFrame(tick);
          };
          tick();
        } catch {
          // Non-critical if AudioContext is restricted
        }

        const startedAt = Date.now();
        setRecordingSeconds(0);
        timerRef.current = window.setInterval(() => {
          setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000));
        }, 500);

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
          const wasCancelled = cancelRecordingRef.current;
          const chunks = audioChunksRef.current;
          audioChunksRef.current = [];

          if (wasCancelled || chunks.length === 0) {
            setInterimTranscript('');
            return;
          }

          const resolvedMime = recorder.mimeType || mimeType || 'audio/webm';
          const audioBlob = new Blob(chunks, { type: resolvedMime });

          if (audioBlob.size < 600) {
            setInterimTranscript('');
            setVoiceError('Recording was too short. Tap the mic, speak clearly, then click Stop & Send.');
            return;
          }

          await transcribeAudioBlob(audioBlob, resolvedMime, onFinalCallbackRef.current || undefined);
        };

        recorder.start(250);
        setIsListening(true);
      } catch (err) {
        releaseMediaStream();
        setInterimTranscript('');
        setIsListening(false);
        const msg = err instanceof Error ? err.message : '';
        if (msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('notallowed')) {
          setVoiceError(
            'Microphone access was denied. Please allow microphone permission in your browser or upload an audio clip.'
          );
        } else {
          setVoiceError(
            'Could not access microphone. Check your audio device permissions or upload an audio clip.'
          );
        }
      }
    },
    [isMediaRecorderSupported, releaseMediaStream, stopSpeaking, transcribeAudioBlob]
  );

  useEffect(() => {
    return () => {
      cancelRecordingRef.current = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      releaseMediaStream();
      stopSpeaking();
    };
  }, [releaseMediaStream, stopSpeaking]);

  return {
    isListening,
    isTranscribing,
    isSynthesizingSpeech,
    isSpeaking,
    audioLevel,
    recordingSeconds,
    transcript,
    interimTranscript,
    voiceError,
    language,
    setLanguage,
    ttsVoice,
    setTtsVoice,
    isSttSupported: isMediaRecorderSupported,
    isTtsSupported,
    startListening,
    stopListening,
    cancelListening,
    transcribeAudioFile,
    speak,
    stopSpeaking,
    clearVoiceError: () => setVoiceError(null),
  };
}
