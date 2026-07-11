import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// TipTap JSON helpers
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type N = Record<string, any>;

const text = (t: string): N => ({ type: "text", text: t });
const p = (...texts: string[]): N => ({
  type: "paragraph",
  content: texts.length > 0 ? texts.map(text) : [{ type: "text", text: "" }],
});
const h1 = (t: string): N => ({ type: "heading", attrs: { level: 1 }, content: [text(t)] });
const h2 = (t: string): N => ({ type: "heading", attrs: { level: 2 }, content: [text(t)] });
const ul = (...items: string[]): N => ({
  type: "bulletList",
  content: items.map((item) => ({
    type: "listItem",
    content: [{ type: "paragraph", content: [text(item)] }],
  })),
});
const embed = (src: string, provider = "generic"): N => ({
  type: "embed",
  attrs: { src, provider },
});
const logoGrid = (): N => ({ type: "logoGrid", attrs: { logos: [] } });
const th = (t: string): N => ({
  type: "tableHeader",
  attrs: { colspan: 1, rowspan: 1, colwidth: null },
  content: [{ type: "paragraph", content: [text(t)] }],
});
const td = (t: string): N => ({
  type: "tableCell",
  attrs: { colspan: 1, rowspan: 1, colwidth: null },
  content: [{ type: "paragraph", content: [text(t)] }],
});
const tr = (...cells: N[]): N => ({ type: "tableRow", content: cells });
const tbl = (...rows: N[]): N => ({ type: "table", content: rows });
const testimonial = (quote: string, author: string, role: string, avatar = ""): N => ({
  type: "testimonial",
  attrs: { quote, author, role, avatar },
});
const metrics = (...items: { value: string; label: string }[]): N => ({
  type: "metrics",
  attrs: { metrics: items },
});
const spacer = (height: "sm" | "md" | "lg" | "xl" = "md"): N => ({
  type: "spacer",
  attrs: { height },
});
const cta = (label: string, url: string): N => ({
  type: "ctaButton",
  attrs: { label, url },
});
const banner = (text: string, opts?: { emoji?: string; bgStyle?: string; link?: string; linkLabel?: string }): N => ({
  type: "banner",
  attrs: {
    text,
    emoji: opts?.emoji ?? "",
    bgStyle: opts?.bgStyle ?? "accent",
    link: opts?.link ?? "",
    linkLabel: opts?.linkLabel ?? "Learn more →",
  },
});
const contactCard = (...contacts: { name: string; title: string; email: string; phone?: string; photo?: string }[]): N => ({
  type: "contactCard",
  attrs: {
    contacts: contacts.map((c, i) => ({
      id: `c_seed_${i}_${c.name.replace(/\s/g, "")}`,
      name: c.name,
      title: c.title,
      email: c.email,
      phone: c.phone ?? "",
      photo: c.photo ?? "",
    })),
  },
});
const doc = (...nodes: N[]): N => ({ type: "doc", content: nodes });
const tab = (label: string, content: N) => ({ label, content });

// ---------------------------------------------------------------------------
// Template 1 — Call Recap
// ---------------------------------------------------------------------------
const callRecapTabs = [
  tab(
    "Recap",
    doc(
      h1("Great talking today, [Name] 👋"),
      p(
        "Here's a summary of everything we covered in our call on [DATE], plus the resources I promised to send over."
      ),
      h2("What We Discussed"),
      ul(
        "[Pain point they mentioned]",
        "[Challenge they're facing]",
        "[Goal they want to achieve]"
      ),
      h2("Demo Recording"),
      embed("https://www.loom.com/embed/your-recording-here", "loom"),
      h2("How We Solve Your Challenges"),
      ul(
        "[Challenge 1] → [How your product solves it]",
        "[Challenge 2] → [How your product solves it]",
        "[Challenge 3] → [How your product solves it]"
      ),
      h2("Next Steps"),
      ul(
        "☐ [Buyer] shares this page with [their colleague] — by [DATE]",
        "☐ [Your name] sends over [security docs / case study / contract] — by [DATE]",
        "☐ Follow-up call to answer remaining questions — [DATE]"
      ),
      h2("Book Time With Me"),
      embed("https://calendly.com/your-link", "generic"),
      h2("Additional Resources"),
      ul(
        "[Case study relevant to their industry]",
        "[Product overview PDF]",
        "[Pricing page]"
      )
    )
  ),
];

// ---------------------------------------------------------------------------
// Template 2 — Business Proposal
// ---------------------------------------------------------------------------
const proposalTabs = [
  tab(
    "Overview",
    doc(
      h1("Proposal for [Company Name]"),
      p("Prepared by [Your Name] · [Your Title] · [Date]"),
      h2("Executive Summary"),
      p(
        "Based on our conversations, [Company Name] is facing [PRIMARY CHALLENGE]. This proposal outlines how [Your Company] solves this, what implementation looks like, and the investment required."
      ),
      h2("The Problem You're Solving"),
      ul(
        "[Pain point 1 — be specific to their situation]",
        "[Pain point 2]",
        "[Pain point 3]"
      ),
      h2("Why Now"),
      p(
        "Every [week/month] without a solution costs [Company Name] approximately [COST/TIME]. The longer this goes unaddressed, [CONSEQUENCE]."
      )
    )
  ),
  tab(
    "Solution",
    doc(
      h1("Our Approach"),
      p("[1-2 sentences on your product/service tailored to their needs]"),
      h2("Walkthrough"),
      embed("https://www.loom.com/embed/your-demo-here", "loom"),
      h2("What You'll Use Most"),
      ul(
        "[Feature 1] — [How it helps them specifically]",
        "[Feature 2] — [How it helps them specifically]",
        "[Feature 3] — [How it helps them specifically]"
      ),
      h2("Implementation Timeline"),
      ul(
        "Week 1: Setup & configuration",
        "Week 2: Team onboarding & training",
        "Week 3: Go live",
        "Week 4: First results review"
      )
    )
  ),
  tab(
    "Pricing",
    doc(
      h1("Investment"),
      tbl(
        tr(th("Package"), th("Users"), th("Price"), th("Best For")),
        tr(td("Starter"), td("Up to 10"), td("$[X]/mo"), td("Small teams")),
        tr(td("Professional ⭐"), td("Up to 50"), td("$[X]/mo"), td("Growing teams")),
        tr(td("Enterprise"), td("Unlimited"), td("Custom"), td("Large orgs"))
      ),
      h2("What's Included"),
      ul(
        "✅ [Deliverable 1]",
        "✅ [Deliverable 2]",
        "✅ [Deliverable 3]",
        "✅ Onboarding & implementation support",
        "✅ Dedicated account manager"
      ),
      h2("ROI Estimate"),
      tbl(
        tr(th("Metric"), th("Current State"), th("With [Your Product]")),
        tr(td("[KPI 1]"), td("[Current number]"), td("[Improved number]")),
        tr(td("[KPI 2]"), td("[Current number]"), td("[Improved number]")),
        tr(td("Time saved per week"), td("[X hours]"), td("[Y hours]"))
      )
    )
  ),
  tab(
    "Proof",
    doc(
      h1("You're In Good Company"),
      p("Here are some customers similar to [Company Name] and the results they've achieved."),
      h2("Customers Like You"),
      logoGrid(),
      spacer("sm"),
      h2("Results That Speak"),
      metrics(
        { value: "[X]%", label: "Revenue increase" },
        { value: "[X]x", label: "Faster implementation" },
        { value: "[X]+", label: "Team members onboarded" }
      ),
      spacer("sm"),
      h2("Case Study: [Similar Company Name]"),
      p("[2-3 sentences on their challenge, what they did, the result they got]"),
      embed("https://your-case-study-link.com", "generic"),
      spacer("sm"),
      h2("What They Say"),
      testimonial(
        "[Testimonial quote about how your product solved their problem and delivered results]",
        "[Name]",
        "[Title] at [Company]"
      ),
      testimonial(
        "[Another testimonial highlighting a different benefit or use case]",
        "[Name]",
        "[Title] at [Company]"
      )
    )
  ),
  tab(
    "Next Steps",
    doc(
      h1("How We Move Forward"),
      ul(
        "☐ [Company Name] reviews this proposal with [stakeholder] — by [DATE]",
        "☐ [Your name] answers any remaining questions — by [DATE]",
        "☐ Legal reviews MSA — by [DATE]",
        "☐ Contract signed — by [DATE]",
        "☐ Kickoff call — [DATE]"
      ),
      h2("Ready to Talk?"),
      embed("https://calendly.com/your-link", "generic")
    )
  ),
];

// ---------------------------------------------------------------------------
// Template 3 — Mutual Action Plan
// ---------------------------------------------------------------------------
const mapTabs = [
  tab(
    "Action Plan",
    doc(
      h1("[Your Company] × [Their Company]"),
      p(
        "Our shared plan to get you live by [TARGET DATE]. Both teams are committed to the milestones below."
      ),
      h2("🏁 Milestone 1: Technical Validation — Week of [DATE]"),
      ul(
        "☐ Security questionnaire completed — Owner: [Their IT] — Due: [DATE]",
        "☐ API documentation shared — Owner: [Your name] — Due: [DATE]",
        "☐ Integration test call — Owner: Both — Due: [DATE]"
      ),
      h2("✅ Milestone 2: Business Approval — Week of [DATE]"),
      ul(
        "☐ Proposal reviewed internally — Owner: [Champion name] — Due: [DATE]",
        "☐ Budget approved — Owner: [Economic buyer] — Due: [DATE]",
        "☐ Legal review complete — Owner: [Their Legal] — Due: [DATE]"
      ),
      h2("📝 Milestone 3: Contracting — Week of [DATE]"),
      ul(
        "☐ MSA sent — Owner: [Your name] — Due: [DATE]",
        "☐ Redlines returned — Owner: [Their Legal] — Due: [DATE]",
        "☐ Contract signed — Owner: Both — Due: [DATE]"
      ),
      h2("🚀 Milestone 4: Onboarding — Week of [DATE]"),
      ul(
        "☐ Kickoff call — Owner: [CSM Name] — Due: [DATE]",
        "☐ Admin access configured — Owner: [Their IT] — Due: [DATE]",
        "☐ Team training session — Owner: [CSM Name] — Due: [DATE]"
      ),
      h2("Your Contacts"),
      ul(
        "Account Executive: [Your Name] — [your@email.com]",
        "Customer Success: [CSM Name] — [csm@email.com]",
        "Support: [support link]"
      ),
      h2("Questions? Book Time"),
      embed("https://calendly.com/your-link", "generic")
    )
  ),
];

// ---------------------------------------------------------------------------
// Template 4 — Competitor Battle Card
// ---------------------------------------------------------------------------
const battlecardTabs = [
  tab(
    "Why Us",
    doc(
      h1("[Your Product] vs [Competitor]"),
      p(
        "Here's an honest look at how we compare. We'll show you where we win, and where they win — so you can make the right decision for [Company Name]."
      ),
      h2("Feature Comparison"),
      tbl(
        tr(th("Feature"), th("[Your Product]"), th("[Competitor]"), th("Notes")),
        tr(td("[Core feature]"), td("✅"), td("✅"), td("Both do this well")),
        tr(td("[Differentiator 1]"), td("✅"), td("❌"), td("[Brief explanation]")),
        tr(td("[Differentiator 2]"), td("✅"), td("❌"), td("[Brief explanation]")),
        tr(td("[Differentiator 3]"), td("✅"), td("⚠️ Partial"), td("[Brief explanation]")),
        tr(td("Implementation time"), td("[X days]"), td("[Y weeks]"), td("[Source]")),
        tr(td("Pricing model"), td("[Your model]"), td("[Their model]"), td("[Why yours is better]"))
      ),
      h2("Where We Win"),
      ul(
        "[Differentiator 1] — [Why this matters to Company Name specifically]",
        "[Differentiator 2] — [Why this matters to Company Name specifically]",
        "[Differentiator 3] — [Why this matters to Company Name specifically]"
      ),
      h2("Where They Win"),
      p(
        "We want you to make the right decision, so here's where [Competitor] genuinely has an edge:"
      ),
      ul("[Thing competitor does better] — [When this matters / when it doesn't]")
    )
  ),
  tab(
    "Proof",
    doc(
      h1("Companies That Chose Us Over [Competitor]"),
      logoGrid(),
      h2("Switch Story: [Company Name]"),
      p(
        "[Company] was using [Competitor] for [X time]. They switched because [REASON]. Since moving to [Your Product]: [RESULTS]."
      ),
      h2("What Review Sites Say"),
      embed("https://www.g2.com/compare/your-product-vs-competitor", "generic")
    )
  ),
  tab(
    "Pricing",
    doc(
      h1("Total Cost of Ownership"),
      tbl(
        tr(th("Cost Factor"), th("[Your Product]"), th("[Competitor]")),
        tr(td("Base price"), td("$[X]/mo"), td("$[Y]/mo")),
        tr(td("Implementation fee"), td("Included"), td("$[Z]")),
        tr(td("Per-seat overages"), td("None"), td("$[X] per user")),
        tr(td("Support"), td("Included"), td("$[X]/mo")),
        tr(td("3-year total"), td("$[X]"), td("$[Y — higher]"))
      ),
      h2("Hidden Costs of [Competitor]"),
      ul(
        "[Hidden cost 1 — e.g. mandatory implementation fee]",
        "[Hidden cost 2 — e.g. per-seat overages]",
        "[Hidden cost 3 — e.g. paid support tiers]"
      )
    )
  ),
];

// ---------------------------------------------------------------------------
// Template 5 — Customer Onboarding
// ---------------------------------------------------------------------------
const onboardingTabs = [
  tab(
    "Welcome",
    doc(
      h1("Welcome to [Your Company], [Name]! 🎉"),
      p(
        "We're so excited to have [Company Name] on board. This page has everything you need to get started — bookmark it."
      ),
      h2("A Personal Welcome From Your CSM"),
      embed("https://www.loom.com/embed/your-welcome-video", "loom"),
      h2("Your Onboarding Journey"),
      ul(
        "Week 1: Account setup & configuration",
        "Week 2: Team training sessions",
        "Week 3: Go live 🚀",
        "Week 4: First results check-in"
      ),
      h2("Start Here — 3 Things to Do Today"),
      ul(
        "☐ Step 1: [First action with link]",
        "☐ Step 2: [Second action with link]",
        "☐ Step 3: Book your kickoff call 👇"
      ),
      h2("Book Your Kickoff Call"),
      embed("https://calendly.com/your-csm-link", "generic"),
      h2("Your Success Team"),
      ul(
        "Customer Success Manager: [CSM Name] — [email]",
        "Support: [support portal link]",
        "Community: [Slack/Discord link]"
      ),
      h2("Resources"),
      ul(
        "📚 Knowledge Base: [link]",
        "🎥 Video Tutorials: [link]",
        "💬 Community Forum: [link]",
        "📄 Your Contract: [PDF embed or link]"
      )
    )
  ),
];

// ---------------------------------------------------------------------------
// Template 6 — Quarterly Business Review
// ---------------------------------------------------------------------------
const qbrTabs = [
  tab(
    "Results",
    doc(
      h1("Q[X] Business Review"),
      p("[Your Company] × [Their Company] · [Date]"),
      h2("Highlights at a Glance"),
      metrics(
        { value: "[X]%", label: "Goal completion" },
        { value: "[X]x", label: "ROI delivered" },
        { value: "[X]+", label: "Active users" }
      ),
      spacer("sm"),
      h2("Detailed Performance"),
      tbl(
        tr(th("Metric"), th("Target"), th("Actual"), th("Status")),
        tr(td("[KPI 1]"), td("[Goal]"), td("[Result]"), td("✅")),
        tr(td("[KPI 2]"), td("[Goal]"), td("[Result]"), td("✅")),
        tr(td("[KPI 3]"), td("[Goal]"), td("[Result]"), td("⚠️")),
        tr(td("ROI"), td("[Expected]"), td("[Actual]"), td("✅"))
      ),
      h2("Usage This Quarter"),
      embed("[Link to usage dashboard or screenshot]", "generic")
    )
  ),
  tab(
    "Wins",
    doc(
      h1("What We Built Together"),
      ul(
        "✅ [Achievement 1 — be specific with numbers]",
        "✅ [Achievement 2]",
        "✅ [Achievement 3]"
      ),
      spacer("sm"),
      h2("Team Feedback"),
      testimonial(
        "[Internal quote from their team member about results]",
        "[Name]",
        "[Title]"
      ),
      testimonial(
        "[Another team member sharing their experience]",
        "[Name]",
        "[Title]"
      )
    )
  ),
  tab(
    "Next Quarter",
    doc(
      h1("Q[X+1] Plan"),
      h2("Our Goals Together"),
      ul(
        "[Joint goal 1 with target number]",
        "[Joint goal 2 with target number]",
        "[Joint goal 3 with target number]"
      ),
      h2("What's Coming in the Product"),
      ul(
        "[Upcoming feature 1 relevant to them — ETA]",
        "[Upcoming feature 2 relevant to them — ETA]"
      ),
      h2("Expansion Opportunities"),
      p(
        "Based on your usage patterns, [Company Name] could get additional value from [EXPANSION OPPORTUNITY]. [1-2 sentences on the benefit]."
      )
    )
  ),
  tab(
    "Renewal",
    doc(
      h1("Renewing With [Your Company]"),
      h2("Your Current Package"),
      tbl(
        tr(th("Detail"), th("Info")),
        tr(td("Plan"), td("[Plan name]")),
        tr(td("Users"), td("[Number]")),
        tr(td("Renewal date"), td("[DATE]")),
        tr(td("Current price"), td("$[X]/mo"))
      ),
      h2("Renewal Options"),
      tbl(
        tr(th("Option"), th("Users"), th("Price"), th("Savings")),
        tr(td("Renew current"), td("[X]"), td("$[Y]/mo"), td("—")),
        tr(td("Expand team"), td("[X+Y]"), td("$[Z]/mo"), td("[X]% vs per-seat")),
        tr(td("Annual plan"), td("[X]"), td("$[Z]/mo"), td("Save [X]%"))
      ),
      h2("Let's Talk Renewal"),
      embed("https://calendly.com/your-link", "generic")
    )
  ),
];

// ---------------------------------------------------------------------------
// Template 7 — Executive One-Pager
// ---------------------------------------------------------------------------
const executiveSummaryTabs = [
  tab(
    "Summary",
    doc(
      h1("Executive Summary"),
      p("Prepared for [Company Name] · [Date]"),
      banner("This page is tailored specifically for [Company Name] based on our discovery call.", {
        emoji: "✨",
        bgStyle: "subtle",
      }),
      spacer("md"),
      h2("The Opportunity"),
      p(
        "[Company Name] is losing [estimated $X / Y hours / Z% efficiency] every [week/month/quarter] because of [PRIMARY PROBLEM]. This is a solvable problem — and here's how we do it."
      ),
      spacer("sm"),
      h2("Impact at a Glance"),
      metrics(
        { value: "[X]%", label: "Efficiency gained" },
        { value: "$[X]K", label: "Annual savings" },
        { value: "[X]", label: "Days to go live" },
        { value: "[X]x", label: "ROI in year one" }
      ),
      spacer("md"),
      h2("Our Solution"),
      ul(
        "[Capability 1] — Directly addresses [their pain point]",
        "[Capability 2] — Replaces [their current workaround]",
        "[Capability 3] — Enables [their aspirational goal]"
      ),
      spacer("sm"),
      h2("What Others Say"),
      testimonial(
        "[Compelling quote from a customer in a similar industry or situation]",
        "[Customer Name]",
        "[Title] at [Company]"
      ),
      spacer("md"),
      h2("Trusted By Industry Leaders"),
      logoGrid(),
      spacer("md"),
      h2("Investment"),
      tbl(
        tr(th("Package"), th("Includes"), th("Price")),
        tr(td("[Recommended plan]"), td("[Key features]"), td("$[X]/mo")),
        tr(td("[Premium plan]"), td("[Additional features]"), td("$[X]/mo"))
      ),
      spacer("md"),
      h2("Next Steps"),
      ul(
        "☐ Review this summary with your team",
        "☐ 30-minute follow-up to answer questions",
        "☐ Start your pilot — no commitment required"
      ),
      spacer("sm"),
      cta("Book a Follow-Up Call", "https://calendly.com/your-link"),
      spacer("md"),
      h2("Your Contact"),
      contactCard(
        { name: "[Your Name]", title: "[Your Title]", email: "[your@email.com]" }
      )
    )
  ),
];

// ---------------------------------------------------------------------------
// Template 8 — ROI Case Study
// ---------------------------------------------------------------------------
const roiCaseStudyTabs = [
  tab(
    "Challenge",
    doc(
      h1("[Customer Name]: From [Problem] to [Result]"),
      p("[Industry] · [Company Size] · [Timeframe]"),
      spacer("sm"),
      banner("[Customer Name] achieved [KEY RESULT] in just [TIMEFRAME] with [Your Product].", {
        emoji: "🏆",
        bgStyle: "accent",
      }),
      spacer("md"),
      h2("The Challenge"),
      p(
        "[Customer Name] was struggling with [PROBLEM]. Their team of [X] people spent [Y hours/week] on [manual process]. This led to [NEGATIVE OUTCOME — missed revenue, slow response times, customer churn]."
      ),
      h2("What They Tried Before"),
      ul(
        "[Previous solution 1] — [Why it didn't work]",
        "[Previous solution 2] — [Why it didn't work]",
        "[Manual workaround] — [Why it wasn't sustainable]"
      ),
      spacer("sm"),
      testimonial(
        "[Quote from the customer about their frustration before finding your solution]",
        "[Contact Name]",
        "[Title] at [Customer Name]"
      )
    )
  ),
  tab(
    "Solution",
    doc(
      h1("The Solution"),
      p("[How Customer Name implemented Your Product and what the rollout looked like]"),
      spacer("sm"),
      h2("Implementation"),
      ul(
        "Day 1–3: Account setup and data migration",
        "Week 1: Core team trained and using the platform",
        "Week 2: Full team rollout",
        "Month 1: First measurable results"
      ),
      spacer("sm"),
      h2("Walkthrough"),
      embed("https://www.loom.com/embed/your-demo-here", "loom"),
      spacer("sm"),
      h2("What Made the Difference"),
      ul(
        "[Feature 1] — [Specific impact on their workflow]",
        "[Feature 2] — [Specific impact on their workflow]",
        "[Feature 3] — [Specific impact on their workflow]"
      ),
      spacer("sm"),
      testimonial(
        "[Quote about the implementation experience — ease, speed, support quality]",
        "[Contact Name]",
        "[Title] at [Customer Name]"
      )
    )
  ),
  tab(
    "Results",
    doc(
      h1("The Results"),
      spacer("sm"),
      metrics(
        { value: "[X]%", label: "Increase in [KPI]" },
        { value: "[X]x", label: "Faster [process]" },
        { value: "$[X]K", label: "Annual savings" },
        { value: "[X]%", label: "Team adoption" }
      ),
      spacer("md"),
      h2("Before & After"),
      tbl(
        tr(th("Metric"), th("Before"), th("After"), th("Change")),
        tr(td("[KPI 1]"), td("[Old value]"), td("[New value]"), td("↑ [X]%")),
        tr(td("[KPI 2]"), td("[Old value]"), td("[New value]"), td("↑ [X]%")),
        tr(td("[KPI 3]"), td("[Old value]"), td("[New value]"), td("↓ [X]%")),
        tr(td("Time spent on [task]"), td("[X] hrs/week"), td("[Y] hrs/week"), td("↓ [Z]%"))
      ),
      spacer("md"),
      h2("In Their Words"),
      testimonial(
        "[Powerful quote about the business impact and ROI they've seen]",
        "[Executive Name]",
        "[C-Level Title] at [Customer Name]"
      ),
      spacer("sm"),
      testimonial(
        "[Quote from an end user about day-to-day improvements]",
        "[User Name]",
        "[Title] at [Customer Name]"
      ),
      spacer("md"),
      h2("Could This Be You?"),
      p(
        "If [Customer Name]'s challenges sound familiar, we'd love to show you how [Your Product] can deliver similar results for [Prospect Company]."
      ),
      cta("See It In Action", "https://calendly.com/your-link")
    )
  ),
];

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------
async function main() {
  // Demo user
  await prisma.user.upsert({
    where: { id: "demo-user-001" },
    update: {},
    create: {
      id: "demo-user-001",
      name: "Demo User",
      email: "demo@dealbeam.dev",
    },
  });
  console.log("Seeded demo user.");

  // Templates
  const templates = [
    {
      id: "template-call-recap",
      name: "Call Recap",
      description:
        "Send within an hour of your call. Recap what was discussed and outline next steps.",
      category: "post-call",
      icon: "📞",
      tabs: callRecapTabs,
    },
    {
      id: "template-proposal",
      name: "Business Proposal",
      description:
        "A full proposal with pricing, proof, and next steps. Designed for multiple stakeholders.",
      category: "proposal",
      icon: "📋",
      tabs: proposalTabs,
    },
    {
      id: "template-map",
      name: "Mutual Action Plan",
      description:
        "A shared checklist to drive deals to close. Keep both sides accountable.",
      category: "deal-room",
      icon: "🤝",
      tabs: mapTabs,
    },
    {
      id: "template-battlecard",
      name: "Competitor Battle Card",
      description:
        "For when prospects are evaluating alternatives. Make the case honestly and confidently.",
      category: "deal-room",
      icon: "⚔️",
      tabs: battlecardTabs,
    },
    {
      id: "template-onboarding",
      name: "Customer Onboarding",
      description:
        "Welcome new customers and give them everything they need to get started.",
      category: "onboarding",
      icon: "🎉",
      tabs: onboardingTabs,
    },
    {
      id: "template-qbr",
      name: "Quarterly Business Review",
      description:
        "Show customers their ROI, celebrate wins, and set goals for next quarter.",
      category: "onboarding",
      icon: "📊",
      tabs: qbrTabs,
    },
    {
      id: "template-executive-summary",
      name: "Executive One-Pager",
      description:
        "A polished single-page overview with metrics, social proof, and a clear ask. Perfect for decision-makers.",
      category: "proposal",
      icon: "✨",
      tabs: executiveSummaryTabs,
    },
    {
      id: "template-roi-case-study",
      name: "ROI Case Study",
      description:
        "Showcase real customer results with before/after metrics, testimonials, and a clear ROI story.",
      category: "deal-room",
      icon: "📈",
      tabs: roiCaseStudyTabs,
    },
  ];

  for (const tmpl of templates) {
    await prisma.template.upsert({
      where: { id: tmpl.id },
      update: {
        name: tmpl.name,
        description: tmpl.description,
        category: tmpl.category,
        icon: tmpl.icon,
        tabs: JSON.stringify(tmpl.tabs),
      },
      create: {
        id: tmpl.id,
        name: tmpl.name,
        description: tmpl.description,
        category: tmpl.category,
        icon: tmpl.icon,
        tabs: JSON.stringify(tmpl.tabs),
        isDefault: true,
        usageCount: 0,
      },
    });
    console.log(`Seeded template: ${tmpl.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
