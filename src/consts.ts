// Até 10/2026 o blog ficou em blog.sucupiranaturale.com.br; o Firebase redireciona o endereço antigo.
export const BLOG_SITE_URL = 'https://guiadasucupira.com.br';
export const SALES_SITE_URL = 'https://www.sucupiranaturale.com.br';

export const SITE_NAME = 'Sucupira Naturale';
export const BLOG_NAME = 'Centro de Conhecimento da Sucupira';
export const DEFAULT_OG_IMAGE = `${BLOG_SITE_URL}/assets/sucupira-natural-banner.webp`;
export const SALES_CTA_URL = `${SALES_SITE_URL}/combos`;
export const GOOGLE_ANALYTICS_ID = 'G-L27DL7MMTY';
export const STORE_ANALYTICS_ID = 'G-LZDYVCN9FV';
// Coleta first-party do CRM (docs/tracking no repositório crm-sucupira-naturale).
export const FIRST_PARTY_TRACKING_ENDPOINT = 'https://sucupira-naturale-crmapi.kip816.easypanel.host/t/v1/s';

export const ORGANIZATION_ID = `${SALES_SITE_URL}/#organization`;
export const WEBSITE_ID = `${BLOG_SITE_URL}/#website`;

export const AUTHOR_NAME = 'Priscila Petrucelli';
export const AUTHOR_ROLE = 'Engenheira Agrônoma e cofundadora da Sucupira Naturale';
export const AUTHOR_JOB_TITLE = 'Engenheira Agrônoma';
export const AUTHOR_PAGE_PATH = '/sobre/';
export const AUTHOR_ID = `${BLOG_SITE_URL}${AUTHOR_PAGE_PATH}#priscila-petrucelli`;

export function blogUrl(pathname = '/') {
  return new URL(pathname, `${BLOG_SITE_URL}/`).toString();
}

export function blogAssetUrl(pathname?: string) {
  if (!pathname) return DEFAULT_OG_IMAGE;
  return new URL(pathname, `${BLOG_SITE_URL}/`).toString();
}

export const CONTACT_PAGE_PATH = '/contato/';
export const PRIVACY_PAGE_PATH = '/politica-de-privacidade/';

// Dados da empresa. Fonte: sucupira-content-intelligence/knowledge/marca-e-empresa.md
export const COMPANY_LEGAL_NAME =
  'Indústria e Comércio de Resina de Sementes de Sucupira em Conserva';
export const COMPANY_CNPJ = '10.230.957/0001-88';
export const COMPANY_CITY = 'Itanhandu';
export const COMPANY_STATE = 'MG';
export const TECHNICAL_MANAGER = 'Andréia Lucia Guimarães Kobi';
export const TECHNICAL_MANAGER_LICENSE = 'CRF-MG 24394';

export const CONTACT_EMAIL = 'atendimento@sucupiranaturale.com.br';
export const CONTACT_PHONE_DISPLAY = '(35) 99169-6906';
export const CONTACT_PHONE_E164 = '+5535991696906';
export const CONTACT_WHATSAPP_URL = 'https://wa.me/5535991696906';

// Publisher ID do AdSense. O script só é injetado quando SERVES_THIRD_PARTY_ADS
// for true — e essa mesma constante liga, na política de privacidade, a
// divulgação de cookies de publicidade que o Google exige do publisher.
// Desligar os anúncios é virar esta flag para false: script e divulgação saem juntos.
// As unidades de anúncio dentro dos artigos têm flag própria: ADS_ENABLED, em config/ads.ts.
export const ADSENSE_CLIENT = 'ca-pub-5232696023072099';
export const SERVES_THIRD_PARTY_ADS = true;

// Revisão do AdSense em andamento (pedido refeito em out/2026). Enquanto true, o
// blog fica com uma chamada para a loja por artigo: some o botão do cabeçalho, a
// barra fixa do celular e o segundo bloco do produto. A recusa de 09/2026 foi por
// "conteúdo de baixo valor", e seis chamadas por post fazem o blog parecer funil da loja.
// Voltar para false depois da aprovação restaura tudo.
export const ADSENSE_REVIEW_MODE = true;

// Data da última revisão da política de privacidade (AAAA-MM-DD).
export const PRIVACY_POLICY_UPDATED_AT = '2026-10-05';
