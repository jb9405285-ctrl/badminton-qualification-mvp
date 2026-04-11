import nodemailer from "nodemailer";

type ApprovalEmailInput = {
  to: string;
  contactName: string;
  organizationName: string;
  setupUrl: string;
  expiresAt: Date;
};

type EmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  replyTo: string | null;
  timeoutMs: number;
};

function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const portValue = process.env.SMTP_PORT?.trim() ?? "";
  const secureValue = process.env.SMTP_SECURE?.trim().toLowerCase() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const password = process.env.SMTP_PASSWORD?.trim() ?? "";
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim() ?? "";
  const fromName = process.env.SMTP_FROM_NAME?.trim() || "羽毛球赛事资格核验工具";
  const replyTo = process.env.SMTP_REPLY_TO?.trim() || null;
  const timeoutMs = Number(process.env.SMTP_TIMEOUT_MS?.trim() || "20000");

  if (!host || !portValue || !user || !password || !fromEmail) {
    return null;
  }

  const port = Number(portValue);

  if (!Number.isFinite(port) || port <= 0) {
    return null;
  }

  return {
    host,
    port,
    secure: secureValue === "true" || port === 465,
    user,
    password,
    fromEmail,
    fromName,
    replyTo,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 20000
  };
}

function formatAddress(name: string, email: string) {
  return `${JSON.stringify(name)} <${email}>`;
}

export function isEmailDeliveryConfigured() {
  return Boolean(getEmailConfig());
}

export async function sendOrganizerApprovalEmail(input: ApprovalEmailInput) {
  const config = getEmailConfig();

  if (!config) {
    throw new Error("邮件发送未配置。请设置 SMTP_HOST、SMTP_PORT、SMTP_USER、SMTP_PASSWORD 和 SMTP_FROM_EMAIL。");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    connectionTimeout: config.timeoutMs,
    greetingTimeout: config.timeoutMs,
    socketTimeout: config.timeoutMs,
    auth: {
      user: config.user,
      pass: config.password
    }
  });

  const expiresAtText = input.expiresAt.toLocaleString("zh-CN");
  const subject = "你的主办方账号已获批准，请完成首次设密";
  const text = [
    `${input.contactName}，你好：`,
    "",
    `你为“${input.organizationName}”提交的主办方账号申请已经通过审批。`,
    "请打开下面的链接完成首次设密：",
    input.setupUrl,
    "",
    `该链接有效期至 ${expiresAtText}。`,
    "设密完成后，你就可以返回登录页进入正式工作台。",
    "",
    "如果链接失效，请联系平台管理员重新生成。",
    "",
    "羽毛球赛事资格核验工具"
  ].join("\n");

  const html = `
    <div style="font-family:Arial,'PingFang SC','Microsoft YaHei',sans-serif;color:#0f172a;line-height:1.7">
      <p>${input.contactName}，你好：</p>
      <p>你为“${input.organizationName}”提交的主办方账号申请已经通过审批。</p>
      <p>请点击下面的按钮完成首次设密：</p>
      <p style="margin:24px 0;">
        <a
          href="${input.setupUrl}"
          style="display:inline-block;padding:12px 20px;border-radius:14px;background:#10284b;color:#ffffff;text-decoration:none;font-weight:600;"
        >
          完成首次设密
        </a>
      </p>
      <p>如果按钮无法打开，也可以直接复制这个链接：</p>
      <p><a href="${input.setupUrl}">${input.setupUrl}</a></p>
      <p>该链接有效期至 ${expiresAtText}。</p>
      <p>设密完成后，你就可以返回登录页进入正式工作台。</p>
      <p>如果链接失效，请联系平台管理员重新生成。</p>
      <p style="margin-top:24px;">羽毛球赛事资格核验工具</p>
    </div>
  `.trim();

  await transporter.sendMail({
    from: formatAddress(config.fromName, config.fromEmail),
    replyTo: config.replyTo ?? undefined,
    to: input.to,
    subject,
    text,
    html
  });
}
