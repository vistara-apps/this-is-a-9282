import React, { useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { stateRightsData } from '../data/stateRights'

export default function StateSelector({ onStateSelect }) {
  const [searchTerm, setSearchTerm] = useState('')

  const states = Object.entries(stateRightsData).filter(([key, state]) =>
    state.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For demo, we'll just select California
          onStateSelect('california')
        },
        (error) => {
          alert('Please enable location access or select your state manually.')
        }
      )
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-surface/10 backdrop-blur-sm rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Roadside Rights</h2>
        <p className="text-white/80 mb-6">
          Get instant access to your state-specific rights and guidance for police encounters.
        </p>
        
        <button
          onClick={handleLocationRequest}
          className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <MapPin className="h-5 w-5" />
          Use My Current Location
        </button>
        
        <div className="text-center text-white/60 mb-4">or</div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
          <input
            type="text"
            placeholder="Search for your state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface/20 border border-white/20 rounded-md py-3 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {states.map(([key, state]) => (
          <button
            key={key}
            onClick={() => onStateSelect(key)}
            className="bg-surface/10 backdrop-blur-sm border border-white/20 rounded-md p-4 text-left hover:bg-surface/20 transition-colors group"
          >
            <h3 className="font-semibold text-white group-hover:text-accent transition-colors">
              {state.name}
            </h3>
            <p className="text-sm text-white/70 mt-1">
              Click to view your rights
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}