export type TenantId = "investec" | "discovery";

export interface TenantBrand {
  id: TenantId;
  name: string;
  location: string;
  appName: string;
  logo: string | null;
  logoDark?: string | null;
  accent: string;
  superUserName: string;
  superUserEmail: string;
}

const TENANTS: Record<TenantId, TenantBrand> = {
  investec: {
    id: "investec",
    name: "Investec",
    location: "Sandton",
    appName: "Eruditio eLearning",
    logo: "/logos/investec.svg",
    accent: "#007cc3",
    superUserName: "Andre Snell",
    superUserEmail: "andresnell29@gmail.com",
  },
  discovery: {
    id: "discovery",
    name: "Discovery",
    location: "Sandton",
    appName: "Discovery Learn",
    logo: "/discovery/FullLighmode.svg",
    logoDark: "/discovery/Full%20Darkmode%20Logo.svg",
    accent: "#e51b35",
    superUserName: "Andre Snell",
    superUserEmail: "ad4snell@gmail.com",
  },
};

function configuredTenant(): TenantId {
  // Presentation-only alias: keep the Investec client account/data scope while
  // exposing a Discovery-labelled URL for demonstrations.
  if (/^\/clients\/discovery-demo(?:\/|$)/.test(window.location.pathname)) return "investec";
  const client = window.location.pathname.match(/^\/clients\/(investec|discovery)(?:\/|$)/)?.[1];
  if (client === "discovery" || client === "investec") return client;
  const env = String(import.meta.env.VITE_TENANT ?? "").toLowerCase();
  if (env === "discovery") return "discovery";
  if (env === "investec") return "investec";
  const host = window.location.hostname.toLowerCase();
  if (host.includes("discovery")) return "discovery";
  const query = new URLSearchParams(window.location.search).get("tenant")?.toLowerCase();
  return query === "discovery" ? "discovery" : "investec";
}

export const TENANT = TENANTS[configuredTenant()];
export const TENANT_ID = TENANT.id;

export function authTenant(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): string | null {
  return String(user.app_metadata?.tenant_id ?? user.user_metadata?.tenant_id ?? "") || null;
}

