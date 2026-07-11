import { Resend } from "resend";
import { APP_NAME, EMAIL_FROM } from "./constants";

const FROM = EMAIL_FROM;
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  // Dev fallback: log to console when no API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n[Password Reset — dev mode]\nEmail: ${email}\nLink: ${resetUrl}\n`);
    return;
  }

  // Lazy-init so an empty key doesn't crash at module load time
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:40px 16px;">
    <div style="max-width:420px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 8px;color:#09090b;">
        Reset your password
      </h1>
      <p style="font-size:14px;color:#71717a;margin:0 0 24px;line-height:1.5;">
        Someone requested a password reset for your ${APP_NAME} account.
        Click the button below to choose a new password. This link expires in
        <strong>1 hour</strong>.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;background:#09090b;color:#fff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;">
        Reset password
      </a>
      <p style="font-size:12px;color:#a1a1aa;margin:24px 0 0;line-height:1.5;">
        If you didn&apos;t request this, you can safely ignore this email.
        Your password won&apos;t change until you click the link above.
      </p>
    </div>
  </body>
</html>`,
  });
}

export async function sendSharePageEmail(
  email: string,
  pageUrl: string,
  pageName: string,
  senderName: string,
  recipientName?: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(
      `\n[Share Page — dev mode]\nEmail: ${email}\nPage: ${pageName}\nSender: ${senderName}\nLink: ${pageUrl}\n`
    );
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${senderName} shared "${pageName}" with you`,
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:40px 16px;">
    <div style="max-width:420px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 8px;color:#09090b;">
        ${senderName} shared a page with you
      </h1>
      <p style="font-size:14px;color:#71717a;margin:0 0 24px;line-height:1.5;">
        ${greeting} <strong>${senderName}</strong> shared
        <strong>&ldquo;${pageName}&rdquo;</strong> with you on ${APP_NAME}.
      </p>
      <a href="${pageUrl}"
         style="display:inline-block;background:#09090b;color:#fff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;">
        View page
      </a>
      <p style="font-size:12px;color:#a1a1aa;margin:24px 0 0;line-height:1.5;">
        This link is unique to you. If you weren&apos;t expecting this, you can safely ignore this email.
      </p>
    </div>
  </body>
</html>`,
  });
}

export async function sendTeamInviteEmail(
  email: string,
  token: string,
  teamName: string,
  inviterName: string
): Promise<void> {
  const inviteUrl = `${APP_URL}/invite/${token}`;

  // Dev fallback: log to console when no API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.log(
      `\n[Team Invite — dev mode]\nEmail: ${email}\nTeam: ${teamName}\nInvited by: ${inviterName}\nLink: ${inviteUrl}\n`
    );
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${inviterName} invited you to join ${teamName} on ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:40px 16px;">
    <div style="max-width:420px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 8px;color:#09090b;">
        You&apos;re invited!
      </h1>
      <p style="font-size:14px;color:#71717a;margin:0 0 24px;line-height:1.5;">
        <strong>${inviterName}</strong> invited you to join
        <strong>${teamName}</strong> on ${APP_NAME}. Click the button below
        to accept the invitation. This link expires in
        <strong>7 days</strong>.
      </p>
      <a href="${inviteUrl}"
         style="display:inline-block;background:#09090b;color:#fff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;">
        Accept invitation
      </a>
      <p style="font-size:12px;color:#a1a1aa;margin:24px 0 0;line-height:1.5;">
        If you weren&apos;t expecting this invite, you can safely ignore this email.
      </p>
    </div>
  </body>
</html>`,
  });
}

export async function sendViewNotificationEmail(
  email: string,
  pageTitle: string,
  analyticsUrl: string,
  isReturn: boolean
): Promise<void> {
  const visitorLabel = isReturn ? "A returning visitor" : "A new visitor";

  if (!process.env.RESEND_API_KEY) {
    console.log(
      `\n[View Notification — dev mode]\nEmail: ${email}\nPage: ${pageTitle}\nVisitor: ${visitorLabel}\nAnalytics: ${analyticsUrl}\n`
    );
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${visitorLabel} is viewing "${pageTitle}"`,
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:40px 16px;">
    <div style="max-width:420px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 8px;color:#09090b;">
        ${visitorLabel} is on your page
      </h1>
      <p style="font-size:14px;color:#71717a;margin:0 0 24px;line-height:1.5;">
        Someone just opened <strong>&ldquo;${pageTitle}&rdquo;</strong>.
        Head to your analytics to see what they engage with.
      </p>
      <a href="${analyticsUrl}"
         style="display:inline-block;background:#09090b;color:#fff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;">
        View analytics
      </a>
      <p style="font-size:12px;color:#a1a1aa;margin:24px 0 0;line-height:1.5;">
        You&apos;re receiving this because view notifications are enabled for this
        page. Turn them off in the page&apos;s share settings.
      </p>
    </div>
  </body>
</html>`,
  });
}
