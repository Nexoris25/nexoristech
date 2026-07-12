/**
 * Stage-driven follow-ups (PRD 5.9). When a lead advances, the CRM prepares a follow-up email
 * tailored to the new stage and a recommended send-by date: if the client has not responded by
 * then, the Action Center surfaces it. The draft comes from the Oge CRM Worker where reachable and
 * a stage-specific warm template otherwise, so a follow-up is always ready. The house voice rules
 * apply: no em dash, no invented price or date, "Nexoris Technologies" in full.
 */
import { businessDayDeadline } from "./business-days.js";
import { draftReply } from "./oge.js";

export interface FollowUpLead {
  name: string | null;
  company: string | null;
  message: string | null;
  matchedServices: string[];
  industry: string | null;
}

export interface FollowUp {
  draft: string;
  draftedBy: "ai" | "template";
  due: Date;
}

/** How long to wait for a reply before the follow-up is due, per stage. Business days. */
const STAGE_WAIT_DAYS: Record<string, number> = {
  New: 1,
  Contacted: 2,
  Qualified: 3,
  "Scoping Call Booked": 2,
  "Proposal Sent": 3,
  Negotiation: 2,
  Nurture: 5,
};

/** What the follow-up should aim to do at each stage, fed to the draft as guidance. */
const STAGE_INTENT: Record<string, string> = {
  Contacted: "Open the conversation, acknowledge their challenge, and offer a short scoping call.",
  Qualified: "Confirm you understand their priority and propose the next concrete step.",
  "Scoping Call Booked": "Confirm the call, set expectations, and ask what a good outcome looks like.",
  "Proposal Sent": "Gently check the proposal landed, offer to walk through it, and invite questions.",
  Negotiation: "Keep momentum, address the open point plainly, and suggest a way to close.",
  Nurture: "Stay warm without pressure, share something useful, and leave the door open.",
};

function firstName(name: string | null): string {
  return (name ?? "").trim().split(/\s+/)[0] || "there";
}

export function followUpTemplate(stage: string, lead: FollowUpLead): string {
  return templateForStage(stage, lead);
}

function templateForStage(stage: string, lead: FollowUpLead): string {
  const who = firstName(lead.name);
  const services =
    lead.matchedServices.length > 0
      ? ` It still looks like ${lead.matchedServices.join(" and ")} could be a good fit for what you described.`
      : "";
  switch (stage) {
    case "Contacted":
      return `Hi ${who},

Thank you again for reaching out to Nexoris Technologies.${services} I would like to understand your goals properly before suggesting anything specific.

Could we set up a short call this week? After it, we will come back with a clear plan and honest numbers, with no obligation.

Best regards,
The Nexoris Technologies team`;
    case "Qualified":
      return `Hi ${who},

Thank you for the detail so far. Based on what you shared, I think we can help, and I would like to line up the next step.

Would a short scoping call suit you this week? We will use it to agree on scope and come back with a clear plan.

Best regards,
The Nexoris Technologies team`;
    case "Scoping Call Booked":
      return `Hi ${who},

Looking forward to our call. So we make the most of it, it helps to know what a good outcome would look like for you and who else should be in the room.

If anything changes on your side, just let me know and we will find another time.

Best regards,
The Nexoris Technologies team`;
    case "Proposal Sent":
      return `Hi ${who},

I wanted to check the proposal reached you and see if any of it raised questions. I am happy to walk through any part of it with you.

If it would help, we can jump on a short call to talk it through together.

Best regards,
The Nexoris Technologies team`;
    case "Negotiation":
      return `Hi ${who},

Thank you for talking things through. I want to make this easy to say yes to, so tell me plainly what is still open and we will work through it together.

Whenever you are ready, we can set a start that suits your side.

Best regards,
The Nexoris Technologies team`;
    case "Nurture":
      return `Hi ${who},

No pressure at all, I just wanted to stay in touch. When the timing is right for you, we would be glad to pick this up again.

In the meantime, if anything comes up that we can help with, you know where we are.

Best regards,
The Nexoris Technologies team`;
    default:
      return `Hi ${who},

Thank you for your time with Nexoris Technologies.${services} Whenever you are ready to take the next step, we are here to help.

Best regards,
The Nexoris Technologies team`;
  }
}

/** Prepare the stage follow-up: a draft plus the recommended send-by date. */
export async function prepareFollowUp(
  stage: string,
  lead: FollowUpLead,
  from: Date = new Date(),
): Promise<FollowUp> {
  const waitDays = STAGE_WAIT_DAYS[stage] ?? 3;
  const due = businessDayDeadline(from, waitDays);

  const intent = STAGE_INTENT[stage];
  const message =
    (lead.message ?? "").trim() ||
    (lead.matchedServices.length > 0
      ? `Interested in ${lead.matchedServices.join(", ")}.`
      : "A new enquiry.");

  if (intent) {
    const ai = await draftReply({
      ...(lead.name ? { name: lead.name } : {}),
      ...(lead.company ? { company: lead.company } : {}),
      message: `${message}\n\nThis is a follow-up at the "${stage}" stage. ${intent}`,
      matchedServices: lead.matchedServices,
      ...(lead.industry ? { industry: lead.industry } : {}),
    });
    if (ai) return { draft: ai.draft, draftedBy: ai.draftedBy, due };
  }

  return { draft: templateForStage(stage, lead), draftedBy: "template", due };
}
