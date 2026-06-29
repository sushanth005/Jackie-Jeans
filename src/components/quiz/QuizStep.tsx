'use client';

import { useEffect, useRef } from 'react';
import { QuizQuestion } from '@/lib/quizConfig';
import DropdownInput from './inputs/DropdownInput';
import NumberInput from './inputs/NumberInput';
import OptionCards from './inputs/OptionCards';
import BrandSelector from './inputs/BrandSelector';
import BrandSizes from './inputs/BrandSizes';
import styles from './QuizStep.module.css';

interface QuizStepProps {
  question: QuizQuestion;
  value: unknown;
  direction: 'forward' | 'back';
  selectedBrands?: string[];
  onChange: (value: unknown) => void;
  onSkip?: () => void;
}

export default function QuizStep({
  question,
  value,
  direction,
  selectedBrands,
  onChange,
  onSkip,
}: QuizStepProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to top on step change
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
  }, [question.id]);

  return (
    <div
      ref={containerRef}
      className={`${styles.step} ${direction === 'back' ? styles.fromLeft : styles.fromRight}`}
    >
      <div className={styles.inner}>
        {/* Question number + text */}
        <div className={styles.questionHeader}>
          <span className={styles.questionNum}>
            {String(question.number).padStart(2, '0')}
          </span>
          <h2 className={styles.questionText}>{question.text}</h2>
          {question.helperText && (
            <p className={styles.helperText}>{question.helperText}</p>
          )}
        </div>

        {/* Input component */}
        <div className={styles.inputArea}>
          {question.type === 'dropdown' && (
            <DropdownInput
              options={question.options ?? []}
              value={value as string}
              unit={question.unit}
              onChange={onChange}
            />
          )}

          {question.type === 'number' && (
            <NumberInput
              value={value as string}
              unit={question.unit ?? 'lbs'}
              onChange={onChange}
              onSkip={onSkip}
              optional={question.optional}
            />
          )}

          {question.type === 'single-select' && (
            <OptionCards
              options={question.options ?? []}
              value={value as string}
              onChange={onChange}
            />
          )}

          {question.type === 'multi-select' && (
            <BrandSelector
              options={question.options ?? []}
              value={(value as string[]) ?? []}
              onChange={onChange}
            />
          )}

          {question.type === 'brand-sizes' && (
            <BrandSizes
              brands={selectedBrands ?? []}
              value={(value as Record<string, string>) ?? {}}
              onChange={onChange}
            />
          )}
        </div>

        {/* Skip button for optional */}
        {question.optional && onSkip && (
          <button
            className={styles.skipBtn}
            onClick={onSkip}
            id={`quiz-skip-${question.id}`}
          >
            {question.skipLabel ?? 'Skip this question'}
          </button>
        )}
      </div>
    </div>
  );
}
