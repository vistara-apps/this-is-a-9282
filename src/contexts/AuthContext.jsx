import React, { createContext, useContext, useState, useEffect } from 'react'
import { userService, supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState('free')

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const currentUser = await userService.getCurrentUser()
        setUser(currentUser)
        
        if (currentUser) {
          // Get user profile data including subscription status
          const { data: profile } = await supabase
            .from('users')
            .select('subscription_status')
            .eq('id', currentUser.id)
            .single()
          
          if (profile) {
            setSubscriptionStatus(profile.subscription_status || 'free')
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          
          // Create or update user profile
          const { error } = await supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              subscription_status: 'free',
              created_at: new Date().toISOString()
            })
          
          if (!error) {
            setSubscriptionStatus('free')
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSubscriptionStatus('free')
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await userService.signUp(email, password)
      
      if (error) throw error
      
      return { success: true, data }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await userService.signIn(email, password)
      
      if (error) throw error
      
      return { success: true, data }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await userService.signOut()
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const updateSubscriptionStatus = async (status) => {
    if (!user) return { success: false, error: 'No user logged in' }
    
    try {
      const { error } = await userService.updateUserProfile(user.id, {
        subscription_status: status
      })
      
      if (error) throw error
      
      setSubscriptionStatus(status)
      return { success: true }
    } catch (error) {
      console.error('Update subscription error:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    loading,
    subscriptionStatus,
    signUp,
    signIn,
    signOut,
    updateSubscriptionStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
