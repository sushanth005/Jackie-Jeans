import type { Metadata } from 'next';
import QuizEngine from '@/components/quiz/QuizEngine';

export const metadata: Metadata = {
  title: 'Fit Quiz — Jackie Jeans',
  description: 'Answer 10 questions to find your perfect pair of jeans.',
};

export default function QuizPage() {
  return <QuizEngine />;
}
