import { SCRIPTS, rumorLine, roleLine, type ScriptDef } from './scripts'
import { playYear, type GameState, type NewsFlash } from './types'

export function rumorFor(script: ScriptDef, week = 1): NewsFlash {
  return {
    text: rumorLine(script, week),
    tone: script.hype === 'ip' ? 'mixed' : script.hype === 'award' ? 'good' : 'mixed',
    kind: 'trade',
  }
}

const ANNOUNCE: Record<string, (name: string) => string> = {
  starriver: (n) => `${n} 确认《星河渡》女二。原著里那个把感情押在上神身上的人。`,
  unnamed: (n) => `${n} 进组沈照《未命名》。书店店员，几乎没有对白。`,
  northstation: (n) => `${n} 进组《北站》。春运广播那间屋子。`,
  snowcourt: (n) => `${n} 出演《庭前雪》小郡主。宴席上那张脸。`,
  summer: (n) => `${n} 官宣《盛夏未完》女二林夏。音乐学院那场。`,
  uncle: (n) => `${n} 进组《我的二舅爷》。黄三珍，不是女主。`,
  glassroom: (n) => `${n} 进组沈照短片《隔间》。`,
  sidecast: (n) => `${n} 客串《星河渡》宴席一眼。`,
  cpheat: (n) => `${n} 官宣《对手戏》女二。男二是梁时。`,
  lovevar: (n) => `${n} 进《心动观察》。和梁时一组。`,
  goldseat: (n) => `${n} 出演《金座》女三。滨江夜宴那席。`,
  sweet: (n) => `${n} 出演《请你偏爱》女三。宴会上被退婚那场。`,
  intern: (n) => `${n} 进组《白大褂》。急诊走廊里的陈慈。`,
  whitenoise: (n) => `${n} 进组《白噪音》。心理门诊前台。`,
  peppercourt: (n) => `${n} 确认《椒房春》蕙嫔。后宫女二。`,
  redcase: (n) => `${n} 确认《赤焰案》梁郡主。`,
  dust: (n) => `${n} 进组沈照《隐尘》。女主。冲奖向。`,
  youngbook: (n) => `${n} 进组《少年书》女二。`,
  northwind: (n) => `${n} 出演《风过北河》律师。`,
  returner: (n) => `${n} 确认《故人归》女主。大 IP。`,
  weiyang: (n) => `${n} 确认《未央辞》女主。`,
  shore: (n) => `${n} 进组沈照《岸边》。女主。冲影后向。`,
  ninegates: (n) => `${n} 确认《九重门》女主。`,
  'people-sea': (n) => `${n} 出演《人海》周蓉。`,
  sister: (n) => `${n} 进组《她的小孩》女主。`,
  brocade: (n) => `${n} 确认《锦衣夜》盛宜。宅门女二。`,
  longnight: (n) => `${n} 进组《长夜未明》。询问室里那个不说话的人。`,
  counter: (n) => `${n} 进组《柜台》女二。药房那场。`,
  nightward: (n) => `${n} 进组《白夜班》。外科值班。`,
  painted: (n) => `${n} 进组沈照《扮相》。女主。冲影后向。`,
  cipher: (n) => `${n} 确认《密信》女主。一张脸两套话。`,
  citylamp: (n) => `${n} 确认《城中灯》女主。`,
}

export function announceFor(name: string, script: ScriptDef): NewsFlash {
  const custom = ANNOUNCE[script.id]
  const text = custom ? custom(name) : fallbackAnnounce(name, script)
  const tone: NewsFlash['tone'] =
    script.hype === 'ip' || script.roleTier === 'second' || script.roleTier === 'lead' || script.roleTier === 'third'
      ? 'mixed'
      : 'good'
  return { text, tone, kind: 'hot' }
}

function fallbackAnnounce(name: string, script: ScriptDef): string {
  const role = roleLine(script)
  if (script.hype === 'ip') return `${name} 确认《${script.title}》${role}`
  if (script.roleTier === 'second' || script.roleTier === 'lead') return `${name} 官宣《${script.title}》${role}`
  if (script.hype === 'award' || script.grade === 'S') return `${name} 进组《${script.title}》`
  if (script.roleTier === 'third') return `${name} 出演《${script.title}》女三`
  return `${name} 进组《${script.title}》`
}

const WRAP: Record<string, (name: string) => string> = {
  starriver: (n) => `${n} 《星河渡》收官。女二那句还在被剪，原著粉和路人还没吵完。`,
  unnamed: (n) => `${n} 《未命名》获点名。影评说书店那场不用哭。`,
  northstation: (n) => `${n} 《北站》预告出了广播。有人听完说像回家。`,
  snowcourt: (n) => `${n} 《庭前雪》收官。小郡主敬酒那场还在被讨论。`,
  summer: (n) => `${n} 《盛夏未完》收官。女二林夏加练那段有人反复看。`,
  sweet: (n) => `${n} 《请你偏爱》收官。摘戒指那一下还在转。`,
  goldseat: (n) => `${n} 《金座》收官。夜宴那席有人说像真的。`,
  intern: (n) => `${n} 《白大褂》收官。走廊里那个实习医生有人问名字。`,
  cpheat: (n) => `${n} 《对手戏》收官，还在被讨论。切片先于正片到的那对本。`,
  peppercourt: (n) => `${n} 《椒房春》收官。蕙嫔那场还在被讨论。`,
  redcase: (n) => `${n} 《赤焰案》收官。郡主拒婚词有人反复看。`,
  dust: (n) => `${n} 《隐尘》获点名。影评说做饭那场不用哭。`,
  youngbook: (n) => `${n} 《少年书》收官。女二那场还在被剪。`,
  northwind: (n) => `${n} 《风过北河》收官。律师那场有人说像真的。`,
  returner: (n) => `${n} 《故人归》收官。女主重逢那场还在吵。`,
  weiyang: (n) => `${n} 《未央辞》收官。女主那十年还在被剪。`,
  shore: (n) => `${n} 《岸边》获点名。海边那场有人说能进女主。`,
  ninegates: (n) => `${n} 《九重门》收官。原著粉还没吵完。`,
  'people-sea': (n) => `${n} 《人海》收官。周蓉那三十年有人反复看。`,
  sister: (n) => `${n} 《她的小孩》获点名。医院那场不用哭。`,
  brocade: (n) => `${n} 《锦衣夜》收官。分家那场还在被讨论。`,
  longnight: (n) => `${n} 《长夜未明》获点名。询问室那场有人说像真的。`,
  counter: (n) => `${n} 《柜台》获点名。递药那场不用哭。`,
  painted: (n) => `${n} 《扮相》获点名。唱段那场有人说能进女主。`,
  cipher: (n) => `${n} 《密信》获点名。端茶那场还在被剪。`,
}

export function wrapNewsFor(name: string, script: ScriptDef, score: number, violated: boolean): NewsFlash | null {
  if (violated) return null
  const custom = WRAP[script.id]
  if (script.awardTrack && score >= 165) {
    return { text: custom ? custom(name) : `${name} 《${script.title}》获好评`, tone: 'good', kind: 'hot' }
  }
  if (custom && (script.hype === 'ip' || script.roleTier === 'second' || script.roleTier === 'lead' || script.grade === 'A' || script.grade === 'S')) {
    return { text: custom(name), tone: 'mixed', kind: 'hot' }
  }
  if (script.hype === 'ip' || script.roleTier === 'second' || script.roleTier === 'lead') {
    return { text: `${name} 《${script.title}》收官，还在被讨论`, tone: 'mixed', kind: 'hot' }
  }
  if (score >= 140) {
    return { text: `${name} 《${script.title}》获好评`, tone: 'good', kind: 'hot' }
  }
  return null
}

export function pickBuzzScript(state: GameState): ScriptDef | null {
  const finished = new Set(state.finishedScripts)
  const booked = new Set((state.bookings ?? []).map((b) => b.scriptId))
  const year = playYear(state.week)
  const pool = SCRIPTS.filter(
    (s) =>
      (s.fromYear ?? 1) <= year &&
      (s.press.length > 0 || s.hype === 'ip' || s.hype === 'award' || s.grade === 'A' || s.grade === 'S' || s.roleTier === 'second') &&
      !finished.has(s.id) &&
      !booked.has(s.id),
  )
  if (!pool.length) return null
  const fortnight = Math.floor((state.week - 1) / 2)
  return pool[(state.offerSeed + fortnight * 17) % pool.length]
}

export function shouldAnnounce(script: ScriptDef): boolean {
  return (
    script.hype === 'ip' ||
    script.hype === 'award' ||
    script.grade === 'S' ||
    script.roleTier === 'second' ||
    script.roleTier === 'lead' ||
    script.roleTier === 'third'
  )
}

const RUMOR_TALK: Record<string, { user: string; text: string }[]> = {
  starriver: [
    { user: '原著粉', text: '女二别瞎改。联姻、把命押上去，原著那样就那样。' },
    { user: '匿名', text: '资本要流量，裴衡要演技。看谁赢。' },
    { user: '行业帖', text: '上神渡劫、小仙入天界。女二是魔尊侧送来的人。' },
  ],
  unnamed: [
    { user: '影评号', text: '这种片子，配角也能进候选。书店那场不用哭。' },
    { user: '路人', text: '现在谁进电影院看退货上架。' },
  ],
  snowcourt: [
    { user: '原著粉', text: '小郡主不是花瓶。宴席上谁先落座，是戏。' },
    { user: '路透', text: '头面比人先出圈。成片为准？先信了。' },
  ],
  sweet: [
    { user: '切片账号', text: '就等摘戒指那一下。女三换了几轮了。' },
    { user: '路人', text: '不就是恶毒女三。先看她笑不笑得住。' },
  ],
  intern: [
    { user: '行业帖', text: '齐衡组。术语错一个，整条作废。' },
    { user: '路人', text: '医疗剧又来。走廊戏好看就行。' },
  ],
  peppercourt: [
    { user: '原著粉', text: '蕙嫔别演成泼。圣眷是负担。' },
    { user: '行业帖', text: '后宫、年家、更衣。白玉兰会看女二。' },
  ],
  redcase: [
    { user: '行业帖', text: '朝堂翻案。郡主挂帅、拒婚。不是联姻工具。' },
    { user: '原著粉', text: '别写成爱上男主就卸甲。' },
  ],
  dust: [
    { user: '影评号', text: '这种片子，女主也能进候选。院线不会多排。' },
    { user: '路人', text: '又是农村。先看她像不像在地里站过。' },
  ],
  shore: [
    { user: '影评号', text: '沈照女主。冲影后。冷、慢、卖座不一定。' },
  ],
  returner: [
    { user: '原著粉', text: '女主别瞎改。重逢是劫，不是甜。' },
    { user: '匿名', text: '和《星河渡》同一年，市场吃得下吗。' },
  ],
  brocade: [
    { user: '原著粉', text: '盛宜别演成作精。她是真的信规矩。' },
    { user: '行业帖', text: '宅门、女工、分家。白玉兰会不会看，看成片。' },
  ],
  longnight: [
    { user: '影评号', text: '询问室那场不用哭。女配也能进候选。' },
    { user: '路人', text: '又是小城案子。先看她像不像住过。' },
  ],
  counter: [
    { user: '影评号', text: '递药那场，评委会盯手。广场会先骂。' },
    { user: '行业帖', text: '片酬低，冲奖向。顾问组盯药名。' },
  ],
  painted: [
    { user: '影评号', text: '真唱。才艺过不了直接停。冲影后。' },
    { user: '路人', text: '戏曲片谁进电影院。' },
  ],
  cipher: [
    { user: '行业帖', text: '一张脸两套话。别演成两个角色。' },
  ],
  goldseat: [
    { user: '行业帖', text: '滨江夜宴。顾宴川投的，女三不是花瓶。' },
    { user: '匿名', text: '酒桌戏像真的，还是像通稿，播出才知道。' },
  ],
  cpheat: [
    { user: '切片账号', text: '需求会对吵那场会先火。男二是梁时。' },
    { user: '官配粉', text: '又发糖。女二别抢。' },
  ],
  summer: [
    { user: '路人', text: '音乐学院、室友、选秀。夏天看完会不会反复重播。' },
  ],
  uncle: [
    { user: '路人', text: '通水通路那种。像真的村子，不是土味短剧。' },
  ],
  sidecast: [
    { user: '原著粉', text: '《星河渡》宴席一眼。逐帧认人。' },
  ],
}

const CAST_TALK: Record<string, (name: string) => { user: string; text: string }[]> = {
  starriver: (n) => [
    { user: '粉籍', text: `女二是${n}？你们认真的。原著人设碰了三件不能碰的。` },
    { user: '原著粉', text: '脸可以。别演成恶毒女二就行。' },
    { user: '营销号', text: `${n} 官宣《星河渡》女二。截图转。` },
  ],
  unnamed: (n) => [
    { user: '影评号', text: `${n}进了沈照组。先别急着骂。` },
    { user: '路人', text: '书店店员。有名字吗。' },
  ],
  sweet: (n) => [
    { user: '切片账号', text: `${n}演被退婚的那个。就等宴会那场。` },
  ],
  cpheat: (n) => [
    { user: '切片账号', text: `${n}和梁时。需求会那场先剪。` },
    { user: '黑', text: '又一个没试镜就进组的？' },
  ],
  intern: (n) => [
    { user: '行业帖', text: `${n}演陈慈。走廊里被喊去推床的那个。` },
  ],
}

const DONE_TALK: Record<string, (name: string) => { user: string; text: string }[]> = {
  starriver: (n) => [
    { user: '看过的', text: `${n}那个女二，爱得难看，但能看懂她在换什么。` },
    { user: '原著粉', text: '还行。没有写成工具人。' },
    { user: '黑', text: '抢女主戏。典型。' },
  ],
  unnamed: (n) => [
    { user: '影评号', text: `颁奖季会不会提${n}，现在说还早。书店那场有人反复看。` },
  ],
  sweet: (n) => [
    { user: '切片账号', text: `摘戒指那一下。有人问是不是${n}。` },
  ],
  summer: (n) => [
    { user: '粉', text: `林夏加练那段我反复看。是${n}。` },
  ],
  intern: (n) => [
    { user: '看过的', text: `走廊里那个实习医生，是${n}。术语没念错。` },
  ],
  goldseat: (n) => [
    { user: '看过的', text: `夜宴那席把话挡回去的人，是${n}。` },
  ],
}

export function buzzComments(script: ScriptDef, name: string, phase: 'rumor' | 'cast' | 'done'): { user: string; text: string }[] {
  const role = roleLine(script)
  if (phase === 'rumor') {
    const rows = [
      { user: '行业帖', text: rumorLine(script) },
      { user: '路透', text: `${script.director}那边看了不少人。` },
    ]
    rows.push(...(RUMOR_TALK[script.id] ?? []))
    if (script.hype === 'ip' && !RUMOR_TALK[script.id]) {
      rows.push(
        { user: '原著粉', text: '女二别瞎改。原著那样就那样。' },
        { user: '匿名', text: '资本要流量，导演要演技。看谁赢。' },
      )
    }
    if (script.awardTrack && !RUMOR_TALK[script.id]) {
      rows.push({ user: '影评号', text: '这种片子，配角也能进候选。' })
    }
    return rows
  }
  if (phase === 'cast') {
    const rows = [
      { user: '刚搜到', text: `${name}？《${script.title}》是她？` },
      { user: '路人', text: `${role}而已。先看看。` },
    ]
    rows.push(...(CAST_TALK[script.id]?.(name) ?? []))
    if (!CAST_TALK[script.id] && (script.roleTier === 'second' || script.roleTier === 'lead')) {
      rows.push(
        { user: '粉籍', text: `女二是${name}？你们认真的。` },
        { user: '营销号', text: `${name} 官宣了。截图转。` },
        { user: '黑', text: '又一个没试镜就进组的？' },
      )
    }
    if (script.roleTier === 'support' || script.roleTier === 'cameo') {
      rows.push({ user: '切片账号', text: '配角。路透里站边上那个。' })
    }
    return rows
  }
  const rows = [
    { user: '看过的', text: `《${script.title}》那个${script.roleName}，是${name}。` },
    { user: '切片账号', text: '剪了一段。有人问名字。' },
  ]
  rows.push(...(DONE_TALK[script.id]?.(name) ?? []))
  if (!DONE_TALK[script.id] && (script.roleTier === 'second' || script.roleTier === 'lead')) {
    rows.push(
      { user: '粉', text: `${role}这段我反复看。` },
      { user: '黑', text: '抢女主戏。典型。' },
      { user: '路人', text: `我是冲${role}进来的。` },
    )
  }
  if (script.awardTrack && !DONE_TALK[script.id]) {
    rows.push({ user: '影评号', text: '颁奖季会不会提她，现在说还早。' })
  }
  return rows
}
