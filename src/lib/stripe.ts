import { loadStripe, type Stripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey) {
  console.warn(
    'Missing Stripe publishable key. Check your .env file:\n' +
    '  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...'
  )
}

let stripePromise: Promise<Stripe | null> | null = null

/** Lazy-loads and caches the Stripe.js instance. */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey)
  }
  return stripePromise ?? Promise.resolve(null)
}