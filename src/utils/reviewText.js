import { toSlashDate } from './format'

const TYPE_LABEL = { moss: '長所', clay: '短所' }

export function buildCopyText({ traits, targetEntries, periodStartDate }) {
  const mossTraits = traits.filter((t) => t.type === 'moss')
  const clayTraits = traits.filter((t) => t.type === 'clay')

  const traitLine = (t) => `・${t.name}：${t.desc?.trim() ? t.desc : '(メモなし)'}`
  const entryLine = (e) => `・[${TYPE_LABEL[e.type]}] (${toSlashDate(e.date)}) ${e.text}`

  const lines = [
    '以下は私自身の長所・短所に関する記録です。傾向を分析し、改善のための具体的なアドバイスをください。',
    '',
    '【長所リスト】',
    ...(mossTraits.length ? mossTraits.map(traitLine) : ['(登録なし)']),
    '',
    '【短所リスト】',
    ...(clayTraits.length ? clayTraits.map(traitLine) : ['(登録なし)']),
    '',
    `【前回の振り返り以降の気づき（${toSlashDate(periodStartDate)} 〜 現在）】`,
    ...(targetEntries.length ? targetEntries.map(entryLine) : ['(該当する記録なし)']),
  ]

  return lines.join('\n')
}
