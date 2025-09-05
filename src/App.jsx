import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import StateSelector from './components/StateSelector'
import RightsCards from './components/RightsCards'
import EncounterAssistant from './components/EncounterAssistant'
import EncounterAssistantEnhanced from './components/EncounterAssistantEnhanced'
import DocumentationPanel from './components/DocumentationPanel'
import SubscriptionModal from './components/SubscriptionModal'
import AuthModal from './components/AuthModal'
import { stateRightsData } from './data/stateRights'
import { allStatesRightsData } from './data/allStatesRights'
import { geolocationService } from './lib/geolocation'
import { encounterService } from './lib/supabase'
import { paymentService } from './lib/stripe'
import { v4 as uuidv4 } from 'uuid'

function AppContent() {
  const { user, loading, subscriptionStatus, updateSubscriptionStatus } = useAuth()
  const [selectedState, setSelectedState] = useState('')
  const [activeTab, setActiveTab] = useState('rights')
  const [isRecording, setIsRecording] = useState(false)
  const [encounterLogs, setEncounterLogs] = useState([])
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [currentEncounter, setCurrentEncounter] = useState(null)
  const [stateData, setStateData] = useState(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  useEffect(() => {
    // Auto-detect user's location and state
    const detectLocation = async () => {
      setIsLoadingLocation(true)
      try {
        const stateResult = await geolocationService.getCurrentState()
        if (stateResult.success) {
          setSelectedState(stateResult.state)
        } else {
          // Fallback to manual selection
          console.log('Location detection failed:', stateResult.error)
        }
      } catch (error) {
        console.log('Location access denied:', error)
      } finally {
        setIsLoadingLocation(false)
      }
    }

    detectLocation()
  }, [])

  useEffect(() => {
    // Load state data when state is selected
    if (selectedState) {
      const data = allStatesRightsData[selectedState] || stateRightsData[selectedState]
      setStateData(data)
    }
  }, [selectedState])

  useEffect(() => {
    // Load user's encounter logs
    const loadEncounterLogs = async () => {
      if (user) {
        try {
          const { data, error } = await encounterService.getUserEncounterLogs(user.id)
          if (!error && data) {
            setEncounterLogs(data)
          }
        } catch (error) {
          console.error('Error loading encounter logs:', error)
        }
      }
    }

    loadEncounterLogs()
  }, [user])

  const handleStartEncounter = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    const newEncounter = {
      id: uuidv4(),
      user_id: user.id,
      timestamp: new Date().toISOString(),
      state: selectedState,
      location: '',
      notes: '',
      audio_recording_url: null,
      video_recording_url: null
    }

    try {
      const { data, error } = await encounterService.createEncounterLog(newEncounter)
      if (!error && data) {
        setCurrentEncounter(data[0])
        setActiveTab('encounter')
      }
    } catch (error) {
      console.error('Error creating encounter:', error)
      // Fallback to local state
      setCurrentEncounter(newEncounter)
      setActiveTab('encounter')
    }
  }

  const handleRecordingStart = () => {
    if (subscriptionStatus === 'free' && encounterLogs.length >= 3) {
      setShowSubscriptionModal(true)
      return
    }
    setIsRecording(true)
  }

  const handleRecordingStop = async () => {
    setIsRecording(false)
    if (currentEncounter) {
      try {
        // Update encounter logs
        const updatedLogs = await encounterService.getUserEncounterLogs(user?.id)
        if (updatedLogs.data) {
          setEncounterLogs(updatedLogs.data)
        }
      } catch (error) {
        console.error('Error updating encounter logs:', error)
      }
    }
  }

  const handleSubscribe = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    try {
      const result = await paymentService.createCheckoutSession('price_premium_monthly', user.id)
      if (result.success) {
        if (result.demo) {
          // Demo mode - simulate successful subscription
          await updateSubscriptionStatus('premium')
          setShowSubscriptionModal(false)
          alert('Demo: Subscription activated! 🎉')
        }
        // In production, Stripe would redirect to checkout
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Subscription failed. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading Roadside Rights...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800">
      <div className="min-h-screen bg-black/20">
        <Header 
          subscriptionStatus={subscriptionStatus}
          onSubscriptionClick={() => setShowSubscriptionModal(true)}
          user={user}
          onShowAuth={() => setShowAuthModal(true)}
        />
        
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          {!selectedState ? (
            <StateSelector 
              onStateSelect={setSelectedState} 
              isLoading={isLoadingLocation}
            />
          ) : (
            <>
              <div className="mb-6">
                <div className="bg-surface/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Current State: {stateData?.name || selectedState}
                  </h2>
                  <button
                    onClick={() => setSelectedState('')}
                    className="text-accent hover:text-accent/80 text-sm"
                  >
                    Change State
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('rights')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      activeTab === 'rights'
                        ? 'bg-primary text-white'
                        : 'bg-surface/10 text-white hover:bg-surface/20'
                    }`}
                  >
                    Your Rights
                  </button>
                  <button
                    onClick={handleStartEncounter}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-semibold"
                  >
                    🚨 Get Help Now
                  </button>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      activeTab === 'logs'
                        ? 'bg-primary text-white'
                        : 'bg-surface/10 text-white hover:bg-surface/20'
                    }`}
                  >
                    My Logs ({encounterLogs.length})
                  </button>
                </div>
              </div>

              {activeTab === 'rights' && stateData && (
                <RightsCards 
                  stateData={stateData}
                  subscriptionStatus={subscriptionStatus}
                />
              )}

              {activeTab === 'encounter' && (
                <>
                  {subscriptionStatus === 'premium' ? (
                    <EncounterAssistantEnhanced
                      stateData={stateData}
                      currentEncounter={currentEncounter}
                      setCurrentEncounter={setCurrentEncounter}
                      isRecording={isRecording}
                      onRecordingStart={handleRecordingStart}
                      onRecordingStop={handleRecordingStop}
                      subscriptionStatus={subscriptionStatus}
                      user={user}
                    />
                  ) : (
                    <EncounterAssistant
                      stateData={stateData}
                      currentEncounter={currentEncounter}
                      setCurrentEncounter={setCurrentEncounter}
                      isRecording={isRecording}
                      onRecordingStart={handleRecordingStart}
                      onRecordingStop={handleRecordingStop}
                      subscriptionStatus={subscriptionStatus}
                    />
                  )}
                </>
              )}

              {activeTab === 'logs' && (
                <DocumentationPanel
                  encounterLogs={encounterLogs}
                  stateData={stateData}
                  user={user}
                />
              )}
            </>
          )}
        </main>

        {showSubscriptionModal && (
          <SubscriptionModal
            onClose={() => setShowSubscriptionModal(false)}
            onSubscribe={handleSubscribe}
          />
        )}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
