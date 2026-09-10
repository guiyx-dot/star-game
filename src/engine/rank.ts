import type { GameState } from './types'

export type RoleTier = 'cameo' | 'support' | 'third' | 'second' | 'lead'

export const ROLE_LABEL: Record<RoleTier, string> = {
  cameo: '客串',
  support: '配角',
  third: '女三',
  second: '女二',
  lead: '女主',
}

export const ROLE_ORDER: RoleTier[] = ['cameo', 'support', 'third', 'second', 'lead']

export const ROLE_FAME: Record<RoleTier, number> = {
  cameo: 0.45,
  support: 1,
  third: 1.7,
  second: 2.6,
  lead: 3.8,
}

/** 名气、地位、角色同一级。演到哪一档，称呼就跟到哪一档。 */
export type CareerRung = {
  role: RoleTier
  fame: string
  status: string
  pay: number
  fameMul: number
}

export const CAREER_RUNGS: CareerRung[] = [
  { role: 'cameo', fame: '无名', status: '尚未出道', pay: 1, fameMul: 1 },
  { role: 'support', fame: '十八线', status: '刚入行', pay: 1.12, fameMul: 1.1 },
  { role: 'third', fame: '小有名气', status: '有作品了', pay: 1.32, fameMul: 1.28 },
  { role: 'second', fame: '崭露头角', status: '业内认得', pay: 1.58, fameMul: 1.5 },
  { role: 'lead', fame: '一线', status: '颁奖常客', pay: 1.9, fameMul: 1.75 },
]

export function rungByRole(role: RoleTier): CareerRung {
  return CAREER_RUNGS.find((r) => r.role === role) ?? CAREER_RUNGS[1]
}

export function roleOnTable(tier: RoleTier, recognition: number, fans: number): boolean {
  if (tier === 'lead') return recognition >= 80 && fans >= 250000
  if (tier === 'second') return recognition >= 42 || fans >= 80000
  if (tier === 'third') return recognition >= 22 || fans >= 15000
  return true
}

/** 桌上能不能出现这个角色。第二年女主开始有人问，不等于已经是一线。 */
export function roleOffered(tier: RoleTier, recognition: number, fans: number, year: number): boolean {
  if (tier === 'lead') {
    if (year <= 1) return false
    if (year === 2) return recognition >= 56 && fans >= 35000
    return recognition >= 70 && fans >= 90000
  }
  return roleOnTable(tier, recognition, fans)
}

export function topRole(recognition: number, fans: number): RoleTier {
  let cur: RoleTier = 'support'
  for (const tier of ROLE_ORDER) {
    if (roleOnTable(tier, recognition, fans)) cur = tier
  }
  return cur
}

export function careerRung(state: Pick<GameState, 'recognition' | 'fans' | 'flags'>): CareerRung {
  if (state.flags?.['rung:lead']) return rungByRole('lead')
  return rungByRole(topRole(state.recognition, state.fans))
}

export function nextRoleLine(recognition: number, fans: number): string {
  const top = topRole(recognition, fans)
  if (top === 'cameo' || top === 'support') {
    return '现在桌上是配角和客串。女三要先有作品、认可上去。'
  }
  if (top === 'third') {
    return '女三开始有人问了。女二还要认可再堆、演技再往上，片方才肯让你试。'
  }
  if (top === 'second') {
    return '女二已经有人问了。女主还早，影后那条路现在连门都没有。'
  }
  return '女主开始有人试探。签下去，才算。'
}

export function gradeUnlocked(
  grade: 'C' | 'B' | 'A' | 'S',
  recognition: number,
  fans: number,
  identity: string,
): boolean {
  if (grade === 'C') return true
  if (grade === 'B') return recognition >= 12 || fans >= 18000 || (identity === 'film' && recognition >= 8)
  if (grade === 'A') return recognition >= 38 || fans >= 120000 || (recognition >= 24 && fans >= 40000)
  return recognition >= 56 || fans >= 500000 || (recognition >= 44 && fans >= 200000)
}

export function careerPayMult(state: Pick<GameState, 'fans' | 'recognition' | 'flags'>): number {
  return careerRung(state).pay
}

export function careerFameMult(state: Pick<GameState, 'fans' | 'recognition' | 'flags'>): number {
  return careerRung(state).fameMul
}

export function rankUpLine(
  before: { fans: number; recognition: number },
  after: Pick<GameState, 'fans' | 'recognition' | 'finishedScripts' | 'bookings' | 'flags'>,
): string {
  const prev = topRole(before.recognition, before.fans)
  const next = topRole(after.recognition, after.fans)
  if (prev === next) return ''
  const key = `rung:${next}`
  if (!after.flags[key]) after.flags[key] = true
  if (next === 'third') return '有人开始记得你演过谁，不只记得你跑过龙套。'
  if (next === 'second') return '周衡说，最近递来的本，女二两个字出现得勤了。'
  if (next === 'lead') return '有片方开始试探女主。还没签，但门开了一条缝。'
  return '最近的评论里，开始有人不用角色名，直接叫你的名字。'
}
