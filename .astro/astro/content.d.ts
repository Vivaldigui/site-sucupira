declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"blog": {
"anti-inflamatorios-naturais-para-articulacoes.md": {
	id: "anti-inflamatorios-naturais-para-articulacoes.md";
  slug: "anti-inflamatorios-naturais-para-articulacoes";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"artrose-no-joelho-como-aliviar-a-dor-naturalmente.md": {
	id: "artrose-no-joelho-como-aliviar-a-dor-naturalmente.md";
  slug: "artrose-no-joelho-como-aliviar-a-dor-naturalmente";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"cha-de-sucupira-capsula-ou-extrato.md": {
	id: "cha-de-sucupira-capsula-ou-extrato.md";
  slug: "cha-de-sucupira-capsula-ou-extrato";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"como-escolher-produto-de-sucupira.md": {
	id: "como-escolher-produto-de-sucupira.md";
  slug: "como-escolher-produto-de-sucupira";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"como-fazer-cha-de-sucupira.md": {
	id: "como-fazer-cha-de-sucupira.md";
  slug: "como-fazer-cha-de-sucupira";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"como-tomar-extrato-de-sucupira.md": {
	id: "como-tomar-extrato-de-sucupira.md";
  slug: "como-tomar-extrato-de-sucupira";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"dor-lombar-o-que-fazer.md": {
	id: "dor-lombar-o-que-fazer.md";
  slug: "dor-lombar-o-que-fazer";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"efeitos-colaterais-da-sucupira.md": {
	id: "efeitos-colaterais-da-sucupira.md";
  slug: "efeitos-colaterais-da-sucupira";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"garrafada-de-sucupira-o-que-e.md": {
	id: "garrafada-de-sucupira-o-que-e.md";
  slug: "garrafada-de-sucupira-o-que-e";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"nervo-ciatico-inflamado-o-que-fazer.md": {
	id: "nervo-ciatico-inflamado-o-que-fazer.md";
  slug: "nervo-ciatico-inflamado-o-que-fazer";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"o-que-e-sucupira-branca.md": {
	id: "o-que-e-sucupira-branca.md";
  slug: "o-que-e-sucupira-branca";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"o-que-tomar-para-dor-na-lombar.md": {
	id: "o-que-tomar-para-dor-na-lombar.md";
  slug: "o-que-tomar-para-dor-na-lombar";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"oleo-de-sucupira-para-que-serve.md": {
	id: "oleo-de-sucupira-para-que-serve.md";
  slug: "oleo-de-sucupira-para-que-serve";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"produto-natural-tambem-precisa-de-cuidado.md": {
	id: "produto-natural-tambem-precisa-de-cuidado.md";
  slug: "produto-natural-tambem-precisa-de-cuidado";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"quantas-tampinhas-de-sucupira-por-dia-guia-de-doses.md": {
	id: "quantas-tampinhas-de-sucupira-por-dia-guia-de-doses.md";
  slug: "quantas-tampinhas-de-sucupira-por-dia-guia-de-doses";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"quanto-tempo-a-sucupira-leva-para-fazer-efeito.md": {
	id: "quanto-tempo-a-sucupira-leva-para-fazer-efeito.md";
  slug: "quanto-tempo-a-sucupira-leva-para-fazer-efeito";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"rigidez-nas-articulacoes-pela-manha.md": {
	id: "rigidez-nas-articulacoes-pela-manha.md";
  slug: "rigidez-nas-articulacoes-pela-manha";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-alivia-dores-cronicas-o-que-a-ciencia-diz.md": {
	id: "sucupira-alivia-dores-cronicas-o-que-a-ciencia-diz.md";
  slug: "sucupira-alivia-dores-cronicas-o-que-a-ciencia-diz";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-contraindicacoes.md": {
	id: "sucupira-contraindicacoes.md";
  slug: "sucupira-contraindicacoes";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-e-confiavel.md": {
	id: "sucupira-e-confiavel.md";
  slug: "sucupira-e-confiavel";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-e-medicamentos.md": {
	id: "sucupira-e-medicamentos.md";
  slug: "sucupira-e-medicamentos";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-e-pressao-alta.md": {
	id: "sucupira-e-pressao-alta.md";
  slug: "sucupira-e-pressao-alta";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-engorda-ou-emagrece.md": {
	id: "sucupira-engorda-ou-emagrece.md";
  slug: "sucupira-engorda-ou-emagrece";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-faz-mal-para-os-rins-ou-figado.md": {
	id: "sucupira-faz-mal-para-os-rins-ou-figado.md";
  slug: "sucupira-faz-mal-para-os-rins-ou-figado";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-faz-mal-para-quem-toma-anticoagulante.md": {
	id: "sucupira-faz-mal-para-quem-toma-anticoagulante.md";
  slug: "sucupira-faz-mal-para-quem-toma-anticoagulante";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-no-vinho-para-que-serve-e-cuidados-importantes.md": {
	id: "sucupira-no-vinho-para-que-serve-e-cuidados-importantes.md";
  slug: "sucupira-no-vinho-para-que-serve-e-cuidados-importantes";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-ou-canela-de-velho-qual-e-melhor-para-dor-nas-articulacoes.md": {
	id: "sucupira-ou-canela-de-velho-qual-e-melhor-para-dor-nas-articulacoes.md";
  slug: "sucupira-ou-canela-de-velho-qual-e-melhor-para-dor-nas-articulacoes";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-a-pele.md": {
	id: "sucupira-para-a-pele.md";
  slug: "sucupira-para-a-pele";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-articulacoes.md": {
	id: "sucupira-para-articulacoes.md";
  slug: "sucupira-para-articulacoes";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-artrite.md": {
	id: "sucupira-para-artrite.md";
  slug: "sucupira-para-artrite";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-artrose.md": {
	id: "sucupira-para-artrose.md";
  slug: "sucupira-para-artrose";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-bursite-e-tendinite.md": {
	id: "sucupira-para-bursite-e-tendinite.md";
  slug: "sucupira-para-bursite-e-tendinite";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-dor-na-coluna.md": {
	id: "sucupira-para-dor-na-coluna.md";
  slug: "sucupira-para-dor-na-coluna";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-dor-no-calcanhar.md": {
	id: "sucupira-para-dor-no-calcanhar.md";
  slug: "sucupira-para-dor-no-calcanhar";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-dor-no-joelho.md": {
	id: "sucupira-para-dor-no-joelho.md";
  slug: "sucupira-para-dor-no-joelho";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-dores-musculares.md": {
	id: "sucupira-para-dores-musculares.md";
  slug: "sucupira-para-dores-musculares";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-fibromialgia.md": {
	id: "sucupira-para-fibromialgia.md";
  slug: "sucupira-para-fibromialgia";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-gota-e-acido-urico.md": {
	id: "sucupira-para-gota-e-acido-urico.md";
  slug: "sucupira-para-gota-e-acido-urico";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-nervo-ciatico.md": {
	id: "sucupira-para-nervo-ciatico.md";
  slug: "sucupira-para-nervo-ciatico";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"sucupira-para-que-serve.md": {
	id: "sucupira-para-que-serve.md";
  slug: "sucupira-para-que-serve";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
"vitaminas-para-articulacoes.md": {
	id: "vitaminas-para-articulacoes.md";
  slug: "vitaminas-para-articulacoes";
  body: string;
  collection: "blog";
  data: InferEntrySchema<"blog">
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("./../../src/content/config.js");
}
