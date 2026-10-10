// De 05 a 08/10/2026 o blog ficou em guiadasucupira.com.br; o Firebase redireciona aquele endereço para cá.
export const BLOG_SITE_URL = 'https://blog.sucupiranaturale.com.br';
export const SALES_SITE_URL = 'https://www.sucupiranaturale.com.br';

// SITE_NAME é a empresa (Organization no schema, controladora na política de privacidade).
// BLOG_NAME é o site: título das páginas, og:site_name, cabeçalho. Até 10/2026 o blog se
// chamava "Centro de Conhecimento da Sucupira".
export const SITE_NAME = 'Sucupira Naturale';
export const BLOG_NAME = 'Guia da Sucupira';
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

// Data da última revisão da política de privacidade (AAAA-MM-DD).
export const PRIVACY_POLICY_UPDATED_AT = '2026-10-08';
