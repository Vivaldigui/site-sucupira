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

import { SALES_CTA_URL } from '../consts.ts';
export const STORE_AD_LABEL = 'Da loja Sucupira Naturale';
export const STORE_AD_EXPERIMENT = 'blog-combos-20261009-v2';
export type StoreAdGroup = 'A' | 'B' | 'C' | 'D';
export interface StoreAdCreative {
  id:string; image:string; width:number; height:number; alt:string;
  title:string; text:string; cta:string; url:string;
}
interface GroupConfig {name:string;creatives:StoreAdCreative[];sticky:{text:string;cta:string;url:string}}
function creative(id:string,image:string,alt:string,title:string,text:string):StoreAdCreative {
  return {id,image:'/assets/loja/'+image+'-720.webp',width:720,height:720,alt,title,text,cta:'Ver combos',url:SALES_CTA_URL};
}
const family=(id:string,title:string,text:string)=>creative(id,'familia-instagram','Priscila com frasco e sementes de sucupira',title,text);
const bottle=(id:string,title:string,text:string)=>creative(id,'frasco-v2','Frasco de Sucupira Naturale sobre sementes',title,text);
const kit=(id:string,title:string,text:string)=>creative(id,'kit-v2','Kit com seis frascos de 400 ml',title,text);
export const STORE_AD_GROUPS:Record<StoreAdGroup,GroupConfig> = {
 A:{name:'preparo caseiro',creatives:[
  creative('a-pronta-v2','pronta-v2','Frasco de sucupira líquida pronta para tomar','Sucupira pronta para tomar','Frasco de 400 ml, sem preparar chá ou garrafada em casa.'),
  family('a-familia-v2','Do preparo da nossa família para a sua rotina','Conheça a Sucupira Naturale líquida e as opções de kits.')],
  sticky:{text:'Sucupira pronta para tomar',cta:'Ver combos',url:SALES_CTA_URL}},
 B:{name:'já decidiu usar',creatives:[
  kit('b-kits-v2','Escolha seu combo','Opções de 2 a 12 frascos de Sucupira Naturale líquida, de 400 ml cada.'),
  bottle('b-frasco-v2','Conheça as opções da loja','Sucupira líquida pronta para tomar, em frasco de 400 ml.')],
  sticky:{text:'Conheça os kits de 400 ml',cta:'Ver combos',url:SALES_CTA_URL}},
 C:{name:'confiança',creatives:[
  family('c-familia-v2','Uma empresa familiar desde 2016','Conheça a Sucupira Naturale, de Itanhandu (MG).'),
  bottle('c-composicao-v2','Composição declarada','49,75% semente de sucupira, 49,75% água mineral e 0,5% álcool de cereais.')],
  sticky:{text:'Conheça a Sucupira Naturale',cta:'Ver combos',url:SALES_CTA_URL}},
 D:{name:'dor e condição',creatives:[
  bottle('d-frasco-v2','Sucupira Naturale Líquida','Conheça o frasco de 400 ml e as opções disponíveis na loja.'),
  family('d-familia-v2','Conheça nossa empresa familiar','Sucupira líquida pronta para tomar, produzida em Itanhandu (MG).')],
  sticky:{text:'Sucupira Naturale Líquida',cta:'Ver combos',url:SALES_CTA_URL}},
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
export const SENSITIVE_SLUGS = new Set(['sucupira-na-gravidez', 'sucupira-faz-mal-para-quem-toma-anticoagulante']);

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
  id: 'topo-kits-v2',
  text: 'Sucupira Naturale Líquida, pronta para tomar. Kits de 2 a 12 frascos de 400 ml.',
  // Celular: uma linha só.
  shortText: 'Sucupira líquida pronta para tomar',
  cta: 'Ver kits',
  url: SALES_CTA_URL,
};

// Card patrocinado na listagem do blog, depois de cada N cards de artigo.
export const STORE_LISTING_EVERY = 6;
export const STORE_LISTING_CARD: StoreAdCreative = {
  id: 'listagem-combos-v2',
  image: '/assets/loja/kit-v2-720.webp',
  width: 720,
  height: 720,
  alt: 'Kit com seis frascos de Sucupira Naturale Líquida',
  title: 'Conheça os combos da Sucupira Naturale',
  text: 'Sucupira líquida pronta para tomar, em kits de 2 a 12 frascos de 400 ml.',
  cta: 'Ver combos',
  url: SALES_CTA_URL,
};

// Primeira menção a "Sucupira Naturale" no texto vira link para o produto, se o
// artigo ainda não tiver link para a loja no corpo.
export const STORE_FIRST_MENTION = { text: 'Sucupira Naturale', url: SALES_CTA_URL, id: 'primeira-mencao-v2' };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);

// Marcação única do card, usada pelo plugin do meio do texto e pelos componentes.
// `posicao` vira `posicao_link` no GA4 (LinkTracking.astro lê `data-posicao`).
export function storeAdHtml(creative: StoreAdCreative, posicao: string) {
  const e = escapeHtml;
  const group = (Object.keys(STORE_AD_GROUPS) as StoreAdGroup[]).find(g => STORE_AD_GROUPS[g].creatives.some(c => c.id === creative.id));
  const variants = group ? STORE_AD_GROUPS[group].creatives : [];
  const rotate = variants.length ? ` data-variants="${e(JSON.stringify(variants))}"` : '';

  return (
    `<aside class="store-ad store-ad--${e(posicao)}" data-posicao="${e(posicao)}" data-criativo="${e(creative.id)}"${rotate} aria-label="${e(STORE_AD_LABEL)}">` +
    `<p class="store-ad-label">${e(STORE_AD_LABEL)}</p>` +
    `<a class="store-ad-link" data-sn-cta="${e(posicao)}" href="${e(creative.url)}">` +
    `<img class="store-ad-img" src="${e(creative.image)}" alt="${e(creative.alt)}" width="${creative.width}" height="${creative.height}" loading="lazy" decoding="async" />` +
    `<span class="store-ad-body">` +
    `<span class="store-ad-title">${e(creative.title)}</span>` +
    `<span class="store-ad-text">${e(creative.text)}</span>` +
    `<span class="store-ad-cta">${e(creative.cta)}</span>` +
    `</span></a></aside>`
  );
}

export const STORE_FOOTER:StoreAdCreative={...family('rodape-familia-v2','Conheça os combos da Sucupira Naturale','Uma empresa familiar desde 2016. Frascos de 400 ml, prontos para tomar.'),image:'/assets/loja/familia-instagram-1200.webp',width:1200,height:1200};
