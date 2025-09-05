import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Lock } from 'lucide-react'
import Card from './ui/Card'

export default function RightsCards({ stateData, subscriptionStatus }) {
  const [expandedCard, setExpandedCard] = useState(null)

  if (!stateData) return null

  const toggleCard = (cardId) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
  }

  const rightsCards = [
    {
      id: 'basic-rights',
      title: 'Your Basic Rights',
      summary: 'Fundamental rights during any police encounter',
      content: stateData.rightsSummary,
      isPremium: false
    },
    {
      id: 'what-to-say',
      title: 'What TO Say',
      summary: 'Recommended phrases and responses',
      content: stateData.doSay,
      isPremium: false
    },
    {
      id: 'what-not-to-say',
      title: 'What NOT to Say',
      summary: 'Avoid these phrases and behaviors',
      content: stateData.dontSay,
      isPremium: false
    },
    {
      id: 'legal-resources',
      title: 'Legal Resources',
      summary: 'Local attorneys and legal aid',
      content: stateData.legalResources,
      isPremium: subscriptionStatus === 'free'
    }
  ]

  return (
    <div className="space-y-4 animate-slide-up">
      {rightsCards.map((card) => (
        <Card key={card.id} className="bg-surface/10 backdrop-blur-sm border border-white/20">
          <button
            onClick={() => toggleCard(card.id)}
            className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded-lg"
            disabled={card.isPremium && subscriptionStatus === 'free'}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{card.title}</h3>
                  {card.isPremium && subscriptionStatus === 'free' && (
                    <Lock className="h-4 w-4 text-accent" />
                  )}
                </div>
                <p className="text-sm text-white/70 mt-1">{card.summary}</p>
              </div>
              {!(card.isPremium && subscriptionStatus === 'free') && (
                expandedCard === card.id ? (
                  <ChevronUp className="h-5 w-5 text-white/60" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-white/60" />
                )
              )}
            </div>
          </button>

          {expandedCard === card.id && !(card.isPremium && subscriptionStatus === 'free') && (
            <div className="px-4 pb-4 border-t border-white/10 mt-4 pt-4">
              <div className="text-white/90 whitespace-pre-line">
                {card.content}
              </div>
            </div>
          )}

          {card.isPremium && subscriptionStatus === 'free' && (
            <div className="px-4 pb-4 border-t border-white/10 mt-4 pt-4">
              <div className="text-center py-6">
                <Lock className="h-8 w-8 text-accent mx-auto mb-2" />
                <p className="text-white/80 mb-2">Premium Feature</p>
                <p className="text-sm text-white/60">
                  Upgrade to access detailed legal resources and local attorney contacts.
                </p>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}