import { buzzComments, pickBuzzScript } from './buzz'
import { calendarPlaza } from './calendar'
import { gossipPlaza } from './gossip'
import { ROLE_FAME } from './rank'
import { scriptById } from './scripts'
import type { GameState } from './types'

export type PhoneComment = {
  user: string
  text: string
}

export function fanText(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  return String(n)
}

function mulberry(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function take<T>(rng: () => number, pool: T[], n: number): T[] {
  const copy = [...pool]
  const out: T[] = []
  while (copy.length && out.length < n) {
    const i = Math.floor(rng() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}

export function phoneComments(state: GameState): PhoneComment[] {
  const name = state.name
  const pool: PhoneComment[] = []
  const booking = state.bookings?.[0]
  const script = booking ? scriptById(booking.scriptId) : undefined
  const lastWork = state.finishedScripts.length
    ? scriptById(state.finishedScripts[state.finishedScripts.length - 1])
    : undefined

  if (state.fans < 200) {
    pool.push(
      { user: '高中同学', text: `${name}？你真的不考研了？` },
      { user: '合租群', text: '今晚谁洗碗。别已读不回。' },
    )
  }

  if (state.identity === 'rich') {
    pool.push(
      { user: '路过的', text: '又一个买热搜的。家里有矿是吧。' },
      { user: '匿名', text: '资源这么好，先看看演得怎么样。' },
    )
  }

  if (state.identity === 'film' && state.fans < 5000) {
    pool.push(
      { user: '对门', text: '走廊里听你对词听到两点。你还活着吗。' },
      { user: '同学', text: '毕业作品谁看过谁知道。别灰心。' },
    )
  }

  if (state.news?.kind === 'trade') {
    pool.push({ user: '行业帖', text: state.news.text })
  }
  if (state.news?.kind === 'gossip') {
    pool.push({ user: '营销号', text: state.news.text })
  }
  if (state.news?.kind === 'award' || state.news?.kind === 'fashion') {
    pool.push({ user: '直播切片', text: state.news.text })
  }

  pool.push(...calendarPlaza(state))
  pool.push(...gossipPlaza(state))

  const buzz = pickBuzzScript(state)
  if (buzz?.press.length) {
    pool.push({ user: '行业帖', text: buzz.press[state.week % buzz.press.length] })
  }

  if (state.hotSearch) {
    if (state.hotSearch.tone === 'bad') {
      pool.push(
        { user: '热搜进来的', text: state.hotSearch.text },
        { user: '路人甲', text: '我是来看热闹的。' },
      )
    } else if (state.hotSearch.tone === 'mixed') {
      pool.push(
        { user: '截图的人', text: state.hotSearch.text },
        { user: '路人', text: '官宣了？先看看她能不能演。' },
      )
    } else {
      pool.push({ user: '刚搜到', text: `原来${name}是这个。` })
    }
  }

  if (script) {
    pool.push(...buzzComments(script, name, 'cast'))
  } else if (lastWork) {
    pool.push(...buzzComments(lastWork, name, 'done'))
  }

  if (state.awards?.length) {
    const last = state.awards[state.awards.length - 1]
    pool.push({ user: '影评号', text: `${last.name}有她。先看最后名单。` })
  }

  if (state.fans >= 800 && state.fans < 20000) {
    pool.push(
      { user: '刚关注', text: '脸可以。有戏吗。' },
      { user: '匿名', text: '经纪人是谁啊，通告好少。' },
    )
  }

  if (state.fans >= 20000) {
    pool.push(
      { user: '粉', text: '今天也在。你有空回一条吗。' },
      { user: '骂的人', text: '红了就开始摆。' },
    )
  }

  if (state.met.xuning) {
    pool.push({ user: '宁宁的粉', text: '别蹭。许宁才是这部的。' })
  }
  if (state.met.ruanqing) {
    pool.push({ user: '路过的', text: '同组那个阮清倒是肯帮人。' })
  }
  if (state.hotSearch?.tone === 'bad') {
    pool.push({ user: '路人', text: '最近怎么总刷到她的负面？' })
  }

  if (pool.length === 0) return []

  const rng = mulberry((state.week * 131 + state.weekday * 17 + state.fans) >>> 0)
  const weight = script ? ROLE_FAME[script.roleTier] : lastWork ? ROLE_FAME[lastWork.roleTier] : 1
  const cap = Math.min(pool.length, state.fans < 120 ? 2 : Math.min(8, Math.round(3 + weight * 2)))
  return take(rng, pool, cap)
}
