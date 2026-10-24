import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia' as any
});

export type PlanTier = 'solo' | 'pro' | 'agency';

export const PLANS: Record<PlanTier, { name: string; priceEuros: number; priceId: string; sitesAllowed: number }> = {
  solo: {
    name: 'Solo E-commerce',
    priceEuros: 89,
    priceId: process.env.STRIPE_PRICE_SOLO || 'price_solo_89',
    sitesAllowed: 1
  },
  pro: {
    name: 'Pro / Multi-sites',
    priceEuros: 149,
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro_149',
    sitesAllowed: 3
  },
  agency: {
    name: 'Agency Partner',
    priceEuros: 299,
    priceId: process.env.STRIPE_PRICE_AGENCY || 'price_agency_299',
    sitesAllowed: 25
  }
};

export class BillingService {
  /**
   * Crée une session de paiement Stripe Checkout pour un abonnement
   */
  static async createCheckoutSession(planTier: PlanTier, customerEmail?: string, siteUrl?: string): Promise<{ url: string | null; isMock?: boolean }> {
    const plan = PLANS[planTier];
    if (!plan) throw new Error(`Plan inconnu: ${planTier}`);

    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    // Si la clé Stripe n'est pas encore configurée par l'utilisateur, mode simulation fluide
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      console.log(`[Stripe Mode Simulation] Checkout initié pour l'offre ${plan.name} (${plan.priceEuros} €/mois)`);
      return {
        url: `${appUrl}/checkout/success?session_id=mock_session_${Date.now()}&plan=${planTier}&site=${encodeURIComponent(siteUrl || '')}`,
        isMock: true
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `AccessiShield — ${plan.name}`,
              description: `Surveillance continue et remédiation légale EAA 2025 (jusqu'à ${plan.sitesAllowed} site(s))`
            },
            unit_amount: plan.priceEuros * 100,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        planTier,
        siteUrl: siteUrl || ''
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=${planTier}&site=${encodeURIComponent(siteUrl || '')}`,
      cancel_url: `${appUrl}/#pricing`
    });

    return { url: session.url, isMock: false };
  }

  /**
   * Crée un lien vers le Portail Client Stripe pour gérer ou annuler l'abonnement
   */
  static async createPortalSession(customerId: string): Promise<string> {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      return `${appUrl}/#pricing`;
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/dashboard`
    });
    return session.url;
  }
}
