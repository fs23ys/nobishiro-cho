// entry.traitIds（複数）と、旧データの entry.traitId（単数）の両方に対応する
export function getTraitIds(entry) {
  if (Array.isArray(entry.traitIds)) return entry.traitIds
  return entry.traitId ? [entry.traitId] : []
}
