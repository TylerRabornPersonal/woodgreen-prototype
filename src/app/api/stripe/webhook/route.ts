/**
 * Stripe webhook endpoint. Verifies the signature, then keeps our DB in sync.
 * Skeleton for Phase 0 — the TODOs are wired up in Phase 2 (billing).
 *
 * Register the URL in the Stripe dashboard (see SETUP.md) and set
 * STRIPE_WEBHOOK_SECRET. Runs on the Node runtime (Stripe needs the raw body).
 */
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) {
    return NextResponse.json({ error: "Missing webhook secret or signature" }, { status: 400 });
  }

  const body = await req.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "invoice.paid":
      // TODO(Phase 2): mark invoice paid + insert a payments row.
      break;
    case "invoice.payment_failed":
      // TODO(Phase 2): start dunning (Resend email + retry).
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // TODO(Phase 2): sync license status from the subscription.
      break;
    case "payment_method.attached":
    case "payment_method.detached":
      // TODO(Phase 2): refresh the org's default payment method reference.
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
