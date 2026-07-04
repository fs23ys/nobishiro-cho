import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'

// collectionNameを購読し、docs(id付き)配列をリアルタイムで返す
export function useCollection(collectionName, orderByField, direction = 'desc') {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy(orderByField, direction))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsubscribe
  }, [collectionName, orderByField, direction])

  return { docs, loading }
}
