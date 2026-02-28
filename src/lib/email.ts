import { Resend } from "resend";

const FROM = "SalesRoom <onboarding@resend.dev>";
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
    subject: "Reset your SalesRoom password",
    html: `
<!DOCTYPE html>
<html>
  <body style="font-family:sans-serif;background:#f4f4f5;margin:0;padding:40px 16px;">
    <div style="max-width:420px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 8px;color:#09090b;">
        Reset your password
      </h1>
      <p style="font-size:14px;color:#71717a;margin:0 0 24px;line-height:1.5;">
        Someone requested a password reset for your SalesRoom account.
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
    subject: `${inviterName} invited you to join ${teamName} on SalesRoom`,
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
        <strong>${teamName}</strong> on SalesRoom. Click the button below
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
