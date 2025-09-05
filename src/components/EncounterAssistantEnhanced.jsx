import React, { useState, useEffect } from 'react'
import { Mic, MicOff, Video, VideoOff, MapPin, Clock, AlertTriangle, Share2, Download } from 'lucide-react'
import { recordingService, recordingUtils } from '../lib/recording'
import { geolocationService } from '../lib/geolocation'
import { aiService } from '../lib/openai'
import { encounterService } from '../lib/supabase'
import { PRICING } from '../lib/stripe'
import Card from './ui/Card'
import Button from './ui/Button'

export default function EncounterAssistantEnhanced({
  stateData,
  currentEncounter,
  setCurrentEncounter,
  isRecording,
  onRecordingStart,
  onRecordingStop,
  subscriptionStatus,
  user
}) {
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [location, setLocation] = useState('')
  const [recordingType, setRecordingType] = useState('audio')
  const [recordingBlob, setRecordingBlob] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [contextualAdvice, setContextualAdvice] = useState('')
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false)
  const [encounterSummary, setEncounterSummary] = useState('')

  useEffect(() => {
    let interval
    if (isRecording) {
      interval = setInterval(() => {
        const duration = recordingService.getRecordingDuration()
        setRecordingDuration(duration)
        
        // Check duration limits for free users
        const maxDuration = PRICING[subscriptionStatus.toUpperCase()]?.limitations?.maxRecordingDuration || 300
        if (subscriptionStatus === 'free' && duration >= maxDuration) {
          handleStopRecording()
        }
      }, 1000)
    } else {
      setRecordingDuration(0)
    }
    return () => clearInterval(interval)
  }, [isRecording, subscriptionStatus])

  useEffect(() => {
    // Get user's location with enhanced geolocation
    const getLocation = async () => {
      try {
        const locationResult = await geolocationService.getCurrentPosition()
        if (locationResult.success) {
          const { latitude, longitude } = locationResult
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          
          // Try to get a more readable address
          const stateResult = await geolocationService.detectStateFromCoordinates(latitude, longitude)
          if (stateResult.success && stateResult.city) {
            setLocation(`${stateResult.city}, ${stateResult.state}`)
          }
        }
      } catch (error) {
        console.log('Location access denied:', error)
      }
    }
    
    getLocation()
  }, [])

  const formatTime = (seconds) => {
    return recordingUtils.formatDuration(seconds)
  }

  const handleStartRecording = async (type = 'audio') => {
    try {
      setRecordingType(type)
      const maxDuration = PRICING[subscriptionStatus.toUpperCase()]?.limitations?.maxRecordingDuration || 300
      
      const result = await recordingService.startRecording(maxDuration)
      if (result.success) {
        onRecordingStart()
      } else {
        alert(`Recording failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Recording start error:', error)
      alert(`Recording failed: ${error.message}`)
    }
  }

  const handleStopRecording = async () => {
    try {
      const result = await recordingService.stopRecording()
      if (result.success) {
        setRecordingBlob(result.blob)
        onRecordingStop()
        
        // Auto-upload if user is authenticated
        if (user && currentEncounter) {
          await handleUploadRecording(result.blob)
        }
      } else {
        alert(`Stop recording failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Recording stop error:', error)
      alert(`Stop recording failed: ${error.message}`)
    }
  }

  const handleUploadRecording = async (blob) => {
    if (!user || !currentEncounter) return

    setIsUploading(true)
    try {
      const fileName = recordingUtils.generateFileName(recordingType, `encounter-${currentEncounter.id}`)
      const uploadResult = await recordingService.uploadRecording(blob, fileName)
      
      if (uploadResult.success) {
        // Update encounter log with recording URL
        const updateData = {
          [`${recordingType}_recording_url`]: uploadResult.url
        }
        
        await encounterService.updateEncounterLog(currentEncounter.id, updateData)
        
        setCurrentEncounter({
          ...currentEncounter,
          ...updateData
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadRecording = () => {
    if (recordingBlob) {
      const fileName = recordingUtils.generateFileName(recordingType, 'encounter')
      const { element } = recordingService.createDownloadLink(recordingBlob, fileName)
      element.click()
    }
  }

  const handleLocationUpdate = (e) => {
    const newLocation = e.target.value
    setLocation(newLocation)
    if (currentEncounter) {
      setCurrentEncounter({
        ...currentEncounter,
        location: newLocation
      })
    }
  }

  const handleNotesUpdate = (e) => {
    const notes = e.target.value
    if (currentEncounter) {
      setCurrentEncounter({
        ...currentEncounter,
        notes
      })
    }
  }

  const getContextualAdvice = async () => {
    if (!currentEncounter?.notes || isLoadingAdvice) return
    
    setIsLoadingAdvice(true)
    try {
      const advice = await aiService.getContextualAdvice(currentEncounter.notes, stateData.name)
      setContextualAdvice(advice)
    } catch (error) {
      console.error('Error getting advice:', error)
    } finally {
      setIsLoadingAdvice(false)
    }
  }

  const generateSummary = async () => {
    if (!currentEncounter || !stateData) return
    
    try {
      const summary = await aiService.generateEncounterSummary(currentEncounter, stateData)
      setEncounterSummary(summary)
    } catch (error) {
      console.error('Error generating summary:', error)
    }
  }

  const shareSummary = async () => {
    if (!encounterSummary) {
      await generateSummary()
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Police Encounter Summary',
          text: encounterSummary,
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(encounterSummary)
        alert('Summary copied to clipboard')
      }
    } else {
      navigator.clipboard.writeText(encounterSummary)
      alert('Summary copied to clipboard')
    }
  }

  if (!stateData) return null

  const maxDuration = PRICING[subscriptionStatus.toUpperCase()]?.limitations?.maxRecordingDuration || 300
  const remainingTime = maxDuration - recordingDuration

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Emergency Header */}
      <Card className="bg-red-600/20 border-red-500/50">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <h2 className="text-xl font-bold text-white">Emergency Encounter Mode</h2>
          </div>
          <p className="text-red-200 text-sm">
            Stay calm. Follow the guidance below. Your safety is the priority.
          </p>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-surface/10 backdrop-blur-sm border border-white/20">
        <div className="p-4">
          <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={isRecording ? handleStopRecording : () => handleStartRecording('audio')}
              className={`flex items-center justify-center gap-3 ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-accent hover:bg-accent/90 text-white'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-5 w-5" />
                  Stop Recording ({formatTime(recordingDuration)})
                  {subscriptionStatus === 'free' && (
                    <span className="text-xs">({formatTime(remainingTime)} left)</span>
                  )}
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  Start Audio Recording
                </>
              )}
            </Button>

            <Button
              onClick={() => handleStartRecording('video')}
              className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={subscriptionStatus === 'free' || isRecording}
            >
              <Video className="h-5 w-5" />
              {subscriptionStatus === 'free' ? 'Video (Premium)' : 'Start Video'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Recording Controls */}
      {recordingBlob && (
        <Card className="bg-surface/10 backdrop-blur-sm border border-white/20">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Recording Complete</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadRecording}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              {isUploading && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm">
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* What to Say */}
      <Card className="bg-green-600/20 border border-green-500/50">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-green-300 mb-3">✅ What to Say</h3>
          <div className="space-y-2">
            {(Array.isArray(stateData.doSay) ? stateData.doSay : 
              stateData.doSay.split('\n').filter(line => line.trim().startsWith('•'))
            ).map((phrase, index) => (
              <div key={index} className="text-green-200 text-sm">
                • {typeof phrase === 'string' ? phrase.replace('•', '').trim() : phrase}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* What NOT to Say */}
      <Card className="bg-red-600/20 border border-red-500/50">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-red-300 mb-3">❌ What NOT to Say</h3>
          <div className="space-y-2">
            {(Array.isArray(stateData.dontSay) ? stateData.dontSay : 
              stateData.dontSay.split('\n').filter(line => line.trim().startsWith('•'))
            ).map((phrase, index) => (
              <div key={index} className="text-red-200 text-sm">
                • {typeof phrase === 'string' ? phrase.replace('•', '').trim() : phrase}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Contextual AI Advice */}
      {subscriptionStatus === 'premium' && (
        <Card className="bg-purple-600/20 border border-purple-500/50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-purple-300">🤖 AI Contextual Advice</h3>
              <Button
                onClick={getContextualAdvice}
                disabled={!currentEncounter?.notes || isLoadingAdvice}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-50"
              >
                {isLoadingAdvice ? 'Loading...' : 'Get Advice'}
              </Button>
            </div>
            {contextualAdvice && (
              <div className="text-purple-200 text-sm whitespace-pre-wrap">
                {contextualAdvice}
              </div>
            )}
            {!currentEncounter?.notes && (
              <p className="text-purple-300 text-sm">Add notes below to get contextual advice</p>
            )}
          </div>
        </Card>
      )}

      {/* Encounter Details */}
      <Card className="bg-surface/10 backdrop-blur-sm border border-white/20">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Encounter Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={handleLocationUpdate}
                placeholder="Enter location or address"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Time
              </label>
              <input
                type="text"
                value={currentEncounter ? new Date(currentEncounter.timestamp).toLocaleString() : ''}
                readOnly
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white/70"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Notes
              </label>
              <textarea
                value={currentEncounter?.notes || ''}
                onChange={handleNotesUpdate}
                placeholder="Badge numbers, officer descriptions, what happened..."
                rows={4}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
          </div>

          {/* Summary and Share */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <Button
              onClick={shareSummary}
              className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white"
            >
              <Share2 className="h-4 w-4" />
              Generate & Share Summary
            </Button>
          </div>
        </div>
      </Card>

      {/* Emergency Contacts */}
      <Card className="bg-yellow-600/20 border border-yellow-500/50">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-yellow-300 mb-3">Emergency Contacts</h3>
          <div className="space-y-2 text-yellow-200 text-sm">
            <div>• Emergency: 911</div>
            <div>• ACLU Know Your Rights: (877) 337-8673</div>
            <div>• Local Legal Aid: 211</div>
            {stateData.legalResources && (
              <div className="mt-2 pt-2 border-t border-yellow-500/30">
                <div className="whitespace-pre-line">{stateData.legalResources}</div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
