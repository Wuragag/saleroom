/**
 * Legal documents rendered at /legal/[slug] by src/components/marketing/LegalPage.tsx.
 *
 * Structured as data so every sentence is reviewable in one place. The facts
 * (what is collected, which cookies, which sub-processors) come from the code
 * inventory in docs/FEATURES.md → Privacy; keep them in step with the code.
 *
 * These documents were drafted to reflect the product as built. They are not
 * legal advice; have counsel review them before relying on them, and complete
 * the TODO fields in ./entity.ts.
 */
import { LEGAL } from "./entity"
import { CATEGORY_LABELS, STORAGE_ENTRIES } from "./cookies"
import { SUBPROCESSORS } from "./subprocessors"

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "note"; text: string }

export interface LegalSection {
  id?: string
  heading: string
  blocks: LegalBlock[]
}

export interface LegalDocument {
  slug: string
  lang: "en" | "tr"
  eyebrow: string
  title: string
  shortTitle: string
  summary: string
  effectiveLabel: string
  tocLabel: string
  relatedLabel: string
  sections: LegalSection[]
}

const p = (text: string): LegalBlock => ({ type: "p", text })
const ul = (...items: string[]): LegalBlock => ({ type: "ul", items })
const ol = (...items: string[]): LegalBlock => ({ type: "ol", items })
const note = (text: string): LegalBlock => ({ type: "note", text })
const table = (head: string[], rows: string[][]): LegalBlock => ({ type: "table", head, rows })

const B = LEGAL.brand
const kindLabel = { cookie: "Cookie", localStorage: "Browser storage" } as const

const storageRows = (category: "necessary" | "functional" | "analytics") =>
  STORAGE_ENTRIES.filter((e) => e.category === category).map((e) => [e.name, kindLabel[e.kind], e.surface, e.purpose, e.lifetime])

const subprocessorRows = SUBPROCESSORS.map((s) => [s.name, s.purpose, s.data, s.location, s.transfer])

/* ────────────────────────────────────────────────────────────────────── */
/* Privacy Policy                                                          */
/* ────────────────────────────────────────────────────────────────────── */
const privacy: LegalDocument = {
  slug: "privacy",
  lang: "en",
  eyebrow: "Legal",
  title: "Privacy Policy",
  shortTitle: "Privacy Policy",
  summary: `How ${B} handles personal data — for people who use ${B} to build deal pages, and for people who are sent one. Written to be read, not skimmed.`,
  effectiveLabel: "Effective",
  tocLabel: "Contents",
  relatedLabel: "Related",
  sections: [
    {
      heading: "Who we are and what this covers",
      blocks: [
        p(`${LEGAL.legalName} ("${B}", "we") operates the ${B} website and application at ${LEGAL.site}. Registered address: ${LEGAL.address}. Privacy questions and requests: ${LEGAL.privacyEmail}.`),
        p("This policy covers two groups of people, and our role differs for each:"),
        ul(
          `Account holders and website visitors — people who sign up for ${B}, or browse this website. For this data ${B} is the controller (under GDPR and UK GDPR), the "veri sorumlusu" (under Türkiye's KVKK), and the "business" (under US state privacy laws).`,
          `Buyers and other readers — people who open a deal page that a ${B} customer (a "seller") shared with them. The seller decides what to collect and why; ${B} processes that data on the seller's behalf as a processor ("veri işleyen", "service provider"). The section "If someone sent you a page" is written for you.`,
        ),
        p("We do not sell personal data, we do not share it for cross-context behavioural advertising, and we do not run advertising or third-party analytics trackers on any part of the service."),
      ],
    },
    {
      heading: "Data we collect from account holders",
      blocks: [
        table(
          ["What", "Examples", "Where it comes from"],
          [
            ["Account details", "Name, email address, password (stored only as a bcrypt hash), company, role, avatar image", "You, at sign-up and in Settings"],
            ["Workspace and content", "Pages and tabs you write, templates, synced blocks, brand kit (logo, colours, fonts), tags, cover images", "You, while using the editor"],
            ["Contacts and deals", "Buyer names, email addresses and companies you add to a page or a deal; stakeholders; deal values, stages, close dates; comments", "You and your team"],
            ["Documents for AI import", "Text extracted from PDF, DOCX or PPTX files you upload, and the instructions you type into AI Write", "You"],
            ["Billing", "Plan, subscription status, Stripe customer and subscription ids. Card details are entered on Stripe and never reach our servers", "You, via Stripe"],
            ["Technical and security data", "IP address and browser type in request and rate-limit logs, session token, sign-in attempts", "Your browser, automatically"],
            ["Support", "Anything you send us by email", "You"],
          ],
        ),
        p("We do not ask for, and you should not upload, special-category data (health, political opinions, biometrics and so on) or data about children."),
      ],
    },
    {
      id: "buyers",
      heading: "If someone sent you a page",
      blocks: [
        p(`A deal page is a web page a seller built in ${B} and shared with you by link. You do not need an account to open it, and you are not asked for anything unless the seller switched on a password or an email gate.`),
        p("When you open a page, the seller can see:"),
        ul(
          "That the page was opened, and when.",
          "Which tabs you viewed, how long each tab was actually visible in your browser (time in a background tab does not count), and how far down each section you scrolled.",
          "Clicks on buttons and links in the page, file downloads, and anything you submit through a form on the page.",
          "Whether the page was opened before from the same browser, using a random identifier your browser generates and stores locally. It is combined with the page id and hashed before it is stored, so the same browser looks different on every page and cannot be followed across pages.",
          "Your name and email address if the seller sent you a personal link, or if you entered them at an email gate. From then on your reads are shown next to your name. Your name may also appear on the page itself if the seller personalised it.",
          "An engagement score (0–100) and a label — High Intent, Warm or Cold — computed from the activity above. It is a heuristic to help the seller prioritise follow-up; no decision with legal or similarly significant effect on you is made from it.",
        ),
        p("What is not collected: your IP address and browser identity are read only to block bots and to rate-limit abuse; they are not stored against your visit. There are no advertising cookies, no third-party analytics and no fingerprinting."),
        p("Session replay. A seller can switch on session replay for a page. It records the page as it looked on your screen together with scrolling and cursor movement, so the seller can watch how the page was read. Text you type into any form field is always masked, and the personalised greeting is masked too. Replay runs only if you click \"Allow recording\" in the notice at the bottom of the page. Choosing \"No thanks\", or having the Global Privacy Control signal switched on in your browser, keeps it off, and your answer is remembered for that page in your browser."),
        p("Embedded content. A seller may embed a video, document or calendar from YouTube, Vimeo, Loom, Google, Airtable or Calendly. When such an embed loads, that provider receives your IP address and may set its own cookies under its own privacy policy. We use YouTube's privacy-enhanced domain, which does not set cookies until you play the video."),
        p(`Your rights over this data. The seller is responsible for it, so the fastest route is to contact the seller: their name and email are in the message that brought you the link. You can also write to ${LEGAL.privacyEmail}; we will act on the seller's instructions or, where we must, directly. See "Your rights" below.`),
        note("The seller is required, under our Terms, to have a lawful basis for reading analytics (usually its legitimate interest in following up on a live proposal) and to respect your objections. If you believe a seller is using this data unlawfully, tell us."),
      ],
    },
    {
      heading: "Why we use data and on what legal basis",
      blocks: [
        table(
          ["Purpose", "Data", "Legal basis (GDPR / UK GDPR)", "KVKK basis (Law 6698, Art. 5)"],
          [
            ["Providing the service: accounts, editor, sharing, deals, notifications", "Account, workspace, contacts, technical", "Performance of a contract (Art. 6(1)(b))", "Necessary for the performance of a contract (5/2-c)"],
            ["Billing and tax records", "Account, billing", "Contract; legal obligation (Art. 6(1)(c))", "Legal obligation (5/2-ç); contract (5/2-c)"],
            ["Reading analytics on a seller's page", "Buyer data described above", "Processed on the seller's behalf. The seller's basis is normally its legitimate interest (Art. 6(1)(f)) in following up a proposal it sent", "Seller's legitimate interest (5/2-f); ${B} acts as veri işleyen"],
            ["Session replay on a seller's page", "Replay recording", "Consent of the reader (Art. 6(1)(a)), given in the page notice and withdrawable at any time", "Explicit consent (5/1)"],
            ["AI Write and document import", "Instructions, page content, uploaded document text", "Contract — you asked for the feature", "Contract (5/2-c)"],
            ["Security, abuse prevention, rate limiting", "Technical", "Legitimate interest (Art. 6(1)(f)) in keeping the service safe", "Legitimate interest (5/2-f)"],
            ["Service emails: password reset, invitations, share emails you send, view notifications you enable", "Email addresses", "Contract; legitimate interest", "Contract (5/2-c)"],
            ["Complying with law and enforcing our terms", "Any of the above, as needed", "Legal obligation; legitimate interest", "Legal obligation (5/2-ç)"],
          ],
        ),
        p("We do not use your content, your buyers' data or your uploaded documents to train machine-learning models, and our AI provider is contractually barred from doing so."),
      ],
    },
    {
      heading: "Cookies and browser storage",
      blocks: [
        p("The website and the app set only strictly necessary cookies (keeping you signed in, protecting forms) and store a few interface preferences in your browser. Deal pages additionally keep the random reading identifier and your replay answer described above. There is no consent banner on the website because nothing on it needs consent; deal pages show a notice instead."),
        p("The full list, with names and lifetimes, is on the Cookies & storage page. You can clear or block all of it in your browser; the app will still work, you will just be signed out and asked again."),
      ],
    },
    {
      heading: "Who we share data with",
      blocks: [
        p("Sellers and their teams. Data collected on a page is shown to the seller who shared it and to members of the seller's workspace who can see that page."),
        p("Service providers (sub-processors). We use a small number of companies to run the service. Each processes data only on our instructions, under a written contract, and only for the purpose listed:"),
        table(["Provider", "Purpose", "Data", "Location", "Transfer safeguard"], subprocessorRows),
        p("Legal requests and protection. We disclose data when the law requires it, or when necessary to protect the rights, safety or property of a person or of the service. We will tell you unless we are legally prevented from doing so."),
        p("Business transfers. If the company is acquired or merges, data may transfer to the successor, who will be bound by this policy."),
        p("We do not sell personal data and never have."),
      ],
    },
    {
      heading: "International transfers",
      blocks: [
        p("Our sub-processors are established in the United States or store data in the region we select at deployment. Where data leaves the European Economic Area, the United Kingdom or Türkiye, we rely on:"),
        ul(
          "The European Commission's Standard Contractual Clauses (2021/914) and, for UK data, the UK International Data Transfer Addendum, with each provider.",
          "The EU-US Data Privacy Framework where the provider is certified.",
          "For data of persons in Türkiye: the mechanisms in KVKK Article 9 as amended in 2024 — an adequacy decision of the Personal Data Protection Board where one exists, otherwise the standard contract published by the Board or, failing those, your explicit consent. Details are in the KVKK Aydınlatma Metni.",
        ),
      ],
    },
    {
      heading: "How long we keep data",
      blocks: [
        table(
          ["Data", "Kept for"],
          [
            ["Account and workspace", "Until you delete your account (Settings → Account → Delete account) or ask us to. Deletion removes your pages and everything collected on them."],
            ["Pages, contacts, deals and the reading data on a page", "Until the seller deletes the page, the contact or the deal, or deletes the account. Sellers are responsible for removing pages once a deal has closed; we recommend doing so within 12 months."],
            ["Session replay recordings", "Deleted with the page or the visitor. Capped at about 40 minutes per session."],
            ["Form submissions", "Until the page is deleted or the seller deletes the submission."],
            ["Password-reset tokens", "1 hour"],
            ["Team invitations", "7 days"],
            ["Personal-link cookie on a deal page", "30 days"],
            ["Sign-in session", "30 days, or until you sign out"],
            ["Rate-limit counters", "Minutes"],
            ["Hosting request logs", "As set by our hosting provider, typically days to a few weeks"],
            ["Billing records at Stripe", "As long as tax and accounting law requires, typically 7 to 10 years"],
          ],
        ),
        note("We do not currently apply automatic expiry to reading analytics. If you want a shorter retention for your workspace, delete pages when deals close, or write to us and we will remove data on request."),
      ],
    },
    {
      heading: "Your rights",
      blocks: [
        p("Wherever you are, you can ask us what data we hold about you, get a copy of it, correct it, have it deleted, restrict or object to how we use it, and withdraw any consent you gave. Depending on where you live you also have the specific rights below."),
        p("European Economic Area, United Kingdom, Switzerland (GDPR / UK GDPR / FADP): access, rectification, erasure, restriction, portability, objection, the right not to be subject to solely automated decisions with legal effect, and the right to lodge a complaint with your supervisory authority (in the EU, the authority of your member state; in the UK, the ICO)."),
        p("Türkiye (KVKK Article 11): the rights listed, in Turkish, in the KVKK Aydınlatma Metni, including learning whether your data is processed, requesting correction or deletion, objecting to results produced by automated analysis, and claiming compensation for unlawful processing. Applications are handled within 30 days."),
        p("United States: see the US state privacy notice below."),
        p("How to exercise them:"),
        ul(
          "Account holders: Settings → Account. \"Download my data\" gives you a JSON export of your profile, pages, contacts and deals; \"Delete account\" erases your account after you confirm with your password.",
          `Everyone: email ${LEGAL.privacyEmail}. We may ask you to confirm your identity (for example by replying from the address on file). We answer within one month, extendable by two months for complex requests, and we will tell you if that happens. Requests are free unless manifestly unfounded or excessive.`,
          "Readers of a deal page: contact the seller who shared it, or us; we will coordinate with the seller.",
        ),
        p("We will not treat you differently for exercising a right."),
      ],
    },
    {
      heading: "Security",
      blocks: [
        ul(
          "All traffic is encrypted in transit (HTTPS, HSTS). Passwords are hashed with bcrypt. Page passwords are hashed; access cookies are signed.",
          "Personal links and impersonation tokens are single-purpose, signed and time-limited. Access to pages, analytics and recordings is checked server-side on every request against your workspace and role.",
          "Session recordings are stored in our database, not in public file storage, and are viewable only by the seller's workspace.",
          "Uploads are type- and size-checked; page content is sanitised before it is served; a strict Content Security Policy limits what can load on a page.",
          "If we learn of a breach affecting your data we will notify the relevant authority and, where required, you, without undue delay and within the deadlines the law sets.",
        ),
      ],
    },
    {
      heading: "Children",
      blocks: [p(`${B} is a business tool. It is not directed at children, and we do not knowingly collect data from anyone under 16 (or under 13 in the United States). If you believe a child has given us data, tell us and we will delete it.`)],
    },
    {
      id: "us-state-privacy",
      heading: "US state privacy notice (California, Colorado, Connecticut, Virginia, Utah, Texas, Oregon and others)",
      blocks: [
        p("This section supplements the policy for residents of US states with comprehensive privacy laws, including the California Consumer Privacy Act as amended by the CPRA. Terms used here have the meaning given in those laws."),
        p("Categories of personal information we collect, and have collected in the last 12 months:"),
        table(
          ["Category", "Collected", "Examples", "Purpose", "Disclosed to"],
          [
            ["Identifiers", "Yes", "Name, email, IP address (transient), account id", "Provide the service, security", "Service providers (hosting, database, email, billing)"],
            ["Customer records", "Yes", "Company, billing status", "Billing, support", "Service providers (Stripe)"],
            ["Commercial information", "Yes", "Plan purchased, pages created", "Provide the service", "Service providers"],
            ["Internet or network activity", "Yes", "Pages viewed, time on tabs, scroll depth, clicks — on deal pages, on behalf of the seller", "Reading analytics for the seller", "The seller who shared the page; service providers"],
            ["Professional information", "Yes", "Role, company, title (as entered by you or a seller)", "Provide the service", "Service providers"],
            ["Inferences", "Yes", "Engagement score and intent label on a deal page", "Help the seller prioritise follow-up", "The seller; service providers"],
            ["Audio/visual, geolocation, biometric, sensitive PI", "No", "—", "—", "—"],
          ],
        ),
        p("Sources: you; your browser; the seller who added your details to a page or deal. We keep each category for the periods in \"How long we keep data\"."),
        p("Sale and sharing: we do not sell personal information and we do not share it for cross-context behavioural advertising, and have not done so in the preceding 12 months. We do not use or disclose sensitive personal information for purposes that would trigger a right to limit. We have no actual knowledge of selling or sharing the personal information of consumers under 16."),
        p("Your rights: to know and access the personal information we hold; to delete it; to correct it; to obtain it in a portable format; to opt out of sale, sharing, targeted advertising and profiling in furtherance of decisions with legal or similarly significant effects (none of which we do); and not to be discriminated against for exercising these rights."),
        p(`How to exercise them: Settings → Account (export or delete), or email ${LEGAL.privacyEmail}. We verify requests by matching the email address on the account or, for readers of a page, through the seller who shared it. You may use an authorised agent; we will ask for proof of the authorisation and may confirm with you directly. We respond within 45 days, extendable once by 45 days with notice.`),
        p("Global Privacy Control: we honour the GPC browser signal. On deal pages it keeps session replay off without asking. Because we do not sell or share personal information, GPC has no further effect."),
        p("California \"Shine the Light\" (Civil Code §1798.83): we do not disclose personal information to third parties for their own direct marketing. Nevada residents: we do not sell covered information as defined in NRS 603A."),
        note("Deal pages are processed on behalf of the seller who shared them, who is the \"business\" for that data; we act as its service provider. Requests about a specific page can be addressed to the seller or to us."),
      ],
    },
    {
      heading: "Türkiye (KVKK)",
      blocks: [
        p(`The Turkish disclosure required by Article 10 of Law No. 6698, including the data subject application procedure, is published at /legal/kvkk. ${LEGAL.verbisNo ? `VERBİS registration: ${LEGAL.verbisNo}.` : "VERBİS registration status is noted there."}`),
      ],
    },
    {
      heading: "Changes and contact",
      blocks: [
        p("We will post changes here and update the effective date. For material changes we will notify account holders by email or in the app before they take effect."),
        p(`Contact: ${LEGAL.privacyEmail} · ${LEGAL.legalName}, ${LEGAL.address}.${LEGAL.euRepresentative ? ` EU representative: ${LEGAL.euRepresentative}.` : ""}${LEGAL.ukRepresentative ? ` UK representative: ${LEGAL.ukRepresentative}.` : ""}`),
      ],
    },
  ],
}

/* ────────────────────────────────────────────────────────────────────── */
/* Terms of Service                                                        */
/* ────────────────────────────────────────────────────────────────────── */
const terms: LegalDocument = {
  slug: "terms",
  lang: "en",
  eyebrow: "Legal",
  title: "Terms of Service",
  shortTitle: "Terms of Service",
  summary: `The agreement between you and ${B} when you create a workspace. Short on purpose.`,
  effectiveLabel: "Effective",
  tocLabel: "Contents",
  relatedLabel: "Related",
  sections: [
    { heading: "The agreement", blocks: [p(`These terms are a contract between ${LEGAL.legalName} ("${B}", "we") and the person or company that creates a workspace ("you"). By creating a workspace you accept them, together with the Privacy Policy and, if you process personal data of people in the EU, UK or Türkiye, the Data Processing Addendum. If you sign up on behalf of a company, you confirm you may bind it.`)] },
    { heading: "Your account", blocks: [ul("You must be at least 18 and give accurate details.", "You are responsible for your password and for everything done in your workspace. Tell us at once if you suspect unauthorised use.", "One person, one account. Team members join your workspace by invitation and are your responsibility.")] },
    {
      heading: "Your content and your buyers' data",
      blocks: [
        p("You own the pages, documents and data you put into the service. You grant us the licence needed to host, display, process and back them up in order to run the service, and no more."),
        p("When you share a page, we collect reading data from the people who open it and show it to you. For that data you are the controller (or \"business\") and we are your processor (or \"service provider\"). You agree to:"),
        ul(
          "Have a lawful basis for collecting it — normally your legitimate interest in following up on a proposal you sent — and be able to explain it.",
          "Not remove or hide the privacy notice and privacy link on published pages, and not switch on session replay where the law of your buyer's country or your own policies forbid it.",
          "Respect objections and requests from your buyers: delete a contact or a page when asked, and tell us if you need help.",
          "Not upload content that is unlawful, infringing, defamatory, or that contains special-category data or data about children.",
          "Not put credentials, payment card numbers or health data into pages, forms or AI prompts.",
        ),
      ],
    },
    { heading: "Acceptable use", blocks: [ul("No phishing, malware, spam or deceptive pages that impersonate someone else.", "No scraping, reverse engineering, load testing or attempts to defeat rate limits, access controls or plan limits.", "No use that breaks a law that applies to you or to your buyers.", "We may suspend or remove content or accounts that breach these terms, and will tell you why unless we cannot.")] },
    {
      heading: "Plans, billing and cancellation",
      blocks: [
        ul(
          "Free is free, with the limits shown on the pricing page. Pro and Team are billed monthly in advance through Stripe at the flat price shown; there are no per-seat fees.",
          "Plan limits (pages, tabs, members, synced blocks, open deals, AI credits) are enforced by the service and described on the pricing page.",
          "You can cancel any time from Settings → Billing; the plan stays active until the end of the period you paid for. We do not refund partial months unless the law requires it.",
          "Prices may change with at least 30 days' notice by email; the change applies from your next billing period.",
          "Taxes are added where required.",
        ),
      ],
    },
    { heading: "AI features", blocks: [p("AI Write and document import send your instructions, the page being edited and the text of documents you upload to our AI provider (Anthropic) to produce a draft. Drafts can be wrong, incomplete or generic; you are responsible for reviewing anything you publish. AI usage is metered by monthly credits per plan. Your inputs are not used to train models.")] },
    { heading: "Intellectual property", blocks: [p(`${B}, its software, design, templates and brand are ours or our licensors'. You may use them only through the service. Feedback you give us may be used without obligation. Templates we provide may be used in your pages; you may not resell them as templates.`)] },
    { heading: "Availability and changes", blocks: [p("We aim for high availability but do not promise uninterrupted service. We may change or retire features; if a change materially reduces what you paid for, you may cancel and we will refund the unused part of the current period.")] },
    { heading: "Termination and data", blocks: [ul("You can delete your account at any time from Settings → Account. Deletion is immediate and irreversible: your pages, buyer data, contacts and deals are removed, and any paid subscription on a workspace you alone own is cancelled.", "We may terminate for breach with notice, or immediately for serious breach. Where lawful, we will give you a chance to export your data first.", "Billing records are kept by our payment provider for as long as tax law requires.")] },
    { heading: "Disclaimers", blocks: [p("The service is provided \"as is\". To the extent the law allows, we disclaim implied warranties of merchantability, fitness for a particular purpose and non-infringement. Engagement scores and intent labels are heuristics, not facts; do not make decisions with legal or significant effects on a person based on them alone.")] },
    { heading: "Limitation of liability", blocks: [p(`To the extent the law allows, ${B} is not liable for indirect, incidental, special or consequential losses, or for lost profits, revenue or data, and our total liability under these terms in any 12-month period is limited to the amount you paid us in that period (or, for Free, to 100 EUR/USD). Nothing limits liability for fraud, wilful misconduct, death or personal injury, or anything that cannot be limited by law. Consumers keep their statutory rights.`)] },
    { heading: "Governing law and disputes", blocks: [p(`These terms are governed by the laws of ${LEGAL.country}, and its courts have jurisdiction, without prejudice to mandatory consumer protections in your country of residence. We will try to resolve any dispute informally first; write to ${LEGAL.supportEmail}.`)] },
    { heading: "Changes to these terms", blocks: [p("We will post changes here and update the effective date. For material changes we will email account holders at least 14 days before they take effect; continuing to use the service after that date means you accept them.")] },
    { heading: "Contact", blocks: [p(`${LEGAL.legalName}, ${LEGAL.address} · ${LEGAL.supportEmail}`)] },
  ],
}

/* ────────────────────────────────────────────────────────────────────── */
/* Cookies & storage                                                       */
/* ────────────────────────────────────────────────────────────────────── */
const cookies: LegalDocument = {
  slug: "cookies",
  lang: "en",
  eyebrow: "Legal",
  title: "Cookies & browser storage",
  shortTitle: "Cookies & storage",
  summary: `Every cookie and browser-storage key ${B} sets, by name, with what it is for and how long it lasts. No advertising cookies, no third-party trackers.`,
  effectiveLabel: "Effective",
  tocLabel: "Contents",
  relatedLabel: "Related",
  sections: [
    {
      heading: "Why there is no cookie banner",
      blocks: [
        p("EU ePrivacy rules require consent for cookies and similar storage unless they are strictly necessary for a service you asked for. Everything the website and the app store falls into that category or is a preference you set yourself, so the website shows no banner."),
        p("Deal pages shared by a seller store a random reading identifier and, if the seller switched it on, your answer to the session-replay question. Those pages show a notice at the bottom instead of a banner: reading analytics are explained there, and session replay only starts if you allow it."),
      ],
    },
    { heading: CATEGORY_LABELS.necessary.title, blocks: [p(CATEGORY_LABELS.necessary.body), table(["Name", "Type", "Where", "Purpose", "Lifetime"], storageRows("necessary"))] },
    { heading: CATEGORY_LABELS.functional.title, blocks: [p(CATEGORY_LABELS.functional.body), table(["Name", "Type", "Where", "Purpose", "Lifetime"], storageRows("functional"))] },
    { heading: CATEGORY_LABELS.analytics.title, blocks: [p(CATEGORY_LABELS.analytics.body), table(["Name", "Type", "Where", "Purpose", "Lifetime"], storageRows("analytics"))] },
    {
      heading: "Third-party content",
      blocks: [
        p("The website and app load no third-party scripts, fonts or images. Published deal pages load the fonts the seller chose from Google Fonts, and may contain embeds (YouTube in privacy-enhanced mode, Vimeo, Loom, Google Docs, Airtable, Calendly) that set their own cookies under their own policies once they load."),
      ],
    },
    {
      heading: "How to control this",
      blocks: [
        ul(
          "Clear or block cookies and site data in your browser settings. The app will sign you out and forget your preferences; deal pages will treat you as a new reader.",
          "Switch on Global Privacy Control in a supporting browser or extension; deal pages then never ask about session replay.",
          "On a deal page, choose \"No thanks\" when asked about replay. Your answer is stored only in your browser and can be reset by clearing site data.",
        ),
      ],
    },
    { heading: "Changes", blocks: [p("This list is generated from the same source the software uses, so it changes only when the software does. The effective date above marks the last change.")] },
  ],
}

/* ────────────────────────────────────────────────────────────────────── */
/* Data Processing Addendum                                                */
/* ────────────────────────────────────────────────────────────────────── */
const dpa: LegalDocument = {
  slug: "dpa",
  lang: "en",
  eyebrow: "Legal",
  title: "Data Processing Addendum",
  shortTitle: "Data Processing Addendum",
  summary: `The processor terms that apply automatically when a customer uses ${B} to process personal data of people in the EU, UK, Switzerland or Türkiye. Includes the sub-processor list.`,
  effectiveLabel: "Effective",
  tocLabel: "Contents",
  relatedLabel: "Related",
  sections: [
    { heading: "Scope and roles", blocks: [p(`This Addendum forms part of the Terms of Service between the customer ("Customer") and ${LEGAL.legalName} ("${B}"). It applies wherever ${B} processes personal data on Customer's behalf — above all the reading data of people who open Customer's deal pages, and the contacts and stakeholders Customer records. For that data Customer is the controller and ${B} the processor within the meaning of Article 28 GDPR, the equivalent UK GDPR provisions, and KVKK Articles 3 and 12 (veri sorumlusu / veri işleyen). It does not apply to Customer's own account data, for which ${B} is an independent controller under the Privacy Policy.`)] },
    {
      heading: "Details of the processing",
      blocks: [
        table(
          ["Item", "Description"],
          [
            ["Subject matter", `Provision of the ${B} service: hosting deal pages, collecting reading analytics, storing contacts, deals and action plans.`],
            ["Duration", "For as long as Customer has a workspace, plus the deletion period below."],
            ["Nature and purpose", "Storage, display, analysis of reading behaviour and notification, so that Customer can follow up on proposals it sent."],
            ["Data subjects", "Customer's prospective and existing customers, their employees and other people Customer shares a page with; Customer's own team members."],
            ["Categories of data", "Name, email, company and title; page opens, tab dwell time, scroll depth, clicks, downloads, form submissions; engagement score and intent label; optional session replay (with inputs masked); the random per-browser identifier."],
            ["Special categories", "None intended. Customer must not collect them through the service."],
          ],
        ),
      ],
    },
    { heading: "Instructions", blocks: [p(`${B} processes personal data only on Customer's documented instructions, which are: the Terms, this Addendum, and Customer's use of the service's features (sharing a page, enabling replay, adding a contact). ${B} will inform Customer if it believes an instruction infringes data protection law. ${B} does not process this data for its own purposes and does not sell it.`)] },
    { heading: "Confidentiality and personnel", blocks: [p(`People authorised by ${B} to access personal data are bound by confidentiality and receive appropriate training. Access is limited to what operating and supporting the service requires.`)] },
    {
      heading: "Security measures",
      blocks: [
        ul(
          "Encryption in transit (TLS 1.2+, HSTS); encryption at rest by our database and storage providers.",
          "Password hashing (bcrypt, cost 12); signed, time-limited, single-use tokens for sensitive links; HMAC-signed access cookies.",
          "Server-side authorisation on every request: page, analytics and recording access is checked against workspace membership and role. Administrative privileges are re-verified from the database on each privileged action.",
          "Session recordings stored in the database with the same access control as analytics; never in public storage. All text inputs masked at capture.",
          "Rate limiting on authentication, uploads, AI, forms and analytics endpoints; bot filtering on analytics writes.",
          "Content sanitisation (DOMPurify) for all published HTML; strict Content Security Policy; upload type/size validation and decompression-bomb guards.",
          "Plan-limit and resource-creation checks executed atomically to prevent race conditions.",
          "Logical separation of workspaces (multi-tenant authorisation); backups managed by the database provider.",
        ),
      ],
    },
    {
      heading: "Sub-processors",
      blocks: [
        p("Customer authorises the sub-processors below. We will give at least 30 days' notice by email or in-app before adding or replacing one; Customer may object on reasonable data-protection grounds, and if we cannot resolve the objection Customer may terminate the affected service and receive a pro-rata refund."),
        table(["Provider", "Purpose", "Data", "Location", "Transfer safeguard"], subprocessorRows),
      ],
    },
    { heading: "Assistance to Customer", blocks: [ul(`${B} will help Customer respond to data-subject requests (access, deletion, objection) relating to data in the service; most can be handled by Customer directly by deleting a contact, a page or a recording.`, `${B} will provide the information reasonably needed for Customer's data protection impact assessments and prior consultations.`, `${B} will forward to Customer, without undue delay, any request it receives directly from a data subject about Customer's pages, unless the law requires ${B} to act itself.`)] },
    { heading: "Personal data breach", blocks: [p(`${B} will notify Customer without undue delay, and in any event within 72 hours, after becoming aware of a personal data breach affecting Customer's data, with the information available at the time and updates as the investigation progresses, so that Customer can meet its own notification duties.`)] },
    { heading: "Deletion and return", blocks: [p("Customer can export its data at any time (Settings → Account → Download my data) and delete pages, contacts, recordings and its account. On account deletion all Customer data is erased from the production database immediately; backups held by the database provider expire on their own schedule (currently within 30 days). Data required to be kept by law (billing) is retained only for that purpose.")] },
    { heading: "Audits", blocks: [p(`${B} will make available the information necessary to demonstrate compliance with this Addendum, and will allow for and contribute to audits, including inspections, conducted by Customer or an auditor mandated by Customer, at most once a year (or after a breach), on 30 days' notice, during business hours, under confidentiality and at Customer's cost, in a manner that does not compromise the security of other customers. Third-party reports of our sub-processors are provided in place of on-site inspections of them.`)] },
    { heading: "International transfers", blocks: [p("Where the processing involves a transfer from the EEA, the UK or Switzerland to a country without an adequacy decision, the parties agree to the EU Standard Contractual Clauses (Decision 2021/914), Module Two (controller to processor) or Module Three (processor to processor) as applicable, with the UK Addendum for UK data and the Swiss amendments for Swiss data, which are incorporated by reference; Annex I is completed by the details above and Annex II by the security measures above. For transfers from Türkiye the parties rely on the mechanisms in KVKK Article 9 (Board adequacy decision, the Board's standard contract, or explicit consent obtained by Customer).")] },
    { heading: "Liability and precedence", blocks: [p("Each party's liability under this Addendum is subject to the limitations in the Terms, except where the law does not allow that. In case of conflict, this Addendum prevails over the Terms for the processing it covers, and the Standard Contractual Clauses prevail over this Addendum.")] },
    { heading: "Execution", blocks: [p(`This Addendum applies automatically by using the service. Customers who need a countersigned copy, or their own signed SCCs, can request one at ${LEGAL.privacyEmail}.`)] },
  ],
}

/* ────────────────────────────────────────────────────────────────────── */
/* KVKK Aydınlatma Metni (Turkish)                                         */
/* ────────────────────────────────────────────────────────────────────── */
const kvkk: LegalDocument = {
  slug: "kvkk",
  lang: "tr",
  eyebrow: "Hukuki",
  title: "Kişisel Verilerin Korunması Hakkında Aydınlatma Metni",
  shortTitle: "KVKK Aydınlatma Metni",
  summary: `6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 10. maddesi uyarınca, ${B}'i kullanan hesap sahiplerine ve kendilerine bir sayfa gönderilen alıcılara yönelik aydınlatma metni.`,
  effectiveLabel: "Yürürlük tarihi:",
  tocLabel: "İçindekiler",
  relatedLabel: "İlgili belgeler",
  sections: [
    {
      heading: "Veri sorumlusu",
      blocks: [
        p(`Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca, veri sorumlusu sıfatıyla ${LEGAL.legalName} ("${B}") tarafından hazırlanmıştır. Adres: ${LEGAL.address}. İletişim: ${LEGAL.privacyEmail}.${LEGAL.verbisNo ? ` VERBİS kayıt numarası: ${LEGAL.verbisNo}.` : ""}`),
        p(`${B}, satış ekiplerinin teklif, fiyatlandırma ve sonraki adımları tek bir bağlantı ("anlaşma sayfası") halinde paylaşmasını ve bu sayfanın nasıl okunduğunu görmesini sağlayan bir yazılım hizmetidir. İki farklı ilgili kişi grubu bulunmaktadır: (i) ${B}'de hesap açan kullanıcılar ve web sitesi ziyaretçileri — bu veriler bakımından ${B} veri sorumlusudur; (ii) bir ${B} müşterisi ("satıcı") tarafından kendisine sayfa gönderilen alıcılar — bu veriler bakımından veri sorumlusu satıcı olup ${B}, satıcı adına hareket eden veri işleyendir.`),
      ],
    },
    {
      heading: "İşlenen kişisel veriler",
      blocks: [
        table(
          ["Veri kategorisi", "Hesap sahipleri", "Sayfa alıcıları"],
          [
            ["Kimlik ve iletişim", "Ad, soyad, e-posta adresi, şirket, unvan, profil fotoğrafı", "Satıcı tarafından eklenmişse veya e-posta kapısında girilmişse ad ve e-posta adresi; satıcı sayfayı kişiselleştirmişse ad"],
            ["Müşteri işlem", "Plan, abonelik durumu, Stripe müşteri numarası (kart bilgileri ${B} sunucularına ulaşmaz)", "—"],
            ["İçerik", "Oluşturulan sayfalar, yüklenen belgelerin metni, kişiler, anlaşmalar, yorumlar", "Sayfadaki formlara girilen bilgiler"],
            ["İşlem güvenliği", "IP adresi ve tarayıcı bilgisi (istek ve hız sınırı kayıtlarında, geçici), oturum çerezi", "IP adresi ve tarayıcı bilgisi yalnızca bot tespiti ve hız sınırı için okunur, ziyaretle birlikte saklanmaz"],
            ["Kullanım / davranış", "—", "Sayfanın açılma zamanı, görüntülenen sekmeler ve görünür kalma süresi, kaydırma derinliği, tıklamalar, indirmeler; tarayıcıda oluşturulan rastgele tanımlayıcının sayfa kimliğiyle birlikte özetlenmiş (hash) hali; etkileşim puanı ve etiketi (Yüksek İlgi / Ilık / Soğuk)"],
            ["Oturum kaydı (isteğe bağlı)", "—", "Satıcı açmış ve alıcı sayfadaki bildirimde \"Kaydı izin ver\" seçeneğini seçmişse, sayfanın ekrandaki görünümü ile kaydırma ve imleç hareketleri; form alanlarına yazılanlar ve kişiselleştirilmiş metinler her zaman maskelenir"],
          ],
        ),
        p(`${B} özel nitelikli kişisel veri talep etmez; kullanıcılar bu tür verileri sayfalara, formlara veya yapay zekâ komutlarına eklememelidir.`),
      ],
    },
    {
      heading: "İşleme amaçları ve hukuki sebepler",
      blocks: [
        table(
          ["Amaç", "Hukuki sebep (KVKK m. 5)"],
          [
            ["Hesabın oluşturulması, hizmetin sunulması, sayfaların yayınlanması ve paylaşılması, bildirimlerin gönderilmesi", "Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (m. 5/2-c)"],
            ["Faturalandırma ve mali kayıtların tutulması", "Hukuki yükümlülüğün yerine getirilmesi (m. 5/2-ç); sözleşmenin ifası (m. 5/2-c)"],
            ["Satıcı adına sayfa okuma analitiği", "Satıcının meşru menfaati (m. 5/2-f); ${B} veri işleyen sıfatıyla satıcının talimatıyla işler"],
            ["Oturum kaydı", "İlgili kişinin açık rızası (m. 5/1); rıza sayfadaki bildirim aracılığıyla alınır ve her zaman geri alınabilir"],
            ["Yapay zekâ ile taslak oluşturma ve belge içe aktarma", "Sözleşmenin ifası (m. 5/2-c)"],
            ["Hizmet güvenliği, kötüye kullanımın önlenmesi, hız sınırlama", "Veri sorumlusunun meşru menfaati (m. 5/2-f)"],
            ["Hukuki taleplerin karşılanması", "Hukuki yükümlülük (m. 5/2-ç); bir hakkın tesisi, kullanılması veya korunması (m. 5/2-e)"],
          ],
        ),
      ],
    },
    { heading: "Toplama yöntemi", blocks: [p("Kişisel veriler; kayıt ve ayar formları, düzenleyici ve paylaşım ekranları, yüklenen belgeler, e-posta yazışmaları aracılığıyla doğrudan ilgili kişiden; sayfa alıcıları bakımından satıcının girdiği bilgilerden ve sayfanın tarayıcıda görüntülenmesi sırasında otomatik yollarla (tarayıcıda çalışan ölçüm kodu) elektronik ortamda toplanmaktadır.")] },
    {
      heading: "Kişisel verilerin aktarılması",
      blocks: [
        p("Yurt içi aktarım: Sayfa alıcılarının okuma verileri, sayfayı paylaşan satıcıya ve satıcının çalışma alanındaki yetkili ekip üyelerine gösterilir. Hukuken yetkili kurum ve kuruluşlara, talep halinde ve mevzuatın gerektirdiği ölçüde aktarım yapılabilir."),
        p("Yurt dışına aktarım: Hizmetin sunulması için kullanılan veri tabanı, barındırma, e-posta, ödeme, hız sınırlama, yapay zekâ ve yazı tipi sağlayıcıları yurt dışında (ağırlıklı olarak Amerika Birleşik Devletleri veya Avrupa Birliği) bulunmaktadır. Bu aktarımlar KVKK'nın 9. maddesi kapsamında; Kişisel Verileri Koruma Kurulu'nca ilan edilen yeterlilik kararı bulunan ülkeler bakımından bu karara, bulunmayan ülkeler bakımından Kurul tarafından yayımlanan standart sözleşmeye (veya Kurul onaylı bağlayıcı şirket kurallarına / yazılı taahhütnameye), bunların bulunmadığı istisnai hallerde ise ilgili kişinin açık rızasına dayanılarak gerçekleştirilir. Alıcı grupları:"),
        table(["Sağlayıcı", "Amaç", "Aktarılan veri", "Ülke"], SUBPROCESSORS.map((s) => [s.name, s.purpose, s.data, s.location])),
      ],
    },
    {
      heading: "Saklama süreleri",
      blocks: [
        ul(
          "Hesap ve çalışma alanı verileri: hesap silinene kadar (Ayarlar → Hesap → Hesabı sil) veya talep üzerine.",
          "Sayfalar, kişiler, anlaşmalar ve sayfa okuma verileri: satıcı ilgili sayfayı, kişiyi veya anlaşmayı silene ya da hesabını kapatana kadar. Satıcılara, anlaşma kapandıktan sonra sayfayı 12 ay içinde silmeleri önerilir.",
          "Oturum kayıtları: sayfa veya ziyaretçi ile birlikte silinir; oturum başına en fazla yaklaşık 40 dakika.",
          "Parola sıfırlama bağlantıları 1 saat; ekip davetleri 7 gün; kişisel bağlantı çerezi 30 gün; oturum çerezi en fazla 30 gün.",
          "Hız sınırı sayaçları dakikalar içinde; barındırma erişim kayıtları sağlayıcının belirlediği kısa süre boyunca.",
          "Fatura kayıtları: ödeme sağlayıcısında vergi ve ticaret mevzuatının öngördüğü süre boyunca.",
        ),
        p("Süre sonunda veya amacın ortadan kalkması halinde kişisel veriler silinir, yok edilir veya anonim hale getirilir."),
      ],
    },
    {
      heading: "Çerezler",
      blocks: [p(`Web sitesi ve uygulama yalnızca zorunlu çerezler (oturum, form güvenliği) ile tarayıcıda saklanan arayüz tercihlerini kullanır; reklam veya üçüncü taraf takip çerezi kullanılmaz. Anlaşma sayfaları ayrıca okuma analitiği için rastgele bir tanımlayıcı ve oturum kaydına ilişkin yanıtınızı tarayıcınızda saklar. Tam liste ve süreler /legal/cookies adresinde yayımlanmaktadır.`)] },
    {
      heading: "İlgili kişinin hakları (KVKK m. 11)",
      blocks: [
        p("KVKK'nın 11. maddesi uyarınca herkes, veri sorumlusuna başvurarak kendisiyle ilgili:"),
        ol(
          "Kişisel veri işlenip işlenmediğini öğrenme,",
          "Kişisel verileri işlenmişse buna ilişkin bilgi talep etme,",
          "Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,",
          "Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,",
          "Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,",
          "KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme,",
          "(d) ve (e) bentleri uyarınca yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,",
          "İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme,",
          "Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme",
        ),
        p("haklarına sahiptir."),
      ],
    },
    {
      heading: "Başvuru yöntemi",
      blocks: [
        p(`Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ uyarınca başvurularınızı; adınız, soyadınız, başvuru yazılı ise imzanız, T.C. kimlik numaranız (yabancılar için pasaport numarası), tebligata esas adresiniz veya e-posta adresiniz ve talep konunuzla birlikte:`),
        ul(
          `${LEGAL.address} adresine yazılı olarak (noter veya iadeli taahhütlü posta ile),`,
          `${LEGAL.privacyEmail} adresine, sistemimizde kayıtlı e-posta adresinizden göndererek,`,
          "Kayıtlı elektronik posta (KEP) adresi, güvenli elektronik imza veya mobil imza ile",
        ),
        p("iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılır; işlemin ayrıca bir maliyet gerektirmesi hâlinde Kurul tarafından belirlenen tarifedeki ücret alınabilir. Hesap sahipleri verilerinin bir kopyasını (Ayarlar → Hesap → Verilerimi indir) alabilir ve hesaplarını aynı ekrandan silebilir. Bir satıcı tarafından kendisine sayfa gönderilen alıcılar, taleplerini sayfayı paylaşan satıcıya veya doğrudan bize iletebilir; veri sorumlusu satıcı olduğundan talep satıcıyla koordineli olarak karşılanır."),
        p("Başvurunuzun reddedilmesi, verilen cevabın yetersiz bulunması veya süresinde cevap verilmemesi hâlinde, cevabı öğrendiğiniz tarihten itibaren 30 ve her hâlde başvuru tarihinden itibaren 60 gün içinde Kişisel Verileri Koruma Kurulu'na şikâyette bulunma hakkınız saklıdır."),
      ],
    },
    { heading: "Değişiklikler", blocks: [p("Bu metin mevzuat veya hizmet değiştikçe güncellenir; güncel sürüm ve yürürlük tarihi bu sayfada yayımlanır.")] },
  ],
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [privacy, terms, cookies, dpa, kvkk]
