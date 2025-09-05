// US State boundaries (simplified for demo - in production, use a proper geocoding service)
const STATE_BOUNDARIES = {
  'california': { lat: [32.5, 42.0], lng: [-124.4, -114.1] },
  'texas': { lat: [25.8, 36.5], lng: [-106.6, -93.5] },
  'florida': { lat: [24.4, 31.0], lng: [-87.6, -80.0] },
  'newyork': { lat: [40.5, 45.0], lng: [-79.8, -71.9] },
  'illinois': { lat: [36.9, 42.5], lng: [-91.5, -87.0] },
  'pennsylvania': { lat: [39.7, 42.3], lng: [-80.5, -74.7] },
  'ohio': { lat: [38.4, 42.3], lng: [-84.8, -80.5] },
  'georgia': { lat: [30.4, 35.0], lng: [-85.6, -80.8] },
  'northcarolina': { lat: [33.8, 36.6], lng: [-84.3, -75.5] },
  'michigan': { lat: [41.7, 48.3], lng: [-90.4, -82.1] }
}

export const geolocationService = {
  /**
   * Check if geolocation is supported
   */
  isSupported() {
    return 'geolocation' in navigator
  },

  /**
   * Get current position
   * @param {Object} options - Geolocation options
   */
  async getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    }

    const finalOptions = { ...defaultOptions, ...options }

    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            success: true,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          })
        },
        (error) => {
          reject({
            success: false,
            error: this.getGeolocationErrorMessage(error),
            code: error.code
          })
        },
        finalOptions
      )
    })
  },

  /**
   * Watch position changes
   * @param {Function} callback - Callback function for position updates
   * @param {Object} options - Geolocation options
   */
  watchPosition(callback, options = {}) {
    if (!this.isSupported()) {
      callback({ success: false, error: 'Geolocation is not supported' })
      return null
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 minute
    }

    const finalOptions = { ...defaultOptions, ...options }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          success: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
      },
      (error) => {
        callback({
          success: false,
          error: this.getGeolocationErrorMessage(error),
          code: error.code
        })
      },
      finalOptions
    )
  },

  /**
   * Clear position watch
   * @param {number} watchId - Watch ID returned by watchPosition
   */
  clearWatch(watchId) {
    if (watchId && this.isSupported()) {
      navigator.geolocation.clearWatch(watchId)
    }
  },

  /**
   * Detect state from coordinates (simplified version)
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   */
  async detectStateFromCoordinates(latitude, longitude) {
    try {
      // In production, use a proper reverse geocoding service like Google Maps API
      // This is a simplified version for demo purposes
      
      for (const [stateName, bounds] of Object.entries(STATE_BOUNDARIES)) {
        if (
          latitude >= bounds.lat[0] && latitude <= bounds.lat[1] &&
          longitude >= bounds.lng[0] && longitude <= bounds.lng[1]
        ) {
          return {
            success: true,
            state: stateName,
            confidence: 'approximate',
            method: 'boundary_check'
          }
        }
      }

      // If no state found in our simplified boundaries, try reverse geocoding
      const reverseGeoResult = await this.reverseGeocode(latitude, longitude)
      if (reverseGeoResult.success) {
        return reverseGeoResult
      }

      return {
        success: false,
        error: 'Could not determine state from coordinates',
        latitude,
        longitude
      }
    } catch (error) {
      console.error('State detection error:', error)
      return {
        success: false,
        error: error.message,
        latitude,
        longitude
      }
    }
  },

  /**
   * Reverse geocode coordinates to get address information
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   */
  async reverseGeocode(latitude, longitude) {
    try {
      // In production, use a proper geocoding service
      // For demo, we'll use a free service (note: has rate limits)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      )

      if (!response.ok) {
        throw new Error('Geocoding service unavailable')
      }

      const data = await response.json()
      
      if (data.principalSubdivision) {
        const stateName = this.normalizeStateName(data.principalSubdivision)
        return {
          success: true,
          state: stateName,
          city: data.city || data.locality,
          country: data.countryName,
          confidence: 'high',
          method: 'reverse_geocoding',
          fullAddress: data.localityInfo?.administrative || []
        }
      }

      return {
        success: false,
        error: 'Could not determine state from geocoding response'
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return {
        success: false,
        error: 'Geocoding service error'
      }
    }
  },

  /**
   * Get user's current state
   */
  async getCurrentState() {
    try {
      const position = await this.getCurrentPosition()
      
      if (!position.success) {
        return position
      }

      const stateResult = await this.detectStateFromCoordinates(
        position.latitude,
        position.longitude
      )

      return {
        ...stateResult,
        coordinates: {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || error.error
      }
    }
  },

  /**
   * Normalize state name to match our data format
   * @param {string} stateName - Raw state name
   */
  normalizeStateName(stateName) {
    const stateMap = {
      'California': 'california',
      'Texas': 'texas',
      'Florida': 'florida',
      'New York': 'newyork',
      'Illinois': 'illinois',
      'Pennsylvania': 'pennsylvania',
      'Ohio': 'ohio',
      'Georgia': 'georgia',
      'North Carolina': 'northcarolina',
      'Michigan': 'michigan'
    }

    return stateMap[stateName] || stateName.toLowerCase().replace(/\s+/g, '')
  },

  /**
   * Get user-friendly geolocation error message
   * @param {GeolocationPositionError} error - Geolocation error
   */
  getGeolocationErrorMessage(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied. Please enable location services and refresh the page.'
      case error.POSITION_UNAVAILABLE:
        return 'Location information is unavailable. Please try again.'
      case error.TIMEOUT:
        return 'Location request timed out. Please try again.'
      default:
        return 'An unknown location error occurred.'
    }
  },

  /**
   * Check if coordinates are within US boundaries (approximate)
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   */
  isWithinUS(latitude, longitude) {
    // Approximate US boundaries
    const US_BOUNDS = {
      north: 49.0,
      south: 24.0,
      east: -66.0,
      west: -125.0
    }

    return (
      latitude >= US_BOUNDS.south &&
      latitude <= US_BOUNDS.north &&
      longitude >= US_BOUNDS.west &&
      longitude <= US_BOUNDS.east
    )
  },

  /**
   * Get distance between two coordinates (in miles)
   * @param {number} lat1 - First latitude
   * @param {number} lng1 - First longitude
   * @param {number} lat2 - Second latitude
   * @param {number} lng2 - Second longitude
   */
  getDistance(lat1, lng1, lat2, lng2) {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  /**
   * Convert degrees to radians
   * @param {number} degrees - Degrees
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }
}
