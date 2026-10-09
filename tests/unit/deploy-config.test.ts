import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Guardia de la estrategia de deploy: `wrangler.jsonc` con valores reales
 * nunca se commitea; solo vive `wrangler.example.jsonc` con placeholders
 * que CI sustituye con secrets (ver .github/workflows/deploy.yaml).
 */
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

function stripFullLineComments(source: string): string {
	return source
		.split("\n")
		.filter((line) => !line.trimStart().startsWith("//"))
		.join("\n");
}

describe("deploy config", () => {
	it("ignora wrangler.jsonc y .dev.vars, y versiona solo el ejemplo", () => {
		const gitignore = read(".gitignore");
		expect(gitignore).toMatch(/^wrangler\.jsonc$/m);
		expect(gitignore).toMatch(/^\.dev\.vars$/m);
		expect(gitignore).toMatch(/^drizzle\/$/m);
		expect(existsSync(join(root, "wrangler.example.jsonc"))).toBe(true);
	});

	it("el ejemplo declara worker, D1 y vars con placeholders", () => {
		const parsed = JSON.parse(
			stripFullLineComments(read("wrangler.example.jsonc")),
	) as {
		name: string;
		main: string;
		images?: { binding: string };
		assets?: { directory: string };
		vars?: Record<string, string>;
		d1_databases?: Array<{
			binding: string;
			database_name: string;
			database_id: string;
		}>;
	};
		expect(parsed.name).toBe("YOUR_WORKER_NAME");
		// wrangler deploy no resuelve el subpath de paquete del adapter:
		// main debe ser el archivo compilado por `astro build`.
		expect(parsed.main).toBe("dist/server/entry.mjs");
		expect(parsed.images).toEqual({ binding: "IMAGES" });
		expect(parsed.assets?.directory).toBe("./dist/client");
		const db = parsed.d1_databases?.[0];
		expect(db?.binding).toBe("DB");
		expect(db?.database_name).toBe("YOUR_DATABASE_NAME");
		expect(db?.database_id).toBe("YOUR_DATABASE_ID");
		for (const key of [
			"BETTER_AUTH_SECRET",
			"BETTER_AUTH_URL",
			"GOOGLE_CLIENT_ID",
			"GOOGLE_CLIENT_SECRET",
			"ADMIN_EMAILS",
		]) {
			expect(parsed.vars?.[key]).toMatch(/^YOUR_/);
		}
	});

	it("el ejemplo no contiene ids reales de D1", () => {
		const raw = read("wrangler.example.jsonc");
		const uuids =
			raw.match(
				/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
			) ?? [];
		const reales = uuids.filter(
			(id) => !/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(id),
		);
		expect(reales).toEqual([]);
	});

	it("el workflow de deploy genera wrangler.jsonc desde el ejemplo", () => {
		const deploy = read(".github/workflows/deploy.yaml");
		expect(deploy).toContain("cp wrangler.example.jsonc wrangler.jsonc");
		expect(deploy).not.toMatch(/database_id.*[0-9a-f-]{36}/i);
	});
});
