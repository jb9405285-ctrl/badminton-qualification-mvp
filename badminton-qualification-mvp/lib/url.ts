const DEFAULT_PRODUCTION_ORIGIN = "https://badminton-prod-site.onrender.com";

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function firstHeaderValue(value: string | null) {
  if (!value) {
    return null;
  }

  const first = value.split(",")[0]?.trim();
  return first || null;
}

export function getPublicOrigin(request: Request) {
  const configuredOrigin =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.RENDER_EXTERNAL_URL?.trim() ||
    "";

  const normalizedConfiguredOrigin = configuredOrigin ? normalizeOrigin(configuredOrigin) : null;

  if (normalizedConfiguredOrigin) {
    return normalizedConfiguredOrigin;
  }

  const forwardedHost =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ||
    firstHeaderValue(request.headers.get("host"));
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto")) || "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const requestOrigin = new URL(request.url).origin;

  if (process.env.NODE_ENV === "production" && requestOrigin.includes("0.0.0.0")) {
    return DEFAULT_PRODUCTION_ORIGIN;
  }

  return requestOrigin;
}
