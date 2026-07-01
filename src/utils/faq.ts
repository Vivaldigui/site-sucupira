export interface FaqItem {
  question: string;
  answer: string;
}

function toPlainText(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_`>#]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractFaqItems(markdown: string): FaqItem[] {
  const heading = /^##\s+Perguntas frequentes\s*$/im.exec(markdown);

  if (!heading) return [];

  const contentAfterHeading = markdown.slice(heading.index + heading[0].length);
  const nextSection = contentAfterHeading.search(/^##\s+|^---\s*$/m);
  const faqSection = nextSection >= 0
    ? contentAfterHeading.slice(0, nextSection)
    : contentAfterHeading;

  const items: FaqItem[] = [];
  let currentQuestion = '';
  let answerLines: string[] = [];

  const flush = () => {
    const answer = toPlainText(answerLines.join(' '));
    if (currentQuestion && answer) {
      items.push({ question: currentQuestion, answer });
    }
  };

  for (const rawLine of faqSection.split(/\r?\n/)) {
    const question = rawLine.trim().match(/^\*\*(.+?\?)\*\*$/);

    if (question) {
      flush();
      currentQuestion = toPlainText(question[1]);
      answerLines = [];
      continue;
    }

    if (currentQuestion && rawLine.trim()) answerLines.push(rawLine.trim());
  }

  flush();
  return items;
}
