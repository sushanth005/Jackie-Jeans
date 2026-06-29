// Voice engine — smart answer parser that maps spoken text to valid quiz options

import Fuse from 'fuse.js';
import {
  DENIM_BRANDS,
  HEIGHT_OPTIONS,
  HIP_OPTIONS,
  JEAN_SIZES,
  WAIST_OPTIONS,
} from './quizConfig';

export interface ParsedAnswer {
  value: string | string[] | Record<string, string> | undefined;
  confidence: 'high' | 'medium' | 'low';
  displayValue: string;
  isSkip?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SKIP_PHRASES = ['skip', 'pass', 'no thanks', 'prefer not', 'rather not', 'next'];

function isSkipIntent(transcript: string): boolean {
  const lower = transcript.toLowerCase().trim();
  return SKIP_PHRASES.some((phrase) => lower.includes(phrase));
}

/**
 * Extract a number from a spoken string.
 * e.g., "about 28", "thirty", "28 inches" → 28
 */
const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  'twenty-one': 21, 'twenty one': 21, 'twenty-two': 22, 'twenty two': 22,
  'twenty-three': 23, 'twenty three': 23, 'twenty-four': 24, 'twenty four': 24,
  'twenty-five': 25, 'twenty five': 25, 'twenty-six': 26, 'twenty six': 26,
  'twenty-seven': 27, 'twenty seven': 27, 'twenty-eight': 28, 'twenty eight': 28,
  'twenty-nine': 29, 'twenty nine': 29, thirty: 30,
  'thirty-one': 31, 'thirty one': 31, 'thirty-two': 32, 'thirty two': 32,
  'thirty-three': 33, 'thirty three': 33, 'thirty-four': 34, 'thirty four': 34,
  'thirty-five': 35, 'thirty five': 35, 'thirty-six': 36, 'thirty six': 36,
  forty: 40, fifty: 50, sixty: 60,
};

function extractNumber(text: string): number | null {
  const lower = text.toLowerCase().replace(/[^\w\s-]/g, '');

  // Try word numbers (longest match first)
  const sortedWords = Object.keys(WORD_NUMBERS).sort((a, b) => b.length - a.length);
  for (const word of sortedWords) {
    if (lower.includes(word)) return WORD_NUMBERS[word];
  }

  // Try numeric digits
  const match = lower.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);

  return null;
}

// ─── Height Parser ──────────────────────────────────────────────────────────

/**
 * Parse spoken height like "five six", "5 foot 6", "five feet six inches", "5'6"
 */
function parseHeight(transcript: string): string | null {
  const lower = transcript.toLowerCase().replace(/['"]/g, '');

  const feetWords: Record<string, number> = {
    four: 4, five: 5, six: 6, '4': 4, '5': 5, '6': 6,
  };
  const inchWords: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
    '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12,
  };

  // Pattern: "5 foot 6" / "five foot six" / "five feet six"
  const feetInchPattern =
    /(\w+)\s*(?:foot|feet|ft|'|')?\s*(?:and\s*)?(\w+)\s*(?:inch(?:es)?|"|in)?/i;
  const match = lower.match(feetInchPattern);

  if (match) {
    const feetVal = feetWords[match[1].toLowerCase()];
    const inchVal = inchWords[match[2].toLowerCase()];
    if (feetVal !== undefined && inchVal !== undefined) {
      const candidate = `${feetVal}'${inchVal}"`;
      if (HEIGHT_OPTIONS.includes(candidate)) return candidate;
    }
  }

  // Direct number match like "5'6"
  const directMatch = transcript.match(/(\d)'(\d{1,2})/);
  if (directMatch) {
    const candidate = `${directMatch[1]}'${directMatch[2]}"`;
    if (HEIGHT_OPTIONS.includes(candidate)) return candidate;
  }

  return null;
}

// ─── Measurement Parser ──────────────────────────────────────────────────────

function parseMeasurement(transcript: string, options: string[]): string | null {
  const num = extractNumber(transcript);
  if (num !== null) {
    const candidate = `${num}"`;
    if (options.includes(candidate)) return candidate;
    // Find closest
    const numericOptions = options.map((o) => parseInt(o));
    const closest = numericOptions.reduce((prev, curr) =>
      Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev
    );
    if (Math.abs(closest - num) <= 2) return `${closest}"`;
  }
  return null;
}

// ─── Single-Select Parser ────────────────────────────────────────────────────

function parseSingleSelect(transcript: string, options: string[]): string | null {
  const lower = transcript.toLowerCase();

  // Exact or partial match
  const exact = options.find((opt) => lower.includes(opt.toLowerCase()));
  if (exact) return exact;

  // Fuzzy match
  const fuse = new Fuse(options, { threshold: 0.4 });
  const results = fuse.search(transcript);
  if (results.length > 0) return results[0].item;

  return null;
}

// ─── Weight Parser ───────────────────────────────────────────────────────────

function parseWeight(transcript: string): string | null {
  const num = extractNumber(transcript);
  if (num !== null && num >= 70 && num <= 400) return `${num}`;
  return null;
}

// ─── Brand Parser ────────────────────────────────────────────────────────────

const brandFuse = new Fuse(DENIM_BRANDS, { threshold: 0.35 });

function parseBrands(transcript: string): string[] {
  const lower = transcript.toLowerCase();
  const found = new Set<string>();

  // Direct matches
  for (const brand of DENIM_BRANDS) {
    if (lower.includes(brand.toLowerCase())) {
      found.add(brand);
    }
  }

  // Fuzzy matches on words/phrases
  const words = lower.split(/[\s,&]+/).filter(Boolean);
  for (const word of words) {
    const results = brandFuse.search(word);
    if (results.length > 0 && results[0].score! < 0.3) {
      found.add(results[0].item);
    }
  }

  // Handle "and" separated list
  const parts = lower.split(/,|\band\b/);
  for (const part of parts) {
    const trimmed = part.trim();
    const results = brandFuse.search(trimmed);
    if (results.length > 0 && results[0].score! < 0.35) {
      found.add(results[0].item);
    }
  }

  return Array.from(found);
}

// ─── Size Parser ─────────────────────────────────────────────────────────────

function parseSize(transcript: string): string | null {
  const lower = transcript.toLowerCase().trim();

  // Word sizes
  const wordSizes: Record<string, string> = {
    'extra small': 'XS', 'xtra small': 'XS', xs: 'XS',
    small: 'S', 's': 'S',
    medium: 'M', 'm': 'M',
    large: 'L', 'l': 'L',
    'extra large': 'XL', xl: 'XL',
    'double xl': 'XXL', xxl: 'XXL',
  };

  for (const [word, size] of Object.entries(wordSizes)) {
    if (lower.includes(word)) return size;
  }

  // Numeric size
  const num = extractNumber(lower);
  if (num !== null) {
    const candidate = String(num);
    if (JEAN_SIZES.includes(candidate)) return candidate;
  }

  // Direct match
  const direct = JEAN_SIZES.find((s) => lower.includes(s.toLowerCase()));
  if (direct) return direct;

  return null;
}

// ─── Main Parser ─────────────────────────────────────────────────────────────

export type QuestionId =
  | 'height' | 'weight' | 'waist' | 'hip'
  | 'waistFit' | 'rise' | 'thighFit'
  | 'brands' | 'brandSizes' | 'frustration';

export function parseAnswer(
  questionId: QuestionId,
  transcript: string,
  context?: {
    selectedBrands?: string[];
    currentBrand?: string;
  }
): ParsedAnswer {
  const trimmed = transcript.trim();

  // Check for skip intent on optional questions
  if (questionId === 'weight' && isSkipIntent(trimmed)) {
    return { value: undefined, confidence: 'high', displayValue: 'Skipped', isSkip: true };
  }

  switch (questionId) {
    case 'height': {
      const parsed = parseHeight(trimmed);
      if (parsed) return { value: parsed, confidence: 'high', displayValue: parsed };
      return { value: undefined, confidence: 'low', displayValue: '' };
    }

    case 'weight': {
      const parsed = parseWeight(trimmed);
      if (parsed) return { value: parsed, confidence: 'high', displayValue: `${parsed} lbs` };
      return { value: undefined, confidence: 'low', displayValue: '' };
    }

    case 'waist': {
      const parsed = parseMeasurement(trimmed, WAIST_OPTIONS);
      if (parsed) return { value: parsed, confidence: 'high', displayValue: parsed };
      return { value: undefined, confidence: 'low', displayValue: '' };
    }

    case 'hip': {
      const parsed = parseMeasurement(trimmed, HIP_OPTIONS);
      if (parsed) return { value: parsed, confidence: 'high', displayValue: parsed };
      return { value: undefined, confidence: 'low', displayValue: '' };
    }

    case 'waistFit': {
      const opts = ['Snug', 'Slightly relaxed', 'Relaxed'];
      const parsed = parseSingleSelect(trimmed, opts);
      if (parsed) return { value: parsed, confidence: 'high', displayValue: parsed };
      return { value: undefined, confidence: 'low', displayValue: '' };
    }

    case 'rise': {
      const opts = ['High rise', 'Mid rise', 'Low rise'];
      const parsed = parseSingleSelect(trimmed, opts);
      if (parsed) return { value: parsed, confidence: 'high', displayValue: parsed };
      return { value: undefined, confidence: 'low', displayValue: '' };
    }

    case 'thighFit': {
      const opts = ['Fitted', 'Relaxed', 'Loose'];
      const parsed = parseSingleSelect(trimmed, opts);
      if (parsed) return { value: parsed, confidence: 'high', displayValue: parsed };
      return { value: undefined, confidence: 'low', displayValue: '' };
    }

    case 'brands': {
      const parsed = parseBrands(trimmed);
      if (parsed.length > 0) {
        return {
          value: parsed,
          confidence: 'high',
          displayValue: parsed.join(', '),
        };
      }
      return { value: [], confidence: 'low', displayValue: '' };
    }

    case 'brandSizes': {
      const parsed = parseSize(trimmed);
      if (parsed && context?.currentBrand) {
        return { value: parsed, confidence: 'high', displayValue: parsed };
      }
      return { value: undefined, confidence: 'low', displayValue: '' };
    }

    case 'frustration': {
      const opts = ['Waist gap', 'Hip tightness', 'Wrong length', 'Thigh fit', 'Rise', 'Other'];
      const parsed = parseSingleSelect(trimmed, opts);
      if (parsed) return { value: parsed, confidence: 'high', displayValue: parsed };
      return { value: undefined, confidence: 'low', displayValue: '' };
    }

    default:
      return { value: undefined, confidence: 'low', displayValue: '' };
  }
}

/**
 * Build the AI confirmation message after receiving an answer
 */
export function buildConfirmation(
  questionId: QuestionId,
  template: string,
  answer: ParsedAnswer
): string {
  if (answer.isSkip) return "No problem, I'll skip that.";
  return template.replace('{answer}', answer.displayValue);
}

/**
 * Build a re-ask message when the answer couldn't be understood
 */
export function buildReaskMessage(questionId: QuestionId): string {
  const reasks: Partial<Record<QuestionId, string>> = {
    height: "I didn't catch that — could you tell me your height again? For example, five foot six.",
    weight: "Could you say your weight in pounds? Or say skip to move on.",
    waist: "What's your waist measurement in inches? For example, 28 inches.",
    hip: "What's your hip measurement in inches? For example, 38 inches.",
    waistFit: "Do you prefer your jeans to fit snug, slightly relaxed, or relaxed?",
    rise: "Where do you like the waistband — high rise, mid rise, or low rise?",
    thighFit: "Should the jeans be fitted, relaxed, or loose through the thighs?",
    brands: "Which denim brands have you worn? You can name a few like Levi's, Gap, or Madewell.",
    brandSizes: "What size did you usually buy? You can say a number like 28, or small, medium, and so on.",
    frustration: "What's your biggest fit frustration — waist gap, hip tightness, wrong length, thigh fit, the rise, or something else?",
  };

  return reasks[questionId] ?? "Sorry, could you repeat that?";
}
