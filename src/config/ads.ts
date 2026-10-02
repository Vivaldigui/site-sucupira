// Publicidade de terceiros nos artigos. Tudo que decide SE, ONDE e QUANTO
// anúncio aparece mora aqui: componentes, plugin de Markdown e loader só leem.
//
// Desligar tudo: ADS_ENABLED = false. Nenhum container é renderizado, o loader
// não entra na página e a política de privacidade deixa de citar a rede.
// Desligar num artigo só: `ads: false` no frontmatter dele.
export const ADS_ENABLED = true;

// Rede que serve as quatro unidades abaixo. Aparece na política de privacidade.
export const AD_NETWORK_NAME = 'Adsterra';
export const AD_NETWORK_PRIVACY_URL = 'https://adsterra.com/privacy-policy/';

export const AD_LABEL = 'Publicidade';

// Corte mobile do site (o mesmo do blog.css). Até aqui vale o 320x50; acima, o
// 728x90 — a coluna do artigo só passa de 728px a partir de 769px de tela.
export const AD_MOBILE_MAX_WIDTH = 768;

interface NativeUnit {
  kind: 'native';
  id: string;
  src: string;
  // O widget traz 4 itens: lado a lado no desktop, empilhados no celular, onde
  // somam mais de 1.200px de anúncio no meio do texto. Este limite mostra só as
  // primeiras N linhas de itens. 0 = sem limite.
  maxRows: number;
}

interface BannerUnit {
  kind: 'banner';
  key: string;
  src: string;
  width: number;
  height: number;
}

export type AdUnit = NativeUnit | BannerUnit;
export type AdUnitName = 'native' | 'rectangle' | 'mobileBanner' | 'desktopBanner';

const BANNER_HOST = 'https://www.highrevenueformat.com';

function banner(key: string, width: number, height: number): BannerUnit {
  return { kind: 'banner', key, src: `${BANNER_HOST}/${key}/invoke.js`, width, height };
}

// IDs, chaves e URLs exatamente como o fornecedor entregou. Não alterar.
export const AD_UNITS: Record<AdUnitName, AdUnit> = {
  native: {
    kind: 'native',
    id: '64cbb69aaba0b33b98a44e08eee15200',
    src: 'https://pl31624354.profitableratecpmnetwork.com/64cbb69aaba0b33b98a44e08eee15200/invoke.js',
    maxRows: 1,
  },
  rectangle: banner('58677c5a8b4e10a26f576a6a8ecdb41a', 300, 250),
  mobileBanner: banner('75e968f1c2cfa7d8bfbae621101418f5', 320, 50),
  desktopBanner: banner('9fd01ff3983e4d43496727c1ac1549f4', 728, 90),
};

// Classe CSS de cada unidade (`ad-container--<sufixo>`).
export const AD_UNIT_CLASS: Record<AdUnitName, string> = {
  native: 'native',
  rectangle: 'rectangle',
  mobileBanner: 'mobile-banner',
  desktopBanner: 'desktop-banner',
};

export const AD_POLICY = {
  // Abaixo disto o artigo é "curto": Native + banner final, sem o 300x250.
  shortArticleMaxWords: 800,
  // Texto menor que isto não recebe Native: não há "meio" para ele ocupar.
  nativeMinWords: 300,
  // Ponto do texto (fração das palavras) em que o Native deve cair.
  nativeTarget: 0.4,
  // Faixa ideal e faixa tolerada para encaixar o Native antes de um H2.
  nativeIdealRange: [0.35, 0.45],
  nativeH2Range: [0.25, 0.6],
  // Sem H2 na faixa tolerada, vale qualquer quebra entre blocos nesta faixa.
  nativeBlockRange: [0.3, 0.55],
} as const;

export const AD_LOADING = {
  // O anúncio só é pedido quando chega a esta distância da área visível.
  lazyRootMargin: '600px 0px',
  // Sem resposta neste prazo, o espaço reservado é recolhido.
  emptyTimeoutMs: 10000,
} as const;

export interface ArticleAdPlan {
  native: boolean;
  rectangle: boolean;
  endBanner: boolean;
}

// Quantas unidades um artigo recebe. O banner final conta uma vez: 320x50 e
// 728x90 nunca aparecem juntos, o CSS mostra um ou outro.
//   curto (< 800 palavras)  -> Native + banner final          = 2
//   médio e longo           -> Native + 300x250 + banner final = 3
export function planArticleAds(options: { ads?: boolean; wordCount?: number }): ArticleAdPlan {
  if (!ADS_ENABLED || options.ads === false) {
    return { native: false, rectangle: false, endBanner: false };
  }

  const isShort = (options.wordCount ?? 0) < AD_POLICY.shortArticleMaxWords;

  return { native: true, rectangle: !isShort, endBanner: true };
}

// HTML do fornecedor, igual ao original, que roda dentro do iframe do anúncio.
export function vendorSnippet(unit: AdUnit) {
  if (unit.kind === 'native') {
    return (
      `<script async="async" data-cfasync="false" src="${unit.src}"></script>` +
      `<div id="container-${unit.id}"></div>`
    );
  }

  return (
    `<script>atOptions = {'key' : '${unit.key}','format' : 'iframe','height' : ${unit.height},` +
    `'width' : ${unit.width},'params' : {}};</script>` +
    `<script src="${unit.src}"></script>`
  );
}
