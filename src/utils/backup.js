import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

const BACKUP_DOC_PATH = ['meta', 'backupBeforeImport']
const BATCH_LIMIT = 400

function chunk(array, size) {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

export function buildExportJson(entries, traits, reviews) {
  return {
    entries,
    traits,
    reviews,
    exportedAt: new Date().toISOString(),
  }
}

export function validateBackupShape(obj) {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Array.isArray(obj.entries) &&
    Array.isArray(obj.traits) &&
    Array.isArray(obj.reviews)
  )
}

export function downloadBackupFile(json, dateStr) {
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `のびしろ帖_backup_${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// collectionNameの既存ドキュメントを全削除し、itemsで全置換する(idを維持)
async function replaceCollection(collectionName, items) {
  const colRef = collection(db, collectionName)
  const existingSnap = await getDocs(colRef)

  const deleteOps = existingSnap.docs.map((d) => ({ type: 'delete', ref: d.ref }))
  const setOps = items.map((item) => {
    const { id, ...rest } = item
    const ref = id ? doc(db, collectionName, id) : doc(colRef)
    return { type: 'set', ref, data: rest }
  })

  for (const batchOps of chunk([...deleteOps, ...setOps], BATCH_LIMIT)) {
    const batch = writeBatch(db)
    for (const op of batchOps) {
      if (op.type === 'delete') batch.delete(op.ref)
      else batch.set(op.ref, op.data)
    }
    await batch.commit()
  }
}

export async function replaceAllData({ entries, traits, reviews }) {
  await replaceCollection('entries', entries)
  await replaceCollection('traits', traits)
  await replaceCollection('reviews', reviews)
}

export async function saveBackupBeforeImport({ entries, traits, reviews }) {
  const ref = doc(db, ...BACKUP_DOC_PATH)
  await setDoc(ref, { entries, traits, reviews, savedAt: serverTimestamp() })
}

// 直前退避の内容で現在のデータを置き換える。退避が存在しない場合はfalseを返す
export async function restoreFromBackupBeforeImport() {
  const ref = doc(db, ...BACKUP_DOC_PATH)
  const snap = await getDoc(ref)
  if (!snap.exists()) return false
  const data = snap.data()
  await replaceAllData({
    entries: data.entries ?? [],
    traits: data.traits ?? [],
    reviews: data.reviews ?? [],
  })
  return true
}
