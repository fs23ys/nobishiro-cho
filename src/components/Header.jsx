import { useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import {
  buildExportJson,
  downloadBackupFile,
  replaceAllData,
  restoreFromBackupBeforeImport,
  saveBackupBeforeImport,
  validateBackupShape,
} from '../utils/backup'
import { todayStr } from '../utils/format'

const TABS = [
  { key: 'entries', label: '記録' },
  { key: 'traits', label: '長所短所' },
  { key: 'review', label: '週次振り返り' },
]

export default function Header({ activeTab, onChangeTab, entries, traits, reviews }) {
  const { logout } = useAuth()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)

  const handleBackup = () => {
    const json = buildExportJson(entries, traits, reviews)
    downloadBackupFile(json, todayStr())
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    let parsed
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      showToast('ファイルの形式が正しくありません')
      return
    }

    if (!validateBackupShape(parsed)) {
      showToast('ファイルの形式が正しくありません')
      return
    }

    const confirmed = window.confirm(
      '現在のデータを、このバックアップの内容で置き換えます。よろしいですか？',
    )
    if (!confirmed) return

    try {
      await saveBackupBeforeImport({ entries, traits, reviews })
      await replaceAllData({
        entries: parsed.entries,
        traits: parsed.traits,
        reviews: parsed.reviews,
      })
      showToast('復元しました', {
        actionLabel: '元に戻す',
        onAction: async () => {
          const restored = await restoreFromBackupBeforeImport()
          showToast(restored ? '元に戻しました' : '退避データが見つかりませんでした')
        },
      })
    } catch {
      showToast('インポート中にエラーが発生しました')
    }
  }

  return (
    <header className="app-header">
      <div className="app-header-top">
        <h1 className="app-title">のびしろ帖</h1>
        <div className="app-header-actions">
          <button type="button" onClick={handleBackup}>
            ⬇ バックアップ
          </button>
          <button type="button" onClick={handleImportClick}>
            ⬆ インポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            hidden
            onChange={handleFileChange}
          />
          <button type="button" className="logout-button" onClick={logout}>
            ログアウト
          </button>
        </div>
      </div>
      <nav className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={tab.key === activeTab ? 'tab active' : 'tab'}
            onClick={() => onChangeTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
