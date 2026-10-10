import { SALES_SITE_URL } from '../consts.ts';
import {
  STORE_AD_POLICY,
  STORE_FIRST_MENTION,
  allowsMiddleAd,
  storeAdCreative,
  storeAdHtml,
} from '../config/store-ads.ts';

// Duas coisas, em build, no corpo de cada artigo:
//
// 1. Card da loja no meio do texto (o lugar que era do Native da Adsterra).
//    A inserção só acontece ENTRE filhos diretos da raiz do Markdown, então nunca
//    cai dentro de parágrafo, lista, tabela, citação, imagem ou título. Ordem de
//    preferência, sempre pelo ponto mais próximo de STORE_AD_POLICY.middleTarget:
//      1. logo antes de um H2 dentro da faixa ideal (fim de uma seção);
//      2. logo antes de um H2 dentro da faixa tolerada;
//      3. qualquer quebra entre blocos na faixa de blocos.
//    Sem ponto válido, o artigo fica sem card no meio — não se força posição ruim.
//
// 2. A primeira menção a "Sucupira Naturale" num parágrafo ou item de lista vira
//    link para o produto, se o corpo ainda não tiver nenhum link para a loja.
//
// `ads: false` no frontmatter desliga as duas.

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

interface VFileLike {
  path?: string;
  history?: string[];
  data?: { astro?: { frontmatter?: Record<string, unknown> } };
}

const HEADING = /^h[1-6]$/;
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const STORE_HOST = new URL(SALES_SITE_URL).hostname.replace(/^www\./, '');

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

function inRange(value: number, range: readonly [number, number]) {
  return value >= range[0] && value <= range[1];
}

function slugOf(file: VFileLike) {
  const path = file.path ?? file.history?.[file.history.length - 1] ?? '';
  return path.replace(/\\/g, '/').split('/').pop()?.replace(/\.mdx?$/, '') ?? '';
}

function isStoreHref(href: unknown) {
  if (typeof href !== 'string') return false;
  try {
    return new URL(href).hostname.replace(/^www\./, '') === STORE_HOST;
  } catch {
    return false;
  }
}

function hasStoreLink(node: HastNode): boolean {
  if (node.type === 'element' && node.tagName === 'a' && isStoreHref(node.properties?.href)) return true;
  if (node.type === 'raw' && /href="https?:\/\/(?:www\.)?sucupiranaturale\.com\.br/i.test(node.value ?? '')) return true;
  return (node.children ?? []).some(hasStoreLink);
}

// Procura a primeira menção dentro de <p> ou <li>, fora de link e de título.
function linkFirstMention(tree: HastNode) {
  const needle = STORE_FIRST_MENTION.text;
  let done = false;

  const visit = (node: HastNode, insideBlock: boolean) => {
    if (done || !node.children) return;
    if (node.type === 'element' && (node.tagName === 'a' || HEADING.test(node.tagName ?? ''))) return;
    const blockHere = insideBlock || (node.type === 'element' && (node.tagName === 'p' || node.tagName === 'li'));

    for (let i = 0; i < node.children.length && !done; i++) {
      const child = node.children[i];
      if (blockHere && child.type === 'text' && child.value?.includes(needle)) {
        const at = child.value.indexOf(needle);
        const before = child.value.slice(0, at);
        const after = child.value.slice(at + needle.length);
        const link: HastNode = {
          type: 'element',
          tagName: 'a',
          properties: { href: STORE_FIRST_MENTION.url, dataCriativo: STORE_FIRST_MENTION.id, dataPosicao: "primeira-mencao", dataSnCta: "primeira-mencao" },
          children: [{ type: 'text', value: needle }],
        };
        const replacement = [before && { type: 'text', value: before }, link, after && { type: 'text', value: after }].filter(
          Boolean
        ) as HastNode[];
        node.children.splice(i, 1, ...replacement);
        done = true;
        return;
      }
      visit(child, blockHere);
    }
  };

  visit(tree, false);
}

export function rehypeStoreAd() {
  return (tree: HastNode, file: VFileLike) => {
    if (file.data?.astro?.frontmatter?.ads === false) return;
    const slug = slugOf(file);
    if (!slug) return;

    if (!hasStoreLink(tree)) linkFirstMention(tree);

    if (!allowsMiddleAd(slug)) return;

    const children = tree.children ?? [];
    const blocks = children
      .map((node, index) => ({ node, index, words: countWords(textOf(node)) }))
      .filter(({ node }) => node.type === 'element' || node.type === 'raw');
    const totalWords = blocks.reduce((sum, block) => sum + block.words, 0);

    if (totalWords < STORE_AD_POLICY.middleMinWords) return;

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
          Math.abs(a.fraction - STORE_AD_POLICY.middleTarget) - Math.abs(b.fraction - STORE_AD_POLICY.middleTarget)
      )[0];

    const chosen =
      closest(candidates.filter((c) => c.beforeH2 && inRange(c.fraction, STORE_AD_POLICY.middleIdealRange))) ??
      closest(candidates.filter((c) => c.beforeH2 && inRange(c.fraction, STORE_AD_POLICY.middleH2Range))) ??
      closest(candidates.filter((c) => inRange(c.fraction, STORE_AD_POLICY.middleBlockRange)));

    if (!chosen) return;

    children.splice(chosen.index, 0, { type: 'raw', value: storeAdHtml(storeAdCreative(slug), 'anuncio-meio') });
  };
}
