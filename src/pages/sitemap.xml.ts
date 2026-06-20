import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('blog');
  const base = 'https://seudesconto.sucupiranaturale.com.br';

  const staticUrls = [
    { loc: `${base}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${base}/blog/`, priority: '0.9', changefreq: 'weekly' },
  ];

  const postUrls = posts.map((p) => ({
    loc: `${base}/blog/${p.slug}/`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: (p.data.updatedDate ?? p.data.publishDate).toISOString().split('T')[0],
  }));

  const all = [...staticUrls, ...postUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${'lastmod' in u ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
