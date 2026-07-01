import type { CollectionEntry } from 'astro:content';

type BlogPost = CollectionEntry<'blog'>;

declare const process: { env?: Record<string, string | undefined> } | undefined;

const PUBLISH_TIME_ZONE = 'America/Sao_Paulo';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: PUBLISH_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function toDateKey(date: Date) {
  const parts = dateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function getPublicationNow() {
  const override = typeof process !== 'undefined' ? process.env?.BLOG_PUBLICATION_DATE : undefined;

  if (!override) return new Date();

  const normalizedOverride = /^\d{4}-\d{2}-\d{2}$/.test(override)
    ? `${override}T12:00:00-03:00`
    : override;
  const overrideDate = new Date(normalizedOverride);

  return Number.isNaN(overrideDate.getTime()) ? new Date() : overrideDate;
}

export function isPublishedPost(post: BlogPost, now = getPublicationNow()) {
  return toDateKey(post.data.publishDate) <= toDateKey(now);
}

export function sortByNewestPublishDate(a: BlogPost, b: BlogPost) {
  return b.data.publishDate.getTime() - a.data.publishDate.getTime();
}

export function getPublishedPosts(posts: BlogPost[], now = getPublicationNow()) {
  return posts.filter((post) => isPublishedPost(post, now)).sort(sortByNewestPublishDate);
}
