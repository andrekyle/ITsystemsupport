export type TenantId = "investec" | "discovery";

export interface TenantBrand {
  id: TenantId;
  name: string;
  location: string;
  appName: string;
  logo: string | null;
  accent: string;
}

const TENANTS: Record<TenantId, TenantBrand> = {
  investec: {
    id: "investec",
    name: "Investec",
    location: "Sandton",
    appName: "ITSS Learn",
    logo: null,
    accent: "#007cc3",
  },
  discovery: {
    id: "discovery",
    name: "Discovery",
    location: "Sandton",
    appName: "Discovery Learn",
    logo: "/logos/Discovery Logo with Chevron Emblem.png",
    accent: "#e51b35",
  },
};

function configuredTenant(): TenantId {
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

