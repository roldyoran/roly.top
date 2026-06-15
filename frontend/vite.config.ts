import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					"vendor-vue": ["vue", "vue-router", "pinia"],
					"vendor-query": ["@tanstack/vue-query"],
					"vendor-ui": ["reka-ui", "class-variance-authority", "clsx", "tailwind-merge"],
				},
			},
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
