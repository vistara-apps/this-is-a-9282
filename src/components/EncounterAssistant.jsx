import React, { useState, useEffect } from 'react'
import { Mic, MicOff, Video, VideoOff, MapPin, Clock, AlertTriangle } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'

export default function EncounterAssistant({
  stateData,
  currentEncounter,
  setCurrentEncounter,
  isRecording,
  onRecordingStart,
  onRecordingStop,
  subscriptionStatus
}) {
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [encounterNotes, setEncounterNotes] = useState('')

  useEffect(() => {
    let interval
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } else {
      setRecordingDuration(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleLocationCapture = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentEncounter(prev => ({
          ...prev,
          location: `${position.coords.latitude}, ${position.coords.longitude}`
        }))
      })
    }
  }

  const handleNotesChange = (notes) => {
    setEncounterNotes(notes)
    setCurrentEncounter(prev => ({
      ...prev,
      notes
    }))
  }

  if (!stateData) return null

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Emergency Banner */}
      <Card className="bg-red-600/20 border-red-500/50">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Roadside Encounter Assistant</h2>
          </div>
          <p className="text-white/90 text-sm">
            Stay calm. Follow the guidance below. Record if safe to do so.
          </p>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-surface/10 backdrop-blur-sm border border-white/20">
        <div className="p-4">
          <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={isRecording ? onRecordingStop : onRecordingStart}
              className={`flex items-center justify-center gap-2 ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-accent hover:bg-accent/90'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-5 w-5" />
                  Stop Recording ({formatDuration(recordingDuration)})
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  Start Audio Recording
                </>
              )}
            </Button>
            
            <Button
              onClick={handleLocationCapture}
              variant="secondary"
              className="flex items-center justify-center gap-2"
            >
              <MapPin className="h-5 w-5" />
              Capture Location
            </Button>
          </div>
          
          {currentEncounter?.location && (
            <div className="mt-3 text-sm text-white/70">
              📍 Location captured: {currentEncounter.location.slice(0, 20)}...
            </div>
          )}
        </div>
      </Card>

      {/* What to Say */}
      <Card className="bg-green-600/20 border border-green-500/50">
        <div className="p-4">
          <h3 className="font-semibold text-green-300 mb-3">✅ What TO Say</h3>
          <div className="text-white/90 whitespace-pre-line text-sm">
            {stateData.doSay}
          </div>
        </div>
      </Card>

      {/* What NOT to Say */}
      <Card className="bg-red-600/20 border border-red-500/50">
        <div className="p-4">
          <h3 className="font-semibold text-red-300 mb-3">❌ What NOT to Say</h3>
          <div className="text-white/90 whitespace-pre-line text-sm">
            {stateData.dontSay}
          </div>
        </div>
      </Card>

      {/* Encounter Notes */}
      <Card className="bg-surface/10 backdrop-blur-sm border border-white/20">
        <div className="p-4">
          <h3 className="font-semibold text-white mb-3">Encounter Notes</h3>
          <textarea
            value={encounterNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Officer badge number, vehicle info, what happened..."
            className="w-full bg-surface/20 border border-white/20 rounded-md p-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] resize-vertical"
          />
          <div className="flex items-center gap-2 mt-3 text-sm text-white/60">
            <Clock className="h-4 w-4" />
            Started: {currentEncounter ? new Date(currentEncounter.timestamp).toLocaleString() : 'Not started'}
          </div>
        </div>
      </Card>
    </div>
  )
}