import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { RedirectUrlUseCase } from "@/server/application/url/redirect-url.usecase";
import { createDb } from "@/server/db";
import { UrlRepository } from "@/server/infrastructure/persistence/url.repository.impl";
import { ClickRepository } from "@/server/infrastructure/persistence/click.repository.impl";
import { parseDevice, parseBrowser } from "@/server/utils/user-agent";
import { RESERVED_SHORT_CODES } from "@/server/config/constants";

const SHORT_CODE_PATTERN = /^[a-z0-9]{1,9}$/;

export const GET = (async ({ params, redirect, request, locals }) => {
	const shortCode = params.slug ?? "";

	if (!SHORT_CODE_PATTERN.test(shortCode)) {
		return redirect("/", 302);
	}

	if (RESERVED_SHORT_CODES.has(shortCode)) {
		return new Response(null, { status: 404 });
	}

	try {
		const repository = new UrlRepository(createDb(env.DB));
		const url = await new RedirectUrlUseCase(repository).execute(shortCode);

		if (!url) {
			return redirect("/", 302);
		}

		const clickRepo = new ClickRepository(createDb(env.DB));
		const userAgent = request.headers.get("user-agent");
		const referer = request.headers.get("referer");
		const cf = (request as Request<unknown, IncomingRequestCfProperties>).cf;
		const country = cf?.country ?? null;

		// El tracking de clicks nunca debe retrasar la redirección (302
		// inmediato) ni perderse si el isolate se congela tras responder.
		// `waitUntil` le dice al runtime de Cloudflare que complete este
		// insert en segundo plano; sin él, la promesa flotante podría
		// cancelarse y perderíamos analytics. El `.catch` evita que un fallo
		// de D1 genere una promesa rechazada sin manejar.
		const capture = clickRepo
			.create({
				urlId: url.id,
				country,
				device: parseDevice(userAgent),
				browser: parseBrowser(userAgent),
				referer,
			})
			.catch((err) => console.error("[CLICK CAPTURE ERROR]", err));

		// `cfContext` es el ExecutionContext del worker que expone el
		// adaptador de Astro (`Astro.locals.cfContext`, con `waitUntil`).
		// OJO: `locals.runtime.ctx` ya no existe (Astro v6 lo eliminó y su
		// getter lanza error al tocarlo), por eso no lo usamos. En build o
		// dev sin workerd `cfContext` puede no existir: acceso defensivo.
		if (typeof locals.cfContext?.waitUntil === "function") {
			locals.cfContext.waitUntil(capture);
		}

		// 302 (no 301/308): los enlaces cortos deben revalidarse siempre para
		// poder contar cada click y respetar desactivaciones/eliminaciones.
		return redirect(url.originalUrl, 302);
	} catch (error) {
		console.error("[REDIRECT ERROR]", error);
		return redirect("/", 302);
	}
}) satisfies APIRoute;
