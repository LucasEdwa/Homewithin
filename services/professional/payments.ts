import { getClient } from "@/services/supabase";
import { confirmSession } from "./booking";

export interface CreatePaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Calls the create-payment-intent Edge Function to create a Stripe PaymentIntent
 * for the given session. The amount is always read from the DB server-side —
 * never trusted from the client.
 */
export async function createPaymentIntent(
  sessionId: string,
): Promise<CreatePaymentIntentResult> {
  const supabase = getClient();
  const { data, error } =
    await supabase.functions.invoke<CreatePaymentIntentResult>(
      "create-payment-intent",
      { body: { sessionId } },
    );

  if (error) throw error;
  if (!data?.clientSecret) throw new Error("Invalid payment intent response.");
  return data;
}

/**
 * Called after the Stripe PaymentSheet confirms payment on the client side.
 * Updates the session status to confirmed with the payment intent ID.
 * Note: the Stripe webhook also does this server-side as a safety net.
 */
export async function handlePaymentSuccess(
  sessionId: string,
  paymentIntentId: string,
): Promise<void> {
  await confirmSession(sessionId, paymentIntentId);
}
