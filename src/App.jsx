import { useState } from 'react'
import './App.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { useCollection } from './hooks/useCollection'
import Login from './components/Login'
import Header from './components/Header'
import EntriesTab from './components/EntriesTab'
import TraitsTab from './components/TraitsTab'
import ReviewTab from './components/ReviewTab'

function AuthedApp() {
  const [activeTab, setActiveTab] = useState('entries')
  const { docs: entries, loading: entriesLoading } = useCollection('entries', 'createdAt', 'desc')
  const { docs: traits, loading: traitsLoading } = useCollection('traits', 'createdAt', 'desc')
  const { docs: reviews, loading: reviewsLoading } = useCollection('reviews', 'date', 'desc')

  const loading = entriesLoading || traitsLoading || reviewsLoading

  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        entries={entries}
        traits={traits}
        reviews={reviews}
      />
      <main className="app-main">
        {loading ? (
          <p className="loading">読み込み中…</p>
        ) : (
          <>
            {activeTab === 'entries' && <EntriesTab entries={entries} traits={traits} />}
            {activeTab === 'traits' && <TraitsTab traits={traits} entries={entries} />}
            {activeTab === 'review' && (
              <ReviewTab entries={entries} traits={traits} reviews={reviews} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

function Gate() {
  const { user, loading } = useAuth()
  if (loading) return <p className="loading">読み込み中…</p>
  return user ? <AuthedApp /> : <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Gate />
      </ToastProvider>
    </AuthProvider>
  )
}
