function tokenizeWords(text) {
  return String(text || '').match(/\S+/g) || [];
}

function stripPunctuation(word) {
  return word.replace(/[\p{P}\p{S}]/gu, '');
}

function punctuationOnlyDiff(a, b) {
  return stripPunctuation(a) === stripPunctuation(b) && a !== b;
}

function isTransposition(a, b) {
  if (a.length !== b.length || a === b) return false;
  const diffs = [];
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) diffs.push(i);
  }
  return diffs.length === 2 && diffs[1] === diffs[0] + 1 && a[diffs[0]] === b[diffs[1]] && a[diffs[1]] === b[diffs[0]];
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}


function typedWithCorrection(typedWord, originalWord, errorClass) {
  return `<span class="typed-correction"><mark class="${errorClass}">${escapeHtml(typedWord)}</mark><span class="expected-word">(${escapeHtml(originalWord)})</span></span>`;
}

function alignWords(originalWords, typedWords) {
  const rows = originalWords.length + 1;
  const cols = typedWords.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));
  const op = Array.from({ length: rows }, () => Array(cols).fill(''));

  for (let i = 1; i < rows; i += 1) {
    dp[i][0] = i;
    op[i][0] = 'delete';
  }
  for (let j = 1; j < cols; j += 1) {
    dp[0][j] = j;
    op[0][j] = 'insert';
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const same = originalWords[i - 1] === typedWords[j - 1];
      const substituteCost = same ? 0 : 1;
      const choices = [
        { cost: dp[i - 1][j - 1] + substituteCost, op: same ? 'equal' : 'replace' },
        { cost: dp[i - 1][j] + 1, op: 'delete' },
        { cost: dp[i][j - 1] + 1, op: 'insert' }
      ];
      choices.sort((a, b) => a.cost - b.cost);
      dp[i][j] = choices[0].cost;
      op[i][j] = choices[0].op;
    }
  }

  const aligned = [];
  let i = originalWords.length;
  let j = typedWords.length;
  while (i > 0 || j > 0) {
    const action = op[i][j] || (i > 0 ? 'delete' : 'insert');
    if (action === 'equal' || action === 'replace') {
      aligned.push({ type: action, original: originalWords[i - 1], typed: typedWords[j - 1] });
      i -= 1;
      j -= 1;
    } else if (action === 'delete') {
      aligned.push({ type: 'delete', original: originalWords[i - 1], typed: '' });
      i -= 1;
    } else {
      aligned.push({ type: 'insert', original: '', typed: typedWords[j - 1] });
      j -= 1;
    }
  }
  return aligned.reverse();
}

export function compareText(originalText = '', typedText = '') {
  const original = String(originalText || '').replace(/\r\n/g, '\n');
  const typed = String(typedText || '').replace(/\r\n/g, '\n');
  const originalWords = tokenizeWords(original);
  const typedWords = tokenizeWords(typed);
  const aligned = alignWords(originalWords, typedWords);

  const errors = {
    additions: 0,
    omissions: 0,
    spellingSubstitutionRepetition: 0,
    incompleteWords: 0,
    spacing: 0,
    capitalization: 0,
    punctuation: 0,
    transposition: 0,
    paragraphic: 0,
    tab: 0,
    fullErrors: 0,
    halfErrors: 0,
    totalErrors: 0
  };

  const originalParts = [];
  const typedParts = [];
  let previousTyped = '';

  for (const item of aligned) {
    if (item.type === 'equal') {
      originalParts.push(`<span class="correct-word">${escapeHtml(item.original)}</span>`);
      typedParts.push(`<span class="correct-word">${escapeHtml(item.typed)}</span>`);
    } else if (item.type === 'delete') {
      errors.omissions += 1;
      originalParts.push(`<mark class="err-omission">${escapeHtml(item.original)}</mark>`);
    } else if (item.type === 'insert') {
      errors.additions += 1;
      typedParts.push(`<mark class="err-addition">${escapeHtml(item.typed)}</mark>`);
    } else if (item.type === 'replace') {
      const lowerSame = item.original.toLowerCase() === item.typed.toLowerCase();
      if (lowerSame) {
        errors.capitalization += 1;
        originalParts.push(`<mark class="err-capitalization">${escapeHtml(item.original)}</mark>`);
        typedParts.push(typedWithCorrection(item.typed, item.original, 'err-capitalization'));
      } else if (punctuationOnlyDiff(item.original, item.typed)) {
        errors.punctuation += 1;
        originalParts.push(`<mark class="err-punctuation">${escapeHtml(item.original)}</mark>`);
        typedParts.push(typedWithCorrection(item.typed, item.original, 'err-punctuation'));
      } else if (isTransposition(item.original, item.typed)) {
        errors.transposition += 1;
        originalParts.push(`<mark class="err-transposition">${escapeHtml(item.original)}</mark>`);
        typedParts.push(typedWithCorrection(item.typed, item.original, 'err-transposition'));
      } else if (item.original.startsWith(item.typed) && item.typed.length < item.original.length) {
        errors.incompleteWords += 1;
        originalParts.push(`<mark class="err-full">${escapeHtml(item.original)}</mark>`);
        typedParts.push(typedWithCorrection(item.typed, item.original, 'err-full'));
      } else {
        errors.spellingSubstitutionRepetition += 1;
        originalParts.push(`<mark class="err-full">${escapeHtml(item.original)}</mark>`);
        typedParts.push(typedWithCorrection(item.typed, item.original, 'err-full'));
      }
    }

    if (item.typed && previousTyped && item.typed.toLowerCase() === previousTyped.toLowerCase()) {
      errors.spellingSubstitutionRepetition += 1;
    }
    if (item.typed) previousTyped = item.typed;
  }

  const originalSpaces = (original.match(/ +/g) || []).join('').length;
  const typedSpaces = (typed.match(/ +/g) || []).join('').length;
  errors.spacing = Math.abs(originalSpaces - typedSpaces);
  errors.paragraphic = Math.abs((original.match(/\n/g) || []).length - (typed.match(/\n/g) || []).length);
  errors.tab = (typed.match(/\t/g) || []).length;

  errors.fullErrors = errors.additions + errors.omissions + errors.spellingSubstitutionRepetition + errors.incompleteWords;
  errors.halfErrors = errors.spacing + errors.capitalization + errors.punctuation + errors.transposition + errors.paragraphic + errors.tab;
  errors.totalErrors = errors.fullErrors + errors.halfErrors;

  return {
    ...errors,
    highlightedOriginal: originalParts.join(' '),
    highlightedTyped: typedParts.join(' ')
  };
}
