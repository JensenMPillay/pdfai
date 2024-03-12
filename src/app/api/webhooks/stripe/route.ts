import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("Stripe-Signature") ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch (err) {
    return new Response(
      `Webhook Error: ${
        err instanceof Error
          ? err.message
          : "Webhook signature verification failed."
      }`,
      { status: 400 },
    );
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
  );

  if (!subscription) {
    return new Response(`Webhook Error: No subscription found`, {
      status: 400,
    });
  }

  // Handle events
  try {
    switch (event.type) {
      case "checkout.session.completed":
        if (!session?.metadata?.userId) return;
        // Update User & Create Stripe Data
        await db.user.update({
          where: {
            id: session.metadata.userId,
          },
          data: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000,
            ),
          },
        });
        break;
      case "invoice.payment_succeeded":
        // Update User & Update Stripe Data
        await db.user.update({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000,
            ),
          },
        });
        break;
    }
  } catch (err) {
    return new Response(
      `Webhook Error: ${
        err instanceof Error ? err.message : "Update booking failed."
      }`,
      { status: 400 },
    );
  }

  // Response
  return new Response(null, { status: 200 });
}
