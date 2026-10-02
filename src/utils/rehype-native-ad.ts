import { AD_LABEL, AD_POLICY, AD_UNIT_CLASS, ADS_ENABLED } from '../config/ads.ts';

// Coloca o container do Native no meio do artigo, em build.
//
// A inserção só acontece ENTRE filhos diretos da raiz do Markdown, então nunca
// cai dentro de parágrafo, lista, tabela, citação, imagem ou título. Ordem de
// preferência, sempre pelo ponto mais próximo de AD_POLICY.nativeTarget:
//   1. logo antes de um H2 dentro da faixa ideal (fim de uma seção);
//   2. logo antes de um H2 dentro da faixa tolerada;
//   3. qualquer quebra entre blocos na faixa de blocos.
// Sem ponto válido, o artigo fica sem Native — não se força posição ruim.

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

interface VFileLike {
  data?: { astro?: { frontmatter?: Record<string, unknown> } };
}

const HEADING = /^h[1-6]$/;
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  if (node.type === 'raw') return (node.value ?? '').replace(/<[^>]*>/g, ' ');
  return (node.children ?? []).map(textOf).join(' ');
}

function countWords(text: string) {
  return (text.match(/\S+/g) ?? []).length;
}

// HTML cru no Markdown pode abrir uma tag num bloco e fechar em outro. Enquanto
// o saldo não volta a zero, a quebra está dentro desse HTML e não serve.
function rawTagBalance(html: string) {
  let balance = 0;

  for (const match of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<(\/)?([a-zA-Z][\w-]*)[^>]*?(\/)?>/g)) {
    const [, closing, tagName, selfClosing] = match;
    if (selfClosing || VOID_TAGS.has(tagName.toLowerCase())) continue;
    balance += closing ? -1 : 1;
  }

  return balance;
}

function nativeAdNode(): HastNode {
  return {
    type: 'element',
    tagName: 'aside',
    properties: {
      className: ['ad-container', `ad-container--${AD_UNIT_CLASS.native}`],
      dataAdUnit: 'native',
      ariaLabel: AD_LABEL,
    },
    children: [
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['ad-label'], ariaHidden: 'true' },
        children: [{ type: 'text', value: AD_LABEL }],
      },
      { type: 'element', tagName: 'div', properties: { className: ['ad-frame'] }, children: [] },
    ],
  };
}

function inRange(value: number, range: readonly [number, number]) {
  return value >= range[0] && value <= range[1];
}

export function rehypeNativeAd() {
  return (tree: HastNode, file: VFileLike) => {
    if (!ADS_ENABLED) return;
    if (file.data?.astro?.frontmatter?.ads === false) return;

    const children = tree.children ?? [];
    const blocks = children
      .map((node, index) => ({ node, index, words: countWords(textOf(node)) }))
      .filter(({ node }) => node.type === 'element' || node.type === 'raw');
    const totalWords = blocks.reduce((sum, block) => sum + block.words, 0);

    if (totalWords < AD_POLICY.nativeMinWords) return;

    const candidates: { index: number; fraction: number; beforeH2: boolean }[] = [];
    let wordsBefore = 0;
    let rawBalance = 0;

    for (let position = 0; position < blocks.length; position++) {
      const block = blocks[position];
      const previous = blocks[position - 1]?.node;

      // A partir da FAQ não entra anúncio: é a seção que vira schema e resposta.
      if (block.node.tagName === 'h2' && /^perguntas frequentes$/i.test(textOf(block.node).trim())) break;

      const afterHeading = Boolean(previous?.tagName && HEADING.test(previous.tagName));
      // "Veja a lista:" seguido da lista é um bloco só para quem lê.
      const afterLeadIn = previous?.tagName === 'p' && /:\s*$/.test(textOf(previous));

      if (previous && rawBalance === 0 && !afterHeading && !afterLeadIn) {
        candidates.push({
          index: block.index,
          fraction: wordsBefore / totalWords,
          beforeH2: block.node.tagName === 'h2',
        });
      }

      wordsBefore += block.words;
      if (block.node.type === 'raw') rawBalance += rawTagBalance(block.node.value ?? '');
    }

    const closest = (list: typeof candidates) =>
      list.sort(
        (a, b) =>
          Math.abs(a.fraction - AD_POLICY.nativeTarget) - Math.abs(b.fraction - AD_POLICY.nativeTarget)
      )[0];

    const chosen =
      closest(candidates.filter((c) => c.beforeH2 && inRange(c.fraction, AD_POLICY.nativeIdealRange))) ??
      closest(candidates.filter((c) => c.beforeH2 && inRange(c.fraction, AD_POLICY.nativeH2Range))) ??
      closest(candidates.filter((c) => inRange(c.fraction, AD_POLICY.nativeBlockRange)));

    if (!chosen) return;

    children.splice(chosen.index, 0, nativeAdNode());
  };
}
