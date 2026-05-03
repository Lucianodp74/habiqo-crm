import { getLeadById, listEventsForLead } from "@/lib/queries/leads";
import { createClient } from "@/lib/supabase/server";
import { generateStream, leadInsightsPrompt } from "@habiqo/ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const requestSchema = z.object({
  leadId: z.string().uuid(),
});

/**
 * Streaming endpoint for the Lead Detail Drawer's AI insights section.
 * Returns a token stream consumed by the client via the AI SDK's useChat.
 *
 * Auth: cookie-based session via Supabase SSR. RLS scopes the lead query.
 * Cost: logged in ai_actions_log via the registered LogSink (see boot).
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse("Invalid request", { status: 400 });
  }

  const lead = await getLeadById(parsed.data.leadId);
  if (!lead) {
    return new NextResponse("Lead not found", { status: 404 });
  }

  const events = await listEventsForLead(lead.id);
  const capturedDaysAgo = Math.floor(
    (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  const prompt = leadInsightsPrompt.buildPrompt({
    lead: {
      fullName: lead.fullName,
      status: lead.status,
      source: lead.source,
      budgetMinEur: lead.budgetMinEur,
      budgetMaxEur: lead.budgetMaxEur,
      preferredZones: lead.preferredZones,
      tags: lead.tags,
      capturedDaysAgo,
    },
    events: events.map((e) => ({
      type: e.type,
      occurredAt: e.occurredAt.toISOString(),
      title: e.title,
      detail: e.detail,
    })),
  });

  const result = generateStream({
    task: "generate_lead_insights",
    system: leadInsightsPrompt.SYSTEM_PROMPT,
    prompt,
    context: { agencyId: lead.agencyId, userId: user.id, traceId: crypto.randomUUID() },
  });

  return result.toDataStreamResponse();
}
