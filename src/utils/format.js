// "YYYY-MM-DD" 形式の今日の日付を返す
export function todayStr() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// "YYYY-MM-DD" -> "YYYY/MM/DD"
export function toSlashDate(dateStr) {
  return dateStr.replaceAll('-', '/')
}

// "YYYY-MM-DD" 同士の経過日数
export function daysBetween(fromDateStr, toDateStr) {
  const from = new Date(`${fromDateStr}T00:00:00`)
  const to = new Date(`${toDateStr}T00:00:00`)
  return Math.round((to - from) / (1000 * 60 * 60 * 24))
}
