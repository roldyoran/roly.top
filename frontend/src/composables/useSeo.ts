import { useHead } from "@vueuse/head";
import { computed, type MaybeRef, unref } from "vue";
import { useRoute } from "vue-router";

interface SeoOptions {
	title?: MaybeRef<string>;
	description?: MaybeRef<string>;
	ogTitle?: MaybeRef<string>;
	ogDescription?: MaybeRef<string>;
	ogImage?: MaybeRef<string>;
	twitterSite?: MaybeRef<string>;
	canonical?: MaybeRef<string>;
	robots?: MaybeRef<string>;
	jsonLd?: MaybeRef<Record<string, unknown>>;
}

const SITE_NAME = "roly.top";
const DEFAULT_DESCRIPTION =
	"Acorta tus URLs de forma rápida y gratuita. Genera códigos QR, obtén estadísticas y gestiona tus enlaces cortos con roly.top.";
const DEFAULT_OG_IMAGE = "/og-image.png";
const DEFAULT_TWITTER_SITE = "@rolytop";

export function useSeo(options: SeoOptions = {}) {
	const route = useRoute();

	const baseUrl = computed(() => {
		if (typeof window !== "undefined") {
			return window.location.origin;
		}
		return "https://roly.top";
	});

	const resolvedTitle = computed(() => {
		const title = unref(options.title);
		return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
	});

	const resolvedDescription = computed(
		() => unref(options.description) || DEFAULT_DESCRIPTION,
	);

	const resolvedCanonical = computed(() => {
		const canonical = unref(options.canonical);
		if (canonical) return canonical;
		return `${baseUrl.value}${route.path}`;
	});

	const resolvedRobots = computed(
		() => unref(options.robots) || "index, follow",
	);

	const resolvedOgImage = computed(() => {
		const img = unref(options.ogImage);
		if (img?.startsWith("http")) return img;
		return `${baseUrl.value}${img || DEFAULT_OG_IMAGE}`;
	});

	const resolvedTwitterSite = computed(
		() => unref(options.twitterSite) || DEFAULT_TWITTER_SITE,
	);

	useHead({
		title: resolvedTitle,
		meta: [
			{
				name: "description",
				content: resolvedDescription,
			},
			{
				name: "robots",
				content: resolvedRobots,
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:title",
				content: computed(() => unref(options.ogTitle) || resolvedTitle.value),
			},
			{
				property: "og:description",
				content: computed(
					() => unref(options.ogDescription) || resolvedDescription.value,
				),
			},
			{
				property: "og:url",
				content: resolvedCanonical,
			},
			{
				property: "og:image",
				content: resolvedOgImage,
			},
			{
				property: "og:site_name",
				content: SITE_NAME,
			},
			{
				property: "og:locale",
				content: "es_ES",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:site",
				content: resolvedTwitterSite,
			},
			{
				name: "twitter:title",
				content: computed(() => unref(options.ogTitle) || resolvedTitle.value),
			},
			{
				name: "twitter:description",
				content: computed(
					() => unref(options.ogDescription) || resolvedDescription.value,
				),
			},
			{
				name: "twitter:image",
				content: resolvedOgImage,
			},
		],
		link: [
			{
				rel: "canonical",
				href: resolvedCanonical,
			},
		],
		script: options.jsonLd
			? [
					{
						type: "application/ld+json",
						children: computed(() => JSON.stringify(unref(options.jsonLd))),
					},
				]
			: [],
	});
}
