export const BLOG_SITE_URL = 'https://blog.sucupiranaturale.com.br';
export const SALES_SITE_URL = 'https://seudesconto.sucupiranaturale.com.br';

export const SITE_NAME = 'Sucupira Naturale';
export const BLOG_NAME = 'Centro de Conhecimento da Sucupira';
export const DEFAULT_OG_IMAGE = `${BLOG_SITE_URL}/assets/sucupira-natural-banner.webp`;
export const SALES_CTA_URL = `${SALES_SITE_URL}/#comprar`;
export const GOOGLE_ANALYTICS_ID = 'G-L27DL7MMTY';

export const ORGANIZATION_ID = `${SALES_SITE_URL}/#organization`;
export const WEBSITE_ID = `${BLOG_SITE_URL}/#website`;

export function blogUrl(pathname = '/') {
  return new URL(pathname, `${BLOG_SITE_URL}/`).toString();
}

export function blogAssetUrl(pathname?: string) {
  if (!pathname) return DEFAULT_OG_IMAGE;
  return new URL(pathname, `${BLOG_SITE_URL}/`).toString();
}
