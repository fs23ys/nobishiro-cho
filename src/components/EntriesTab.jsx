import { useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { todayStr, toSlashDate } from '../utils/format'
import { getTraitIds } from '../utils/traits'

const TYPE_LABEL = { moss: '長所', clay: '短所' }

export default function EntriesTab({ entries, traits }) {
  const [date, setDate] = useState(todayStr())
  const [text, setText] = useState('')
  const [type, setType] = useState('moss')
  const [traitIds, setTraitIds] = useState([])
  const [nextAction, setNextAction] = useState('')
  const [showNextAction, setShowNextAction] = useState(false)
  const [creatingTrait, setCreatingTrait] = useState(false)
  const [newTraitName, setNewTraitName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [editingNextAction, setEditingNextAction] = useState('')
  const [editingShowNextAction, setEditingShowNextAction] = useState(false)
  const [filterTraitId, setFilterTraitId] = useState('')
  const [traitSearchText, setTraitSearchText] = useState('')

  const traitUsageCount = useMemo(() => {
    const map = new Map()
    for (const e of entries) {
      for (const id of getTraitIds(e)) map.set(id, (map.get(id) ?? 0) + 1)
    }
    return map
  }, [entries])

  const filteredTraits = useMemo(() => {
    const keyword = traitSearchText.trim()
    const list = traits.filter(
      (t) => t.type === type && (!keyword || t.name.includes(keyword)),
    )
    return [...list].sort(
      (a, b) => (traitUsageCount.get(b.id) ?? 0) - (traitUsageCount.get(a.id) ?? 0),
    )
  }, [traits, type, traitSearchText, traitUsageCount])

  const traitById = useMemo(() => {
    const map = new Map()
    for (const t of traits) map.set(t.id, t)
    return map
  }, [traits])

  const visibleEntries = useMemo(() => {
    if (!filterTraitId) return entries
    return entries.filter((e) => getTraitIds(e).includes(filterTraitId))
  }, [entries, filterTraitId])

  const handleTypeChange = (newType) => {
    setType(newType)
    setTraitIds([])
    setCreatingTrait(false)
    setNewTraitName('')
    setTraitSearchText('')
  }

  const toggleTraitId = (id) => {
    setTraitIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleCreateTrait = async () => {
    const name = newTraitName.trim()
    if (!name) return
    const ref = await addDoc(collection(db, 'traits'), {
      name,
      type,
      desc: '',
      createdAt: serverTimestamp(),
    })
    setTraitIds((prev) => [...prev, ref.id])
    setNewTraitName('')
    setCreatingTrait(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    await addDoc(collection(db, 'entries'), {
      date,
      text: text.trim(),
      type,
      traitIds,
      nextAction: nextAction.trim() || null,
      nextActionDone: false,
      createdAt: serverTimestamp(),
    })
    setDate(todayStr())
    setText('')
    setTraitIds([])
    setNextAction('')
    setShowNextAction(false)
  }

  const handleDelete = (id) => {
    deleteDoc(doc(db, 'entries', id))
  }

  const startEdit = (entry) => {
    setEditingId(entry.id)
    setEditingText(entry.text)
    setEditingNextAction(entry.nextAction ?? '')
    setEditingShowNextAction(!!entry.nextAction)
  }

  const commitEdit = async (id) => {
    if (editingText.trim()) {
      await updateDoc(doc(db, 'entries', id), {
        text: editingText.trim(),
        nextAction: editingNextAction.trim() || null,
      })
    }
    setEditingId(null)
  }

  const toggleNextActionDone = (entry) => {
    updateDoc(doc(db, 'entries', entry.id), { nextActionDone: !entry.nextActionDone })
  }

  return (
    <div className="tab-panel">
      <form className="card entry-form" onSubmit={handleSubmit}>
        <div className="entry-type-label">この気づきの種別</div>
        <div className="type-toggle">
          <label className={type === 'moss' ? 'chip chip-moss selected' : 'chip chip-moss'}>
            <input
              type="radio"
              name="entry-type"
              checked={type === 'moss'}
              onChange={() => handleTypeChange('moss')}
            />
            長所
          </label>
          <label className={type === 'clay' ? 'chip chip-clay selected' : 'chip chip-clay'}>
            <input
              type="radio"
              name="entry-type"
              checked={type === 'clay'}
              onChange={() => handleTypeChange('clay')}
            />
            短所
          </label>
          <input
            type="date"
            className="entry-date-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayStr()}
            required
          />
        </div>
        <textarea
          placeholder="気づいたことを書き留める…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          required
        />
        {showNextAction ? (
          <input
            className="next-action-input"
            placeholder="次から試す小さな一歩（任意）"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="next-action-add-link"
            onClick={() => setShowNextAction(true)}
          >
            ＋ 次から試す小さな一歩を追加（任意）
          </button>
        )}
        <div className="trait-picker-label">
          特性を選ぶ（任意・上で選んだ種別から・よく使う順）
        </div>
        <input
          type="text"
          className="trait-picker-search"
          placeholder="特性を検索…"
          value={traitSearchText}
          onChange={(e) => setTraitSearchText(e.target.value)}
        />
        <div className="trait-picker">
          {filteredTraits.map((t) => (
            <button
              type="button"
              key={t.id}
              className={
                traitIds.includes(t.id) ? 'trait-pick-chip selected' : 'trait-pick-chip'
              }
              onClick={() => toggleTraitId(t.id)}
            >
              {t.name}
            </button>
          ))}
          <button
            type="button"
            className="trait-pick-chip trait-pick-chip-add"
            onClick={() => setCreatingTrait(true)}
          >
            ＋ 新しい特性
          </button>
        </div>
        {creatingTrait && (
          <div className="quick-trait-create">
            <input
              placeholder="新しい特性名"
              value={newTraitName}
              onChange={(e) => setNewTraitName(e.target.value)}
              autoFocus
            />
            <button type="button" onClick={handleCreateTrait}>
              作成
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatingTrait(false)
                setNewTraitName('')
              }}
            >
              キャンセル
            </button>
          </div>
        )}
        <button type="submit">記録する</button>
      </form>

      <div className="entry-filter">
        <label>
          特性で絞り込む
          <select value={filterTraitId} onChange={(e) => setFilterTraitId(e.target.value)}>
            <option value="">すべて</option>
            <optgroup label="長所">
              {traits
                .filter((t) => t.type === 'moss')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="短所">
              {traits
                .filter((t) => t.type === 'clay')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </label>
      </div>

      <ul className="entry-list">
        {visibleEntries.map((entry) => {
          const linkedTraits = getTraitIds(entry)
            .map((id) => traitById.get(id))
            .filter(Boolean)
          return (
            <li key={entry.id} className="entry-item">
              <div className="entry-item-meta">
                <span className="entry-date">{toSlashDate(entry.date)}</span>
                {linkedTraits.length > 0 ? (
                  linkedTraits.map((t) => (
                    <span key={t.id} className={`entry-trait-chip entry-trait-chip-${t.type}`}>
                      {t.name}
                    </span>
                  ))
                ) : (
                  <span className={entry.type === 'moss' ? 'chip chip-moss' : 'chip chip-clay'}>
                    {TYPE_LABEL[entry.type]}
                  </span>
                )}
              </div>
              {editingId === entry.id ? (
                <div className="entry-edit">
                  <textarea
                    className="entry-edit-textarea"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  {editingShowNextAction ? (
                    <input
                      className="next-action-input"
                      placeholder="次から試す小さな一歩（任意）"
                      value={editingNextAction}
                      onChange={(e) => setEditingNextAction(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      className="next-action-add-link"
                      onClick={() => setEditingShowNextAction(true)}
                    >
                      ＋ 次から試す小さな一歩を追加（任意）
                    </button>
                  )}
                  <div className="entry-edit-actions">
                    <button type="button" onClick={() => commitEdit(entry.id)}>
                      保存
                    </button>
                    <button type="button" onClick={() => setEditingId(null)}>
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="entry-text" onClick={() => startEdit(entry)}>
                    {entry.text}
                  </p>
                  {entry.nextAction && (
                    <label className="next-action-row">
                      <input
                        type="checkbox"
                        checked={!!entry.nextActionDone}
                        onChange={() => toggleNextActionDone(entry)}
                      />
                      <span className={entry.nextActionDone ? 'next-action-done' : ''}>
                        {entry.nextAction}
                      </span>
                    </label>
                  )}
                </>
              )}
              <button
                type="button"
                className="delete-button"
                aria-label="削除"
                onClick={() => handleDelete(entry.id)}
              >
                ×
              </button>
            </li>
          )
        })}
        {visibleEntries.length === 0 && <li className="empty-state">まだ記録がありません</li>}
      </ul>
    </div>
  )
}
