export const ATTR_KEYS = [
  'looks',
  'acting',
  'talent',
  'speech',
  'poise',
  'fashion',
  'wit',
  'fitness',
  'confidence',
] as const

export type AttrKey = (typeof ATTR_KEYS)[number]

export type IdentityId = 'college' | 'film' | 'rich'

export type Slot = 'day' | 'eve'

export type Phase = 'title' | 'create' | 'intro' | 'plan' | 'play' | 'ended'

export type NpcId =
  | 'zhouheng'
  | 'peiyu'
  | 'shenzhao'
  | 'liangshi'
  | 'guyan'
  | 'hanchi'
  | 'xuning'
  | 'ruanqing'
  | 'songwan'

export type ItemKind = 'cosmetic' | 'clothes' | 'jewelry'

export type WearSlot = 'daily' | 'carpet' | 'jewel1' | 'jewel2'

export type Attrs = Record<AttrKey, number>

export type ActionId = string

export type GameEventOption = {
  id: string
  label: string
}

export type Track = 'film' | 'music' | 'variety'

export type GameEvent = {
  id: string
  title: string
  body: string
  /** 点一下出一句。没有时按正文拆开。 */
  lines?: string[]
  options: GameEventOption[]
  scriptId?: string
  track?: Track
}

export type WorkRecord = {
  scriptId: string
  quality: number
  score: number
  week: number
}

export type CeremonyDue = {
  seasonId: string
  week: number
  nominated: boolean
  win: boolean
  scriptId?: string
  rival: string
  awardName: string
  org: string
  name: string
}

export type HotSearch = {
  text: string
  tone: 'good' | 'bad' | 'mixed'
  daysLeft: number
}

export type NewsFlash = {
  text: string
  tone: 'good' | 'bad' | 'mixed'
  kind?: 'hot' | 'trade' | 'gossip' | 'award' | 'fashion'
}

export type PromoKind = 'interview' | 'live' | 'roadshow' | 'stills' | 'fanmeet' | 'radio' | 'premiere'

export type Booking = {
  scriptId: string
  phase: 'shoot' | 'promo'
  shootDone: number
  shootNeed: number
  promoDone: number
  promoNeed: number
  promoTasks?: PromoKind[]
  promoCleared?: number[]
  deadlineDay: number
  promoDeadlineDay: number
  quality: number
  match: number
  deposit: number
}

export type OwnedItem = {
  itemId: string
  worn: boolean
}

export type CosmeticBuff = {
  itemId: string
  looks: number
  confidence: number
  fashion?: number
  daysLeft: number
}

export type LogLine = {
  week: number
  weekday: number
  slot: Slot
  text: string
}

export type AwardRecord = {
  id: string
  name: string
  org: string
  week: number
  scriptId?: string
}

export type GameState = {
  phase: Phase
  name: string
  identity: IdentityId
  week: number
  weekday: number
  slot: Slot
  money: number
  stamina: number
  mood: number
  attrs: Attrs
  fans: number
  opinion: number
  recognition: number
  plan: Record<Slot, ActionId | null>[]
  bookings: Booking[]
  finishedScripts: string[]
  workLog: WorkRecord[]
  ceremonyDue: CeremonyDue | null
  awards: AwardRecord[]
  offerSeed: number
  offerMonth: number
  declinedIds: string[]
  auditionedIds: string[]
  items: OwnedItem[]
  houseId: string
  buffs: CosmeticBuff[]
  favor: Record<NpcId, number>
  met: Record<NpcId, boolean>
  flags: Record<string, boolean>
  hotSearch: HotSearch | null
  news: NewsFlash | null
  event: GameEvent | null
  log: LogLine[]
  lastNote: string
  recapWeek: number | null
}

export const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'] as const

export const ATTR_LABEL: Record<AttrKey, string> = {
  looks: '容貌',
  acting: '演技',
  talent: '才艺',
  speech: '口才',
  poise: '气质',
  fashion: '时尚',
  wit: '智慧',
  fitness: '体能',
  confidence: '自信',
}

export const NPC_NAME: Record<NpcId, string> = {
  zhouheng: '周衡',
  peiyu: '裴予',
  shenzhao: '沈照',
  liangshi: '梁时',
  guyan: '顾宴川',
  hanchi: '韩迟',
  xuning: '许宁',
  ruanqing: '阮清',
  songwan: '宋晚',
}

export const YEAR_WEEKS = 52
export const TOTAL_YEARS = 3

export function playYear(week: number): number {
  return Math.max(1, Math.ceil(week / YEAR_WEEKS))
}

export function weekInYear(week: number): number {
  return ((week - 1) % YEAR_WEEKS) + 1
}

export const STA_MAX = 100
export const MOOD_MAX = 100
export const ATTR_MAX = 200
export const MAX_BOOKINGS = 3
