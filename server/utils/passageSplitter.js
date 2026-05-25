export function splitIntoPassages(text = '') {
  const cleaned = String(text || '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!cleaned) return [];

  const headingPattern = /(?:^|\n)\s*(?:Passage|PASSAGE)\s*(\d+)\s*[:.-]?\s*/g;
  const matches = [...cleaned.matchAll(headingPattern)];
  if (matches.length > 1) {
    return matches.map((match, index) => {
      const start = match.index + match[0].length;
      const end = matches[index + 1]?.index ?? cleaned.length;
      return cleaned.slice(start, end).trim();
    }).filter(Boolean);
  }

  const paragraphs = cleaned.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const passages = [];
  let current = '';
  for (const paragraph of paragraphs.length ? paragraphs : [cleaned]) {
    if ((current + '\n\n' + paragraph).trim().length <= 1200) {
      current = (current + '\n\n' + paragraph).trim();
    } else {
      if (current) passages.push(current);
      if (paragraph.length > 1200) {
        for (let i = 0; i < paragraph.length; i += 1000) {
          passages.push(paragraph.slice(i, i + 1000).trim());
        }
        current = '';
      } else {
        current = paragraph;
      }
    }
  }
  if (current) passages.push(current);
  return passages.filter(Boolean);
}
