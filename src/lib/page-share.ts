/**
 * Sharing a page with named recipients: per-contact tracking links (`?ref=`)
 * so engagement is attributed to a person, optional share email, and a
 * mirror into the canonical Contacts book. Shared by
 * POST /api/pages/[id]/contacts and the MCP `share_page` tool.
 */
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { sendSharePageEmail } from "@/lib/email";
import { upsertContactFromActivity } from "@/lib/contacts";

export const MAX_SHARE_CONTACTS = 50;

export interface ShareContactInput {
  email: string;
  name?: string | null;
  company?: string | null;
}

export interface SharedContact {
  id: string;
  email: string;
  name: string | null;
  refToken: string;
  /** Absolute tracking link for this recipient. */
  link: string;
}

export interface SharePageOptions {
  page: {
    id: string;
    title: string;
    slug: string;
    teamId: string | null;
    userId: string;
  };
  contacts: ShareContactInput[];
  /** Send the share email via Resend (failures are logged, never thrown). */
  sendEmail: boolean;
  /** Shown in the email as the sender. */
  senderName: string;
  /** Origin used to build the links (derive from the request, not env). */
  appUrl: string;
}

export function trackingLink(appUrl: string, slug: string, refToken: string): string {
  return `${appUrl.replace(/\/$/, "")}/p/${slug}?ref=${refToken}`;
}

export async function sharePageWithContacts(
  opts: SharePageOptions
): Promise<SharedContact[]> {
  const { page } = opts;
  const created: SharedContact[] = [];

  // Sharing a room with someone is a capture moment — mirror each recipient
  // into the canonical Contacts book (fire-safe, never blocks the share).
  const crmScope = { teamId: page.teamId, userId: page.userId };

  for (const input of opts.contacts.slice(0, MAX_SHARE_CONTACTS)) {
    const email = input.email?.trim().toLowerCase();
    if (!email) continue;

    // companyName (not a pre-resolved id) so the company lookup also runs
    // inside the fire-safe wrapper and can't 500 the share mid-loop.
    await upsertContactFromActivity(crmScope, {
      email,
      name: typeof input.name === "string" ? input.name : null,
      companyName: typeof input.company === "string" ? input.company : null,
    });

    const contact = await prisma.pageContact.upsert({
      where: { pageId_email: { pageId: page.id, email } },
      update: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.company ? { company: input.company.trim() } : {}),
      },
      create: {
        pageId: page.id,
        email,
        name: input.name?.trim() ?? null,
        company: input.company?.trim() ?? null,
        refToken: nanoid(12),
      },
    });

    const link = trackingLink(opts.appUrl, page.slug, contact.refToken);
    created.push({
      id: contact.id,
      email: contact.email,
      name: contact.name,
      refToken: contact.refToken,
      link,
    });

    if (opts.sendEmail) {
      try {
        await sendSharePageEmail(
          email,
          link,
          page.title,
          opts.senderName,
          contact.name ?? undefined
        );
      } catch (err) {
        console.error(`[share] Failed to send email to ${email}:`, err);
      }
    }
  }

  // Record the share on the page's activity timeline / share stats.
  // One event per share action (not per contact) — this is a seller action,
  // so it's created here rather than exposed on the public event endpoint.
  if (created.length > 0) {
    await prisma.pageEvent.create({
      data: {
        pageId: page.id,
        type: "share",
        meta: JSON.stringify({ contacts: created.length }),
      },
    });
  }

  return created;
}
