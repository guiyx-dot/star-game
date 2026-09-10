import type { GameEvent, GameEventOption } from './types'

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

export function eventBeats(ev: GameEvent): string[] {
  if (ev.lines?.length) return ev.lines.map((s) => s.trim()).filter(Boolean)
  return splitBeats(ev.body)
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
