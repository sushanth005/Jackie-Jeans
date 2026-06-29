'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QuizProgress from './QuizProgress';
import QuizStep from './QuizStep';
import FitOverview from './FitOverview';
import { QUIZ_QUESTIONS, QuizQuestion } from '@/lib/quizConfig';
import { FitProfile, saveFitProfile } from '@/lib/fitProfile';
import styles from './QuizEngine.module.css';

type QuizAnswers = Record<string, unknown>;

function getActiveQuestions(answers: QuizAnswers): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter((q) => {
    if (q.dependsOn === 'brands') {
      const brands = answers['brands'] as string[] | undefined;
      return brands && brands.length > 0;
    }
    return true;
  });
}

export default function QuizEngine() {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const activeQuestions = getActiveQuestions(answers);
  const currentQuestion = activeQuestions[stepIndex];
  const currentValue = answers[currentQuestion?.id ?? ''];
  const totalSteps = QUIZ_QUESTIONS.length;
  const isLast = stepIndex === activeQuestions.length - 1;

  const canContinue =
    currentQuestion?.optional ||
    currentQuestion?.type === 'brand-sizes' ||
    (currentValue !== undefined &&
      currentValue !== '' &&
      !(Array.isArray(currentValue) && (currentValue as unknown[]).length === 0));

  function handleAnswer(value: unknown) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  }

  const goNext = useCallback(() => {
    if (isTransitioning || !canContinue) return;
    if (isLast) { handleComplete(); return; }
    setIsTransitioning(true);
    setDirection('forward');
    setTimeout(() => { setStepIndex((i) => i + 1); setIsTransitioning(false); }, 180);
  }, [isTransitioning, canContinue, isLast]);

  function goBack() {
    if (isTransitioning || stepIndex === 0) return;
    setIsTransitioning(true);
    setDirection('back');
    setTimeout(() => { setStepIndex((i) => i - 1); setIsTransitioning(false); }, 180);
  }

  function handleComplete() {
    const profile: FitProfile = {
      height: (answers['height'] as string) ?? '',
      weight: answers['weight'] as string | undefined,
      waist: (answers['waist'] as string) ?? '',
      hip: (answers['hip'] as string) ?? '',
      waistFit: (answers['waistFit'] as string) ?? '',
      rise: (answers['rise'] as string) ?? '',
      thighFit: (answers['thighFit'] as string) ?? '',
      brands: (answers['brands'] as string[]) ?? [],
      brandSizes: (answers['brandSizes'] as Record<string, string>) ?? {},
      frustration: (answers['frustration'] as string) ?? '',
      completedVia: 'manual',
      completedAt: new Date().toISOString(),
    };
    saveFitProfile(profile);
    router.push('/quiz/complete');
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') goNext();
      if (e.key === 'ArrowLeft') goBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext]);

  if (!currentQuestion) return null;

  return (
    <div className={styles.shell}>
      {/* Animated background is in layout.tsx globally */}

      {/* ── Progress bar below global nav ── */}
      <div className={styles.topBar}>
        <button
          className={styles.backBtn}
          onClick={goBack}
          disabled={stepIndex === 0}
          aria-label="Previous question"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className={styles.topCenter}>
          <QuizProgress current={stepIndex} total={totalSteps} />
        </div>
        <span className={styles.stepCount}>{stepIndex + 1}/{totalSteps}</span>
      </div>
      {/* ── Split layout: overview | card ── */}
      <div className={styles.splitLayout}>

        {/* LEFT: Live Fit Overview */}
        <FitOverview
          answers={answers}
          currentStep={stepIndex}
          totalSteps={totalSteps}
        />

        {/* RIGHT: Centered quiz card */}
        <div className={styles.cardOuter}>
          <div className={styles.card}>
            {/* Card header: back + progress step */}
            <div className={styles.cardHeader}>
              <button
                className={styles.backBtn}
                onClick={goBack}
                disabled={stepIndex === 0}
                aria-label="Previous"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <span className={styles.stepPill}>{stepIndex + 1} / {totalSteps}</span>
            </div>

            {/* Question */}
            <div className={styles.cardBody} style={{ overflow: 'hidden' }}>
              <div key={stepIndex} className="animate-slideUp" style={{ animationDuration: '0.4s' }}>
                <QuizStep
                  question={currentQuestion}
                  value={currentValue}
                  onChange={handleAnswer}
                  direction={direction}
                  selectedBrands={answers['brands'] as string[] | undefined}
                />
              </div>
            </div>

            {/* Footer */}
            <div className={styles.cardFooter}>
              {currentQuestion.optional && (
                <button className={styles.skipBtn} onClick={goNext}>Skip</button>
              )}
              <button
                className={`${styles.nextBtn} ${!canContinue ? styles.nextBtnDisabled : ''}`}
                onClick={goNext}
                disabled={!canContinue}
                id="quiz-next-btn"
              >
                {isLast ? 'Get My Fit →' : 'Continue'}
                {!isLast && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
