import { v4 as uuidv4 } from 'uuid'
import { storageService } from './supabase'

export class RecordingService {
  constructor() {
    this.mediaRecorder = null
    this.recordedChunks = []
    this.stream = null
    this.isRecording = false
    this.recordingType = 'audio' // 'audio' or 'video'
    this.startTime = null
    this.maxDuration = 300 // 5 minutes default for free users
  }

  /**
   * Check if recording is supported
   */
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }

  /**
   * Request permission for recording
   * @param {string} type - 'audio' or 'video'
   */
  async requestPermission(type = 'audio') {
    try {
      const constraints = type === 'video' 
        ? { video: true, audio: true }
        : { audio: true }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
      this.recordingType = type
      return { success: true, stream: this.stream }
    } catch (error) {
      console.error('Permission denied:', error)
      return { 
        success: false, 
        error: this.getPermissionErrorMessage(error) 
      }
    }
  }

  /**
   * Start recording
   * @param {number} maxDuration - Maximum recording duration in seconds
   */
  async startRecording(maxDuration = this.maxDuration) {
    try {
      if (!this.stream) {
        const permissionResult = await this.requestPermission(this.recordingType)
        if (!permissionResult.success) {
          return permissionResult
        }
      }

      this.recordedChunks = []
      this.maxDuration = maxDuration
      this.startTime = Date.now()

      // Configure MediaRecorder
      const options = {
        mimeType: this.getSupportedMimeType()
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options)

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      // Handle recording stop
      this.mediaRecorder.onstop = () => {
        this.isRecording = false
      }

      // Start recording
      this.mediaRecorder.start(1000) // Collect data every second
      this.isRecording = true

      // Set auto-stop timer
      if (maxDuration > 0) {
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording()
          }
        }, maxDuration * 1000)
      }

      return { success: true, recordingId: uuidv4() }
    } catch (error) {
      console.error('Recording start error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Stop recording
   */
  async stopRecording() {
    try {
      if (!this.mediaRecorder || !this.isRecording) {
        return { success: false, error: 'No active recording' }
      }

      return new Promise((resolve) => {
        this.mediaRecorder.onstop = () => {
          this.isRecording = false
          const blob = new Blob(this.recordedChunks, {
            type: this.getSupportedMimeType()
          })

          const duration = Math.floor((Date.now() - this.startTime) / 1000)
          
          resolve({
            success: true,
            blob,
            duration,
            size: blob.size,
            type: this.recordingType,
            mimeType: blob.type
          })
        }

        this.mediaRecorder.stop()
        this.stopStream()
      })
    } catch (error) {
      console.error('Recording stop error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Pause recording
   */
  pauseRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.pause()
      return { success: true }
    }
    return { success: false, error: 'No active recording to pause' }
  }

  /**
   * Resume recording
   */
  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
      return { success: true }
    }
    return { success: false, error: 'No paused recording to resume' }
  }

  /**
   * Get recording duration
   */
  getRecordingDuration() {
    if (!this.startTime) return 0
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  /**
   * Stop media stream
   */
  stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
  }

  /**
   * Upload recording to storage
   * @param {Blob} blob - Recording blob
   * @param {string} fileName - File name
   */
  async uploadRecording(blob, fileName) {
    try {
      const file = new File([blob], fileName, { type: blob.type })
      const result = await storageService.uploadRecording(file, fileName)
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      const url = await storageService.getRecordingUrl(fileName)
      return { success: true, url, fileName }
    } catch (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get supported MIME type for recording
   */
  getSupportedMimeType() {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return 'audio/webm' // fallback
  }

  /**
   * Get user-friendly permission error message
   */
  getPermissionErrorMessage(error) {
    switch (error.name) {
      case 'NotAllowedError':
        return 'Recording permission denied. Please allow microphone access in your browser settings.'
      case 'NotFoundError':
        return 'No recording device found. Please check your microphone connection.'
      case 'NotSupportedError':
        return 'Recording is not supported in this browser.'
      case 'NotReadableError':
        return 'Recording device is already in use by another application.'
      default:
        return `Recording error: ${error.message}`
    }
  }

  /**
   * Create download link for recording
   * @param {Blob} blob - Recording blob
   * @param {string} fileName - File name
   */
  createDownloadLink(blob, fileName) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    return { url, element: a }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopStream()
    this.recordedChunks = []
    this.mediaRecorder = null
    this.isRecording = false
    this.startTime = null
  }
}

// Utility functions
export const recordingUtils = {
  /**
   * Format duration in MM:SS format
   * @param {number} seconds - Duration in seconds
   */
  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  /**
   * Format file size
   * @param {number} bytes - Size in bytes
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * Generate recording file name
   * @param {string} type - 'audio' or 'video'
   * @param {string} prefix - File name prefix
   */
  generateFileName(type = 'audio', prefix = 'recording') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const extension = type === 'video' ? 'webm' : 'webm'
    return `${prefix}-${timestamp}.${extension}`
  }
}

// Create singleton instance
export const recordingService = new RecordingService()
