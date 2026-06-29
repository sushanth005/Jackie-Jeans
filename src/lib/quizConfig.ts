// Quiz configuration — single source of truth for all 10 Fit Quiz questions

export type QuestionType =
  | 'dropdown'
  | 'number'
  | 'single-select'
  | 'multi-select'
  | 'brand-sizes';

export interface QuizQuestion {
  id: string;
  number: number;
  text: string; // Display text
  voicePrompt: string; // Spoken by AI (more natural)
  voiceConfirmTemplate: string; // e.g., "Got it — {answer}."
  type: QuestionType;
  options?: string[];
  optional?: boolean;
  skipLabel?: string;
  dependsOn?: string; // question id this depends on
  helperText?: string;
  unit?: string;
}

// Height options: 4'10" to 6'2"
export const HEIGHT_OPTIONS: string[] = (() => {
  const opts: string[] = [];
  for (let feet = 4; feet <= 6; feet++) {
    const startInch = feet === 4 ? 10 : 0;
    const endInch = feet === 6 ? 2 : 11;
    for (let inch = startInch; inch <= endInch; inch++) {
      opts.push(`${feet}'${inch}"`);
    }
  }
  return opts;
})();

// Waist options: 24" to 52"
export const WAIST_OPTIONS: string[] = Array.from({ length: 29 }, (_, i) => `${24 + i}"`);

// Hip options: 32" to 60"
export const HIP_OPTIONS: string[] = Array.from({ length: 29 }, (_, i) => `${32 + i}"`);

// Denim brands
export const DENIM_BRANDS: string[] = [
  "Levi's",
  'Wrangler',
  'Gap',
  'American Eagle',
  'Abercrombie & Fitch',
  'Lucky Brand',
  '7 For All Mankind',
  'AG Jeans',
  'Paige',
  'Frame',
  'Good American',
  'Citizens of Humanity',
  'Madewell',
  "J.Crew",
  'Banana Republic',
  'Express',
  'Old Navy',
  'H&M',
  'Zara',
  'Everlane',
];

// Size options for brand sizes (Q9)
export const JEAN_SIZES: string[] = [
  '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36',
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'height',
    number: 1,
    text: "What is your height?",
    voicePrompt: "Let's start! What's your height?",
    voiceConfirmTemplate: "Perfect, {answer}.",
    type: 'dropdown',
    options: HEIGHT_OPTIONS,
    helperText: "We use this to find your ideal inseam length.",
  },
  {
    id: 'weight',
    number: 2,
    text: "What is your weight? (Optional)",
    voicePrompt:
      "What's your approximate weight? This helps me fine-tune your fit — but feel free to say skip if you'd prefer.",
    voiceConfirmTemplate: "Got it.",
    type: 'number',
    optional: true,
    skipLabel: 'Skip this question',
    unit: 'lbs',
    helperText: "Optional — skip if you prefer. Just helps calibrate your proportions.",
  },
  {
    id: 'waist',
    number: 3,
    text: "What is your waist measurement?",
    voicePrompt:
      "Now, what's your waist measurement in inches — measured at your narrowest point?",
    voiceConfirmTemplate: "Got it — {answer} waist.",
    type: 'dropdown',
    options: WAIST_OPTIONS,
    helperText: "Measure at the narrowest point of your torso.",
  },
  {
    id: 'hip',
    number: 4,
    text: "What is your hip measurement?",
    voicePrompt:
      "And your hip measurement in inches — measured at the fullest point?",
    voiceConfirmTemplate: "Noted — {answer} hips.",
    type: 'dropdown',
    options: HIP_OPTIONS,
    helperText: "Measure at the fullest part of your hips and seat.",
  },
  {
    id: 'waistFit',
    number: 5,
    text: "How do you like jeans to fit at the waist?",
    voicePrompt:
      "How do you prefer your jeans to fit at the waist — snug, slightly relaxed, or relaxed?",
    voiceConfirmTemplate: "Got it — {answer} at the waist.",
    type: 'single-select',
    options: ['Snug', 'Slightly relaxed', 'Relaxed'],
    helperText: "Your comfort preference, not just the measurement.",
  },
  {
    id: 'rise',
    number: 6,
    text: "Where should the waistband sit?",
    voicePrompt:
      "Where do you like the waistband to sit — high rise, mid rise, or low rise?",
    voiceConfirmTemplate: "Noted — {answer}.",
    type: 'single-select',
    options: ['High rise', 'Mid rise', 'Low rise'],
    helperText: "This narrows down the style that suits you best.",
  },
  {
    id: 'thighFit',
    number: 7,
    text: "How should jeans fit through the thighs?",
    voicePrompt:
      "How should jeans fit through your thighs — fitted, relaxed, or loose?",
    voiceConfirmTemplate: "Perfect — {answer} through the thighs.",
    type: 'single-select',
    options: ['Fitted', 'Relaxed', 'Loose'],
    helperText: "The second most common fit issue after the waist.",
  },
  {
    id: 'brands',
    number: 8,
    text: "Which denim brands have you worn before?",
    voicePrompt:
      "Which denim brands have you bought before? You can name a few — like Levi's, Gap, Madewell, and so on.",
    voiceConfirmTemplate: "Got it — {answer}.",
    type: 'multi-select',
    options: DENIM_BRANDS,
    helperText: "Select all that apply. This helps us calibrate against real sizing.",
  },
  {
    id: 'brandSizes',
    number: 9,
    text: "What size did you buy in those brands?",
    voicePrompt:
      "And what size did you usually buy in {brand}?",
    voiceConfirmTemplate: "Noted.",
    type: 'brand-sizes',
    dependsOn: 'brands',
    helperText: "Tell us the size per brand — this is our most accurate input.",
  },
  {
    id: 'frustration',
    number: 10,
    text: "What's your biggest fit frustration when buying jeans?",
    voicePrompt:
      "Last question! What's your biggest frustration when buying jeans — is it the waist gap, hip tightness, wrong length, thigh fit, the rise, or something else?",
    voiceConfirmTemplate: "Understood — {answer}. I've got everything I need!",
    type: 'single-select',
    options: ['Waist gap', 'Hip tightness', 'Wrong length', 'Thigh fit', 'Rise', 'Other'],
    helperText: "This personalizes how we explain your recommendation.",
  },
];

export const TOTAL_QUESTIONS = 10;

export function getQuestionById(id: string): QuizQuestion | undefined {
  return QUIZ_QUESTIONS.find((q) => q.id === id);
}
