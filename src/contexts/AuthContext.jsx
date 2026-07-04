import { createContext, useContext, useEffect, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../firebase'

const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = async () => {
    const result = await signInWithPopup(auth, new GoogleAuthProvider())
    if (ALLOWED_EMAIL && result.user.email !== ALLOWED_EMAIL) {
      await signOut(auth)
      throw new Error('このGoogleアカウントではログインできません。')
    }
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
