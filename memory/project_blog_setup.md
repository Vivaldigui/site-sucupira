---
name: project-blog-setup
description: Estrutura do blog Astro adicionada à landing page Sucupira Naturale — decisões arquiteturais e status.
metadata:
  type: project
---

Blog construído com Astro (static output) sobre a landing page existente da Sucupira Naturale.

**Why:** Capturar tráfego orgânico de buscas informacionais sobre sucupira (artrite, artrose, para que serve, contraindicações) e converter para venda.

**How to apply:** O blog fica em `/blog/` do mesmo subdomínio `seudesconto.sucupiranaturale.com.br`. A landing original está preservada em `public/index.html` — não é gerada pelo Astro, não tem risco de regressão. Deploy via Vercel/Netlify (Git push → auto-deploy).

## Stack
- Astro 4.x (static)
- Posts em Markdown: `src/content/blog/*.md`
- Layout: `src/layouts/BlogPost.astro`
- CSS da marca em: `src/styles/blog.css`
- Sitemap: `src/pages/sitemap.xml.ts` (endpoint nativo, sem plugin — o plugin `@astrojs/sitemap` bugou com a versão do Astro)

## Arquivos criados
- `package.json` + `astro.config.mjs`
- `src/content/config.ts` — schema dos posts (title, description, publishDate, author, tags)
- `src/layouts/BlogPost.astro` — layout com: disclaimer saúde, box de autor (E-E-A-T), CTA produto com cupom, footer disclaimer legal
- `src/pages/blog/index.astro` — índice do blog (grid de cards)
- `src/pages/blog/[...slug].astro` — rota dinâmica dos posts
- `src/styles/blog.css` — CSS com as cores exatas da landing
- `public/robots.txt`

## Artigos criados
1. `sucupira-para-que-serve.md` — artigo de topo de funil (maior volume de busca)

## Próximos artigos sugeridos (por prioridade)
1. "Chá de sucupira faz mal? Efeitos colaterais e contraindicações"
2. "Sucupira para artrite e artrose: funciona?"
3. "Quanto tempo a sucupira leva para fazer efeito?"
4. "Sucupira em cápsula x extrato líquido: qual é melhor?"
5. "Onde comprar extrato de sucupira original"
