import { compareText } from './compareText.js';
import { formatTime } from './formatTime.js';

function round2(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function calculateTypingResult({ originalText = '', typedText = '', durationSeconds = 1, backspaceCount = 0, keystrokes } = {}) {
  const safeDuration = Math.max(1, Number(durationSeconds) || 1);
  const totalKeystrokes = Number.isFinite(Number(keystrokes)) ? Number(keystrokes) : String(typedText || '').length;
  const totalWordsTyped = totalKeystrokes / 5;
  const minutes = safeDuration / 60;
  const comparison = compareText(originalText, typedText);
  const totalErrors = comparison.totalErrors;
  const grossWpm = totalWordsTyped / minutes;
  const netWpm = Math.max(0, (totalWordsTyped - totalErrors) / minutes);
  const accuracy = grossWpm > 0 ? (netWpm / grossWpm) * 100 : 0;
  const errorPercentage = totalWordsTyped > 0 ? (totalErrors / totalWordsTyped) * 100 : 0;
  const marks = Math.max(0, 20 - totalErrors / 4);

  return {
    totalKeystrokes,
    backspaceCount: Number(backspaceCount) || 0,
    totalWordsTyped: round2(totalWordsTyped),
    grossWpm: round2(grossWpm),
    netWpm: round2(netWpm),
    accuracy: round2(accuracy),
    errorPercentage: round2(errorPercentage),
    marks: round2(marks),
    qualified: netWpm >= 40 && marks >= 10,
    durationSeconds: safeDuration,
    durationFormatted: formatTime(safeDuration),
    errors: {
      additions: comparison.additions,
      omissions: comparison.omissions,
      spellingSubstitutionRepetition: comparison.spellingSubstitutionRepetition,
      incompleteWords: comparison.incompleteWords,
      spacing: comparison.spacing,
      capitalization: comparison.capitalization,
      punctuation: comparison.punctuation,
      transposition: comparison.transposition,
      paragraphic: comparison.paragraphic,
      tab: comparison.tab,
      fullErrors: comparison.fullErrors,
      halfErrors: comparison.halfErrors,
      totalErrors: comparison.totalErrors
    },
    highlightedOriginal: comparison.highlightedOriginal,
    highlightedTyped: comparison.highlightedTyped
  };
}
