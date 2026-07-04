import { useMemo } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useToast } from '../contexts/ToastContext'
import { daysBetween, todayStr, toSlashDate } from '../utils/format'
import { buildCopyText } from '../utils/reviewText'

const TYPE_LABEL = { moss: '長所', clay: '短所' }

export default function ReviewTab({ entries, traits, reviews }) {
  const { showToast } = useToast()
  const lastReview = reviews[0] ?? null // reviewsはdate降順で渡される

  const targetEntries = useMemo(() => {
    if (!lastReview) return entries
    return entries.filter((e) => e.date > lastReview.date)
  }, [entries, lastReview])

  const periodStartDate = useMemo(() => {
    if (lastReview) return lastReview.date
    if (entries.length === 0) return todayStr()
    return entries.reduce((min, e) => (e.date < min ? e.date : min), entries[0].date)
  }, [entries, lastReview])

  const handleComplete = () => {
    addDoc(collection(db, 'reviews'), {
      date: todayStr(),
      createdAt: serverTimestamp(),
    })
  }

  const handleCopy = async () => {
    const text = buildCopyText({ traits, targetEntries, periodStartDate })
    try {
      await navigator.clipboard.writeText(text)
      showToast('コピーしました')
    } catch {
      showToast('コピーに失敗しました')
    }
  }

  return (
    <div className="tab-panel">
      <div className="card review-banner">
        {lastReview ? (
          <>
            <p>
              前回の振り返り: {toSlashDate(lastReview.date)}（
              {daysBetween(lastReview.date, todayStr())}日経過）
            </p>
            <p>前回以降の記録: {targetEntries.length}件</p>
          </>
        ) : (
          <>
            <p>まだ振り返りをしたことがありません</p>
            <p>総記録件数: {entries.length}件</p>
          </>
        )}
        <div className="review-banner-actions">
          <button type="button" onClick={handleComplete}>
            今週の振り返りを完了する
          </button>
          <button type="button" onClick={handleCopy}>
            コピー用テキストを出力
          </button>
        </div>
      </div>

      <section>
        <h2 className="section-title">対象の記録</h2>
        <ul className="entry-list">
          {targetEntries.map((entry) => (
            <li key={entry.id} className="entry-item">
              <div className="entry-item-meta">
                <span className="entry-date">{toSlashDate(entry.date)}</span>
                <span className={entry.type === 'moss' ? 'chip chip-moss' : 'chip chip-clay'}>
                  {TYPE_LABEL[entry.type]}
                </span>
              </div>
              <p className="entry-text">{entry.text}</p>
            </li>
          ))}
          {targetEntries.length === 0 && <li className="empty-state">対象の記録はありません</li>}
        </ul>
      </section>

      <section>
        <h2 className="section-title">振り返り履歴</h2>
        <ul className="review-history">
          {reviews.map((r) => (
            <li key={r.id}>{toSlashDate(r.date)}</li>
          ))}
          {reviews.length === 0 && <li className="empty-state">履歴はありません</li>}
        </ul>
      </section>
    </div>
  )
}
