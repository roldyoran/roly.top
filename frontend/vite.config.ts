import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), tailwindcss(), cssInjectedByJsPlugin()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:8787",
				changeOrigin: true,
				configure: (proxy) => {
					proxy.on("proxyReq", (_proxyReq, req) => {
						if (req.headers.cookie) {
							_proxyReq.setHeader("Cookie", req.headers.cookie);
						}
					});
				},
			},
			"/v1": {
				target: "http://localhost:8787",
				changeOrigin: true,
				configure: (proxy) => {
					proxy.on("proxyReq", (_proxyReq, req) => {
						if (req.headers.cookie) {
							_proxyReq.setHeader("Cookie", req.headers.cookie);
						}
					});
				},
			},
		},
	},
});
