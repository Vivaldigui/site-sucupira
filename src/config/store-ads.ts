// Anúncios da própria loja dentro do blog. Desde 08/10/2026 o blog não usa
// anúncio de terceiros (nem AdSense nem Adsterra): os espaços são da Sucupira
// Naturale. Tudo que decide O QUE aparece e ONDE mora aqui; componentes e o
// plugin rehype só leem.
//
// Estudo e critérios: sucupira-content-intelligence/planejamento/estudo-anuncios-da-loja-no-blog-2026-10-08.md
//
// Cada post pertence a um grupo pela dúvida de quem lê. O grupo decide a
// mensagem, a imagem e o destino na loja, como um anúncio contextual faria.
// Links sem UTM: blog e loja dividem o domínio raiz e o cookie do GA4, e UTM em
// link interno abriria uma sessão nova (knowledge/links-comerciais.md).

import { SALES_SITE_URL } from '../consts.ts';

export const STORE_AD_LABEL = 'Da loja Sucupira Naturale';

const PRODUCT_URL = `${SALES_SITE_URL}/sucupira-naturale-liquida`;
const TREATMENTS_URL = `${SALES_SITE_URL}/tratamentos`;
const COMBOS_URL = `${SALES_SITE_URL}/combos`;

export type StoreAdGroup = 'A' | 'B' | 'C' | 'D';

export interface StoreAdCreative {
  // Vai no evento `clique_para_loja` como `criativo`. Trocar o id ao trocar a peça,
  // senão o relatório mistura o desempenho das duas.
  id: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  text: string;
  cta: string;
  url: string;
}

interface GroupConfig {
  name: string;
  // Mais de um criativo: cada post recebe um, fixo, escolhido pelo slug. Assim o
  // mesmo post mostra sempre a mesma peça e os criativos se dividem entre os posts.
  creatives: StoreAdCreative[];
  sticky: { text: string; cta: string; url: string };
}

const PRONTA_PARA_TOMAR = {
  image: '/assets/loja/sucupira-liquida-pronta-para-tomar.webp',
  width: 720,
  height: 720,
  alt: 'Frasco de Sucupira Naturale Líquida 400 ml com o texto "Sucupira líquida pronta para tomar"',
};
const PRONTA_ALIVIO = {
  image: '/assets/loja/sucupira-pronta-para-tomar-alivio.webp',
  width: 720,
  height: 900,
  alt: 'Dois frascos de Sucupira Naturale Líquida 400 ml com o texto "Sucupira pronta para tomar"',
};
const TRES_BENEFICIOS = {
  image: '/assets/loja/sucupira-liquida-3-beneficios.webp',
  width: 720,
  height: 720,
  alt: 'Frascos de Sucupira Naturale Líquida 400 ml em quatro ambientes',
};
const KIT = {
  image: '/assets/loja/kit-6-frascos.webp',
  width: 600,
  height: 751,
  alt: 'Seis frascos de Sucupira Naturale Líquida 400 ml',
};
const FRASCO = {
  image: '/assets/sucupira-frasco-vertical.webp',
  width: 900,
  height: 1349,
  alt: 'Frasco da Sucupira Naturale sobre sementes de sucupira',
};

export const STORE_AD_GROUPS: Record<StoreAdGroup, GroupConfig> = {
  // Já usa a semente em casa: chá, garrafada, vinho, óleo.
  A: {
    name: 'preparo caseiro',
    creatives: [
      {
        id: 'A-pronta-para-tomar',
        ...PRONTA_PARA_TOMAR,
        title: 'Sucupira pronta para tomar',
        text: 'Sem quebrar semente, ferver ou esperar a garrafada curtir: a Sucupira Naturale Líquida vem em frasco de 400 ml, pronta para o consumo.',
        cta: 'Conhecer a Sucupira Líquida',
        url: PRODUCT_URL,
      },
      {
        id: 'A-pronta-alivio',
        ...PRONTA_ALIVIO,
        title: 'A sucupira de sempre, sem o preparo',
        text: 'Extrato da semente branca graúda de sucupira, em frasco de 400 ml. É só tomar.',
        cta: 'Ver a Sucupira Naturale Líquida',
        url: PRODUCT_URL,
      },
    ],
    sticky: { text: 'Sucupira pronta para tomar', cta: 'Ver produto', url: PRODUCT_URL },
  },
  // Já decidiu usar: como tomar, quanto, por quanto tempo.
  B: {
    name: 'já decidiu usar',
    creatives: [
      {
        id: 'B-kit-tempo-de-uso',
        ...KIT,
        title: 'Escolha o kit pelo tempo de uso',
        text: 'Kits de 2 a 12 frascos de 400 ml, com a conta de quantos frascos cada tratamento usa por mês.',
        cta: 'Ver kits e rendimento',
        url: TREATMENTS_URL,
      },
    ],
    sticky: { text: 'Kits pelo tempo de uso', cta: 'Ver kits', url: TREATMENTS_URL },
  },
  // Confiança e segurança. Só fatos do produto: quem lê aqui está desconfiado.
  C: {
    name: 'confiança e segurança',
    creatives: [
      {
        id: 'C-composicao',
        ...FRASCO,
        title: 'O que vem no frasco',
        text: 'Sucupira Naturale Líquida: 49,75% semente de sucupira, 49,75% água mineral e 0,5% álcool de cereais. Empresa com CNPJ e responsável técnica identificada.',
        cta: 'Ver composição e detalhes',
        url: PRODUCT_URL,
      },
    ],
    sticky: { text: 'Composição declarada', cta: 'Ver produto', url: PRODUCT_URL },
  },
  // Dor e condição: a persona principal.
  D: {
    name: 'dor e condição',
    creatives: [
      {
        id: 'D-pronta-alivio',
        ...PRONTA_ALIVIO,
        title: 'Sucupira Naturale Líquida',
        text: 'A tradição da sucupira em frasco de 400 ml, pronta para tomar. Empresa familiar de Itanhandu (MG), desde 2016.',
        cta: 'Conhecer o produto',
        url: PRODUCT_URL,
      },
      {
        id: 'D-tres-beneficios',
        ...TRES_BENEFICIOS,
        title: 'Sucupira líquida, pronta para tomar',
        text: 'Extrato da semente de sucupira em frasco de 400 ml, avulso ou em kits de 2 a 12 frascos.',
        cta: 'Ver a Sucupira Naturale',
        url: PRODUCT_URL,
      },
      {
        id: 'D-pronta-para-tomar',
        ...PRONTA_PARA_TOMAR,
        title: 'Sucupira pronta para tomar',
        text: 'Sucupira Naturale Líquida, frasco de 400 ml. Sem preparo em casa.',
        cta: 'Conhecer o produto',
        url: PRODUCT_URL,
      },
    ],
    sticky: { text: 'Sucupira Naturale Líquida', cta: 'Ver produto', url: PRODUCT_URL },
  },
};

// Grupo de cada post, pelo slug. Post fora desta lista cai em D (dor e condição),
// o assunto da maioria do acervo. Post novo: incluir aqui se não for de D.
const SLUG_GROUP: Record<string, StoreAdGroup> = {
  'como-fazer-cha-de-sucupira': 'A',
  'garrafada-de-sucupira-o-que-e': 'A',
  'sucupira-no-vinho-para-que-serve-e-cuidados-importantes': 'A',
  'oleo-de-sucupira-para-que-serve': 'A',
  'sucupira-composta': 'A',
  'o-que-e-sucupira-branca': 'A',
  'cha-de-sucupira-capsula-ou-extrato': 'A',
  'sucupira-em-capsulas': 'A',
  'como-escolher-produto-de-sucupira': 'A',
  'quanto-tempo-a-sucupira-leva-para-fazer-efeito': 'B',
  'como-tomar-extrato-de-sucupira': 'B',
  'quantas-tampinhas-de-sucupira-por-dia-guia-de-doses': 'B',
  'sucupira-e-confiavel': 'C',
  'sucupira-contraindicacoes': 'C',
  'efeitos-colaterais-da-sucupira': 'C',
  'sucupira-faz-mal-para-os-rins-ou-figado': 'C',
  'sucupira-e-medicamentos': 'C',
  'sucupira-e-pressao-alta': 'C',
  'sucupira-e-diabetes': 'C',
  'sucupira-e-colesterol': 'C',
  'sucupira-engorda-ou-emagrece': 'C',
  'sucupira-para-idosos': 'C',
  'sucupira-na-menopausa': 'C',
  'produto-natural-tambem-precisa-de-cuidado': 'C',
  'sucupira-na-gravidez': 'C',
  'sucupira-faz-mal-para-quem-toma-anticoagulante': 'C',
};

// O texto destes posts diz para não usar ou para falar com o médico antes. Um
// card de compra no meio do texto contradiria o artigo: só o bloco do fim.
const SENSITIVE_SLUGS = new Set(['sucupira-na-gravidez', 'sucupira-faz-mal-para-quem-toma-anticoagulante']);

export function storeAdGroup(slug: string): StoreAdGroup {
  return SLUG_GROUP[slug] ?? 'D';
}

export function allowsMiddleAd(slug: string) {
  return !SENSITIVE_SLUGS.has(slug);
}

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

// `offset` 1 dá ao bloco do fim um criativo diferente do meio, quando o grupo tem mais de um.
export function storeAdCreative(slug: string, offset = 0): StoreAdCreative {
  const { creatives } = STORE_AD_GROUPS[storeAdGroup(slug)];
  return creatives[(hash(slug) + offset) % creatives.length];
}

// Posição do card no meio do texto, calculada em build por src/utils/rehype-store-ad.ts.
// Os números vêm da unidade Native que ocupava o mesmo lugar.
export const STORE_AD_POLICY = {
  // Texto menor que isto não recebe card no meio: não há "meio" para ele ocupar.
  middleMinWords: 300,
  // Ponto do texto (fração das palavras) em que o card deve cair.
  middleTarget: 0.4,
  // Faixa ideal e faixa tolerada para encaixar o card antes de um H2.
  middleIdealRange: [0.35, 0.45],
  middleH2Range: [0.25, 0.6],
  // Sem H2 na faixa tolerada, vale qualquer quebra entre blocos nesta faixa.
  middleBlockRange: [0.3, 0.55],
} as const;

// Faixa no topo de todas as páginas do blog. Um destaque só, sem preço e sem
// urgência (templates/bloco-comercial.md). Trocar aqui quando o destaque mudar.
export const STORE_TOP_BAR = {
  id: 'topo-kits',
  text: 'Sucupira Naturale Líquida, pronta para tomar. Kits de 2 a 12 frascos de 400 ml.',
  // Celular: uma linha só.
  shortText: 'Sucupira líquida pronta para tomar',
  cta: 'Ver kits',
  url: COMBOS_URL,
};

// Card patrocinado na listagem do blog, depois de cada N cards de artigo.
export const STORE_LISTING_EVERY = 6;
export const STORE_LISTING_CARD: StoreAdCreative = {
  id: 'listagem-combos',
  image: '/assets/loja/combos-banner.webp',
  width: 1200,
  height: 675,
  alt: 'Frasco de Sucupira Naturale Líquida com o texto "Conheça os combos da Sucupira Naturale"',
  title: 'Conheça os combos da Sucupira Naturale',
  text: 'Sucupira líquida pronta para tomar, em kits de 2 a 12 frascos de 400 ml.',
  cta: 'Ver combos',
  url: COMBOS_URL,
};

// Primeira menção a "Sucupira Naturale" no texto vira link para o produto, se o
// artigo ainda não tiver link para a loja no corpo.
export const STORE_FIRST_MENTION = { text: 'Sucupira Naturale', url: PRODUCT_URL, id: 'link-primeira-mencao' };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);

// Marcação única do card, usada pelo plugin do meio do texto e pelos componentes.
// `posicao` vira `posicao_link` no GA4 (LinkTracking.astro lê `data-posicao`).
export function storeAdHtml(creative: StoreAdCreative, posicao: string) {
  const e = escapeHtml;
  return (
    `<aside class="store-ad store-ad--${e(posicao)}" data-posicao="${e(posicao)}" data-criativo="${e(creative.id)}" aria-label="${e(STORE_AD_LABEL)}">` +
    `<p class="store-ad-label">${e(STORE_AD_LABEL)}</p>` +
    `<a class="store-ad-link" href="${e(creative.url)}">` +
    `<img class="store-ad-img" src="${e(creative.image)}" alt="${e(creative.alt)}" width="${creative.width}" height="${creative.height}" loading="lazy" decoding="async" />` +
    `<span class="store-ad-body">` +
    `<span class="store-ad-title">${e(creative.title)}</span>` +
    `<span class="store-ad-text">${e(creative.text)}</span>` +
    `<span class="store-ad-cta">${e(creative.cta)}</span>` +
    `</span></a></aside>`
  );
}
