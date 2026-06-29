// Web Speech API wrappers — typed, safe, with fallback detection

export type SpeechRecognitionStatus = 'idle' | 'listening' | 'processing' | 'error';
export type SpeechSynthesisStatus = 'idle' | 'speaking';

/**
 * Check if the browser supports Speech Recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

/**
 * Check if the browser supports Speech Synthesis
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let recognitionInstance: SpeechRecognition | null = null;

/**
 * Start speech recognition. Returns a cleanup function.
 */
export function startListening(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  language: string = 'en-US'
): () => void {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser.');
    return () => {};
  }

  // Cancel any existing session
  if (recognitionInstance) {
    try { recognitionInstance.abort(); } catch {}
    recognitionInstance = null;
  }

  const SpeechRecognitionClass =
    (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition })
      .webkitSpeechRecognition || window.SpeechRecognition;

  const recognition = new SpeechRecognitionClass();
  recognitionInstance = recognition;

  recognition.lang = language;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      onResult(finalTranscript.trim(), true);
    } else if (interimTranscript) {
      onResult(interimTranscript.trim(), false);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'Microphone not available. Check your device settings.',
      'not-allowed': 'Microphone access was denied. Please allow access and try again.',
      'network': 'Network error occurred. Please check your connection.',
      'aborted': '', // Intentional abort — no error needed
    };
    const msg = errorMessages[event.error] ?? `Speech error: ${event.error}`;
    if (msg) onError(msg);
    recognitionInstance = null;
  };

  recognition.onend = () => {
    recognitionInstance = null;
  };

  try {
    recognition.start();
  } catch (err) {
    onError(`Could not start microphone: ${err}`);
    recognitionInstance = null;
  }

  return () => {
    if (recognitionInstance) {
      try { recognitionInstance.abort(); } catch {}
      recognitionInstance = null;
    }
  };
}

/**
 * Stop listening early
 */
export function stopListening(): void {
  if (recognitionInstance) {
    try { recognitionInstance.stop(); } catch {}
    recognitionInstance = null;
  }
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Speak text using Web Speech Synthesis. Returns a promise that resolves when done.
 */
export function speak(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voiceName?: string;
  }
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisSupported()) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();
    currentUtterance = null;

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    utterance.rate = options?.rate ?? 1.25;
    utterance.pitch = options?.pitch ?? 1.05;
    utterance.volume = options?.volume ?? 1.0;
    utterance.lang = 'en-US';

    // Pick a good voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.name.includes('Victoria') ||
            v.name.includes('Google US English') ||
            v.name.includes('Microsoft Zira') ||
            v.name.includes('Female') ||
            v.default)
      );
      if (preferred) utterance.voice = preferred;
    }

    // Safety timeout: Chrome sometimes never fires onend
    const safetyTimeout = setTimeout(() => {
      currentUtterance = null;
      resolve(false);
    }, text.length * 100 + 3000); // Rough estimate: 100ms per char + 3s buffer

    utterance.onend = () => {
      clearTimeout(safetyTimeout);
      currentUtterance = null;
      resolve(false);
    };

    utterance.onerror = (e) => {
      clearTimeout(safetyTimeout);
      currentUtterance = null;
      if (e.error !== 'interrupted') {
        reject(new Error(`Speech synthesis error: ${e.error}`));
      } else {
        resolve(true); // interrupted is fine, return true
      }
    };

    // Chrome bug: voices may load async — retry with slight delay
    const attemptSpeak = () => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        reject(err);
      }
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = attemptSpeak;
    } else {
      attemptSpeak();
    }
  });
}

/**
 * Cancel any ongoing speech
 */
export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

/**
 * Request microphone permission explicitly (shows browser prompt)
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks immediately — we just needed the permission
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

// ─── Volume Tracking & Utils ────────────────────────────────────────────────

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let microphone: MediaStreamAudioSourceNode | null = null;
let volumeAnimationFrame = 0;
let micStream: MediaStream | null = null;

function updateVolume() {
  if (!analyser) return;
  const array = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(array);
  
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum += array[i];
  }
  const average = sum / array.length;
  // Map average (0-255) to a scale factor (1.0 to 1.8)
  const scale = 1.0 + (average / 255) * 0.8;
  
  document.documentElement.style.setProperty('--mic-volume', scale.toString());
  
  volumeAnimationFrame = requestAnimationFrame(updateVolume);
}

let isStartingVolume = false;

export async function startVolumeTracking() {
  if (micStream || isStartingVolume) return; // Already tracking or starting
  isStartingVolume = true;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0.5;
    analyser.fftSize = 64;
    microphone = audioContext.createMediaStreamSource(micStream);
    microphone.connect(analyser);
    updateVolume();
  } catch (err) {
    console.error("Volume tracking error", err);
  } finally {
    isStartingVolume = false;
  }
}

export function stopVolumeTracking() {
  if (volumeAnimationFrame) cancelAnimationFrame(volumeAnimationFrame);
  if (microphone) { microphone.disconnect(); microphone = null; }
  if (analyser) { analyser.disconnect(); analyser = null; }
  if (audioContext) { 
    audioContext.close().catch(() => {}); 
    audioContext = null; 
  }
  if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
  document.documentElement.style.setProperty('--mic-volume', '1');
}

export const pauseFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
