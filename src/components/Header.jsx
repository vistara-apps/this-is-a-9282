import React from 'react'
import { Shield, Crown } from 'lucide-react'

export default function Header({ subscriptionStatus, onSubscriptionClick }) {
  return (
    <header className="bg-surface/10 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-xl font-bold text-white">Roadside Rights</h1>
              <p className="text-sm text-white/70">Your rights. Your safety. Instantly accessible.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {subscriptionStatus === 'premium' ? (
              <div className="flex items-center gap-2 bg-accent/20 px-3 py-1 rounded-full">
                <Crown className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent">Premium</span>
              </div>
            ) : (
              <button
                onClick={onSubscriptionClick}
                className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accent/90 transition-colors text-sm font-medium"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}