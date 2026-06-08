import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import { getApiBaseUrl } from "@/api/http";

// Cliente Better Auth para el frontend
// Apunta al backend donde están montadas las rutas /api/auth/*
export const authClient = createAuthClient({
	baseURL: getApiBaseUrl(),
	plugins: [
		adminClient(),
	],
});

export const { signIn, signOut, useSession } = authClient;
