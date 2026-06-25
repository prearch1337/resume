const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export const API_URL = configuredApiUrl || (import.meta.env.DEV ? "http://localhost:3001" : "");
export const TOKEN_KEY = "resumeBuilderToken";
