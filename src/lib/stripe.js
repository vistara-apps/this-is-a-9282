import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo')

export const paymentService = {
  /**
   * Initialize Stripe checkout for subscription
   * @param {string} priceId - Stripe price ID for the subscription
   * @param {string} userId - User ID for the subscription
   */
  async createCheckoutSession(priceId = 'price_premium_monthly', userId) {
    try {
      // In a real app, this would call your backend API
      // For demo purposes, we'll simulate the flow
      const stripe = await stripePromise
      
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      // This would typically be a call to your backend
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/cancel`,
        }),
      })

      if (!response.ok) {
        // For demo purposes, simulate success
        console.log('Demo mode: Simulating successful payment')
        return { success: true, demo: true }
      }

      const session = await response.json()
      
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      return { success: true }
    } catch (error) {
      console.error('Payment error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Create a payment intent for one-time payments
   * @param {number} amount - Amount in cents
   * @param {string} currency - Currency code (default: 'usd')
   */
  async createPaymentIntent(amount, currency = 'usd') {
    try {
      // This would typically call your backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { client_secret } = await response.json()
      return { clientSecret: client_secret, success: true }
    } catch (error) {
      console.error('Payment intent error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Confirm payment with Stripe Elements
   * @param {string} clientSecret - Payment intent client secret
   * @param {Object} paymentMethod - Payment method details
   */
  async confirmPayment(clientSecret, paymentMethod) {
    try {
      const stripe = await stripePromise
      
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      return { success: true, paymentIntent: result.paymentIntent }
    } catch (error) {
      console.error('Payment confirmation error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get subscription status
   * @param {string} customerId - Stripe customer ID
   */
  async getSubscriptionStatus(customerId) {
    try {
      const response = await fetch(`/api/subscription-status/${customerId}`)
      
      if (!response.ok) {
        throw new Error('Failed to get subscription status')
      }

      const data = await response.json()
      return { success: true, subscription: data }
    } catch (error) {
      console.error('Subscription status error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Cancel subscription
   * @param {string} subscriptionId - Stripe subscription ID
   */
  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch(`/api/cancel-subscription/${subscriptionId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      return { success: true }
    } catch (error) {
      console.error('Subscription cancellation error:', error)
      return { success: false, error: error.message }
    }
  }
}

// Pricing configuration
export const PRICING = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Basic rights information',
      'State-specific guidance',
      'Up to 3 encounter logs',
      'Basic recording (5 minutes max)'
    ],
    limitations: {
      maxRecordings: 3,
      maxRecordingDuration: 300, // 5 minutes in seconds
      customScripts: false,
      unlimitedLogs: false
    }
  },
  PREMIUM: {
    name: 'Premium',
    price: 4.99,
    priceId: 'price_premium_monthly',
    features: [
      'All free features',
      'Unlimited encounter logs',
      'Unlimited recording duration',
      'Custom scenario scripts',
      'AI-powered summaries',
      'Priority support',
      'Advanced sharing options'
    ],
    limitations: {
      maxRecordings: Infinity,
      maxRecordingDuration: Infinity,
      customScripts: true,
      unlimitedLogs: true
    }
  }
}
