import { STAR } from './circle'
import { scriptById } from './scripts'
import { storyEvent } from './story'
import { YEAR_WEEKS, TOTAL_YEARS, playYear, weekInYear, type CeremonyDue, type GameEvent, type GameState, type NewsFlash } from './types'

export type SeasonKind = 'film-award' | 'tv-award' | 'fashion'

export type SeasonEvent = {
  id: string
  month: number
  kind: SeasonKind
  name: string
  org: string
  awardName: string
  rival: string
  headline: string
}

const CAL_START = new Date(2026, 0, 2)

function mondayOf(week: number): Date {
  const d = new Date(CAL_START)
  d.setDate(d.getDate() + (week - 1) * 7)
  return d
}

export function weekMonth(week: number): number {
  return mondayOf(week).getMonth() + 1
}

export function firstWeekOfMonth(month: number): number {
  for (let w = 1; w <= YEAR_WEEKS; w++) {
    if (weekMonth(w) === month) return w
  }
  return YEAR_WEEKS
}

export function seasonYear(week: number): number {
  if (week <= YEAR_WEEKS) return 1
  return Math.ceil(week / YEAR_WEEKS)
}

export const SEASONS: SeasonEvent[] = [
  {
    id: 'asia',
    month: 3,
    kind: 'film-award',
    name: '亚洲电影大奖',
    org: '电影',
    awardName: '最佳女配角',
    rival: STAR.chenwanqiu,
    headline: '亚洲电影大奖揭晓',
  },
  {
    id: 'chinafw',
    month: 5,
    kind: 'fashion',
    name: '中国国际时装周',
    org: '北京 · 春夏',
    awardName: '',
    rival: STAR.guciwan,
    headline: '中国国际时装周 春夏场',
  },
  {
    id: 'magnolia',
    month: 6,
    kind: 'tv-award',
    name: '白玉兰奖',
    org: '电视剧',
    awardName: '最佳女配角',
    rival: STAR.songzhixia,
    headline: '白玉兰奖揭晓',
  },
  {
    id: 'osmanthus',
    month: 9,
    kind: 'film-award',
    name: '金桂奖',
    org: '电影',
    awardName: '最佳女配角',
    rival: STAR.jiangwanning,
    headline: '金桂奖揭晓',
  },
  {
    id: 'shfw',
    month: 10,
    kind: 'fashion',
    name: '上海时装周',
    org: '上海 · 秋冬',
    awardName: '',
    rival: STAR.guciwan,
    headline: '上海时装周 秋冬场',
  },
  {
    id: 'gala',
    month: 12,
    kind: 'tv-award',
    name: '国剧盛典',
    org: '电视剧',
    awardName: '年度女演员',
    rival: STAR.baishuying,
    headline: '国剧盛典揭晓',
  },
]

export function seasonById(id: string): SeasonEvent | undefined {
  return SEASONS.find((s) => s.id === id)
}

export function seasonForWeek(week: number): SeasonEvent | undefined {
  if (week < 1 || week > YEAR_WEEKS * TOTAL_YEARS) return undefined
  const w = weekInYear(week)
  return SEASONS.find((s) => firstWeekOfMonth(s.month) === w)
}

export function seasonStatus(week: number, ev: SeasonEvent): 'done' | 'now' | 'soon' {
  const w = firstWeekOfMonth(ev.month)
  const cur = weekInYear(week)
  if (cur > w) return 'done'
  if (cur === w) return 'now'
  return 'soon'
}

export function seasonAwardName(ev: SeasonEvent, week: number, roleIsLead: boolean): string {
  if (ev.kind === 'fashion') return ev.awardName
  if (playYear(week) >= 3 && roleIsLead) {
    if (ev.kind === 'film-award') return '最佳女主角'
    if (ev.id === 'gala') return '年度女演员'
    return '最佳女主角'
  }
  return ev.awardName
}

function calKey(week: number, id: string): string {
  return `cal:${id}:${seasonYear(week)}`
}

function workWonSeason(state: GameState, scriptId: string, seasonId: string): boolean {
  return (state.awards ?? []).some((a) => a.scriptId === scriptId && a.id === `win:${seasonId}:${scriptId}`)
}

function bestAwardWork(state: GameState, ev: SeasonEvent) {
  const works = (state.workLog ?? []).filter((w) => {
    const s = scriptById(w.scriptId)
    if (!s?.awardTrack) return false
    if (workWonSeason(state, w.scriptId, ev.id)) return false
    if (ev.kind === 'film-award') return /电影|微电影/.test(s.type)
    if (ev.kind === 'tv-award') return /剧/.test(s.type) && !/电影/.test(s.type)
    return false
  })
  return works.slice().sort((a, b) => b.score - a.score)[0] ?? null
}

function evaluateNomination(state: GameState, ev: SeasonEvent): CeremonyDue {
  const work = bestAwardWork(state, ev)
  const base: CeremonyDue = {
    seasonId: ev.id,
    week: state.week,
    nominated: false,
    win: false,
    rival: ev.rival,
    awardName: ev.awardName,
    org: ev.org,
    name: ev.name,
  }
  if (ev.kind === 'fashion' || !ev.awardName) return base
  if (!work) return base
  const script = scriptById(work.scriptId)
  if (!script) return base
  const year = playYear(state.week)
  const leadWork = script.roleTier === 'lead'
  const awardName = seasonAwardName(ev, state.week, leadWork)
  const named = { ...base, awardName, scriptId: work.scriptId }
  const acting = state.attrs.acting
  const actingBar = year >= 3 && leadWork ? 148 : year >= 2 ? 122 : 108
  const scoreBar = year >= 3 && leadWork ? 260 : 210
  const recBar = year >= 3 ? 40 : 22
  const fansBar = year >= 3 ? 40000 : 8000
  const eligible =
    work.quality >= 82 &&
    work.score >= scoreBar &&
    acting >= actingBar &&
    state.recognition >= recBar &&
    state.fans >= fansBar
  if (!eligible) return named
  const seed = ((state.offerSeed + state.week * 997 + ev.id.length * 13) >>> 0) % 100
  const nomActing = year >= 3 && leadWork ? 155 : year >= 2 ? 132 : 122
  const nomChance = work.quality >= 90 && acting >= nomActing && state.recognition >= (year >= 3 ? 48 : 32) ? 72 : 48
  const nominated = seed < nomChance
  if (!nominated) return named
  const winActing = year >= 3 && leadWork ? 152 : year >= 2 ? 128 : 118
  const winBar = work.quality >= 88 && acting >= winActing && state.recognition >= (year >= 3 ? 48 : 28)
  const winSeed = ((state.offerSeed + state.week * 131 + 7) >>> 0) % 100
  const winChance = (year >= 3 && leadWork ? 4 : 6) + Math.min(10, Math.floor((work.quality - 88) / 2))
  const win = winBar && winSeed < winChance
  return { ...named, nominated: true, win }
}

function nomLines(state: GameState, ev: SeasonEvent, due: CeremonyDue): string[] {
  const others = [STAR.chenwanqiu, STAR.jiangwanning, STAR.baishuying].filter((n) => n !== ev.rival)
  if (ev.kind === 'fashion') {
    return [
      `${ev.name}开幕。`,
      `手机上一整天都是秀场照片。`,
      `${STAR.guciwan}因为临时换造型上了热搜。`,
      `${STAR.jiangwanning}第一次坐到品牌前排。`,
      state.met.zhouheng
        ? '周衡转来一张照片：「这套不错。不是让你买，先学着看。」'
        : '工作群里在讨论谁的团队借到了当季高定。',
    ]
  }
  const start = [
    `${ev.name}开始评选了。`,
    `入围名单今晚公布。`,
    `${ev.awardName}这一栏，圈里先传了三个名字。`,
    `${ev.rival}。`,
    `${others[0]}。`,
    `${others[1]}。`,
  ]
  if (!due.nominated) {
    return [
      ...start,
      '周衡把名单转给你。',
      '「你不在上面。」',
      '她顿了一下。',
      '「别人的典礼，看完就睡。别当成自己的作业。」',
    ]
  }
  const title = due.scriptId ? scriptById(due.scriptId)?.title : ''
  return [
    ...start,
    '周衡的电话比截图先到。',
    title ? `「《${title}》。你在候选人里。」` : '「你在候选人里。」',
    '「别高兴太早。入围只说明有人看见了。」',
    '「这周腾一天。礼服、座位、走红毯，都要到场。」',
    '「拿不拿奖另说。缺席，比落选更难看。」',
  ]
}

function fashionWatch(ev: SeasonEvent, state: GameState): GameEvent {
  return storyEvent(`cal-${ev.id}`, ev.name, nomLines(state, ev, evaluateNomination(state, ev)), [
    { id: 'watch', label: '看完' },
  ])
}

function nominationEvent(state: GameState, ev: SeasonEvent, due: CeremonyDue): GameEvent {
  return storyEvent(
    `cal-nom-${ev.id}`,
    ev.name,
    nomLines(state, ev, due),
    [{ id: 'ok', label: due.nominated ? '回去排行程' : '知道了' }],
  )
}

export function ceremonyPlayEvent(state: GameState, due: CeremonyDue): GameEvent {
  const carpet = state.items.some((o) => o.worn && (o.itemId.startsWith('carpet') || o.itemId === 'carpet-black'))
  const winLines = due.win
    ? [
        `信封打开。`,
        `「${due.awardName}，${state.name}。」`,
        '有人鼓掌，也有人在看旁边那一桌的表情。',
        '上台只有十几秒。麦克风有一点回声。',
        '你谢了剧组，谢了周衡。',
        '没有谢命运。',
      ]
    : [
        `信封打开。`,
        `「${due.awardName}，${due.rival}。」`,
        `${due.rival}起身时，裙摆扫过你这一排。`,
        '你跟着鼓掌。',
        '镜头没有在你脸上停太久。',
        '周衡在你耳边只说了一句：「坐住。」',
      ]
  return storyEvent(
    `ceremony-${due.seasonId}`,
    due.name,
    [
      '酒店门口已经围了人。',
      '你跟着周衡从侧门进去。',
      carpet ? '礼裙是自己的。闪光灯比想象中近。' : '借来的礼服肩带紧了一点。闪光灯比想象中近。',
      `${STAR.chenwanqiu}在你前面停了两次，把裙摆理好。`,
      `${STAR.jiangwanning}在你侧后方和摄影对了一下机位。`,
      '入席以后，主持人讲了很久感谢。',
      `${due.awardName}这一项轮到时，全场安静了两秒。`,
      ...winLines,
    ],
    [{ id: 'ok', label: '散场' }],
  )
}

function watchNews(ev: SeasonEvent, due: CeremonyDue, name: string): NewsFlash {
  if (ev.kind === 'fashion') {
    return { text: ev.headline, tone: 'mixed', kind: 'fashion' }
  }
  if (due.nominated) {
    return { text: `${ev.name}入围 ${name} ${ev.rival} ${STAR.baishuying}`, tone: 'mixed', kind: 'award' }
  }
  return { text: `${ev.name}入围 ${ev.rival} ${STAR.jiangwanning} ${STAR.baishuying}`, tone: 'mixed', kind: 'award' }
}

export function applyCalendarChoice(state: GameState, eventId: string): string {
  if (eventId.startsWith('cal-nom-')) {
    const ev = seasonById(eventId.slice(8))
    if (!ev) return ''
    const due = state.ceremonyDue
    if (due?.nominated) {
      state.news = watchNews(ev, due, state.name)
      return '周衡把典礼那天标红了。这周要空出一天。'
    }
    state.ceremonyDue = null
    state.news = watchNews(ev, due ?? evaluateNomination(state, ev), state.name)
    return ev.kind === 'fashion' ? '你存下了几张喜欢的造型。' : '你看完了名单，回去看自己的剧本。'
  }
  if (eventId.startsWith('cal-')) {
    const ev = seasonById(eventId.slice(4))
    if (!ev) return ''
    state.news = { text: ev.headline, tone: 'mixed', kind: ev.kind === 'fashion' ? 'fashion' : 'award' }
    return ev.kind === 'fashion' ? '你把手机放下，顺手重新搭了明天要穿的衣服。' : '颁奖礼还在继续。你关掉直播。'
  }
  return ''
}

export function applyCeremonyChoice(state: GameState): string {
  const due = state.ceremonyDue
  if (!due) return '典礼结束了。'
  state.flags[`cerDone:${due.seasonId}:${seasonYear(state.week)}`] = true
  if (due.win && due.scriptId) {
    if (!state.awards) state.awards = []
    const id = `win:${due.seasonId}:${due.scriptId}`
    if (!state.awards.some((a) => a.id === id)) {
      state.awards.push({
        id,
        name: due.awardName,
        org: due.name,
        week: state.week,
        scriptId: due.scriptId,
      })
    }
    state.fans += 2800
    state.recognition += 8
    state.news = {
      text: `${state.name} 获${due.name}${due.awardName}`,
      tone: 'good',
      kind: 'award',
    }
    state.hotSearch = { text: `${state.name} 获${due.name}${due.awardName}`, tone: 'good', daysLeft: 7 }
    state.ceremonyDue = null
    return '散场的时候，周衡只说：回去睡觉。明天还有通告。'
  }
  state.news = {
    text: `${due.rival} 获${due.name}${due.awardName}`,
    tone: 'mixed',
    kind: 'award',
  }
  state.ceremonyDue = null
  return `${due.rival}在台上谢词。你坐到礼成，跟周衡一起从侧门离开。`
}

export function maybeCalendar(state: GameState) {
  const ev = seasonForWeek(state.week)
  if (!ev) return
  const key = calKey(state.week, ev.id)
  if (state.flags[key]) return
  state.flags[key] = true
  if (ev.kind === 'fashion') {
    if (state.event) {
      if (!state.news) state.news = { text: ev.headline, tone: 'mixed', kind: 'fashion' }
      return
    }
    state.event = fashionWatch(ev, state)
    return
  }
  const due = evaluateNomination(state, ev)
  state.ceremonyDue = due.nominated ? due : { ...due, week: state.week }
  if (state.event) {
    if (!state.news) state.news = watchNews(ev, due, state.name)
    return
  }
  state.event = nominationEvent(state, ev, due)
}

export function ensureCeremonyPlan(state: GameState) {
  const due = state.ceremonyDue
  if (!due || !due.nominated || due.week !== state.week) return
  if (state.plan.some((d) => d.day?.startsWith('ceremony:'))) return
  const id = `ceremony:${due.seasonId}`
  const empty = state.plan.findIndex((d) => !d.day)
  if (empty >= 0) state.plan[empty].day = id
  else state.plan[5].day = id
}

export function parseCeremonyPlan(id: string): { seasonId: string } | null {
  if (!id.startsWith('ceremony:')) return null
  return { seasonId: id.slice(10) }
}

export function ceremonySlotName(id: string): string {
  const parsed = parseCeremonyPlan(id)
  if (!parsed) return ''
  const ev = seasonById(parsed.seasonId)
  return ev ? `出席${ev.name}` : '出席典礼'
}

export function missCeremonyIfNeeded(state: GameState): string {
  const due = state.ceremonyDue
  if (!due || !due.nominated) return ''
  if (due.week !== state.week - 1) return ''
  const key = `cerDone:${due.seasonId}:${seasonYear(due.week)}`
  if (state.flags[key]) return ''
  state.flags[key] = true
  state.ceremonyDue = null
  state.opinion -= 4
  if (state.met.zhouheng) {
    state.favor.zhouheng = Math.max(0, (state.favor.zhouheng ?? 0) - 6)
  }
  return '典礼那天你没有到场。周衡把你的名字从座位表上划掉了。'
}

export function afterRecap(state: GameState): GameState {
  const next = structuredClone(state)
  next.recapWeek = null
  maybeCalendar(next)
  return next
}

export function calendarPlaza(state: GameState): { user: string; text: string }[] {
  const ev = seasonForWeek(state.week)
  if (!ev) return []
  if (ev.kind === 'fashion') {
    return [
      { user: '买手', text: `${ev.name}。${STAR.guciwan}那套被转了。` },
      { user: '路人', text: `${STAR.jiangwanning}坐前排了？` },
    ]
  }
  return [
    { user: '直播切片', text: `${ev.name}。${ev.awardName}还没念。` },
    { user: '影评号', text: `${ev.rival}在名单上。` },
  ]
}
