import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(200),
  organisation: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10).max(4000),
});

/**
 * Contact enquiries.
 *
 * There is no transactional-email provider wired up yet, so this validates and
 * logs. That is deliberate: silently pretending to deliver mail would be worse
 * than a visible integration point. Swap the log for your provider's SDK call
 * and nothing else has to change.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the form fields.",
        issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      },
      { status: 422 },
    );
  }

  console.info("[aquavision] contact enquiry", {
    name: parsed.data.name,
    email: parsed.data.email,
    organisation: parsed.data.organisation ?? "—",
    length: parsed.data.message.length,
    at: new Date().toISOString(),
  });

  return NextResponse.json({ received: true }, { status: 202 });
}
