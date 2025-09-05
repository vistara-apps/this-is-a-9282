import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import StateSelector from './components/StateSelector'
import RightsCards from './components/RightsCards'
import EncounterAssistant from './components/EncounterAssistant'
import DocumentationPanel from './components/DocumentationPanel'
import SubscriptionModal from './components/SubscriptionModal'
import { stateRightsData } from './data/stateRights'

export default function App() {
  const [selectedState, setSelectedState] = useState('')
  const [activeTab, setActiveTab] = useState('rights')
  const [isRecording, setIsRecording] = useState(false)
  const [encounterLogs, setEncounterLogs] = useState([])
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState('free')
  const [currentEncounter, setCurrentEncounter] = useState(null)

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, we'd use reverse geocoding to get the state
          // For demo purposes, we'll default to California
          setSelectedState('california')
        },
        (error) => {
          console.log('Location access denied')
        }
      )
    }
  }, [])

  const handleStartEncounter = () => {
    const newEncounter = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      state: selectedState,
      location: '',
      notes: '',
      audioRecordingUrl: null,
      videoRecordingUrl: null
    }
    setCurrentEncounter(newEncounter)
    setActiveTab('encounter')
  }

  const handleRecordingStart = () => {
    if (subscriptionStatus === 'free' && encounterLogs.length >= 3) {
      setShowSubscriptionModal(true)
      return
    }
    setIsRecording(true)
  }

  const handleRecordingStop = () => {
    setIsRecording(false)
    if (currentEncounter) {
      // In a real app, we'd upload the recording
      const updatedEncounter = {
        ...currentEncounter,
        audioRecordingUrl: 'demo-recording-url'
      }
      setEncounterLogs(prev => [...prev, updatedEncounter])
      setCurrentEncounter(null)
    }
  }

  const handleSubscribe = () => {
    setSubscriptionStatus('premium')
    setShowSubscriptionModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800">
      <div className="min-h-screen bg-black/20">
        <Header 
          subscriptionStatus={subscriptionStatus}
          onSubscriptionClick={() => setShowSubscriptionModal(true)}
        />
        
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          {!selectedState ? (
            <StateSelector onStateSelect={setSelectedState} />
          ) : (
            <>
              <div className="mb-6">
                <div className="bg-surface/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Current State: {stateRightsData[selectedState]?.name}
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

              {activeTab === 'rights' && (
                <RightsCards 
                  stateData={stateRightsData[selectedState]}
                  subscriptionStatus={subscriptionStatus}
                />
              )}

              {activeTab === 'encounter' && (
                <EncounterAssistant
                  stateData={stateRightsData[selectedState]}
                  currentEncounter={currentEncounter}
                  setCurrentEncounter={setCurrentEncounter}
                  isRecording={isRecording}
                  onRecordingStart={handleRecordingStart}
                  onRecordingStop={handleRecordingStop}
                  subscriptionStatus={subscriptionStatus}
                />
              )}

              {activeTab === 'logs' && (
                <DocumentationPanel
                  encounterLogs={encounterLogs}
                  stateData={stateRightsData[selectedState]}
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
      </div>
    </div>
  )
}