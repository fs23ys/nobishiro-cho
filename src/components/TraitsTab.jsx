import { useMemo, useState } from 'react'
import { addDoc, collection, doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { getTraitIds } from '../utils/traits'

// "名前 — メモ" のような1行1件のテキストをパースする（区切りがなければメモなし扱い）
function parseBulkLines(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?)\s*[—―\-:：]\s*(.+)$/)
      if (match) return { name: match[1].trim(), desc: match[2].trim() }
      return { name: line, desc: '' }
    })
    .filter((item) => item.name)
}

// order未設定の特性は、これまで通り新しい順で末尾に並べる
function byOrder(a, b) {
  const orderA = a.order ?? Number.MAX_SAFE_INTEGER
  const orderB = b.order ?? Number.MAX_SAFE_INTEGER
  if (orderA !== orderB) return orderA - orderB
  const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
  const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
  return tb - ta
}

const NAME_PLACEHOLDER = {
  moss: '例：タイピングが速い、人の話をしっかり聞ける',
  clay: '例：忙しい時に対応が雑になる、朝が弱い',
}

const DESC_PLACEHOLDER = {
  moss: '例：どんな時に発揮される？（例：薬歴入力が早く終わる）',
  clay: '例：どんな時に起きやすい？（例：患者さんが多くて焦っている時）',
}

function CountBadge({ type, count }) {
  if (count === 0) {
    return <span className="trait-count trait-count-empty">−</span>
  }
  if (type === 'moss') {
    return <span className="trait-count trait-count-moss">✨ {count}回</span>
  }
  return <span className="trait-count trait-count-clay">⚠️ {count}回</span>
}

export default function TraitsTab({ traits, entries }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('moss')
  const [desc, setDesc] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingDesc, setEditingDesc] = useState('')
  const [editingNameId, setEditingNameId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkType, setBulkType] = useState('moss')
  const [bulkText, setBulkText] = useState('')
  const [dragSource, setDragSource] = useState(null) // { listType, index }
  const [hoverIndex, setHoverIndex] = useState(null) // { listType, index }

  const countByTraitId = useMemo(() => {
    const map = new Map()
    for (const e of entries) {
      for (const traitId of getTraitIds(e)) {
        map.set(traitId, (map.get(traitId) ?? 0) + 1)
      }
    }
    return map
  }, [entries])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    await addDoc(collection(db, 'traits'), {
      name: name.trim(),
      type,
      desc: desc.trim(),
      createdAt: serverTimestamp(),
    })
    setName('')
    setDesc('')
  }

  const startEdit = (trait) => {
    setEditingId(trait.id)
    setEditingDesc(trait.desc ?? '')
  }

  const commitEdit = async (traitId) => {
    await updateDoc(doc(db, 'traits', traitId), { desc: editingDesc.trim() })
    setEditingId(null)
  }

  const startEditName = (trait) => {
    setEditingNameId(trait.id)
    setEditingName(trait.name)
  }

  const commitEditName = async (traitId) => {
    const trimmed = editingName.trim()
    if (trimmed) {
      await updateDoc(doc(db, 'traits', traitId), { name: trimmed })
    }
    setEditingNameId(null)
  }

  const handleBulkAdd = async () => {
    const items = parseBulkLines(bulkText)
    if (items.length === 0) return
    const batch = writeBatch(db)
    for (const item of items) {
      const ref = doc(collection(db, 'traits'))
      batch.set(ref, {
        name: item.name,
        type: bulkType,
        desc: item.desc,
        createdAt: serverTimestamp(),
      })
    }
    await batch.commit()
    setBulkText('')
  }

  const handleToggleType = async (trait) => {
    await updateDoc(doc(db, 'traits', trait.id), {
      type: trait.type === 'moss' ? 'clay' : 'moss',
    })
  }

  const handleDelete = async (traitId) => {
    const linkedEntries = entries.filter((e) => getTraitIds(e).includes(traitId))
    const batch = writeBatch(db)
    batch.delete(doc(db, 'traits', traitId))
    for (const e of linkedEntries) {
      batch.update(doc(db, 'entries', e.id), {
        traitIds: getTraitIds(e).filter((id) => id !== traitId),
        traitId: null,
      })
    }
    await batch.commit()
  }

  const reorderByDrag = async (listType, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    const list = traits.filter((t) => t.type === listType).sort(byOrder)
    const reordered = [...list]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    const batch = writeBatch(db)
    reordered.forEach((t, i) => batch.update(doc(db, 'traits', t.id), { order: i }))
    await batch.commit()
  }

  const renderList = (listType) => {
    const list = traits.filter((t) => t.type === listType).sort(byOrder)
    return (
      <ul className="trait-list">
        {list.map((t, i) => {
          const isDragSource = dragSource?.listType === listType && dragSource.index === i
          const isHovered =
            hoverIndex?.listType === listType &&
            hoverIndex.index === i &&
            dragSource?.listType === listType &&
            dragSource.index !== i
          const itemClassName = [
            'trait-item',
            listType === 'moss' ? 'trait-item-moss' : 'trait-item-clay',
            isDragSource && 'trait-item-dragging',
            isHovered && 'trait-item-drop-target',
          ]
            .filter(Boolean)
            .join(' ')
          return (
          <li
            key={t.id}
            className={itemClassName}
            onDragOver={(e) => {
              e.preventDefault()
              if (dragSource?.listType === listType) setHoverIndex({ listType, index: i })
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (dragSource?.listType === listType) reorderByDrag(listType, dragSource.index, i)
              setDragSource(null)
              setHoverIndex(null)
            }}
          >
            <div className="trait-item-header">
              <span
                className="trait-drag-handle"
                draggable
                aria-label="ドラッグで並び替え"
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move'
                  setDragSource({ listType, index: i })
                }}
                onDragEnd={() => {
                  setDragSource(null)
                  setHoverIndex(null)
                }}
              >
                ⠿
              </span>
              {editingNameId === t.id ? (
                <input
                  className="trait-name-input"
                  value={editingName}
                  autoFocus
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => commitEditName(t.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                    if (e.key === 'Escape') setEditingNameId(null)
                  }}
                />
              ) : (
                <span className="trait-name" onClick={() => startEditName(t)}>
                  {t.name}
                </span>
              )}
              <CountBadge type={t.type} count={countByTraitId.get(t.id) ?? 0} />
              <button
                type="button"
                className="delete-button"
                aria-label="削除"
                onClick={() => handleDelete(t.id)}
              >
                ×
              </button>
            </div>
            {editingId === t.id ? (
              <input
                className="trait-desc-input"
                value={editingDesc}
                autoFocus
                onChange={(e) => setEditingDesc(e.target.value)}
                onBlur={() => commitEdit(t.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') setEditingId(null)
                }}
              />
            ) : (
              <p className="trait-desc" onClick={() => startEdit(t)}>
                {t.desc || 'メモを追加…'}
              </p>
            )}
            <div className="trait-item-footer">
              <button
                type="button"
                className="trait-type-switch-link"
                onClick={() => handleToggleType(t)}
              >
                {t.type === 'moss' ? '短所に移動する' : '長所に移動する'}
              </button>
            </div>
          </li>
          )
        })}
        {list.length === 0 && <li className="empty-state">まだ登録がありません</li>}
      </ul>
    )
  }

  return (
    <div className="tab-panel">
      <form className="card trait-form" onSubmit={handleSubmit}>
        <input
          placeholder={NAME_PLACEHOLDER[type]}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="type-toggle">
          <label className={type === 'moss' ? 'chip chip-moss selected' : 'chip chip-moss'}>
            <input
              type="radio"
              name="trait-type"
              checked={type === 'moss'}
              onChange={() => setType('moss')}
            />
            長所
          </label>
          <label className={type === 'clay' ? 'chip chip-clay selected' : 'chip chip-clay'}>
            <input
              type="radio"
              name="trait-type"
              checked={type === 'clay'}
              onChange={() => setType('clay')}
            />
            短所
          </label>
        </div>
        <input
          placeholder={DESC_PLACEHOLDER[type]}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <button type="submit">追加する</button>
      </form>

      <div className="card bulk-trait">
        <button type="button" className="bulk-trait-toggle" onClick={() => setBulkOpen((v) => !v)}>
          {bulkOpen ? '▲ テキストから一括登録を閉じる' : '▼ テキストから一括登録'}
        </button>
        {bulkOpen && (
          <>
            <p className="bulk-trait-hint">
              1行1件、「名前 — メモ」の形式で貼り付けてください（メモ省略も可）。
            </p>
            <div className="type-toggle">
              <label className={bulkType === 'moss' ? 'chip chip-moss selected' : 'chip chip-moss'}>
                <input
                  type="radio"
                  name="bulk-trait-type"
                  checked={bulkType === 'moss'}
                  onChange={() => setBulkType('moss')}
                />
                長所
              </label>
              <label className={bulkType === 'clay' ? 'chip chip-clay selected' : 'chip chip-clay'}>
                <input
                  type="radio"
                  name="bulk-trait-type"
                  checked={bulkType === 'clay'}
                  onChange={() => setBulkType('clay')}
                />
                短所
              </label>
            </div>
            <textarea
              className="bulk-trait-textarea"
              placeholder={'PC・IT知識が豊富 — 一般的な人より詳しく、タイピングも速い。\n傾聴力がある — 人の話を聞くことを面倒に感じない。'}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={6}
            />
            <button type="button" onClick={handleBulkAdd}>
              {parseBulkLines(bulkText).length}件を登録する
            </button>
          </>
        )}
      </div>

      <section>
        <h2 className="section-title chip-moss-text">長所</h2>
        {renderList('moss')}
      </section>
      <section>
        <h2 className="section-title chip-clay-text">短所</h2>
        {renderList('clay')}
      </section>
    </div>
  )
}
