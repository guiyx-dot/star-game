import type { GameEvent, GameEventOption } from './types'

export type StoryBeat = {
  kind: 'narration' | 'talk'
  text: string
  from?: 'you' | 'npc'
}

export function isTalkLine(text: string): boolean {
  return /[「」『』]/.test(text)
}

export function splitBeats(body: string): string[] {
  if (!body.trim()) return []
  const paras = body.split(/\n\n+/).map((s) => s.trim()).filter(Boolean)
  const beats: string[] = []
  for (const p of paras) {
    const parts = p.split(/(?<=[。！？…])(?![」』])/).map((s) => s.trim()).filter(Boolean)
    if (parts.length <= 1) beats.push(p)
    else beats.push(...parts)
  }
  return beats.length ? beats : [body.trim()]
}

function speakerCue(text: string): 'you' | 'npc' | null {
  const t = text.trim().replace(/[：:]+$/, '')
  if (/你(问|说|回|答|开口)/.test(t) || t === '你') return 'you'
  if (/才开口/.test(t) || /(开口|说|问|道|喊)$/.test(t)) return 'npc'
  return null
}

function isCueOnly(text: string): boolean {
  const t = text.trim().replace(/[：:]+$/, '')
  if (!t || /[，。；]/.test(t)) return false
  return speakerCue(t) !== null
}

function stripColon(text: string): string {
  let t = text.trim().replace(/[：:]+$/, '')
  if (t && /(开口|说|问)$/.test(t) && !/[。！？…]$/.test(t)) t += '。'
  return t
}

function tidyNarration(text: string): string {
  let t = stripColon(text)
  if (/，$/.test(t)) t = t.replace(/，$/, '。')
  return t
}

export function unitsFrom(text: string, from: 'you' | 'npc' = 'npc'): { units: StoryBeat[]; from: 'you' | 'npc' } {
  const units: StoryBeat[] = []
  if (!text.trim()) return { units, from }
  const re = /「([^」]*)」|『([^』]*)』/g
  let last = 0
  let found = false
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    found = true
    const before = text.slice(last, m.index).trim()
    if (before) {
      const cue = speakerCue(before)
      from = cue ?? 'npc'
      if (!isCueOnly(before)) units.push({ kind: 'narration', text: tidyNarration(before) })
    } else {
      from = 'npc'
    }
    const said = (m[1] ?? m[2] ?? '').trim()
    if (said) units.push({ kind: 'talk', text: said, from })
    from = 'npc'
    last = m.index + m[0].length
  }
  const rest = text.slice(last).trim()
  if (found) {
    if (rest) {
      const cue = speakerCue(rest)
      if (cue) from = cue
      if (!isCueOnly(rest)) units.push({ kind: 'narration', text: tidyNarration(rest) })
    }
  } else {
    const cue = speakerCue(text)
    if (cue) from = cue
    if (!isCueOnly(text)) units.push({ kind: 'narration', text: tidyNarration(text) })
  }
  return { units, from }
}

export function eventUnits(ev: GameEvent): StoryBeat[] {
  const paced = Boolean(ev.lines?.length)
  const chunks = (ev.lines?.length ? ev.lines : ev.body.split(/\n\n+/))
    .map((s) => s.trim())
    .filter(Boolean)
  let from: 'you' | 'npc' = 'npc'
  const out: StoryBeat[] = []
  for (const chunk of chunks) {
    const taken = unitsFrom(chunk, from)
    from = taken.from
    if (paced || taken.units.some((u) => u.kind === 'talk')) {
      out.push(...taken.units)
    } else {
      out.push(...splitBeats(chunk).map((text) => ({ kind: 'narration' as const, text })))
    }
  }
  if (ev.talk) {
    const taken = unitsFrom(ev.talk, from)
    out.push(...taken.units)
  }
  return out
}

export function eventBeats(ev: GameEvent): string[] {
  const units = eventUnits(ev)
  return units.length ? units.map((u) => u.text) : []
}

export function storyEvent(
  id: string,
  title: string,
  lines: string[],
  options: GameEventOption[],
  extra?: Partial<GameEvent>,
): GameEvent {
  const clean = lines.map((s) => s.trim()).filter(Boolean)
  return {
    id,
    title,
    body: clean.join('\n\n'),
    lines: clean,
    options,
    ...extra,
  }
}
