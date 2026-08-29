import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { BLOG_SITE_URL, SALES_CTA_URL } from './src/consts.ts';

const BLOG_CONTENT_DIRECTORY = new URL('./src/content/blog/', import.meta.url);
const publicationDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function getFrontmatterDate(frontmatter, field) {
  const match = frontmatter.match(
    new RegExp(`^${field}:\\s*(?:"([^"]+)"|'([^']+)'|([^\\s#]+))\\s*$`, 'm')
  );

  return match?.slice(1).find(Boolean);
}

const publicationDateOverride = process.env.BLOG_PUBLICATION_DATE;
const requestedPublicationDate = publicationDateOverride
  ? new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(publicationDateOverride)
        ? `${publicationDateOverride}T12:00:00-03:00`
        : publicationDateOverride
    )
  : new Date();
const currentPublicationDate = Number.isNaN(requestedPublicationDate.getTime())
  ? new Date()
  : requestedPublicationDate;
const currentPublicationDateKey = publicationDateFormatter.format(currentPublicationDate);
const sitemapLastmodByPath = new Map();
let latestPublishedArticle;

for (const fileName of readdirSync(BLOG_CONTENT_DIRECTORY).filter((name) => name.endsWith('.md'))) {
  const source = readFileSync(new URL(fileName, BLOG_CONTENT_DIRECTORY), 'utf8');
  const frontmatter = source.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)?.[1];

  if (!frontmatter) continue;

  const publishDate = getFrontmatterDate(frontmatter, 'publishDate');
  const lastmod = getFrontmatterDate(frontmatter, 'updatedDate') ?? publishDate;

  if (!publishDate || !lastmod) continue;

  const slug = fileName.replace(/\.md$/, '');
  sitemapLastmodByPath.set(`/${slug}/`, lastmod);

  const publishTime = Date.parse(publishDate);
  const publishDateKey = publishDate.slice(0, 10);

  if (
    publishDateKey <= currentPublicationDateKey &&
    Number.isFinite(publishTime) &&
    (!latestPublishedArticle || publishTime > latestPublishedArticle.publishTime)
  ) {
    latestPublishedArticle = { publishTime, lastmod };
  }
}

if (latestPublishedArticle) {
  sitemapLastmodByPath.set('/', latestPublishedArticle.lastmod);
}

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
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const lastmod = sitemapLastmodByPath.get(pathname);

        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  markdown: {
    rehypePlugins: [improveBlogMarkdownOutput],
  },
});
