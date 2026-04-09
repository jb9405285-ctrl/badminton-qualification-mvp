export type AppMode = "demo" | "production";

export function getAppMode(): AppMode {
  return process.env.APP_MODE === "production" ? "production" : "demo";
}

export function isDemoMode() {
  return getAppMode() === "demo";
}

export function isProductionMode() {
  return getAppMode() === "production";
}

export function getSuperAdminConfig() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim() ?? "";
  const password = process.env.SUPER_ADMIN_PASSWORD?.trim() ?? "";
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "平台管理员";

  return {
    email,
    password,
    name,
    configured: email.length > 0 && password.length > 0
  };
}
