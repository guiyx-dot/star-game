import { CODEX_TAPES } from './gossip'
import { houseRank } from './catalog'
import { careerRung, ROLE_ORDER, type RoleTier } from './rank'
import { SCRIPTS, scriptById } from './scripts'
import { NPC_NAME, TOTAL_YEARS, YEAR_WEEKS, type GameState, type NpcId } from './types'

export const CODEX_KEY = 'star-game-codex-v1'

export type AchievementGroup = 'main' | 'other'

export type AchievementDef = {
  id: string
  name: string
  hint: string
  group: AchievementGroup
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'company', name: '去公司', hint: '第一次进影视公司。', group: 'main' },
  { id: 'contract', name: '第一份合同', hint: '签下一部戏。', group: 'main' },
  { id: 'wrap1', name: '第一次杀青', hint: '拍完并跑完宣传。', group: 'main' },
  { id: 'works5', name: '履历五部', hint: '作品满五部。', group: 'main' },
  { id: 'works10', name: '履历十部', hint: '作品满十部。', group: 'main' },
  { id: 'works15', name: '履历十五部', hint: '作品满十五部。', group: 'main' },
  { id: 'second', name: '女二杀青', hint: '以女二拍完一部。', group: 'main' },
  { id: 'lead', name: '女主杀青', hint: '以女主拍完一部。', group: 'main' },
  { id: 'grade-s', name: 'S 级杀青', hint: '拍完一部 S 级。', group: 'main' },
  { id: 'award-work', name: '冲奖本', hint: '一部冲奖本进履历。', group: 'main' },
  { id: 'shenzhao', name: '沈照的组', hint: '进过沈照的组，或在片场见过他。', group: 'main' },
  { id: 'rung-third', name: '小有名气', hint: '称呼到小有名气。', group: 'main' },
  { id: 'rung-second', name: '崭露头角', hint: '称呼到崭露头角。', group: 'main' },
  { id: 'rung-lead', name: '一线', hint: '拍完女主本，或认可和粉都够。', group: 'main' },
  { id: 'rung-head', name: '头牌', hint: '认可 ≥90，粉 ≥80 万。', group: 'main' },
  { id: 'rung-icon', name: '常青', hint: '认可 ≥110，粉 ≥200 万。', group: 'main' },
  { id: 'rung-legend', name: '殿堂', hint: '认可 ≥140，粉 ≥500 万。', group: 'main' },
  { id: 'live', name: '开过直播', hint: '白天开过一次播。', group: 'main' },
  { id: 'fans60k', name: '粉到六万', hint: '《隐尘》上桌的那条线。', group: 'main' },
  { id: 'broker', name: '周衡特供', hint: '好感够了，她塞来两份本。', group: 'main' },
  { id: 'meet-liangshi', name: '见过梁时', hint: '片场或约会。', group: 'main' },
  { id: 'meet-guyan', name: '见过顾宴川', hint: '饭局或片场。', group: 'main' },
  { id: 'award-season', name: '颁奖季有你的本', hint: '典礼周时冲奖本够资格。不看提名骰。', group: 'main' },
  { id: 'attended', name: '出席典礼', hint: '入围到场，或够资格去坐后排。', group: 'main' },
  { id: 'house', name: '自己的房子', hint: '住进开间以上，或收下别人给的钥匙。', group: 'main' },
  { id: 'carpet', name: '自己的礼裙', hint: '衣橱里有红毯那件。', group: 'main' },
  { id: 'acting155', name: '演技一百五十五', hint: '表演课接到《隐尘》的线。', group: 'main' },
  { id: 'contract-window', name: '合同窗口', hint: '第二年留下或走，说清了。', group: 'main' },
  { id: 'studio-call', name: '工作室', hint: '挂牌或把章程推回去。', group: 'main' },
  { id: 'year3', name: '第三年', hint: '日历翻过两年。', group: 'main' },
  { id: 'quality100', name: '一部满分', hint: '有一部戏质量到 100。', group: 'main' },
  { id: 'closed', name: '合上抽屉', hint: '打完三年。', group: 'main' },
  { id: 'college-end', name: '大学生走完三年', hint: '换这条身份重开。', group: 'other' },
  { id: 'rich-end', name: '富二代走完三年', hint: '换这条身份重开。', group: 'other' },
  { id: 'unnamed', name: '《未命名》', hint: '第一年把演技练到能进沈照那部书店。', group: 'other' },
  { id: 'painted', name: '《扮相》', hint: '才艺和演技都过，真唱那部。', group: 'other' },
  { id: 'named-song', name: '以自己的名字发过歌', hint: '唱片公司那条线，独唱有名字。', group: 'other' },
  { id: 'left-end', name: '解约后走完三年', hint: '合同窗口选走，自己扛完。', group: 'other' },
]

export const CODEX_PEOPLE: NpcId[] = [
  'zhouheng',
  'liangshi',
  'guyan',
  'shenzhao',
  'xuning',
  'ruanqing',
  'songwan',
  'peiyu',
  'hanchi',
]

export const TAPE_LABEL: Record<string, string> = {
  lines: '词',
  wait: '候场',
  hog: '一条八遍',
  nameless: '没名字',
  toast: '敬酒',
  wig: '假发',
  lunch: '盒饭',
  again: '再来一条',
  cut: '被剪',
  bg: '背景',
  latepal: '晚到',
  friend: '同组',
}

export type CodexScript = {
  title: string
  role: string
  director: string
  week: number
}

export type CodexTrophy = {
  id: string
  name: string
  org: string
  scriptId?: string
  title?: string
  week: number
}

export type Codex = {
  version: 1
  achievements: Record<string, { week: number }>
  scripts: Record<string, CodexScript>
  people: Record<string, true>
  tapes: Record<string, true>
  trophies: CodexTrophy[]
  ngPlusCount: number
}

function emptyCodex(): Codex {
  return {
    version: 1,
    achievements: {},
    scripts: {},
    people: {},
    tapes: {},
    trophies: [],
    ngPlusCount: 0,
  }
}

export function loadCodex(): Codex {
  try {
    const raw = localStorage.getItem(CODEX_KEY)
    if (!raw) return emptyCodex()
    const data = JSON.parse(raw) as Codex
    if (data.version !== 1) return emptyCodex()
    return {
      ...emptyCodex(),
      ...data,
      achievements: data.achievements ?? {},
      scripts: data.scripts ?? {},
      people: data.people ?? {},
      tapes: data.tapes ?? {},
      trophies: data.trophies ?? [],
      ngPlusCount: data.ngPlusCount ?? 0,
    }
  } catch {
    return emptyCodex()
  }
}

export function saveCodex(codex: Codex) {
  localStorage.setItem(CODEX_KEY, JSON.stringify(codex))
}

export function clearCodex() {
  localStorage.removeItem(CODEX_KEY)
}

function rungAtLeast(state: GameState, tier: RoleTier): boolean {
  return ROLE_ORDER.indexOf(careerRung(state).role) >= ROLE_ORDER.indexOf(tier)
}

function threeYearsOver(state: GameState): boolean {
  return state.phase === 'ended' && state.week > YEAR_WEEKS * TOTAL_YEARS
}

function workScripts(state: GameState) {
  return (state.workLog ?? [])
    .map((w) => scriptById(w.scriptId))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
}

export function achievementHolds(state: GameState, id: string): boolean {
  const works = workScripts(state)
  switch (id) {
    case 'company':
      return Boolean(state.met.zhouheng)
    case 'contract':
      return works.length > 0 || (state.bookings?.length ?? 0) > 0 || (state.finishedScripts?.length ?? 0) > 0
    case 'wrap1':
      return works.length >= 1
    case 'works5':
      return works.length >= 5
    case 'works10':
      return works.length >= 10
    case 'works15':
      return works.length >= 15
    case 'second':
      return works.some((s) => s.roleTier === 'second')
    case 'lead':
      return works.some((s) => s.roleTier === 'lead')
    case 'grade-s':
      return works.some((s) => s.grade === 'S')
    case 'award-work':
      return works.some((s) => s.awardTrack)
    case 'shenzhao':
      return Boolean(state.met.shenzhao) || works.some((s) => s.director === '沈照')
    case 'rung-third':
      return rungAtLeast(state, 'third')
    case 'rung-second':
      return rungAtLeast(state, 'second')
    case 'rung-lead':
      return rungAtLeast(state, 'lead')
    case 'rung-head':
      return rungAtLeast(state, 'headliner')
    case 'rung-icon':
      return rungAtLeast(state, 'icon')
    case 'rung-legend':
      return rungAtLeast(state, 'legend')
    case 'live':
      return Boolean(state.flags.didLive) || state.log.some((line) => line.text.startsWith('直播结束'))
    case 'fans60k':
      return state.fans >= 60000
    case 'broker':
      return Boolean(state.flags.brokerSpecial)
    case 'meet-liangshi':
      return Boolean(state.met.liangshi)
    case 'meet-guyan':
      return Boolean(state.met.guyan)
    case 'award-season':
      return Object.keys(state.flags).some((k) => k.startsWith('cerEligible:'))
    case 'attended':
      return Object.keys(state.flags).some((k) => k.startsWith('cerDone:') || k.startsWith('cerSit:'))
    case 'house':
      return houseRank(state.houseId) >= 1
    case 'carpet':
      return state.items.some((o) => o.itemId.startsWith('carpet'))
    case 'acting155':
      return state.attrs.acting >= 155
    case 'contract-window':
      return Boolean(state.flags.y2contract)
    case 'studio-call':
      return Boolean(state.flags.y2studio)
    case 'year3':
      return state.week > YEAR_WEEKS * 2
    case 'quality100':
      return (state.workLog ?? []).some((w) => w.quality >= 100)
    case 'closed':
      return threeYearsOver(state)
    case 'college-end':
      return state.identity === 'college' && threeYearsOver(state)
    case 'rich-end':
      return state.identity === 'rich' && threeYearsOver(state)
    case 'unnamed':
      return works.some((s) => s.id === 'unnamed')
    case 'painted':
      return works.some((s) => s.id === 'painted')
    case 'named-song':
      return works.some((s) => s.track === 'music' && s.roleTier === 'second')
    case 'left-end':
      return Boolean(state.flags.leftAgency) && threeYearsOver(state)
    default:
      return false
  }
}

export function syncCodex(state: GameState): string[] {
  const codex = loadCodex()
  const fresh: string[] = []

  for (const work of state.workLog ?? []) {
    const script = scriptById(work.scriptId)
    if (!script || codex.scripts[script.id]) continue
    codex.scripts[script.id] = {
      title: script.title,
      role: script.role,
      director: script.director,
      week: work.week,
    }
  }

  for (const id of CODEX_PEOPLE) {
    if (state.met[id]) codex.people[id] = true
  }

  for (const id of CODEX_TAPES) {
    if (state.flags[`tip:${id}`]) codex.tapes[id] = true
  }

  for (const award of state.awards ?? []) {
    if (codex.trophies.some((t) => t.id === award.id)) continue
    const work = award.scriptId ? scriptById(award.scriptId) : undefined
    codex.trophies.push({
      id: award.id,
      name: award.name,
      org: award.org,
      scriptId: award.scriptId,
      title: work?.title,
      week: award.week,
    })
  }

  for (const def of ACHIEVEMENTS) {
    if (codex.achievements[def.id]) continue
    if (!achievementHolds(state, def.id)) continue
    codex.achievements[def.id] = { week: state.week }
    fresh.push(def.name)
  }

  saveCodex(codex)
  return fresh
}

export function bumpNgPlus() {
  const codex = loadCodex()
  codex.ngPlusCount += 1
  saveCodex(codex)
}

export function achievementStats(codex = loadCodex()) {
  const total = ACHIEVEMENTS.length
  const got = ACHIEVEMENTS.filter((a) => codex.achievements[a.id]).length
  const main = ACHIEVEMENTS.filter((a) => a.group === 'main')
  const other = ACHIEVEMENTS.filter((a) => a.group === 'other')
  return {
    total,
    got,
    mainGot: main.filter((a) => codex.achievements[a.id]).length,
    mainTotal: main.length,
    otherGot: other.filter((a) => codex.achievements[a.id]).length,
    otherTotal: other.length,
    scriptsGot: Object.keys(codex.scripts).length,
    scriptsTotal: SCRIPTS.length,
  }
}

export { NPC_NAME, CODEX_TAPES }
