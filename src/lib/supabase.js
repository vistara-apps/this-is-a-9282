import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database schema types for TypeScript-like documentation
export const DatabaseSchema = {
  users: {
    id: 'uuid',
    email: 'string',
    current_state: 'string',
    subscription_status: 'string', // 'free' | 'premium'
    created_at: 'timestamp'
  },
  state_info: {
    id: 'uuid',
    state_name: 'string',
    rights_summary: 'text',
    do_say: 'text',
    dont_say: 'text',
    legal_resources: 'text',
    created_at: 'timestamp'
  },
  encounter_logs: {
    id: 'uuid',
    user_id: 'uuid',
    timestamp: 'timestamp',
    location: 'string',
    state: 'string',
    notes: 'text',
    audio_recording_url: 'string',
    video_recording_url: 'string',
    created_at: 'timestamp'
  }
}

// User management functions
export const userService = {
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async updateUserProfile(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
    return { data, error }
  }
}

// State information functions
export const stateService = {
  async getAllStates() {
    const { data, error } = await supabase
      .from('state_info')
      .select('*')
      .order('state_name')
    return { data, error }
  },

  async getStateByName(stateName) {
    const { data, error } = await supabase
      .from('state_info')
      .select('*')
      .eq('state_name', stateName)
      .single()
    return { data, error }
  }
}

// Encounter logs functions
export const encounterService = {
  async createEncounterLog(encounterData) {
    const { data, error } = await supabase
      .from('encounter_logs')
      .insert([encounterData])
      .select()
    return { data, error }
  },

  async getUserEncounterLogs(userId) {
    const { data, error } = await supabase
      .from('encounter_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async updateEncounterLog(logId, updates) {
    const { data, error } = await supabase
      .from('encounter_logs')
      .update(updates)
      .eq('id', logId)
      .select()
    return { data, error }
  },

  async deleteEncounterLog(logId) {
    const { error } = await supabase
      .from('encounter_logs')
      .delete()
      .eq('id', logId)
    return { error }
  }
}

// File upload functions
export const storageService = {
  async uploadRecording(file, fileName, bucket = 'recordings') {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)
    return { data, error }
  },

  async getRecordingUrl(fileName, bucket = 'recordings') {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)
    return data.publicUrl
  },

  async deleteRecording(fileName, bucket = 'recordings') {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName])
    return { error }
  }
}
