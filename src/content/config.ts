import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Equipe Sucupira Naturale'),
    authorRole: z.string().default('Equipe de conteúdo'),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    ogImage: z.string().optional(),
  }),
});

export const collections = { blog };
