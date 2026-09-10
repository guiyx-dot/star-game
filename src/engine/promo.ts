import type { ScriptDef } from './scripts'
import type { PromoKind } from './types'

export type { PromoKind }

export const PROMO_LABEL: Record<PromoKind, string> = {
  interview: '专访',
  live: '角色直播',
  roadshow: '路演',
  stills: '物料拍摄',
  fanmeet: '粉丝见面',
  radio: '电台连线',
  premiere: '点映',
}

function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  return h >>> 0
}

function poolFor(script: ScriptDef): PromoKind[] {
  const t = `${script.type}${script.tags.join('')}`
  if (script.track === 'music' || /音综|翻唱|单曲|剧宣曲/.test(t)) {
    return ['live', 'radio', 'interview', 'fanmeet']
  }
  if (script.track === 'variety' || /综|真人秀/.test(t)) {
    return ['live', 'interview', 'fanmeet', 'radio']
  }
  if (/广告/.test(t)) return ['stills', 'live', 'interview', 'radio']
  if (/电影/.test(t)) return ['premiere', 'interview', 'roadshow', 'stills', 'live']
  return ['interview', 'live', 'roadshow', 'stills', 'fanmeet']
}

export function buildPromoTasks(script: ScriptDef): PromoKind[] {
  const n = Math.max(0, script.promoNeed)
  const pool = poolFor(script)
  const start = hashId(script.id) % pool.length
  return Array.from({ length: n }, (_, i) => pool[(start + i) % pool.length])
}

export function promoLine(kind: PromoKind, title: string): string {
  if (kind === 'interview') return `你接受了《${title}》的杂志采访。记者问得比提纲细，有两个问题周衡在旁边及时打断了。`
  if (kind === 'live') return `你参加了《${title}》的角色直播。主持人负责控流程，你一边回答问题，一边看弹幕飞快刷过去。`
  if (kind === 'roadshow') return `你跟着《${title}》跑了一场路演。映后有观众认真问了角色，也有人只顾着举手机拍你。`
  if (kind === 'stills') return `你拍完一组《${title}》的宣传照。摄影师临时换了两次方案，收工比原计划晚了一个小时。`
  if (kind === 'fanmeet') return `你参加了《${title}》的粉丝见面会。台下有人喊角色名，也有人第一次喊了你的名字。`
  if (kind === 'radio') return `你为《${title}》做了一次电台连线。没有镜头以后，聊天反而比平时放松。`
  return `你参加了《${title}》的点映。散场后，几位观众留在座位上把片尾看完了。`
}
