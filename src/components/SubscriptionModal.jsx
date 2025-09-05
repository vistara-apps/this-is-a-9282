import React from 'react'
import { X, Check, Crown } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'

export default function SubscriptionModal({ onClose, onSubscribe }) {
  const features = [
    'Unlimited audio recording',
    'Video recording capability',
    'Detailed legal resources',
    'Local attorney contacts',
    'Advanced encounter documentation',
    'Priority customer support'
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-surface border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-accent" />
              <h2 className="text-xl font-bold text-textPrimary">Upgrade to Premium</h2>
            </div>
            <button
              onClick={onClose}
              className="text-textSecondary hover:text-textPrimary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-textPrimary mb-2">$4.99<span className="text-lg font-normal text-textSecondary">/month</span></div>
            <p className="text-textSecondary">Get full access to all premium features</p>
          </div>

          <div className="space-y-3 mb-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-accent flex-shrink-0" />
                <span className="text-textPrimary">{feature}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Button
              onClick={onSubscribe}
              className="w-full bg-accent hover:bg-accent/90"
            >
              Subscribe Now
            </Button>
            <Button
              onClick={onClose}
              variant="secondary"
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-textSecondary text-center mt-4">
            Cancel anytime. 7-day free trial for new users.
          </p>
        </div>
      </Card>
    </div>
  )
}