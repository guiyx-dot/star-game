import { useEffect, useRef, useState } from 'react'
import { actionGroup, actionById, groupLabel } from './engine/catalog'
import type { ActionDef } from './engine/catalog'
import {
  absDay,
  assignNext,
  clearWeek,
  fillEmptyInSlot,
  fillRemainingPromo,
  mdLabel,
  openTravel,
  parseWorkPlan,
  planFillFrom,
  plannerActions,
  remainingPromoTasks,
  resolveCurrent,
  setPlan,
  skipEmpty,
  splitLogLine,
  slotRecord,
  startWeek,
  tripSlotName,
  weekLines,
  workPlanId,
  ymdLabel,
} from './engine/game'
import { PROMO_LABEL } from './engine/promo'
import { GRADE_LABEL, roleLine, scriptById } from './engine/scripts'
import { ceremonySlotName, parseCeremonyPlan } from './engine/calendar'
import { WEEKDAYS, type GameState, type Slot } from './engine/types'

type Tab = 'work' | 'train' | 'leisure' | 'out'

function slotText(state: GameState, weekday: number, slot: Slot): string {
  const id = state.plan[weekday][slot]
  if (!id) return ''
  const work = parseWorkPlan(id)
  if (work) {
    const script = scriptById(work.scriptId)
    const title = script?.title ?? ''
    if (work.phase === 'promo') {
      const booking = state.bookings?.find((b) => b.scriptId === work.scriptId)
      const kind = work.promoIndex != null ? booking?.promoTasks?.[work.promoIndex] : undefined
      const label = kind ? PROMO_LABEL[kind] : '宣传'
      return `${label}《${title}》`
    }
    return `${script?.type ?? ''}《${title}》`
  }
  const tripName = tripSlotName(id)
  if (tripName) return tripName
  const ceremony = ceremonySlotName(id)
  if (ceremony) return ceremony
  return actionById(id)?.name ?? id
}

function dayLabel(state: GameState, weekday: number, slot: Slot, playing: boolean): string {
  const name = slotText(state, weekday, slot)
  if (name) {
    const tag = groupLabel(state.plan[weekday][slot] ?? '')
    return tag ? `周${WEEKDAYS[weekday]} · ${tag} ${name}` : `周${WEEKDAYS[weekday]} · ${name}`
  }
  if (playing) {
    const happened = slotRecord(state, weekday, slot).replace(/^没安排。/, '')
    if (happened) return `周${WEEKDAYS[weekday]} · ${happened}`
  }
  return `周${WEEKDAYS[weekday]}`
}

function pickSlot(action: ActionDef, view: Slot): Slot {
  if (action.slot === 'any') return view
  return action.slot
}

export function Planner({
  state,
  planning,
  onPatch,
}: {
  state: GameState
  planning: boolean
  onPatch: (next: GameState) => void
}) {
  const [view, setView] = useState<Slot>('day')
  const [tab, setTab] = useState<Tab>(() => ((state.bookings?.length ?? 0) > 0 ? 'work' : 'out'))
  const [keepPick, setKeepPick] = useState(false)
  const playLogRef = useRef<HTMLDivElement>(null)
  const weekLog = weekLines(state, state.week)
  const playing = state.phase === 'play'
  const currentActionId = playing ? state.plan[state.weekday][state.slot] : null
  const gap = playing && !state.event && !state.news && state.slot === 'day' && !state.plan[state.weekday].day

  useEffect(() => {
    if (planning) {
      setKeepPick(false)
      return
    }
    if (gap) setKeepPick(true)
  }, [planning, gap])

  const arranging = planning || (playing && !state.event && !state.news && state.slot === 'day' && (gap || keepPick))

  useEffect(() => {
    if (gap) setView('day')
  }, [gap, state.weekday])

  useEffect(() => {
    if (planning || arranging) return
    setView(state.slot)
  }, [planning, arranging, state.slot])

  useEffect(() => {
    if (arranging) return
    const el = playLogRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [arranging, state.log, state.lastNote])

  useEffect(() => {
    if (view === 'eve') setTab('leisure')
  }, [view])

  const slot = arranging ? view : state.slot
  const trainActs = plannerActions(state, slot).filter((a) => actionGroup(a) === 'train')
  const leisureActs = plannerActions(state, slot).filter((a) => actionGroup(a) === 'leisure')
  const outingActs = plannerActions(state, slot).filter(
    (a) => actionGroup(a) === 'out' && a.kind !== 'company' && a.kind !== 'agency',
  )
  const nightActs = plannerActions(state, 'eve')
  const bookings = state.bookings ?? []
  const currentActionName = currentActionId ? slotText(state, state.weekday, state.slot) : ''
  const currentActionGroup = groupLabel(currentActionId)
  const fillFrom = planFillFrom(state, slot)

  function pick(id: string) {
    if (!arranging) return
    const work = parseWorkPlan(id)
    if (work) {
      onPatch(assignNext(state, id, slot))
      return
    }
    if (parseCeremonyPlan(id)) {
      onPatch(assignNext(state, id, slot))
      return
    }
    const action = actionById(id)
    if (!action) return
    const target = pickSlot(action, slot)
    if (target !== view) setView(target)
    onPatch(assignNext(state, id, target))
  }

  function toggleDay(weekday: number) {
    if (!arranging) return
    if (weekday < fillFrom) return
    if (!state.plan[weekday][slot]) return
    onPatch(setPlan(state, weekday, slot, null))
  }

  function goNext() {
    setKeepPick(false)
    onPatch(resolveCurrent(state))
  }

  function passEmpty() {
    setKeepPick(false)
    onPatch(skipEmpty(state))
  }

  return (
    <div className="planner">
      <div className="week-col">
        <div className="week-rail">
          <div className="week-orb">
            {mdLabel(absDay(state.week, 0))}
            <small>—</small>
            {mdLabel(absDay(state.week, 6))}
          </div>
          {planning ? (
            <button className={`night-btn${view === 'eve' ? ' is-on' : ''}`} onClick={() => setView(view === 'day' ? 'eve' : 'day')}>
              {view === 'day' ? '看夜晚' : '看白天'}
            </button>
          ) : (
            <div className="night-btn is-on">{state.slot === 'day' ? '白天' : '夜晚'}</div>
          )}
        </div>
        <div className="day-list">
          {WEEKDAYS.map((_, i) => {
            const now = state.phase === 'play' && state.weekday === i && state.slot === slot
            const passed = playing && i < fillFrom
            const filled = Boolean(state.plan[i][slot]) || (passed && Boolean(slotRecord(state, i, slot)))
            return (
              <button
                type="button"
                key={`${slot}-${i}`}
                className={`day-slot${now ? ' now' : ''}${filled ? ' filled' : ' idle'}`}
                onClick={() => toggleDay(i)}
              >
                <span className="day-body">{dayLabel(state, i, slot, !planning)}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="pick-col">
        {arranging ? (
          slot === 'eve' ? (
            <>
              <p className="slots-left">{planning ? '夜晚' : '空着的可以现在排。'}</p>
              {!planning && /排满了|排不了这个|改不了|去不了|只要去一天|已经订了|出门以后/.test(state.lastNote) ? (
                <p className="note">{state.lastNote}</p>
              ) : null}
              <div className="train-grid">
                {nightActs.map((a) => (
                  <button key={a.id} onClick={() => pick(a.id)}>
                    {a.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {!planning ? <p className="slots-left">空着的可以现在排。</p> : null}
              {!planning && /排满了|排不了这个|改不了|去不了|只要去一天|已经订了|出门以后/.test(state.lastNote) ? (
                <p className="note">{state.lastNote}</p>
              ) : null}
              <div className="tabs">
                <button className={tab === 'work' ? 'is-on' : ''} onClick={() => setTab('work')}>
                  通告
                </button>
                <button className={tab === 'train' ? 'is-on' : ''} onClick={() => setTab('train')}>
                  培训
                </button>
                <button className={tab === 'leisure' ? 'is-on' : ''} onClick={() => setTab('leisure')}>
                  休闲
                </button>
                <button className={tab === 'out' ? 'is-on' : ''} onClick={() => setTab('out')}>
                  外出
                </button>
              </div>
              {tab === 'work' ? (
                <div className="work-pane">
                  {state.ceremonyDue?.nominated && state.ceremonyDue.week === state.week ? (
                    <button type="button" className="contract" onClick={() => pick(`ceremony:${state.ceremonyDue!.seasonId}`)}>
                      <h3 className="serif">出席{state.ceremonyDue.name}</h3>
                      <p>入围了。这周要去一天，拿不拿奖都得坐到礼成。</p>
                    </button>
                  ) : null}
                  {bookings.length === 0 && !(state.ceremonyDue?.nominated && state.ceremonyDue.week === state.week) ? (
                    <p className="muted">还没有签下的通告。</p>
                  ) : null}
                  {bookings.map((booking) => {
                    const script = scriptById(booking.scriptId)
                    if (!script) return null
                    if (booking.phase === 'promo') {
                      const tasks = remainingPromoTasks(state, booking.scriptId)
                      return (
                        <div key={booking.scriptId}>
                          <p className="muted">
                            《{script.title}》宣传 · 还剩 {booking.promoNeed - booking.promoDone} 场 · {ymdLabel(booking.promoDeadlineDay)}前
                          </p>
                          {tasks.map((row) => (
                            <button
                              key={row.index}
                              type="button"
                              className="contract"
                              onClick={() => pick(workPlanId('promo', booking.scriptId, row.index))}
                            >
                              <h3 className="serif">
                                {row.label}《{script.title}》
                              </h3>
                            </button>
                          ))}
                          {tasks.length > 0 ? (
                            <div className="row">
                              <button className="tiny" onClick={() => onPatch(fillRemainingPromo(state, booking.scriptId, slot))}>
                                空着的都去
                              </button>
                            </div>
                          ) : null}
                        </div>
                      )
                    }
                    const remain = booking.shootNeed - booking.shootDone
                    const planId = workPlanId('shoot', booking.scriptId)
                    return (
                      <div key={booking.scriptId}>
                        <button type="button" className="contract" onClick={() => pick(planId)}>
                          <h3 className="serif">
                            拍《{script.title}》
                          </h3>
                          <p>
                            {GRADE_LABEL[script.grade]} · {roleLine(script)} · 还剩 {remain} 场 · {ymdLabel(booking.deadlineDay)}前
                          </p>
                        </button>
                        <div className="row">
                          <button className="tiny" onClick={() => onPatch(fillEmptyInSlot(state, planId, slot))}>
                            空着的都去
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : tab === 'out' ? (
                <div className="work-pane">
                  <button type="button" className="contract" onClick={() => pick('company')}>
                    <h3 className="serif">影视公司</h3>
                    <p>去公司看看最近在找演员的电影、剧集和广告。</p>
                  </button>
                  <button type="button" className="contract" onClick={() => pick('label')}>
                    <h3 className="serif">唱片公司</h3>
                    <p>去听新到的小样，也许有翻唱、插曲或单曲。</p>
                  </button>
                  <button type="button" className="contract" onClick={() => pick('media')}>
                    <h3 className="serif">媒体公司</h3>
                    <p>最近的访谈和综艺通告都在这里谈。</p>
                  </button>
                  <button type="button" className="contract" onClick={() => pick('agency')}>
                    <h3 className="serif">房屋中介</h3>
                    <p>看看最近的新房源，顺便问问价格。</p>
                  </button>
                  <button type="button" className="contract" onClick={() => onPatch(openTravel(state))}>
                    <h3 className="serif">旅游</h3>
                    <p>给自己放几天假，去远一点的地方走走。</p>
                  </button>
                  <div className="train-grid">
                    {outingActs.map((a) => (
                      <button key={a.id} onClick={() => pick(a.id)}>
                        {a.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="train-grid">
                  {(tab === 'train' ? trainActs : leisureActs).map((a) => (
                    <button key={a.id} onClick={() => pick(a.id)}>
                      {a.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )
        ) : (
          <div className="play-pane recap-log" ref={playLogRef}>
            {weekLog.length === 0 && !currentActionName ? (
              <p className="note">{state.lastNote || '这一周开始了。'}</p>
            ) : (
              weekLog.map((line, i) => {
                const { story, delta } = splitLogLine(line.text)
                return (
                  <div key={`${line.weekday}-${line.slot}-${i}`}>
                    <span className="recap-when">
                      周{WEEKDAYS[line.weekday]}
                      {line.slot === 'day' ? '白天' : '晚上'}
                    </span>
                    {story}
                    {delta ? <span className="recap-delta">{delta}</span> : null}
                  </div>
                )
              })
            )}
            <div className="current-preview">
              <span className="recap-when">
                周{WEEKDAYS[state.weekday]}
                {state.slot === 'day' ? '白天' : '晚上'} · 接下来
              </span>
              {currentActionName
                ? `${currentActionGroup ? `${currentActionGroup} · ` : ''}${currentActionName}`
                : state.slot === 'day'
                  ? '今天没有安排。'
                  : '今晚没有安排。'}
            </div>
          </div>
        )}
      </div>

      <div className="planner-foot">
        {planning ? (
          <>
            <button className="ghost ink" onClick={() => onPatch(clearWeek(state))}>
              重置
            </button>
            <button className="primary" onClick={() => onPatch(startWeek(state))}>
              出门
            </button>
          </>
        ) : arranging && !currentActionId ? (
          <button className="ghost ink" onClick={passEmpty}>
            空过
          </button>
        ) : (
          <button className="primary" onClick={goNext} disabled={Boolean(state.event || state.news)}>
            下一段
          </button>
        )}
      </div>
    </div>
  )
}
