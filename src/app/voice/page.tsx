'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TranscriptBubble, { Message } from '@/components/voice/TranscriptBubble';
import FitOverview from '@/components/quiz/FitOverview';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  requestMicrophonePermission,
  speak,
  startListening,
  cancelSpeech,
  startVolumeTracking,
  stopVolumeTracking,
  pauseFor
} from '@/lib/speechUtils';
import { QUIZ_QUESTIONS, QuizQuestion } from '@/lib/quizConfig';
import { saveFitProfile } from '@/lib/fitProfile';
import styles from './VoicePage.module.css';

type QuizAnswers = Record<string, unknown>;
type VoicePhase = 'permission' | 'intro' | 'quiz' | 'complete' | 'error';

const SYSTEM_PROMPT = `You are Jackie, a warm AI fit assistant for Jackie Jeans.
Parse the user's spoken answer and respond with a short confirmation (1 sentence).
Return ONLY valid JSON: { "parsed": <extracted value or null>, "reply": "<short confirmation>" }`;

const INTRO_MESSAGE = "Hi! I'm Jackie, your fit assistant. I'll ask a few quick questions to find your perfect jeans. Ready? Let's go!";

function getActiveQuestions(answers: QuizAnswers): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter((q) => {
    if (q.dependsOn === 'brands') {
      const brands = answers['brands'] as string[] | undefined;
      return brands && brands.length > 0;
    }
    return true;
  });
}

let msgIdCounter = 0;
function newMsgId() { return `msg-${++msgIdCounter}`; }

async function callGroq(userText: string, question: QuizQuestion): Promise<{ parsed: unknown; reply: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('/api/groq-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Question: "${question.voicePrompt}"\nUser said: "${userText}"\nType: ${question.type}${question.options ? `\nOptions: ${question.options.join(', ')}` : ''}\nReturn JSON only.`,
        }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const match = (data.content as string).match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { parsed: null, reply: data.content || '' };
  } catch (err) {
    console.warn("Groq API failed or timed out, falling back to local parse:", err);
    return { parsed: null, reply: '' };
  }
}

function wordToNumber(w: string): string {
  const map: Record<string, string> = { 'zero':'0', 'one':'1', 'two':'2', 'three':'3', 'four':'4', 'five':'5', 'six':'6', 'seven':'7', 'eight':'8', 'nine':'9', 'ten':'10', 'eleven':'11', 'twelve':'12' };
  return map[w.toLowerCase()] || w;
}

function localParse(question: QuizQuestion, transcript: string): unknown {
  const t = transcript.toLowerCase().trim();

  if (question.id === 'height') {
    const m = t.match(/(?:5|five|6|six|4|four)\s*(?:foot|feet|'|ft)?\s*(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)?/i);
    if (m) {
      const feetWord = m[0].match(/^(four|4|five|5|six|6)/i)?.[0] ?? '5';
      const feetNum = feetWord === 'four' ? '4' : feetWord === 'six' ? '6' : '5';
      const inches = m[1] ? wordToNumber(m[1]) : '0';
      return `${feetNum}'${inches}"`;
    }
  }

  if (question.id === 'waist' || question.id === 'hip') {
    const m = t.match(/(\d{2})/);
    if (m) return `${m[1]}"`;
  }

  if (question.type === 'number') {
    const skip = t.includes('skip') || t.includes('prefer not');
    if (skip) return 'skip';
    const m = t.match(/\d+/);
    return m ? m[0] : null;
  }

  if ((question.type === 'dropdown' || question.type === 'single-select') && question.options) {
    // Try case-insensitive substring match first
    const found = question.options.find(o => t.includes(o.toLowerCase()));
    if (found) return found;
    // Fuzzy: try partial word match (must be >2 chars to avoid 'a', 'in', etc.)
    return question.options.find(o =>
      o.toLowerCase().split(' ').some(word => word.length > 2 && t.includes(word))
    ) ?? null;
  }

  if (question.type === 'multi-select' && question.options) {
    const found = question.options.filter(o =>
      t.includes(o.toLowerCase()) ||
      o.toLowerCase().split(' ').some(word => word.length > 2 && t.includes(word))
    );
    return found.length > 0 ? found : null;
  }

  return null;
}

export default function VoicePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<VoicePhase>('permission');
  const [orbState, setOrbState] = useState<'idle' | 'speaking' | 'listening' | 'processing' | 'done'>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [reaskCount, setReaskCount] = useState(0);

  const isMounted = useRef(true);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const isRequestingMic = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Use a ref to track orbState inside async callbacks (avoids stale closure)
  const orbStateRef = useRef(orbState);
  const answersRef = useRef(answers);
  const reaskCountRef = useRef(reaskCount);

  // Keep refs in sync
  useEffect(() => { orbStateRef.current = orbState; }, [orbState]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { reaskCountRef.current = reaskCount; }, [reaskCount]);

  useEffect(() => () => {
    isMounted.current = false;
    cancelSpeech();
    stopListeningRef.current?.();
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    stopVolumeTracking();
  }, []);

  function addMsg(role: 'ai' | 'user', text: string) {
    setMessages(prev => [...prev, { id: newMsgId(), role, text }]);
  }

  // ─── Permission ───────────────────────────────────────────────────────────

  async function handlePermission() {
    if (isRequestingMic.current) return;
    isRequestingMic.current = true;

    if (!isSpeechRecognitionSupported()) {
      setErrorMsg('Voice recognition not supported. Please use Chrome or Edge.');
      setPhase('error');
      isRequestingMic.current = false;
      return;
    }
    if (!isSpeechSynthesisSupported()) {
      setErrorMsg('Speech synthesis not supported. Please use Chrome or Edge.');
      setPhase('error');
      isRequestingMic.current = false;
      return;
    }

    const granted = await requestMicrophonePermission();
    if (!granted) {
      setErrorMsg('Microphone access denied. Click the lock icon in the address bar, allow microphone, and reload.');
      setPhase('error');
      isRequestingMic.current = false;
      return;
    }

    setPhase('intro');
    setOrbState('speaking');
    addMsg('ai', INTRO_MESSAGE);
    try { await speak(INTRO_MESSAGE); } catch { /* speak errors are non-fatal */ }
    if (isMounted.current) {
      setPhase('quiz');
      askQuestion(0, {});
    }
    isRequestingMic.current = false;
  }

  // ─── Silence timer ────────────────────────────────────────────────────────

  function clearSilenceTimer() {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }

  function setSilenceTimer(idx: number, cur: QuizAnswers, q: QuizQuestion) {
    clearSilenceTimer();
    silenceTimeoutRef.current = setTimeout(async () => {
      if (!isMounted.current) return;
      // Only fire if we're still in listening state (use ref to avoid stale closure)
      if (orbStateRef.current !== 'listening') return;
      stopListeningRef.current?.();
      stopVolumeTracking();
      const count = reaskCountRef.current;
      setOrbState('speaking');
      const msgs = ["Still there? Take your time.", "Still listening — go ahead whenever you're ready."];
      const msg = msgs[Math.min(count, msgs.length - 1)];
      addMsg('ai', msg);
      try { await speak(msg); } catch {}
      if (isMounted.current) listenForAnswer(idx, cur, q);
    }, 6000);
  }

  // ─── Question flow ────────────────────────────────────────────────────────

  const askQuestion = useCallback(async (idx: number, cur: QuizAnswers) => {
    if (!isMounted.current) return;
    const active = getActiveQuestions(cur);
    if (idx >= active.length) { handleComplete(cur); return; }
    const q = active[idx];

    if (q.type === 'brand-sizes') {
      const brands = (cur['brands'] as string[]) ?? [];
      const sizes = (cur['brandSizes'] as Record<string, string>) ?? {};
      const bi = Object.keys(sizes).length;
      if (bi >= brands.length) { askQuestion(idx + 1, cur); return; }
      const brand = brands[bi];
      const prompt = `What size did you usually wear in ${brand}?`;
      setOrbState('speaking'); addMsg('ai', prompt);
      try { await speak(prompt); } catch {}
      if (isMounted.current) listenForBrandSize(idx, cur, brand, brands);
      return;
    }

    setStepIndex(idx);
    setReaskCount(0);
    reaskCountRef.current = 0;
    setOrbState('speaking');
    addMsg('ai', q.voicePrompt);
    try { await speak(q.voicePrompt); } catch {}
    if (isMounted.current) listenForAnswer(idx, cur, q);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function listenForAnswer(idx: number, cur: QuizAnswers, q: QuizQuestion) {
    if (!isMounted.current) return;
    setOrbState('listening');
    setLiveTranscript('');
    startVolumeTracking();
    setSilenceTimer(idx, cur, q);

    const cleanup = startListening(
      async (transcript, isFinal) => {
        if (!isMounted.current) return;
        setLiveTranscript(transcript);
        // Reset silence timer on any speech activity
        if (!isFinal) {
          setSilenceTimer(idx, cur, q);
        } else {
          clearSilenceTimer();
          stopVolumeTracking();
          stopListeningRef.current = null;
          setLiveTranscript('');
          await processAnswer(idx, cur, q, transcript);
        }
      },
      (err) => {
        if (!isMounted.current) return;
        // 'aborted' errors are intentional (we called stop/abort) — ignore them
        if (!err) return;
        clearSilenceTimer();
        stopVolumeTracking();
        setOrbState('idle');
        // Auto-retry on no-speech
        if (err.includes('No speech')) {
          reask(idx, cur, q);
        }
      }
    );

    stopListeningRef.current = () => {
      cleanup();
      stopVolumeTracking();
      clearSilenceTimer();
    };
  }

  async function processAnswer(idx: number, cur: QuizAnswers, q: QuizQuestion, transcript: string) {
    if (!isMounted.current) return;
    setOrbState('processing');
    addMsg('user', transcript);

    // Handle optional skip
    const tLow = transcript.toLowerCase();
    if (q.optional && (tLow.includes('skip') || tLow.includes('prefer not') || tLow.includes('no thanks'))) {
      const msg = `No problem, moving on.`;
      setOrbState('speaking'); addMsg('ai', msg);
      try { await speak(msg); } catch {}
      if (isMounted.current) askQuestion(idx + 1, cur);
      return;
    }

    const groq = await callGroq(transcript, q);
    if (!isMounted.current) return;

    let parsed = (groq.parsed !== null && groq.parsed !== undefined) ? groq.parsed : localParse(q, transcript);
    const reply = groq.reply || (parsed ? `Got it — ${Array.isArray(parsed) ? (parsed as string[]).join(', ') : String(parsed)}.` : '');

    if (parsed === null || parsed === undefined || (Array.isArray(parsed) && (parsed as unknown[]).length === 0)) {
      reask(idx, cur, q);
      return;
    }

    const next = { ...cur, [q.id]: parsed };
    setAnswers(next);
    answersRef.current = next;
    setOrbState('speaking');
    addMsg('ai', reply);
    try {
      const interrupted = await speak(reply);
      if (!interrupted) await pauseFor(400);
    } catch {}
    if (isMounted.current) askQuestion(idx + 1, next);
  }

  function reask(idx: number, cur: QuizAnswers, q: QuizQuestion) {
    if (!isMounted.current) return;
    const n = reaskCountRef.current + 1;
    setReaskCount(n);
    reaskCountRef.current = n;

    if (n >= 3) {
      const msg = q.optional ? "No problem, I'll skip that one." : "Let's keep going — I'll come back to that.";
      setOrbState('speaking'); addMsg('ai', msg);
      speak(msg).then(async (interrupted) => {
        if (!interrupted) await pauseFor(400);
        if (isMounted.current) askQuestion(idx + 1, cur);
      }).catch(() => {
        if (isMounted.current) askQuestion(idx + 1, cur);
      });
      return;
    }

    const msgs = [
      `Sorry, I didn't catch that. Could you say it again?`,
      `Almost got it — could you repeat your answer?`,
      `One more time — speak clearly and I'll get it.`
    ];
    const msg = msgs[Math.min(n - 1, msgs.length - 1)];
    setOrbState('speaking'); addMsg('ai', msg);
    speak(msg).then(() => {
      if (isMounted.current) listenForAnswer(idx, cur, q);
    }).catch(() => {
      if (isMounted.current) listenForAnswer(idx, cur, q);
    });
  }

  function listenForBrandSize(idx: number, cur: QuizAnswers, brand: string, brands: string[]) {
    if (!isMounted.current) return;
    setOrbState('listening');
    setLiveTranscript('');
    startVolumeTracking();

    const cleanup = startListening(
      async (t, isFinal) => {
        if (!isMounted.current) return;
        setLiveTranscript(t);
        if (isFinal) {
          stopVolumeTracking();
          setLiveTranscript('');
          await processBrandSize(idx, cur, brand, brands, t);
        }
      },
      (err) => {
        if (!isMounted.current || !err) return;
        stopVolumeTracking();
        setOrbState('idle');
      }
    );
    stopListeningRef.current = () => {
      cleanup();
      stopVolumeTracking();
    };
  }

  async function processBrandSize(idx: number, cur: QuizAnswers, brand: string, brands: string[], transcript: string) {
    if (!isMounted.current) return;
    setOrbState('processing'); addMsg('user', transcript);
    const m = transcript.match(/\b(\d{2}|xs|s\b|m\b|l\b|xl|xxl|small|medium|large|extra\s*small|extra\s*large)\b/i);
    let size = m ? m[1].toUpperCase().replace(/\s+/g, '') : null;
    if (size) {
      if (size === 'SMALL') size = 'S';
      else if (size === 'MEDIUM') size = 'M';
      else if (size === 'LARGE') size = 'L';
      else if (size === 'EXTRASMALL') size = 'XS';
      else if (size === 'EXTRALARGE') size = 'XL';
    }
    if (!size) {
      const msg = `What size in ${brand}? Say a number like 28 or 30, or small, medium, large.`;
      setOrbState('speaking'); addMsg('ai', msg);
      try { await speak(msg); } catch {}
      if (isMounted.current) listenForBrandSize(idx, cur, brand, brands);
      return;
    }
    const sizes = { ...((cur['brandSizes'] as Record<string, string>) ?? {}), [brand]: size };
    const next = { ...cur, brandSizes: sizes };
    setAnswers(next);
    answersRef.current = next;
    const nextIdx = Object.keys(sizes).length;
    if (nextIdx < brands.length) {
      const nextBrand = brands[nextIdx];
      const msg = `Got it — ${brand}: ${size}. And ${nextBrand}?`;
      setOrbState('speaking'); addMsg('ai', msg);
      try { await speak(msg); } catch {}
      if (isMounted.current) listenForBrandSize(idx, next, nextBrand, brands);
    } else {
      const msg = `Perfect, got all your sizes!`;
      setOrbState('speaking'); addMsg('ai', msg);
      try { await speak(msg); } catch {}
      if (isMounted.current) askQuestion(idx + 1, next);
    }
  }

  async function handleComplete(final: QuizAnswers) {
    if (!isMounted.current) return;
    setOrbState('done'); setPhase('complete');
    const msg = "Perfect! I have everything I need to find your best fit. Redirecting you now.";
    addMsg('ai', msg);
    try { await speak(msg); } catch {}
    saveFitProfile({
      height: (final['height'] as string) ?? '',
      weight: final['weight'] as string | undefined,
      waist: (final['waist'] as string) ?? '',
      hip: (final['hip'] as string) ?? '',
      waistFit: (final['waistFit'] as string) ?? '',
      rise: (final['rise'] as string) ?? '',
      thighFit: (final['thighFit'] as string) ?? '',
      brands: (final['brands'] as string[]) ?? [],
      brandSizes: (final['brandSizes'] as Record<string, string>) ?? {},
      frustration: (final['frustration'] as string) ?? '',
      completedVia: 'voice',
      completedAt: new Date().toISOString(),
    });
    setTimeout(() => { if (isMounted.current) router.push('/voice/complete'); }, 2500);
  }

  function handleManualSwitch() {
    cancelSpeech();
    stopListeningRef.current?.();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('voiceAnswersFallback', JSON.stringify(answers));
    }
    router.push('/quiz');
  }

  async function handleBackNav(e: React.MouseEvent) {
    e.preventDefault();
    cancelSpeech();
    stopListeningRef.current?.();
    clearSilenceTimer();
    if (stepIndex > 0 && phase === 'quiz') {
      const prevIdx = stepIndex - 1;
      const msg = "Sure, let's go back.";
      setOrbState('speaking'); addMsg('ai', msg);
      try { await speak(msg); } catch {}
      if (isMounted.current) askQuestion(prevIdx, answers);
    } else {
      router.push('/');
    }
  }

  function handleMicClick() {
    if (phase === 'permission') { handlePermission(); return; }
    if (orbState === 'speaking') {
      cancelSpeech();
      return;
    }
    if (orbState === 'listening') {
      stopListeningRef.current?.();
      setOrbState('idle');
      return;
    }
    if (orbState === 'idle' && phase === 'quiz') {
      const active = getActiveQuestions(answers);
      const q = active[stepIndex];
      if (q) listenForAnswer(stepIndex, answers, q);
    }
  }

  const currentQ = getActiveQuestions(answers)[stepIndex];

  // ─── Render ───────────────────────────────────────────────────────────────

  if (phase === 'error') {
    return (
      <div className={styles.errorPage}>
      <div className={styles.errorContent}>
          <div className={styles.errorIcon}>🎙️</div>
          <h1>Mic Access Needed</h1>
          <p>{errorMsg}</p>
          <Link href="/quiz" className="btn btn-primary">Use Manual Quiz</Link>
          <button className="btn btn-ghost" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.bgGlow} ${orbState === 'listening' ? styles.bgGlowCyan : ''}`} aria-hidden="true" />

      {/* Sub-nav bar */}
      <div className={styles.subNav}>
        <div className={styles.subNavLeft}>
          <a href="/" className={styles.backBtn} aria-label="Back" onClick={handleBackNav}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </a>
          <span className={styles.subNavTitle}>
            {phase === 'quiz' ? `Question ${stepIndex + 1} of ${QUIZ_QUESTIONS.length}` : 'AI Voice Quiz'}
          </span>
        </div>
        <Link href="/quiz" className={styles.switchBtn}>Manual quiz →</Link>
      </div>

      {/* Main split layout: Fit Profile | Voice Interface */}
      <div className={styles.splitLayout}>

        {/* LEFT: Live Fit Overview */}
        <div className={styles.fitPanelWrap}>
          <FitOverview
            answers={answers}
            currentStep={stepIndex}
            totalSteps={QUIZ_QUESTIONS.length}
          />
        </div>

        {/* RIGHT: Voice Interface */}
        <div className={styles.voicePanel}>

          {/* Progress dots */}
          {phase === 'quiz' && (
            <div className={styles.progressRow}>
              {QUIZ_QUESTIONS.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.progDot} ${i < stepIndex ? styles.progDone : i === stepIndex ? styles.progActive : ''}`}
                />
              ))}
            </div>
          )}

          {/* Main voice section */}
          <div className={styles.main}>

            {/* Transcript bubbles */}
            {messages.length > 0 && (
              <div className={styles.transcriptWrap}>
                <TranscriptBubble messages={messages} currentTranscript={liveTranscript} />
              </div>
            )}

            {/* Current question card */}
            {phase === 'quiz' && currentQ && (
              <div className={styles.qCard}>
                <span className={styles.qNum}>{QUIZ_QUESTIONS.indexOf(currentQ) + 1} / {QUIZ_QUESTIONS.length}</span>
                <p className={styles.qText}>{currentQ.text}</p>
                {currentQ.helperText && <p className={styles.qHint}>{currentQ.helperText}</p>}
              </div>
            )}

            {/* ══════ MIC BUTTON ══════ */}
            <div className={styles.micSection}>

              {/* PERMISSION */}
              {phase === 'permission' && (
                <div className={styles.micStage}>
                  <button className={`${styles.micBtn} ${styles.micBtnIdle}`} onClick={handleMicClick} id="voice-mic-btn" aria-label="Start voice quiz">
                    <span className={styles.ring1} /><span className={styles.ring2} />
                    <span className={styles.micCore}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
                      </svg>
                    </span>
                  </button>
                  <p className={styles.micLabel}>Tap to start</p>
                  <p className={styles.micHint}>Jackie will guide you through {QUIZ_QUESTIONS.length} quick questions</p>
                </div>
              )}

              {/* PROCESSING */}
              {orbState === 'processing' && (
                <div className={styles.micStage}>
                  <div className={styles.spinWrap}><div className={styles.spinner} /></div>
                  <p className={styles.micLabel}>Processing...</p>
                </div>
              )}

              {/* MIC STAGE (Intro & Quiz) */}
              {(phase === 'intro' || phase === 'quiz') && orbState !== 'processing' && (
                <div className={styles.micStage}>
                  <button
                    className={`${styles.micBtn} ${
                      orbState === 'listening' ? styles.micBtnListening :
                      orbState === 'speaking'  ? styles.micBtnSpeaking  : styles.micBtnIdle
                    }`}
                    onClick={handleMicClick}
                    id="voice-mic-btn"
                    aria-label={orbState === 'listening' ? 'Stop listening' : orbState === 'speaking' ? 'Interrupt Jackie' : 'Tap to speak'}
                  >
                    {orbState === 'listening' && <><span className={`${styles.ring1} ${styles.ringPulse}`} /><span className={`${styles.ring2} ${styles.ringPulse}`} /></>}
                    {orbState === 'speaking'  && <><span className={`${styles.ring1} ${styles.ringSpeaking}`} /><span className={`${styles.ring2} ${styles.ringSpeaking}`} /></>}

                    <span className={styles.micCore}>
                      {orbState === 'speaking' ? (
                        /* Pause/interrupt icon when speaking */
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                        </svg>
                      ) : (
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                          <line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
                        </svg>
                      )}
                    </span>

                    {orbState === 'listening' && (
                      <span className={styles.waveRow} aria-hidden="true">
                        {[0,1,2,3,4].map(i => <span key={i} className={styles.waveBar} style={{ animationDelay: `${i * 0.11}s` }} />)}
                      </span>
                    )}
                  </button>

                  <p className={`${styles.micLabel} ${orbState === 'listening' ? styles.labelListen : orbState === 'speaking' ? styles.labelSpeak : ''}`}>
                    {orbState === 'idle'      && 'Tap the mic to answer'}
                    {orbState === 'listening' && 'Listening — tap to stop'}
                    {orbState === 'speaking'  && 'Jackie is speaking — tap to interrupt'}
                  </p>

                  {/* Live transcript preview */}
                  {orbState === 'listening' && liveTranscript && (
                    <div className={styles.liveHear}>
                      <span className={styles.liveDot} />
                      <span className={styles.liveText}>{liveTranscript}</span>
                    </div>
                  )}
                </div>
              )}

              {/* COMPLETE */}
              {phase === 'complete' && (
                <div className={styles.micStage}>
                  <div className={styles.doneCircle}>
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <p className={styles.micLabel}>✓ Fit Profile Complete</p>
                  <p className={styles.micHint}>Redirecting you to your results...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating manual switch */}
      <button className={styles.manualFloatingSwitch} onClick={handleManualSwitch}>
        ⌨ Continue Manually
      </button>

      {phase === 'permission' && <p className={styles.footHint}>Voice never stored or shared</p>}
    </div>
  );
}
