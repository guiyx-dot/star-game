import { ACTIONS, HOUSES, IDENTITIES, actionById, houseById, houseRank, identityById, itemById, tripById } from './catalog'
import type { ActionDef, TripDef } from './catalog'
import {
  GRADE_MULT,
  canTakeScript,
  monthIndex,
  monthOfferIds,
  scriptById,
  scriptMatch,
  workWindow,
  type ScriptDef,
} from './scripts'
import {
  auditionFailEvent,
  auditionOkEvent,
  companyTalk,
  dateChoice,
  dateEvent,
  guyanDinner,
  meetChoice,
  meetEvent,
  sceneChoice,
  sceneEvent,
  shuraEvent,
  zhouIntro,
} from './scenes'
import { buildPromoTasks, promoLine, PROMO_LABEL } from './promo'
import { careerFameMult, careerPayMult, careerRung, rankUpLine, ROLE_FAME } from './rank'
import { announceFor, pickBuzzScript, rumorFor, shouldAnnounce, wrapNewsFor } from './buzz'
import { applyGossipChoice, maybeGossip } from './gossip'
import { applyCalendarChoice, applyCeremonyChoice, ceremonyPlayEvent, ensureCeremonyPlan, maybeCalendar, missCeremonyIfNeeded, parseCeremonyPlan } from './calendar'
import { storyEvent } from './story'
import {
  ATTR_KEYS,
  ATTR_LABEL,
  ATTR_MAX,
  MAX_BOOKINGS,
  MOOD_MAX,
  NPC_NAME,
  STA_MAX,
  WEEKDAYS,
  YEAR_WEEKS,
  TOTAL_YEARS,
  playYear,
  weekInYear,
  type ActionId,
  type Attrs,
  type Booking,
  type GameEvent,
  type GameState,
  type IdentityId,
  type NpcId,
  type Slot,
  type Track,
} from './types'

const SAVE_KEY = 'star-game-year1-v3'
const ROMANCE: NpcId[] = ['liangshi', 'guyan']
const BROKER_REFER_FAVOR = 50

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function emptyFavor(): Record<NpcId, number> {
  return {
    zhouheng: 0,
    peiyu: 0,
    shenzhao: 0,
    liangshi: 0,
    guyan: 0,
    hanchi: 0,
    xuning: 0,
    ruanqing: 0,
    songwan: 0,
  }
}

function emptyMet(): Record<NpcId, boolean> {
  return {
    zhouheng: false,
    peiyu: false,
    shenzhao: false,
    liangshi: false,
    guyan: false,
    hanchi: false,
    xuning: false,
    ruanqing: false,
    songwan: false,
  }
}

function emptyPlan(): GameState['plan'] {
  return Array.from({ length: 7 }, () => ({ day: null, eve: null }))
}

export function absDay(week: number, weekday: number): number {
  return (week - 1) * 7 + weekday
}

function absToDate(abs: number): Date {
  const d = new Date(2026, 0, 2)
  d.setDate(d.getDate() + abs)
  return d
}

export function mdLabel(abs: number): string {
  const d = absToDate(abs)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function ymdLabel(abs: number): string {
  const d = absToDate(abs)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function createState(name: string, identity: IdentityId): GameState {
  const def = identityById(identity)
  const flags: Record<string, boolean> = {}
  for (const f of def.flags) flags[f] = true
  const player = name.trim() || '林澄'
  return {
    phase: 'intro',
    name: player,
    identity,
    week: 1,
    weekday: 0,
    slot: 'day',
    money: def.money,
    stamina: def.stamina,
    mood: def.mood,
    attrs: { ...def.attrs },
    fans: identity === 'film' ? 800 : identity === 'rich' ? 4000 : 80,
    opinion: identity === 'rich' ? -8 : 4,
    recognition: identity === 'film' ? 6 : 0,
    plan: emptyPlan(),
    bookings: [],
    finishedScripts: [],
    workLog: [],
    ceremonyDue: null,
    awards: [],
    offerSeed: Math.floor(Math.random() * 1e9),
    offerMonth: -1,
    declinedIds: [],
    auditionedIds: [],
    items: identity === 'rich' ? [{ itemId: 'xiang', worn: true }] : [{ itemId: 'tee', worn: true }],
    houseId: def.houseId,
    buffs: [],
    favor: emptyFavor(),
    met: emptyMet(),
    flags,
    hotSearch: identity === 'rich' ? { text: `${player} 疑似买热搜出道`, tone: 'bad', daysLeft: 4 } : null,
    news: identity === 'rich' ? { text: `${player} 疑似买热搜出道`, tone: 'bad' } : null,
    event: { id: 'intro', title: '这个月', body: def.intro, options: [{ id: 'ok', label: '开始你的星途' }] },
    log: [],
    lastNote: '',
    recapWeek: null,
  }
}

export function effectiveAttrs(state: GameState): Attrs {
  const out = { ...state.attrs }
  for (const b of state.buffs) {
    out.looks += b.looks
    out.confidence += b.confidence
    out.fashion += b.fashion ?? 0
  }
  for (const own of state.items) {
    if (!own.worn) continue
    const item = itemById(own.itemId)
    if (!item) continue
    out.looks += item.looks ?? 0
    out.fashion += item.fashion ?? 0
    out.poise += item.poise ?? 0
    out.confidence += item.confidence ?? 0
  }
  for (const k of ATTR_KEYS) out[k] = clamp(out[k], 0, ATTR_MAX)
  return out
}

export function influenceLabel(state: GameState): string {
  return careerRung(state).fame
}

export function statusLabel(state: GameState): string {
  return careerRung(state).status
}

function houseMoodMax(state: GameState): number {
  return MOOD_MAX + houseById(state.houseId).moodCapBonus
}

function growAttr(cur: number, raw: number): number {
  if (raw <= 0) return clamp(cur + raw, 0, ATTR_MAX)
  let g = raw
  if (cur >= 180) g = 0
  else if (cur >= 150) g = raw >= 3 ? 1 : 0
  else if (cur >= 120) g = Math.min(1, raw)
  else if (cur >= 100) g = Math.min(2, raw)
  return clamp(cur + g, 0, ATTR_MAX)
}

function addAttr(state: GameState, patch?: Partial<Attrs>) {
  if (!patch) return
  for (const k of ATTR_KEYS) {
    const v = patch[k]
    if (v) state.attrs[k] = growAttr(state.attrs[k], v)
  }
}

function addFavor(state: GameState, id: NpcId, n: number) {
  if (!state.met[id] && n > 0) state.met[id] = true
  state.favor[id] = clamp(state.favor[id] + n, 0, 100)
}

function tickBuffs(state: GameState) {
  state.buffs = state.buffs.map((b) => ({ ...b, daysLeft: b.daysLeft - 1 })).filter((b) => b.daysLeft > 0)
  if (state.hotSearch) {
    state.hotSearch.daysLeft -= 1
    if (state.hotSearch.daysLeft <= 0) state.hotSearch = null
  }
}

function log(state: GameState, text: string) {
  state.log.unshift({ week: state.week, weekday: state.weekday, slot: state.slot, text })
  state.log = state.log.slice(0, 80)
  state.lastNote = text
}

type StatSnap = {
  money: number
  stamina: number
  mood: number
  fans: number
  recognition: number
  attrs: Attrs
}

function snapStats(state: GameState): StatSnap {
  return {
    money: state.money,
    stamina: state.stamina,
    mood: state.mood,
    fans: state.fans,
    recognition: state.recognition,
    attrs: { ...state.attrs },
  }
}

function fmtDelta(before: StatSnap, after: GameState): string {
  const parts: string[] = []
  const push = (label: string, n: number) => {
    if (!n) return
    parts.push(`${label}${n > 0 ? '+' : ''}${n}`)
  }
  push('金钱', after.money - before.money)
  push('体力', after.stamina - before.stamina)
  push('心情', after.mood - before.mood)
  push('粉丝', after.fans - before.fans)
  push('认可', after.recognition - before.recognition)
  for (const k of ATTR_KEYS) push(ATTR_LABEL[k], after.attrs[k] - before.attrs[k])
  return parts.join(' ')
}

function withDelta(before: StatSnap, state: GameState, text: string): string {
  const delta = fmtDelta(before, state)
  if (!delta) return text
  const base = text.trim().replace(/。+$/, '')
  return `${base}。${delta}`
}

function clone(state: GameState): GameState {
  return structuredClone(state)
}

export function meetsNeed(have: Attrs, need?: Partial<Attrs>): boolean {
  if (!need) return true
  return ATTR_KEYS.every((k) => (need[k] ?? 0) <= have[k])
}

export function currentOffers(state: GameState, track: Track = 'film'): ScriptDef[] {
  const m = monthIndex(state.week)
  const declined = new Set(state.offerMonth === m ? state.declinedIds : [])
  return monthOfferIds(
    state.offerSeed,
    state.week,
    state.finishedScripts,
    bookedScriptIds(state),
    state.recognition,
    state.identity,
    track,
    state.fans,
    { flags: state.flags, favor: state.favor, met: state.met },
  )
    .filter((id) => !declined.has(id))
    .map((id) => scriptById(id))
    .filter((s): s is ScriptDef => Boolean(s))
}

export function shootingCount(state: GameState): number {
  return (state.bookings ?? []).filter((b) => b.phase === 'shoot').length
}

export function bookedScriptIds(state: GameState): string[] {
  return (state.bookings ?? []).map((b) => b.scriptId)
}

export function bookingByScript(state: GameState, scriptId: string): Booking | undefined {
  return (state.bookings ?? []).find((b) => b.scriptId === scriptId)
}

export function workPlanId(phase: 'shoot' | 'promo', scriptId: string, promoIndex?: number): string {
  if (phase === 'shoot') return `shoot:${scriptId}`
  if (promoIndex != null) return `promo:${scriptId}:${promoIndex}`
  return `promo:${scriptId}`
}

export function parseWorkPlan(id: string): { phase: 'shoot' | 'promo'; scriptId: string; promoIndex?: number } | null {
  if (id.startsWith('shoot:')) return { phase: 'shoot', scriptId: id.slice(6) }
  const indexed = /^promo:([^:]+):(\d+)$/.exec(id)
  if (indexed) return { phase: 'promo', scriptId: indexed[1], promoIndex: Number(indexed[2]) }
  if (id.startsWith('promo:')) return { phase: 'promo', scriptId: id.slice(6) }
  return null
}

export function tripPlanId(destId: string, index: number, night = false): string {
  return `${night ? 'tn' : 'trip'}:${destId}:${index}`
}

export function parseTripPlan(id: string): { destId: string; index: number; night: boolean } | null {
  const m = /^(trip|tn):([^:]+):(\d+)$/.exec(id)
  if (!m) return null
  return { destId: m[2], index: Number(m[3]), night: m[1] === 'tn' }
}

export function tripSlotName(id: string): string {
  const trip = parseTripPlan(id)
  if (!trip) return ''
  const dest = tripById(trip.destId)
  if (!dest) return ''
  if (trip.index === 0) return dest.name
  return `${dest.name} · ${trip.index + 1}`
}

function ensurePromoTasks(b: Booking, script: ScriptDef) {
  if (!b.promoTasks || b.promoTasks.length !== script.promoNeed) {
    b.promoTasks = buildPromoTasks(script)
  }
  if (!b.promoCleared) b.promoCleared = []
}

export function remainingPromoTasks(state: GameState, scriptId: string): { index: number; kind: string; label: string }[] {
  const b = bookingByScript(state, scriptId)
  const script = scriptById(scriptId)
  if (!b || b.phase !== 'promo' || !script) return []
  const tasks = b.promoTasks && b.promoTasks.length === script.promoNeed ? b.promoTasks : buildPromoTasks(script)
  const cleared = new Set(b.promoCleared ?? [])
  const planned = new Set(
    state.plan.flatMap((day) => [day.day, day.eve]).filter((id): id is string => Boolean(id)),
  )
  return tasks
    .map((kind, index) => ({ index, kind, label: PROMO_LABEL[kind] }))
    .filter((row) => !cleared.has(row.index) && !planned.has(workPlanId('promo', scriptId, row.index)))
}

function bookingForEvent(state: GameState): Booking | undefined {
  const id = state.event?.scriptId
  if (id) return bookingByScript(state, id)
  return state.bookings?.[0]
}

export function actionAvailable(state: GameState, action: ActionDef, slot: Slot): boolean {
  if (action.slot !== 'any' && action.slot !== slot) return false
  if (slot === 'eve' && action.kind !== 'social' && action.kind !== 'story') return false
  if (action.id === 'story-bar') return false
  if (action.id === 'story-home') return false
  if (action.id === 'story-dinner') {
    if (!state.flags.guyanFilm || state.met.guyan) return false
  }
  if (action.kind === 'film' || action.kind === 'promo') return false
  if (action.need && !meetsNeed(effectiveAttrs(state), action.need)) return false
  if (action.npcId) {
    if (action.npcId === 'hanchi') return false
    if (!state.met[action.npcId]) return false
  }
  return true
}

export function workAvailable(state: GameState, phase: 'shoot' | 'promo', scriptId: string, slot: Slot, promoIndex?: number): boolean {
  if (slot !== 'day') return false
  const b = bookingByScript(state, scriptId)
  if (!b || b.phase !== phase) return false
  if (phase !== 'promo' || promoIndex == null) return true
  const script = scriptById(scriptId)
  if (!script) return false
  ensurePromoTasks(b, script)
  if ((b.promoCleared ?? []).includes(promoIndex)) return false
  return !state.plan.some((day) => day.day === workPlanId('promo', scriptId, promoIndex))
}

export function plannerActions(state: GameState, slot: Slot): ActionDef[] {
  return ACTIONS.filter((a) => actionAvailable(state, a, slot))
}

export function setPlan(state: GameState, weekday: number, slot: Slot, actionId: ActionId | null): GameState {
  const next = clone(state)
  next.plan[weekday][slot] = actionId
  return next
}

export function fillEmpty(state: GameState, actionId: ActionId): GameState {
  const next = clone(state)
  const action = actionById(actionId)
  if (!action) return next
  for (let i = 0; i < 7; i++) {
    for (const slot of ['day', 'eve'] as Slot[]) {
      if (next.plan[i][slot]) continue
      if (!actionAvailable(next, action, slot)) continue
      next.plan[i][slot] = actionId
    }
  }
  return next
}

export function fillEmptyInSlot(state: GameState, actionId: ActionId, slot: Slot): GameState {
  const next = clone(state)
  const work = parseWorkPlan(actionId)
  if (work) {
    if (work.phase === 'promo') return fillRemainingPromo(state, work.scriptId, slot)
    for (let i = 0; i < 7; i++) {
      if (next.plan[i][slot]) continue
      if (!workAvailable(next, work.phase, work.scriptId, slot, work.promoIndex)) continue
      next.plan[i][slot] = actionId
    }
    return next
  }
  const action = actionById(actionId)
  if (!action) return next
  for (let i = 0; i < 7; i++) {
    if (next.plan[i][slot]) continue
    if (!actionAvailable(next, action, slot)) continue
    next.plan[i][slot] = actionId
  }
  return next
}

export function fillRemainingPromo(state: GameState, scriptId: string, slot: Slot): GameState {
  let next = clone(state)
  for (const row of remainingPromoTasks(next, scriptId)) {
    const before = next.plan.map((d) => d[slot])
    next = assignNext(next, workPlanId('promo', scriptId, row.index), slot)
    if (next.plan.every((d, i) => d[slot] === before[i])) break
  }
  return next
}

export function assignNext(state: GameState, actionId: ActionId, slot: Slot): GameState {
  const next = clone(state)
  const ceremony = parseCeremonyPlan(actionId)
  if (ceremony) {
    if (slot !== 'day') {
      next.lastNote = '晚上去不了典礼。'
      return next
    }
    if (next.plan.some((d) => d.day?.startsWith('ceremony:'))) {
      next.lastNote = '这周只要去一天。'
      return next
    }
    for (let i = 0; i < 7; i++) {
      if (next.plan[i][slot]) continue
      next.plan[i][slot] = actionId
      return next
    }
    next.lastNote = '这一周白天已经排满了。'
    return next
  }
  const work = parseWorkPlan(actionId)
  if (work) {
    if (!workAvailable(next, work.phase, work.scriptId, slot, work.promoIndex)) {
      next.lastNote = slot === 'eve' ? '晚上排不了这个。' : '这部现在排不了。'
      return next
    }
    for (let i = 0; i < 7; i++) {
      if (next.plan[i][slot]) continue
      next.plan[i][slot] = actionId
      return next
    }
    next.lastNote = '这一周白天已经排满了。'
    return next
  }
  const action = actionById(actionId)
  if (!action) return next
  if (!actionAvailable(next, action, slot)) {
    next.lastNote = slot === 'eve' ? '晚上排不了这个。' : '白天排不了这个。'
    return next
  }
  for (let i = 0; i < 7; i++) {
    if (next.plan[i][slot]) continue
    next.plan[i][slot] = actionId
    return next
  }
  next.lastNote = slot === 'eve' ? '这一周晚上已经排满了。' : '这一周白天已经排满了。'
  return next
}

export function clearWeek(state: GameState): GameState {
  const next = clone(state)
  next.plan = emptyPlan()
  return next
}

export function travelEvent(): GameEvent {
  return {
    id: 'travel',
    title: '旅游',
    body: '旅行社的屏幕上轮流播放海边、温泉和山里的照片。工作人员问你想去几天，又提醒临近出发不能随意改期。',
    options: [{ id: 'leave', label: '先不下单' }],
  }
}

export function openTravel(state: GameState): GameState {
  const next = clone(state)
  if (next.phase !== 'plan') {
    next.lastNote = '出门以后再改不了。'
    return next
  }
  if (next.plan.some((d) => parseTripPlan(d.day ?? '') || parseTripPlan(d.eve ?? ''))) {
    next.lastNote = '这周已经订了行程。'
    return next
  }
  next.event = travelEvent()
  return next
}

function tripWindow(state: GameState, days: number): number {
  for (let start = 0; start <= 7 - days; start++) {
    let ok = true
    for (let i = 0; i < days; i++) {
      if (state.plan[start + i].day || state.plan[start + i].eve) {
        ok = false
        break
      }
    }
    if (ok) return start
  }
  return -1
}

function clearTripFrom(state: GameState, destId: string, fromIndex: number) {
  for (const day of state.plan) {
    const d = day.day ? parseTripPlan(day.day) : null
    if (d?.destId === destId && d.index >= fromIndex) day.day = null
    const e = day.eve ? parseTripPlan(day.eve) : null
    if (e?.destId === destId && e.index >= fromIndex) day.eve = null
  }
}

export function bookTrip(state: GameState, destId: string): GameState {
  const next = clone(state)
  const dest = tripById(destId)
  if (!dest) return next
  if (next.phase !== 'plan') {
    next.lastNote = '出门以后再改不了。'
    return next
  }
  if (next.plan.some((d) => parseTripPlan(d.day ?? '') || parseTripPlan(d.eve ?? ''))) {
    next.lastNote = '这周已经订了行程。'
    return next
  }
  if (next.money < dest.price) {
    next.lastNote = '卡里不够'
    return next
  }
  const start = tripWindow(next, dest.days)
  if (start < 0) {
    next.lastNote = '这周排不开。这几天白天晚上都要空着。'
    return next
  }
  for (let i = 0; i < dest.days; i++) {
    next.plan[start + i].day = tripPlanId(dest.id, i)
    next.plan[start + i].eve = tripPlanId(dest.id, i, true)
  }
  next.event = null
  next.lastNote = `订了${dest.name}。这周有 ${dest.days} 天不在。`
  return next
}

function applyTripSlot(state: GameState, dest: TripDef, index: number, night: boolean): string {
  if (night) {
    return dest.nightText
  }
  const prevKey = `tripd:${state.week}:${dest.id}:${index - 1}`
  if (index > 0 && !state.flags[prevKey]) {
    clearTripFrom(state, dest.id, index)
    state.stamina = clamp(state.stamina + 18, 0, STA_MAX)
    state.mood = clamp(state.mood + 8, 0, houseMoodMax(state))
    return '行程断了。你提前回来了。'
  }
  if (index === 0) {
    if (state.money < dest.price) {
      clearTripFrom(state, dest.id, 0)
      return '卡里不够，行程退了。'
    }
    state.money -= dest.price
  }
  state.flags[`tripd:${state.week}:${dest.id}:${index}`] = true
  if (index === dest.days - 1) {
    state.stamina = STA_MAX
    state.mood = houseMoodMax(state)
    addAttr(state, dest.attr)
    return dest.endLine
  }
  state.stamina = clamp(state.stamina + 12, 0, STA_MAX)
  state.mood = clamp(state.mood + 10, 0, houseMoodMax(state))
  return dest.daysText[index] ?? dest.daysText[0]
}

export function startWeek(state: GameState): GameState {
  const next = clone(state)
  next.phase = 'play'
  next.weekday = 0
  next.slot = 'day'
  next.event = null
  next.recapWeek = null
  next.lastNote = '这一周开始了。'
  ensureCeremonyPlan(next)
  maybeIndustryBuzz(next)
  maybeCalendar(next)
  maybeGossip(next)
  return next
}

function slotNeedsChoice(id: string): boolean {
  return (
    id === 'company' ||
    id === 'company-busy' ||
    id === 'label' ||
    id === 'label-busy' ||
    id === 'media' ||
    id === 'media-busy' ||
    id === 'sign' ||
    id === 'mall' ||
    id === 'audition-ok' ||
    id === 'audition-fail' ||
    id === 'agency' ||
    id.startsWith('scene-') ||
    id.startsWith('date-') ||
    (id.startsWith('meet-') && id !== 'meet-zhouheng') ||
    id.startsWith('ceremony-') ||
    id === 'guyan-ask' ||
    id === 'y2-contract' ||
    id === 'y2-studio'
  )
}

function continueAfter(state: GameState): GameState {
  if (state.event) return state
  if (state.phase !== 'play') return state
  const hasPlan = state.plan.some((d) => d.day || d.eve)
  if (!hasPlan && state.weekday === 0 && state.slot === 'day') {
    state.phase = 'plan'
    if (!state.lastNote) state.lastNote = '新的一周。'
    return state
  }
  return state
}

export function weekLines(state: GameState, week: number): GameState['log'] {
  return state.log.filter((line) => line.week === week).slice().reverse()
}

export function splitLogLine(text: string): { story: string; delta: string } {
  const idx = text.lastIndexOf('。')
  if (idx < 0) return { story: text, delta: '' }
  const delta = text.slice(idx + 1)
  if (!/^(金钱|体力|心情|粉丝|认可|容貌|演技|才艺|口才|气质|时尚|智慧|体能|自信)/.test(delta)) {
    return { story: text, delta: '' }
  }
  return { story: text.slice(0, idx + 1), delta }
}

export function slotRecord(state: GameState, weekday: number, slot: Slot): string {
  const lines = state.log
    .filter((line) => line.week === state.week && line.weekday === weekday && line.slot === slot)
    .slice()
    .reverse()
  if (!lines.length) return ''
  return splitLogLine(lines[0].text).story.replace(/。+$/, '')
}

function moneyShort(state: GameState, action: ActionDef): boolean {
  return (action.money ?? 0) < 0 && state.money < -(action.money ?? 0)
}

function staShort(state: GameState, action: ActionDef): boolean {
  const sta = action.stamina ?? 0
  return sta < 0 && state.stamina < -sta && action.kind !== 'rest'
}

function setHot(state: GameState, text: string, tone: 'good' | 'bad' | 'mixed', days: number) {
  state.hotSearch = { text, tone, daysLeft: days }
  state.news = { text, tone, kind: 'hot' }
  if (tone === 'bad') {
    const loss = Math.max(80, Math.round(state.fans * 0.05))
    state.fans = Math.max(0, state.fans - loss)
    state.opinion = clamp(state.opinion - 2, -40, 40)
  }
}

function maybeIndustryBuzz(state: GameState) {
  if (state.week < 3 || state.news) return
  const fortnight = Math.floor((state.week - 1) / 2)
  const key = `buzzF:${fortnight}`
  if (state.flags[key]) return
  const script = pickBuzzScript(state)
  if (!script) return
  state.flags[key] = true
  state.news = rumorFor(script, state.week)
}

function stretchBookingWindows(state: GameState) {
  const today = absDay(state.week, state.weekday)
  for (const b of state.bookings ?? []) {
    if (b.phase === 'shoot') {
      const remain = Math.max(0, b.shootNeed - b.shootDone)
      b.deadlineDay = Math.max(b.deadlineDay, today + workWindow(remain))
    } else {
      const remain = Math.max(0, b.promoNeed - b.promoDone)
      b.promoDeadlineDay = Math.max(b.promoDeadlineDay, today + workWindow(remain))
    }
  }
}

export function signContract(state: GameState, scriptId: string): string {
  const script = scriptById(scriptId)
  if (!script) return '本子不存在'
  if (!state.bookings) state.bookings = []
  if (state.bookings.some((b) => b.scriptId === scriptId)) return '这部你已经签了。'
  if (shootingCount(state) >= MAX_BOOKINGS) return '周衡合上合同：「你手上已经有三部在拍。先把其中一部杀青，再谈新的。」'
  if (!canTakeScript(effectiveAttrs(state), script, { recognition: state.recognition, fans: state.fans })) {
    return '周衡没有把合同递给你：「这次没过。先回去准备，下次再试。」'
  }
  const match = scriptMatch(effectiveAttrs(state), script)
  const today = absDay(state.week, state.weekday)
  state.money += script.deposit
  state.bookings.push({
    scriptId: script.id,
    phase: 'shoot',
    shootDone: 0,
    shootNeed: script.shootNeed,
    promoDone: 0,
    promoNeed: script.promoNeed,
    deadlineDay: today + script.deadlineDays,
    promoDeadlineDay: 0,
    quality: Math.round(28 + match * 0.2),
    match,
    deposit: script.deposit,
  })
  addAttr(state, { confidence: 2 })
  if (shouldAnnounce(script)) {
    const n = announceFor(state.name, script)
    setHot(state, n.text, n.tone, script.hype === 'ip' || script.roleTier === 'second' || script.roleTier === 'lead' ? 6 : 4)
  }
  const dep = script.deposit > 0 ? `定金 ${script.deposit} 元已经打进来。` : ''
  return `你签下了《${script.title}》，饰演${script.roleName}。共 ${script.shootNeed} 场戏，要在 ${script.deadlineDays} 天内完成。${dep}`.trim()
}

export function markAudition(state: GameState, scriptId: string) {
  if (!state.auditionedIds) state.auditionedIds = []
  if (!state.auditionedIds.includes(scriptId)) state.auditionedIds.push(scriptId)
}

function workPractice(script: ScriptDef): Partial<Attrs> {
  const primary = ATTR_KEYS.find((k) => script.need[k]) ?? 'acting'
  return { [primary]: 1 }
}

function applyFilmSlot(state: GameState, b: Booking): string {
  if (b.phase !== 'shoot') return '通告单上没你的场。'
  const script = scriptById(b.scriptId)
  if (!script) return '本子丢失'
  state.stamina = clamp(state.stamina - 24, 0, STA_MAX)
  state.mood = clamp(state.mood - 5, 0, houseMoodMax(state))
  const q = 3 + Math.round(b.match / 25) + (state.mood > 50 ? 2 : 0) - (state.stamina < 20 ? 3 : 0)
  b.quality = clamp(b.quality + q, 0, 100)
  b.shootDone += 1
  if (b.shootDone % 3 === 1) addAttr(state, workPractice(script))

  if (script.investor === 'guyan') state.flags.guyanFilm = true
  if (script.meetNpc && !state.met[script.meetNpc] && b.shootDone === 1) {
    state.event = { ...meetEvent(script.meetNpc), scriptId: b.scriptId }
  } else if (script.sceneAt && script.sceneEvent && b.shootDone === script.sceneAt) {
    state.event = { ...sceneEvent(script.sceneEvent, script), scriptId: b.scriptId }
  }

  if (state.met.ruanqing && state.favor.ruanqing >= 18) {
    const together =
      script.meetNpc === 'ruanqing' ||
      script.supporting.includes('阮清') ||
      script.leads.includes('阮清')
    if (together) b.quality = clamp(b.quality + 3, 0, 100)
  }

  if (b.shootDone >= b.shootNeed) {
    startPromo(state, script, b)
    const names = (b.promoTasks ?? []).map((k) => PROMO_LABEL[k]).join('、')
    return `《${script.title}》杀青。你刚卸完妆，周衡就把后续宣传安排发了过来：${names}。要在 ${script.promoDays} 天内完成。`
  }
  return `《${script.title}》今天的戏拍完了。进度 ${b.shootDone}/${b.shootNeed}。`
}

function startPromo(state: GameState, script: ScriptDef, b: Booking) {
  const gross = Math.round(
    script.pay * (state.flags.signed ? 0.9 : 1) * (0.7 + b.quality / 200) * (0.85 + b.match / 400) * careerPayMult(state),
  )
  const rest = Math.max(0, gross - (b.deposit ?? 0))
  if (rest > 0) {
    state.money += rest
  }
  b.phase = 'promo'
  b.promoDeadlineDay = absDay(state.week, state.weekday) + script.promoDays
  ensurePromoTasks(b, script)
  b.promoCleared = []
  const from = workPlanId('shoot', script.id)
  let idx = 0
  for (const day of state.plan) {
    if (day.day !== from) continue
    if (idx < (b.promoTasks?.length ?? 0)) {
      day.day = workPlanId('promo', script.id, idx)
      idx += 1
    } else {
      day.day = null
    }
  }
}

function applyPromoSlot(state: GameState, b: Booking, promoIndex?: number): string {
  if (b.phase !== 'promo') return '宣传档期还没到。'
  const script = scriptById(b.scriptId)
  if (!script) return '本子丢失'
  ensurePromoTasks(b, script)
  let index = promoIndex
  if (index == null) {
    index = (b.promoTasks ?? []).findIndex((_, i) => !(b.promoCleared ?? []).includes(i))
  }
  if (index < 0 || (b.promoCleared ?? []).includes(index)) return '通告单上没你的场。'
  const kind = b.promoTasks![index]
  state.stamina = clamp(state.stamina - 16, 0, STA_MAX)
  state.mood = clamp(state.mood - 3, 0, houseMoodMax(state))
  addAttr(state, workPractice(script))
  b.promoCleared = [...(b.promoCleared ?? []), index]
  b.promoDone = b.promoCleared.length
  const fame = Math.round(
    (80 + b.quality * 6 + b.match) * GRADE_MULT[script.grade] * 0.35 * careerFameMult(state) * ROLE_FAME[script.roleTier],
  )
  const rec = Math.max(1, Math.round((script.recognition / script.promoNeed) * (0.7 + b.quality / 150)))
  state.fans += fame
  state.recognition += rec
  state.opinion += 1
  if (b.promoDone >= b.promoNeed) {
    finishWork(state, script, b, false)
    return `《${script.title}》的宣传行程全部结束。最新采访下面，开始有人问你还演过什么。`
  }
  return promoLine(kind, script.title)
}

function finishWork(state: GameState, script: ScriptDef, b: Booking, violated: boolean) {
  if (!state.finishedScripts.includes(script.id)) state.finishedScripts.push(script.id)
  const score = b.quality * GRADE_MULT[script.grade] * (0.6 + b.match / 250)
  if (violated) {
    const penalty = (b.deposit ?? 0) + Math.round(Math.max(b.deposit, script.pay * 0.1))
    state.money = Math.max(0, state.money - penalty)
    state.mood = clamp(state.mood - 14, 0, houseMoodMax(state))
    state.opinion -= 12
    state.recognition = Math.max(0, state.recognition - 10)
    setHot(state, `${state.name} 档期违约 《${script.title}》`, 'bad', 6)
  } else {
    if (!state.workLog) state.workLog = []
    state.workLog.push({
      scriptId: script.id,
      quality: b.quality,
      score,
      week: state.week,
    })
    if (script.roleTier === 'lead') state.flags['rung:lead'] = true
    const news = wrapNewsFor(state.name, script, score, false)
    if (news) setHot(state, news.text, news.tone, script.awardTrack ? 7 : 5)
  }
  state.bookings = state.bookings.filter((x) => x.scriptId !== b.scriptId)
  for (const day of state.plan) {
    const w = day.day ? parseWorkPlan(day.day) : null
    if (w?.scriptId === b.scriptId) day.day = null
  }
}

function violateIfNeeded(state: GameState) {
  const today = absDay(state.week, state.weekday)
  for (const b of [...(state.bookings ?? [])]) {
    const script = scriptById(b.scriptId)
    if (!script) continue
    if (b.phase === 'shoot' && today > b.deadlineDay && b.shootDone < b.shootNeed) {
      const penalty = (b.deposit ?? 0) + Math.round(Math.max(b.deposit, script.pay * 0.1))
      log(state, `《${script.title}》超过了约定工期。片方发来违约通知，你退回定金并赔偿 ${penalty} 元。`)
      finishWork(state, script, b, true)
      continue
    }
    if (b.phase === 'promo' && today > b.promoDeadlineDay && b.promoDone < b.promoNeed) {
      log(state, `《${script.title}》的宣传没有全部完成。片方没再追着催，之后也没主动联系过你。`)
      state.recognition += Math.max(1, Math.round(script.recognition * 0.2))
      finishWork(state, script, b, false)
    }
  }
}

function inviteEvent(script: ScriptDef): GameEvent {
  return {
    id: 'invite',
    title: `《${script.title}》`,
    body: '',
    scriptId: script.id,
    track: script.track,
    options: [
      { id: 'audition', label: '试镜' },
      { id: 'back', label: '先放下' },
      { id: 'decline', label: '婉拒' },
    ],
  }
}

function signEvent(script: ScriptDef): GameEvent {
  const dep = script.deposit > 0 ? `定金：${script.deposit}元` : '没有定金。'
  return {
    id: 'sign',
    title: '通告签约',
    body: `周衡把合同翻到工期和违约条款，一项项念给你听。\n\n《${script.title}》\n\n角色：${script.roleName} · ${script.roleKind}\n\n${dep}\n\n「不懂的现在问，别回头说没看见。」她把笔放在桌上，「确定时间排得开，再签。」`,
    scriptId: script.id,
    options: [
      { id: 'abort', label: '把笔放下' },
      { id: 'ok', label: '签订合约' },
    ],
  }
}

function venueId(track: Track): 'company' | 'label' | 'media' {
  if (track === 'music') return 'label'
  if (track === 'variety') return 'media'
  return 'company'
}

function companyEvent(state: GameState, track: Track = 'film'): GameEvent {
  const offers = currentOffers(state, track)
  const id = venueId(track)
  if (offers.length === 0) {
    if (track === 'music') {
      return {
        id: 'label-busy',
        title: '这个月没有小样',
        body: '企划查了一遍项目表，摘下耳机说：「这个月公开找人的歌都定了。下个月有新小样，我让前台通知你。」',
        track,
        options: [{ id: 'ok', label: '回去' }],
      }
    }
    if (track === 'variety') {
      return {
        id: 'media-busy',
        title: '环节排满了',
        body: '导播确认完名单说：「这个月的飞行嘉宾已经排满了。下个月有新环节，你可以再来看。」',
        track,
        options: [{ id: 'ok', label: '回去' }],
      }
    }
    return {
      id: 'company-busy',
      title: '桌上没了',
      body: state.flags.leftAgency
        ? '这个月公开找人的角色都定了。没人会替你再问一遍。下个月你自己再盯。'
        : '周衡把项目表翻到最后一页：「这个月公开找人的角色都定了。先拍好手上的，下个月再来看。」',
      track,
      options: [{ id: 'ok', label: '回去' }],
    }
  }
  const filmBody = state.flags.leftAgency
    ? shootingCount(state) >= 3
      ? '你自己约了会议室。没有人替你挡枪。\n\n档期已经满了。可以看，不能再签。'
      : '你自己约了会议室。没有人替你挡枪。\n\n这个月公开找人的都在这儿。今天最多试一部。'
    : companyTalk(shootingCount(state), track)
  return {
    id,
    title: track === 'music' ? '这个月的小样' : track === 'variety' ? '这个月的环节' : '桌上这几部',
    body: track === 'film' ? filmBody : companyTalk(shootingCount(state), track),
    track,
    options: [
      ...offers.map((s) => ({
        id: `view:${s.id}`,
        label: `翻开《${s.title}》`,
      })),
      { id: 'leave', label: '再说，先回去' },
    ],
  }
}

function everydayResult(action: ActionDef): string {
  const lines: Partial<Record<ActionId, string>> = {
    salon: '护理做完以后，你在休息区坐了一会儿才离开。',
    'train-acting': '表演课上排了三轮对手戏。老师把你最习惯的小动作挑了个遍。',
    'train-talent': '练声和编舞连着上了一下午。最后一遍结束时，衣服已经被汗浸透。',
    'train-speech': '老师拿临时问题追问了一个下午。到下课时，你总算不再每句话都想半天。',
    'train-poise': '你顶着书走了很多遍，又重新练了落座和起身。看着简单，做完腰背都酸。',
    'train-fashion': '造型老师让你自己搭了三套衣服，再把最用力的那套全部换掉。',
    'train-wit': '你看了几份真实合同，终于分清报价、分成和违约条款不是一回事。',
    'train-fit': '教练没因为你明天有通告就少排一组。拉伸结束时，腿还有点发抖。',
    'job-cafe': '咖啡店从午后一直忙到关门。你记住了几个熟客的口味，也收错了一次钱。',
    'job-sing': '三轮驻唱唱完，台下有人点了第二次同一首歌。你喝完水才从后门离开。',
    'job-extra': '你跟着群演队伍换了三次衣服，大部分时间都在等。收工时领到了当天的工资。',
    'job-warmup': '商演现场比彩排乱得多。你把冷下来的场子重新带热，嗓子也快喊哑了。',
    'job-counter': '专柜忙了一整天。你替客人试色、补货，也学会了在三句话里说清一件产品。',
    'show-variety': '节目录了两遍。第二遍结束时，主持人终于准确叫出了你的名字。',
    live: '直播结束。你关掉补光灯，评论区还在继续刷新。',
    park: '你在公园走了很久，手机一直放在包里。回去时天已经快黑了。',
    cinema: '电影散场以后，你坐到字幕放完才离开。',
  }
  return lines[action.id] ?? `${action.name}结束了。`
}

function applyAction(state: GameState, action: ActionDef): string {
  const before = snapStats(state)
  const done = (text: string) => {
    const up = rankUpLine({ fans: before.fans, recognition: before.recognition }, state)
    if (up) setHot(state, `${state.name} ${up.replace(/。$/, '')}`, 'good', 4)
    return withDelta(before, state, up ? `${text.trim().replace(/。+$/, '')}。${up}` : text)
  }
  const house = houseById(state.houseId)
  if (action.kind === 'rest') {
    const staGain = Math.round(60 * house.staMul)
    const moodGain = Math.round(12 * house.moodMul)
    state.stamina = clamp(state.stamina + staGain, 0, STA_MAX)
    state.mood = clamp(state.mood + moodGain, 0, houseMoodMax(state))
    return done('回家睡了一觉。')
  }
  if (action.id === 'company') {
    state.stamina = clamp(state.stamina - 10, 0, STA_MAX)
    if (!state.met.zhouheng) {
      state.event = {
        id: 'meet-zhouheng',
        title: '有人来接你',
        body: zhouIntro(state.identity),
        options: [{ id: 'ok', label: '跟她进去看本' }],
      }
      return done('第一次进公司。')
    }
    state.event = companyEvent(state, 'film')
    return done(currentOffers(state, 'film').length ? '桌上摊着几部戏。' : '这个月桌上已经没有通告。')
  }
  if (action.id === 'label') {
    state.stamina = clamp(state.stamina - 10, 0, STA_MAX)
    state.event = companyEvent(state, 'music')
    return done(currentOffers(state, 'music').length ? '你进了唱片公司。' : '这个月没有小样。')
  }
  if (action.id === 'media') {
    state.stamina = clamp(state.stamina - 10, 0, STA_MAX)
    state.event = companyEvent(state, 'variety')
    return done(currentOffers(state, 'variety').length ? '你进了媒体公司。' : '这个月没有环节。')
  }
  if (action.kind === 'mall') {
    state.mood = clamp(state.mood + (action.mood ?? 0), 0, houseMoodMax(state))
    state.event = {
      id: 'mall',
      title: '商场',
      body: '商场里人很多。你先去了常逛的那层，又顺路看了几家平时不会进去的店。衣服可以试，护肤和彩妆也能在柜台体验。',
      options: [{ id: 'leave', label: '离开' }],
    }
    return done('你进了商场。')
  }
  if (action.kind === 'agency') {
    state.stamina = clamp(state.stamina + (action.stamina ?? 0), 0, STA_MAX)
    state.event = {
      id: 'agency',
      title: '房屋中介',
      body: '中介门店的玻璃上贴满房源。工作人员先问了你的预算、通勤和入住时间，再把合适的几套房调出来给你看。',
      options: [{ id: 'leave', label: '离开' }],
    }
    return done('你进了中介。')
  }
  if (action.kind === 'film') {
    const b = (state.bookings ?? []).find((x) => x.phase === 'shoot') ?? (state.bookings ?? []).find((x) => x.phase === 'promo')
    if (!b) return done('通告单上没你的场。')
    return done(b.phase === 'promo' ? applyPromoSlot(state, b) : applyFilmSlot(state, b))
  }
  if (action.kind === 'promo') {
    const b = (state.bookings ?? []).find((x) => x.phase === 'promo') ?? (state.bookings ?? []).find((x) => x.phase === 'shoot')
    if (!b) return done('宣传档期还没到。')
    return done(b.phase === 'shoot' ? applyFilmSlot(state, b) : applyPromoSlot(state, b))
  }
  if (action.kind === 'story') {
    state.stamina = clamp(state.stamina + (action.stamina ?? 0), 0, STA_MAX)
    state.mood = clamp(state.mood + (action.mood ?? 0), 0, houseMoodMax(state))
    if (action.id === 'story-dinner' && !state.met.guyan) {
      state.flags.meetGu = true
      state.event = guyanDinner()
      return done('你去赴顾宴川的饭局。')
    }
    return done(action.name)
  }

  if (moneyShort(state, action)) return '卡里不够，只好回家。'
  if (staShort(state, action)) return '走不动了，只好回去睡。'

  state.money += action.money ?? 0
  state.stamina = clamp(state.stamina + (action.stamina ?? 0), 0, STA_MAX)
  state.mood = clamp(state.mood + (action.mood ?? 0), 0, houseMoodMax(state))
  addAttr(state, action.attr)
  if (action.fans) state.fans += action.fans
  if (action.kind === 'show') {
    state.money += Math.round((action.money ?? 0) * (careerPayMult(state) - 1))
    state.fans += Math.round((action.fans ?? 0) * (careerFameMult(state) - 1))
  }

  if (action.kind === 'live') {
    const eff = effectiveAttrs(state)
    const quality = (eff.speech + eff.looks + eff.confidence + state.mood) / 4
    const pay = Math.round((200 + state.fans * 0.08) * careerPayMult(state))
    state.money += pay
    const fanGain = Math.max(
      40,
      Math.round((80 + state.fans * 0.02 + quality * 4) * (state.mood < 25 ? 0.4 : 1) * careerFameMult(state)),
    )
    state.fans += fanGain
    addAttr(state, { confidence: quality > 60 ? 2 : 1 })
    return done(everydayResult(action))
  }
  if (action.kind === 'social' && action.npcId) {
    addFavor(state, action.npcId, 7)
    state.event = dateEvent(state, action.npcId)
    return done(`和${NPC_NAME[action.npcId]}见面。`)
  }
  if (action.kind === 'job' && action.id === 'job-sing' && !state.met.peiyu) {
    return done('驻唱结束。后门没人。')
  }
  if (action.kind === 'show' && !state.met.xuning) {
    state.event = meetEvent('xuning')
    return done('垫场综艺。候场室已经有人。')
  }
  return done(everydayResult(action))
}

function yearTurnEvent(week: number): GameEvent | null {
  if (week === YEAR_WEEKS * TOTAL_YEARS + 1) {
    return {
      id: 'year-end',
      title: '三年',
      body: `三年的通告单叠在一起。

有的本还在播。
有的人已经不联系。

影后不是年终礼物。你把抽屉关上。`,
      options: [{ id: 'ok', label: '合上' }],
    }
  }
  if (week === YEAR_WEEKS + 1) {
    return {
      id: 'year-end',
      title: '这一年',
      body: `日历翻到最后一页。

有人开始叫得出你的名字。

开春会有后宫、朝堂、电影节放到桌上。

合同也快到期。周衡说，走或不走，要说清。`,
      options: [{ id: 'next', label: '开启第二年' }],
    }
  }
  if (week === YEAR_WEEKS * 2 + 1) {
    return {
      id: 'year-end',
      title: '第二年',
      body: `第二年过完了。

女主两个字开始出现在通告上。

有的本是拿档期去换一次被看见。

你把去年的东西收进夹子。`,
      options: [{ id: 'next', label: '开启第三年' }],
    }
  }
  return null
}

function maybeStoryEvent(state: GameState): GameEvent | null {
  if (
    playYear(state.week) === 2 &&
    !state.flags.y2contract &&
    state.met.zhouheng &&
    state.slot === 'eve'
  ) {
    state.flags.y2contract = true
    return storyEvent(
      'y2-contract',
      '合同',
      [
        '周衡把两份文件摊开。',
        '「明年的约，到期了。」',
        '「留下，我还是你的经纪人。分成还是原来那样。」',
        '「走，你自己挂牌。柜台上没人挡枪。空窗至少两个月。」',
        state.identity === 'rich' ? '「家里那边已经问过我一次。我没替你答。」' : '「没有人会替你选。」',
        '她把笔搁在中间。',
        '「今晚说清。」',
      ],
      [
        { id: 'stay', label: '留下' },
        { id: 'leave', label: '解约' },
      ],
    )
  }
  if (
    playYear(state.week) === 2 &&
    weekInYear(state.week) >= 32 &&
    !state.flags.y2studio &&
    state.money >= 120000 &&
    state.recognition >= 40 &&
    state.slot === 'eve'
  ) {
    state.flags.y2studio = true
    return storyEvent(
      'y2-studio',
      '工作室',
      [
        state.flags.leftAgency
          ? '律师把章程摊开。'
          : '周衡把一份章程转过来。',
        '「个人工作室。宣发、公关、一部本的分成你能看见。」',
        '「挂牌要一笔钱。之后每个月从账上走。」',
        state.flags.leftAgency ? '「柜台上没人挡枪。这是你自己的门。」' : '「公司还在。分成还是原来那样。工作室只是你多挂一块牌子。」',
        '「不挂也可以。私下把事办完。」',
      ],
      [
        { id: 'open', label: '挂牌' },
        { id: 'wait', label: '先不挂' },
      ],
    )
  }
  if (state.flags.guyanFilm && !state.met.guyan && !state.flags.guyanAsk && state.slot === 'eve') {
    state.flags.guyanAsk = true
    return {
      id: 'guyan-ask',
      title: '一条消息',
      body: `顾宴川的助理发来一个江边餐厅的地址。

消息里写：「顾总想请你吃顿便饭，聊聊刚杀青的戏。如果不方便，我替您改时间。」

你看了一眼时间，晚上九点。`,
      options: [
        { id: 'go', label: '去' },
        { id: 'later', label: '改天' },
      ],
    }
  }
  const high = ROMANCE.filter((id) => state.met[id] && state.favor[id] >= 60)
  if (high.length >= 2 && !state.flags.shura1 && state.slot === 'eve') {
    state.flags.shura1 = true
    return shuraEvent(NPC_NAME[high[0]], NPC_NAME[high[1]])
  }
  return null
}

function applyStoryChoice(state: GameState, eventId: string, optionId: string): string {
  if (eventId.startsWith('cal-')) {
    return applyCalendarChoice(state, eventId)
  }
  if (eventId.startsWith('ceremony-')) {
    return applyCeremonyChoice(state)
  }
  if (eventId.startsWith('gossip-')) {
    return applyGossipChoice(state, eventId, optionId)
  }
  if (eventId === 'intro') {
    state.flags.introDone = true
    state.phase = 'plan'
    return '接下来的一周还没有安排。'
  }
  if (eventId === 'mall' || eventId === 'agency' || eventId === 'travel') {
    return eventId === 'mall' ? '你从商场出来。' : eventId === 'agency' ? '你从中介出来。' : '你没下单。'
  }
  if (eventId === 'year-end') {
    if (optionId === 'next') {
      state.phase = 'plan'
      const y = playYear(state.week)
      state.lastNote = y === 2 ? '第二年的通告还没排。' : '第三年的通告还没排。'
      return y === 2 ? '合同还在抽屉里。这周周衡会谈一次。' : '新的一年。'
    }
    return '三年到头了。'
  }
  if (eventId === 'y2-contract') {
    if (optionId === 'leave') {
      state.flags.leftAgency = true
      state.flags.signed = false
      state.money = Math.max(0, state.money - 80000)
      addFavor(state, 'zhouheng', -18)
      return '你签了解约。周衡把工牌收回抽屉。空窗从这周算。'
    }
    addFavor(state, 'zhouheng', 8)
    state.flags.signed = true
    return '你把合同签回去。周衡只说：「那桌上那些本，还是我去要。」'
  }
  if (eventId === 'y2-studio') {
    if (optionId === 'open') {
      if (state.money < 120000) return '账上不够。章程还在桌上。'
      state.money -= 120000
      state.flags.studio = true
      return '牌子挂出去了。以后每个月从账上走一笔。公关翻车，没人替你挡。'
    }
    return '你把章程推回去。门上还是原来的名字。'
  }
  if (eventId === 'meet-zhouheng') {
    addFavor(state, 'zhouheng', 12)
    state.event = companyEvent(state, 'film')
    return '周衡带你进会议室，开始看这个月的通告。'
  }
  if (eventId === 'company' || eventId === 'label' || eventId === 'media') {
    if (optionId === 'leave') return '你暂时没有选，和周衡说想再考虑一下。'
    if (optionId.startsWith('view:')) {
      const script = scriptById(optionId.slice(5))
      if (script) state.event = inviteEvent(script)
      return script ? `你把《${script.title}》拿起来。` : '那份通告不在了。'
    }
  }
  if (eventId === 'invite' || eventId === 'invite-short') {
    const script = scriptById(state.event?.scriptId ?? '')
    if (!script) return '通告不在了。'
    if (optionId === 'decline') {
      const m = monthIndex(state.week)
      if (state.offerMonth !== m) {
        state.offerMonth = m
        state.declinedIds = []
      }
      if (!state.declinedIds.includes(script.id)) state.declinedIds.push(script.id)
      state.event = companyEvent(state, script.track)
      return `你把《${script.title}》放回去。档期让给别人。`
    }
    if (optionId === 'back') {
      state.event = companyEvent(state, script.track)
      return '你把通告放下。'
    }
    if (optionId === 'audition' || optionId === 'accept') {
      markAudition(state, script.id)
      state.stamina = clamp(state.stamina - 6, 0, STA_MAX)
      const attrs = effectiveAttrs(state)
      if (!canTakeScript(attrs, script, { recognition: state.recognition, fans: state.fans })) {
        state.mood = clamp(state.mood - 3, 0, houseMoodMax(state))
        state.event = auditionFailEvent(script, attrs)
        return '试镜结束。选角导演让你先回去等消息。'
      }
      addAttr(state, { confidence: 1 })
      state.event = auditionOkEvent(script)
      return '试镜结束。选角导演留下你，又问了一遍档期。'
    }
  }
  if (eventId === 'audition-ok') {
    const script = scriptById(state.event?.scriptId ?? '')
    if (!script) return '通告不在了。'
    if (optionId === 'back') {
      return '周衡看了看表：今天到这里。'
    }
    if (optionId === 'sign') {
      state.event = signEvent(script)
      return '周衡把合同翻到签字页。'
    }
  }
  if (eventId === 'audition-fail') {
    return '周衡把你送到电梯口：「今天只能试这一部。回去等消息。」'
  }
  if (eventId === 'sign') {
    const script = scriptById(state.event?.scriptId ?? '')
    if (!script) return '合同不在了。'
    if (optionId === 'abort') {
      return '你没有签。周衡把合同收回文件夹：「想清楚再说，但片方不会一直等。」'
    }
    if (optionId === 'ok') return signContract(state, script.id)
  }
  if (eventId === 'meet-peiyu') {
    addFavor(state, 'peiyu', optionId === 'kind' || optionId === 'hello' ? 10 : 4)
    return meetChoice('peiyu', optionId)
  }
  if (eventId === 'meet-xuning') {
    addFavor(state, 'xuning', optionId === 'hello' ? 8 : 5)
    return meetChoice('xuning', optionId)
  }
  if (eventId === 'meet-ruanqing') {
    addFavor(state, 'ruanqing', optionId === 'kind' ? 10 : 5)
    return meetChoice('ruanqing', optionId)
  }
  if (eventId === 'meet-songwan') {
    addFavor(state, 'songwan', optionId === 'hello' ? 6 : 3)
    return meetChoice('songwan', optionId)
  }
  if (eventId === 'meet-liangshi') {
    addFavor(state, 'liangshi', optionId === 'back' ? 8 : 3)
    return meetChoice('liangshi', optionId)
  }
  if (eventId === 'meet-shenzhao') {
    addFavor(state, 'shenzhao', optionId === 'again' ? 10 : 5)
    const shot = bookingForEvent(state)
    if (shot) shot.quality += optionId === 'again' ? 8 : 2
    return meetChoice('shenzhao', optionId)
  }
  if (eventId === 'meet-guyan') {
    addFavor(state, 'guyan', optionId === 'plain' ? 10 : 6)
    return meetChoice('guyan', optionId)
  }
  if (eventId === 'guyan-ask') {
    if (optionId === 'go') {
      state.flags.meetGu = true
      state.event = guyanDinner()
      return '你去了江边。'
    }
    return '你回：改天。地址还在。'
  }
  if (eventId === 'broker-refer') {
    return '周衡把两份本收回文件夹：「我先替你报上去。有消息再告诉你。」'
  }
  if (eventId.startsWith('date-')) {
    const npc = eventId.slice(5) as NpcId
    addFavor(state, npc, optionId === 'hold' || optionId === 'quiet' || optionId === 'wait' ? 3 : 6)
    return dateChoice(npc, optionId)
  }
  if (eventId === 'shura1') {
    const high = ROMANCE.filter((id) => state.met[id] && state.favor[id] >= 60)
    if (optionId === 'both') {
      addFavor(state, high[0], -8)
      addFavor(state, high[1], -8)
      setHot(state, `${state.name} 同晚两行程`, 'mixed', 4)
      return '两边都觉得你在应付。'
    }
    const pick = optionId === 'pick0' ? high[0] : high[1]
    const other = optionId === 'pick0' ? high[1] : high[0]
    addFavor(state, pick, 6)
    addFavor(state, other, -12)
    return `你去见了${NPC_NAME[pick]}。`
  }
  if (eventId === 'move') {
    if (optionId === 'pei' && state.met.peiyu) {
      addFavor(state, 'peiyu', 10)
      return '裴予帮你把最后一个箱子搬进门，连水都没喝就赶回了排练室。'
    }
    if (optionId === 'zhou' && state.met.zhouheng) {
      addFavor(state, 'zhouheng', 6)
      return '周衡替你联系了搬家公司，还站在门口逐件核对，生怕你少了东西。'
    }
    state.stamina = clamp(state.stamina - 18, 0, STA_MAX)
    return '你自己搬了一整天。最后一个箱子放下时，胳膊已经抬不起来了。'
  }
  if (eventId === 'gift-house') {
    if (optionId === 'take') {
      state.houseId = 'studio'
      state.flags.guyanHouse = true
      addFavor(state, 'guyan', 12)
      setHot(state, `${state.name} 新居曝光`, 'bad', 6)
      return '你收下了钥匙。助理请你在交接单上签字，第二天就有人开始搬东西。'
    }
    addFavor(state, 'guyan', 4)
    return '你说想自己买。'
  }
  if (eventId === 'scene-summer') {
      const shot = bookingForEvent(state)
      if (optionId === 'help') {
        if (shot) shot.quality += 6
        state.opinion += 2
      } else {
        if (shot) shot.quality += 10
        state.opinion -= 2
      }
    return sceneChoice(eventId, optionId, state.met)
  }
  if (eventId === 'scene-store') {
      if (optionId === 'take') {
      state.money += 800
      const shot = bookingForEvent(state)
      if (shot) shot.quality += 8
      if (state.met.xuning) addFavor(state, 'xuning', -6)
    } else {
      if (state.met.xuning) addFavor(state, 'xuning', 8)
      state.fans += 200
    }
    return sceneChoice(eventId, optionId, state.met)
  }
  if (eventId === 'scene-dialogue') {
    if (optionId === 'hard') {
      addAttr(state, { acting: 2, confidence: 2 })
      if (state.met.liangshi) addFavor(state, 'liangshi', 6)
    } else {
      addAttr(state, { confidence: -1 })
    }
    return sceneChoice(eventId, optionId, state.met)
  }
  if (eventId === 'scene-nightstudy') {
    const shot = bookingForEvent(state)
    if (optionId === 'help') {
      if (shot) shot.quality += 4
      if (state.met.ruanqing) addFavor(state, 'ruanqing', 8)
    } else {
      addAttr(state, { confidence: 1 })
      if (state.met.ruanqing) addFavor(state, 'ruanqing', 4)
    }
    return sceneChoice(eventId, optionId, state.met)
  }
  if (eventId === 'scene-sweet') {
    const shot = bookingForEvent(state)
    if (optionId === 'take') {
      if (shot) shot.quality += 6
      if (state.met.songwan) addFavor(state, 'songwan', -8)
    } else {
      if (state.met.songwan) addFavor(state, 'songwan', 6)
      state.fans += 200
    }
    return sceneChoice(eventId, optionId, state.met)
  }
  if (eventId === 'scene-rain' || eventId.startsWith('scene-')) {
    if (optionId === 'again') {
      if (state.met.shenzhao) addFavor(state, 'shenzhao', 8)
      const shot = bookingForEvent(state)
      if (shot) shot.quality += 12
    } else if (state.met.shenzhao) {
      addFavor(state, 'shenzhao', 3)
    }
    return sceneChoice(eventId, optionId, state.met)
  }
  return ''
}

export function choose(state: GameState, optionId: string): GameState {
  const next = clone(state)
  if (!next.event) return next
  const id = next.event.id
  const before = snapStats(next)
  const text = applyStoryChoice(next, id, optionId)
  const noted = withDelta(before, next, text)
  if (next.event && next.event.id !== id) {
    log(next, noted)
    return next
  }
  log(next, noted)
  next.event = null
  if (slotNeedsChoice(id)) return continueAfter(advance(next))
  return continueAfter(next)
}

export function resolveCurrent(state: GameState): GameState {
  const next = clone(state)
  if (next.event || next.phase !== 'play') return next
  violateIfNeeded(next)
  if (next.event) return next

  const actionId = next.plan[next.weekday][next.slot]
  if (!actionId) {
    if (next.slot === 'eve') {
      const story = maybeStoryEvent(next)
      if (story) {
        next.event = story
        return next
      }
      return advance(next)
    }
    const before = snapStats(next)
    next.stamina = clamp(next.stamina + 8, 0, STA_MAX)
    log(next, withDelta(before, next, '没安排。在家耗着。'))
    return advance(next)
  }
  const ceremony = parseCeremonyPlan(actionId)
  if (ceremony) {
    const due = next.ceremonyDue
    if (!due || due.seasonId !== ceremony.seasonId || !due.nominated) {
      log(next, '典礼对不上，只好空过。')
      return advance(next)
    }
    next.stamina = clamp(next.stamina - 16, 0, STA_MAX)
    next.event = ceremonyPlayEvent(next, due)
    log(next, `你去出席${due.name}。`)
    return next
  }
  const trip = parseTripPlan(actionId)
  if (trip) {
    const dest = tripById(trip.destId)
    if (!dest) {
      log(next, '行程对不上，只好空过。')
      return advance(next)
    }
    const before = snapStats(next)
    log(next, withDelta(before, next, applyTripSlot(next, dest, trip.index, trip.night)))
    return advance(next)
  }
  const work = parseWorkPlan(actionId)
  if (work) {
    const b = bookingByScript(next, work.scriptId)
    if (!b || b.phase !== work.phase) {
      log(next, '通告单上没你的场。')
      return advance(next)
    }
    const before = snapStats(next)
    const text = work.phase === 'shoot' ? applyFilmSlot(next, b) : applyPromoSlot(next, b, work.promoIndex)
    const up = rankUpLine({ fans: before.fans, recognition: before.recognition }, next)
    if (up) setHot(next, `${next.name} ${up.replace(/。$/, '')}`, 'good', 4)
    log(next, withDelta(before, next, up ? `${text.trim().replace(/。+$/, '')}。${up}` : text))
    if (next.event) return next
    const afterStory = maybeStoryEvent(next)
    if (afterStory) {
      next.event = afterStory
      return next
    }
    return advance(next)
  }
  const action = actionById(actionId)
  if (!action) {
    log(next, '行程对不上，只好空过。')
    return advance(next)
  }
  if (action.kind !== 'rest' && action.kind !== 'company' && action.kind !== 'film' && action.kind !== 'promo' && (moneyShort(next, action) || staShort(next, action))) {
    const rest = actionById('rest')
    log(next, `${moneyShort(next, action) ? '卡里不够' : '走不动了'}，只好回家。`)
    if (rest) log(next, applyAction(next, rest))
    return advance(next)
  }
  log(next, applyAction(next, action))
  if (next.event) return next
  const story = maybeStoryEvent(next)
  if (story) {
    next.event = story
    return next
  }
  return advance(next)
}

function advance(state: GameState): GameState {
  if (state.event) return state
  if (state.slot === 'day') {
    state.slot = 'eve'
    if (state.plan[state.weekday].eve) return state
    const story = maybeStoryEvent(state)
    if (story) {
      state.event = story
      return state
    }
  }
  tickBuffs(state)
  state.slot = 'day'
  state.weekday += 1
  if (state.weekday >= 7) {
    state.weekday = 0
    state.week += 1
    if (state.flags.studio) state.money = Math.max(0, state.money - 5000)
    const missed = missCeremonyIfNeeded(state)
    if (missed) log(state, missed)
    state.plan = emptyPlan()
    state.recapWeek = state.week - 1
    const turn = yearTurnEvent(state.week)
    if (turn) {
      state.phase = 'ended'
      state.event = turn
      return state
    }
    maybeGuOffer(state)
    maybeRivalNews(state)
    maybeIndustryBuzz(state)
    maybeGossip(state)
    if (!state.event) {
      state.phase = 'plan'
      state.lastNote = '新的一周。'
    }
  }
  violateIfNeeded(state)
  return state
}

function maybeRivalNews(state: GameState) {
  if (state.news || state.hotSearch) return
  const month = monthIndex(state.week)
  const key = `smearM:${month}`
  if (state.flags[key]) return
  const shield = state.met.ruanqing && state.favor.ruanqing >= 40
  const xuningMad = state.met.xuning && state.favor.xuning < 26
  const songwanMad = state.met.songwan && state.favor.songwan < 24 && state.fans >= 2000
  if (!xuningMad && !songwanMad) return
  const roll = ((state.offerSeed + state.week * 997) >>> 0) % 100
  if (shield && roll < 55) {
    state.flags[key] = true
    return
  }
  if (roll < 38) return
  state.flags[key] = true
  if (songwanMad && (!xuningMad || roll % 2 === 0)) {
    setHot(state, `${state.name} 被爆片场难搞`, 'bad', 5)
    if (state.met.songwan) addFavor(state, 'songwan', -2)
    return
  }
  setHot(state, `${state.name} 疑似抢戏 同期不点名`, 'bad', 5)
  if (state.met.xuning) addFavor(state, 'xuning', -2)
}

export function inviteBlocked(state: GameState, npc: NpcId): string | null {
  const action = actionById(`date-${npc}`)
  if (!action) return '现在约不了。'
  if (!state.met[npc]) return '通讯录里还没有这个人。'
  if (state.phase !== 'plan' && state.phase !== 'play') return '现在约不了。'
  if (state.plan.some((d) => d.eve === action.id)) return '这周已经约过。'
  const start = state.phase === 'play' ? state.weekday : 0
  for (let i = start; i < 7; i++) {
    if (state.phase === 'play' && i === state.weekday && state.slot === 'eve') continue
    if (state.plan[i].eve) continue
    if (!actionAvailable(state, action, 'eve')) continue
    return null
  }
  return '这一周晚上已经排满了。'
}

export function inviteNpc(state: GameState, npc: NpcId): GameState {
  const next = clone(state)
  const why = inviteBlocked(next, npc)
  if (why) {
    next.lastNote = why
    return next
  }
  const action = actionById(`date-${npc}`)
  if (!action) return next
  const start = next.phase === 'play' ? next.weekday : 0
  for (let i = start; i < 7; i++) {
    if (next.phase === 'play' && i === next.weekday && next.slot === 'eve') continue
    if (next.plan[i].eve) continue
    if (!actionAvailable(next, action, 'eve')) continue
    next.plan[i].eve = action.id
    const verb = npc === 'zhouheng' ? '对行程' : NPC_KIND_INVITE[npc]
    next.lastNote = `周${WEEKDAYS[i]}晚，${verb}。`
    return next
  }
  next.lastNote = '这一周晚上已经排满了。'
  return next
}

const NPC_KIND_INVITE: Record<NpcId, string> = {
  zhouheng: '对行程',
  liangshi: '约了梁时',
  guyan: '约了顾宴川',
  xuning: '见许宁',
  ruanqing: '见阮清',
  songwan: '见宋晚',
  peiyu: '见面',
  shenzhao: '见面',
  hanchi: '见面',
}

export function brokerCanRefer(state: GameState): string | null {
  if (!state.met.zhouheng) return 'busy'
  if (state.phase !== 'plan' && state.phase !== 'play') return 'busy'
  if (state.favor.zhouheng < BROKER_REFER_FAVOR) return 'busy'
  if (state.flags.brokerSpecial) return 'busy'
  if (state.event) return 'busy'
  return null
}

export function brokerRefer(state: GameState): GameState {
  const next = clone(state)
  if (brokerCanRefer(next)) return next
  next.flags.brokerSpecial = true
  addFavor(next, 'zhouheng', 4)
  next.event = {
    id: 'broker-refer',
    title: '两份新本',
    body: `行程对完以后，周衡没有立刻合电脑。

「等一下。」她从包里拿出两份文件，「有两个项目还没公开找人，我替你问到了试镜。」

你先拿起上面那份。导演一栏写着沈照。

「短片，预算不高，要求很麻烦。」周衡指了指另一份，「这部是大项目，阵容已经定得差不多了，角色只有几场。」

你问她为什么现在才拿出来。

「以前拿出来也没用。」她说完停了一下，「最近你状态不错，可以去试试了。下个月来公司，应该能看见正式通告。」`,
    options: [{ id: 'ok', label: '收下' }],
  }
  return next
}

function maybeGuOffer(state: GameState) {
  if (state.flags.guOffer || !state.met.guyan || state.favor.guyan < 40) return
  if (houseRank(state.houseId) >= 2 || state.week < 8) return
  state.flags.guOffer = true
  state.event = {
    id: 'gift-house',
    title: '钥匙',
    body: '顾宴川的助理送来一套一居室的钥匙，说房子离你现在的片场很近，已经付过一年租金。\n\n纸条上是顾宴川的字：「先住。觉得不合适就让助理退掉，不用勉强。」\n\n助理把交接单放在桌上，安静地等你决定。',
    options: [
      { id: 'take', label: '收下' },
      { id: 'reject', label: '自己买' },
    ],
  }
}

export function autoUntilEvent(state: GameState): GameState {
  let cur = state
  for (let i = 0; i < 48; i++) {
    if (cur.event || cur.phase !== 'play') return cur
    const stamp = `${cur.week}-${cur.weekday}-${cur.slot}-${cur.phase}`
    cur = resolveCurrent(cur)
    if (cur.event) return cur
    if (`${cur.week}-${cur.weekday}-${cur.slot}-${cur.phase}` === stamp) return cur
  }
  return cur
}

export function bookingHint(state: GameState): string {
  const list = state.bookings ?? []
  if (!list.length) {
    const offers = currentOffers(state)
    if (offers.length === 0) return '这个月桌上已经没有通告。'
    return '周衡桌上还有戏。想签就去公司。'
  }
  const today = absDay(state.week, state.weekday)
  return list
    .map((b) => {
      const title = scriptById(b.scriptId)?.title ?? ''
      if (b.phase === 'shoot') {
        const left = Math.max(0, b.deadlineDay - today)
        return `《${title}》 ${b.shootDone}/${b.shootNeed} · 还剩 ${left} 天`
      }
      const left = Math.max(0, b.promoDeadlineDay - today)
      return `《${title}》宣传 ${b.promoDone}/${b.promoNeed} · ${left} 天`
    })
    .join('；')
}

export function buyItem(state: GameState, itemId: string): GameState {
  const next = clone(state)
  const item = itemById(itemId)
  if (!item) return next
  if (next.money < item.price) {
    next.lastNote = '卡里不够'
    return next
  }
  const before = snapStats(next)
  next.money -= item.price
  if (item.kind === 'cosmetic') {
    next.buffs.push({
      itemId: item.id,
      looks: item.looks ?? 0,
      confidence: item.confidence ?? 0,
      fashion: item.fashion ?? 0,
      daysLeft: item.days ?? 7,
    })
    log(next, withDelta(before, next, `用了${item.name}。`))
    return next
  }
  if (next.items.some((i) => i.itemId === itemId)) {
    next.money += item.price
    next.lastNote = '衣橱里已经有一件了'
    return next
  }
  next.items.push({ itemId: item.id, worn: false })
  log(next, withDelta(before, next, `买下${item.name}。`))
  return next
}

export function wearItem(state: GameState, itemId: string): GameState {
  const next = clone(state)
  const item = itemById(itemId)
  if (!item || item.kind === 'cosmetic') return next
  const own = next.items.find((i) => i.itemId === itemId)
  if (!own) return next
  if (item.wear === 'daily' || item.wear === 'carpet') {
    for (const o of next.items) {
      const it = itemById(o.itemId)
      if (it?.wear === item.wear) o.worn = false
    }
  }
  if (item.wear === 'jewel') {
    const jewels = next.items.filter((o) => itemById(o.itemId)?.wear === 'jewel' && o.worn)
    if (jewels.length >= 2 && !own.worn) jewels[0].worn = false
  }
  own.worn = !own.worn
  log(next, own.worn ? `穿上${item.name}` : `脱下${item.name}`)
  return next
}

export function buyHouse(state: GameState, houseId: string): GameState {
  const next = clone(state)
  const house = HOUSES.find((h) => h.id === houseId)
  if (!house || house.price <= 0) return next
  if (next.houseId === houseId) {
    next.lastNote = '你已经住在这里'
    return next
  }
  if (houseRank(houseId) <= houseRank(next.houseId)) {
    next.lastNote = '你已经住得比这里好。'
    return next
  }
  if (next.money < house.price) {
    next.lastNote = '卡里不够'
    return next
  }
  const before = snapStats(next)
  next.money -= house.price
  next.houseId = houseId
  next.event = {
    id: 'move',
    title: '搬家',
    body: `新房的钥匙拿到了。中介问你什么时候搬，今天正好还能约到搬家公司。\n\n你也可以自己慢慢搬。如果想叫熟人来帮忙，现在发消息还来得及。`,
    options: [
      ...(next.met.zhouheng ? [{ id: 'zhou', label: '让周衡找人' }] : []),
      { id: 'self', label: '自己搬' },
    ],
  }
  log(next, withDelta(before, next, `买下${house.name}。`))
  return next
}

export function saveState(state: GameState) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state))
}

function refreshSavedStory(state: GameState) {
  const event = state.event
  if (!event) return
  if (event.id === 'meet-guyan') {
    state.event = guyanDinner()
    return
  }
  if (event.id.startsWith('meet-')) {
    const npc = event.id.slice(5) as NpcId
    if (npc !== 'zhouheng' && NPC_NAME[npc]) {
      state.event = { ...meetEvent(npc), scriptId: event.scriptId }
    }
    return
  }
  if (event.id.startsWith('date-')) {
    const npc = event.id.slice(5) as NpcId
    if (NPC_NAME[npc]) state.event = dateEvent(state, npc)
    return
  }
  if (event.id.startsWith('scene-') && event.scriptId) {
    const script = scriptById(event.scriptId)
    if (script) state.event = { ...sceneEvent(event.id, script), scriptId: event.scriptId }
    return
  }
  if (event.id === 'audition-fail' && event.scriptId) {
    const script = scriptById(event.scriptId)
    if (script) state.event = auditionFailEvent(script, effectiveAttrs(state))
  }
  if (event.id === 'audition-ok' && event.scriptId) {
    const script = scriptById(event.scriptId)
    if (script) state.event = auditionOkEvent(script)
  }
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as GameState
    if (typeof data.recognition !== 'number') return null
    if (Array.isArray(data.plan)) {
      for (const day of data.plan) {
        if (day.day === 'phone') day.day = null
        if (day.eve === 'phone') day.eve = null
      }
    }
    const loaded: GameState = {
      ...data,
      declinedIds: data.declinedIds ?? [],
      auditionedIds: data.auditionedIds ?? [],
      recapWeek: data.recapWeek ?? null,
      awards: data.awards ?? [],
      workLog: data.workLog ?? [],
      ceremonyDue: data.ceremonyDue ?? null,
      news:
        Object.prototype.hasOwnProperty.call(data, 'news')
          ? data.news
          : data.hotSearch
            ? { text: data.hotSearch.text, tone: data.hotSearch.tone }
            : null,
      bookings:
        (data as GameState & { booking?: Booking | null }).bookings ??
        ((data as GameState & { booking?: Booking | null }).booking
          ? [(data as GameState & { booking?: Booking | null }).booking!]
          : []),
    }
    for (const b of loaded.bookings) {
      const script = scriptById(b.scriptId)
      if (b.phase !== 'promo' || !script) continue
      if (!b.promoTasks || b.promoTasks.length !== script.promoNeed) b.promoTasks = buildPromoTasks(script)
      if (!b.promoCleared) b.promoCleared = Array.from({ length: Math.min(b.promoDone, script.promoNeed) }, (_, i) => i)
    }
    const first = loaded.bookings[0]
    if (Array.isArray(loaded.plan) && first) {
      for (const day of loaded.plan) {
        if (day.day === 'film') day.day = workPlanId(first.phase === 'promo' ? 'promo' : 'shoot', first.scriptId)
        if (day.day === 'promo') day.day = workPlanId('promo', first.scriptId)
      }
    }
    if (!loaded.flags) loaded.flags = {}
    loaded.favor = { ...emptyFavor(), ...loaded.favor }
    loaded.met = { ...emptyMet(), ...loaded.met }
    if (!loaded.flags.windowsStretched) {
      stretchBookingWindows(loaded)
      loaded.flags.windowsStretched = true
    }
    if (!loaded.flags.copyRewriteV1) {
      refreshSavedStory(loaded)
      loaded.flags.copyRewriteV1 = true
    }
    if (!loaded.flags.storyVnV1) {
      refreshSavedStory(loaded)
      loaded.flags.storyVnV1 = true
    }
    if (loaded.phase === 'ended') {
      const turn = yearTurnEvent(loaded.week)
      if (turn) loaded.event = turn
    }
    return loaded
  } catch {
    return null
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY)
}

export function titleState(): GameState {
  return { ...createState('林澄', IDENTITIES[0].id), phase: 'title', event: null }
}
