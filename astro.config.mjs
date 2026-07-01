import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { BLOG_SITE_URL, SALES_CTA_URL } from './src/consts.ts';

function improveBlogMarkdownOutput() {
  return (tree) => {
    const visit = (node) => {
      if (node?.type === 'element' && node.tagName === 'img') {
        node.properties ??= {};
        node.properties.loading ??= 'lazy';
        node.properties.decoding ??= 'async';
      }

      if (node?.type === 'element' && node.tagName === 'a') {
        const href = node.properties?.href;

        if (href === '/#comprar') {
          node.properties.href = SALES_CTA_URL;
        } else if (typeof href === 'string' && href.startsWith('/blog/')) {
          node.properties.href = href.replace(/^\/blog\//, '/');
        }
      }

      if (node?.type === 'raw' && typeof node.value === 'string' && node.value.includes('<img')) {
        node.value = node.value.replace(/<img(?![^>]*\bloading=)([^>]*)>/gi, (
          _match,
          attributes
        ) => `<img loading="lazy" decoding="async"${attributes}>`);
      }

      node?.children?.forEach(visit);
    };

    visit(tree);
  };
}

export default defineConfig({
  site: BLOG_SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith('/blog/'),
    }),
  ],
  markdown: {
    rehypePlugins: [improveBlogMarkdownOutput],
  },
});
