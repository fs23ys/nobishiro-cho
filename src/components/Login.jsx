import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async () => {
    setError('')
    setSubmitting(true)
    try {
      await login()
    } catch (e) {
      setError(e.message || 'ログインに失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-form">
        <h1>のびしろ帖</h1>
        {error && <p className="login-error">{error}</p>}
        <button type="button" onClick={handleLogin} disabled={submitting}>
          {submitting ? 'ログイン中…' : 'Googleでログイン'}
        </button>
      </div>
    </div>
  )
}
