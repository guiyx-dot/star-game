import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { IDENTITIES, ITEMS, NPC_BIO, NPC_ORDER, inviteVerb, HOUSES, houseById, identityById, TRIPS } from './engine/catalog'
import { Planner } from './Planner'
import { ScriptNeed, ScriptSheet } from './ScriptSheet'
import { fanText, phoneComments } from './engine/phone'
import { afterRecap, seasonById } from './engine/calendar'
import { eventUnits, type StoryBeat } from './engine/story'
import {
  ATTR_LABEL,
  NPC_NAME,
  WEEKDAYS,
  playYear,
  weekInYear,
  type EventSheet,
  type GameEvent,
  type GameState,
  type IdentityId,
} from './engine/types'
import {
  careerRung,
  ROLE_LABEL,
} from './engine/rank'
import {
  bookTrip,
  brokerCanRefer,
  brokerRefer,
  buyHouse,
  buyItem,
  choose,
  clearSave,
  createState,
  currentOffers,
  effectiveAttrs,
  influenceLabel,
  inviteBlocked,
  inviteNpc,
  loadState,
  saveState,
  statusLabel,
  titleState,
  wearItem,
  splitLogLine,
  weekLines,
  contractSheet,
  SIGN_TALK,
} from './engine/game'
import {
  GRADE_LABEL,
  highlightLine,
  hypeLine,
  roleLine,
  scriptById,
} from './engine/scripts'

function yuan(n: number): string {
  if (Math.abs(n) >= 10000) return `${(n / 10000).toFixed(1)}万`
  return `${n}元`
}

function signEventView(event: GameEvent): GameEvent {
  const script = event.scriptId ? scriptById(event.scriptId) : undefined
  return {
    ...event,
    sheet: event.sheet ?? (script ? contractSheet(script) : undefined),
    talk: event.talk ?? SIGN_TALK,
    body: '',
  }
}

function EventSheetBox({ sheet }: { sheet: EventSheet }) {
  return (
    <section className="invite-box event-sheet">
      {sheet.heading ? <h4 className="serif">{sheet.heading}</h4> : null}
      {sheet.rows.map((row) => (
        <p key={row.label} className="sheet-row">
          <span className="muted">{row.label}</span>
          <span>{row.value}</span>
        </p>
      ))}
    </section>
  )
}

function StoryLine({ beat, past }: { beat: StoryBeat; past?: boolean }) {
  if (beat.kind === 'talk') {
    return (
      <div className={`say ${beat.from === 'you' ? 'you' : 'npc'}${past ? ' vn-past' : ' vn-now'}`}>
        <p className="bubble">{beat.text}</p>
      </div>
    )
  }
  return <p className={`narration ${past ? 'vn-past' : 'vn-now'}`}>{beat.text}</p>
}

function EventText({ event, text }: { event?: GameEvent; text?: string }) {
  const beats = text != null ? unitsFromText(text) : event ? eventUnits(event) : []
  if (!event?.sheet && !beats.length) return null
  return (
    <div className="event-copy">
      {event?.sheet ? <EventSheetBox sheet={event.sheet} /> : null}
      {beats.length ? (
        <div className="event-body">
          {beats.map((beat, i) => (
            <StoryLine key={i} beat={beat} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function unitsFromText(text: string): StoryBeat[] {
  return eventUnits({ id: '', title: '', body: text, options: [] })
}

function EventStory({
  event,
  onChoose,
  extra,
}: {
  event: GameEvent
  onChoose: (id: string) => void
  extra?: ReactNode
}) {
  const beats = eventUnits(event)
  const [shown, setShown] = useState(beats.length ? 1 : 0)
  useEffect(() => {
    setShown(beats.length ? 1 : 0)
  }, [event.id, event.body, event.talk])
  const done = !beats.length || shown >= beats.length
  return (
    <>
      {event.sheet ? <EventSheetBox sheet={event.sheet} /> : null}
      <div
        className="event-body vn"
        onClick={() => {
          if (!done) setShown((n) => Math.min(beats.length, n + 1))
        }}
      >
        {beats.slice(0, shown).map((beat, i) => (
          <StoryLine key={i} beat={beat} past={i !== shown - 1} />
        ))}
        {!done ? <p className="vn-hint">点击继续</p> : extra}
      </div>
      {done ? (
        <div className="choices">
          {event.options.map((op) => (
            <button key={op.id} onClick={() => onChoose(op.id)}>
              {op.label}
            </button>
          ))}
        </div>
      ) : null}
    </>
  )
}

function wardrobeItems(state: GameState) {
  return state.items
    .map((own) => {
      const item = ITEMS.find((i) => i.id === own.itemId)
      return item ? { own, item } : null
    })
    .filter((row): row is { own: (typeof state.items)[number]; item: (typeof ITEMS)[number] } => Boolean(row))
}

function wornLine(state: GameState): string {
  return wardrobeItems(state)
    .filter((row) => row.own.worn)
    .map((row) => row.item.name)
    .join('、')
}

function Recap({ state, onClose }: { state: GameState; onClose: () => void }) {
  const week = state.recapWeek
  if (week == null) return null
  const lines = weekLines(state, week).filter((line) => !line.text.startsWith('没安排。'))
  return (
    <div className="modal-back">
      <div className="modal recap">
        <h2>
          第 {playYear(week)} 年 · 第 {weekInYear(week)} 周
        </h2>
        <div className="recap-log">
          {lines.length === 0 ? (
            <p className="muted">这一周过得很安静。</p>
          ) : (
            lines.map((line, i) => {
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
        </div>
        <div className="row invite-actions">
          <button className="primary" onClick={onClose}>
            开启下周
          </button>
        </div>
      </div>
    </div>
  )
}

function RankGlance({ state }: { state: GameState }) {
  const rung = careerRung(state)
  return (
    <div className="rank-box">
      <p>
        <b>名气</b> {rung.fame}
      </p>
      <p>
        <b>地位</b> {rung.status}
      </p>
      <p>
        <b>角色</b> {ROLE_LABEL[rung.role]}
      </p>
    </div>
  )
}

function Career({ state, onClose }: { state: GameState; onClose: () => void }) {
  const [tab, setTab] = useState<'works' | 'awards'>('works')
  const filming = state.bookings ?? []
  const filmingIds = new Set(filming.map((b) => b.scriptId))
  const done = [...state.finishedScripts].reverse().filter((id) => !filmingIds.has(id))
  const awards = state.awards ?? []

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>履历</h2>
        <div className="tabs">
          <button className={tab === 'works' ? 'is-on' : ''} onClick={() => setTab('works')}>
            作品
          </button>
          <button className={tab === 'awards' ? 'is-on' : ''} onClick={() => setTab('awards')}>
            奖项
          </button>
        </div>
        {tab === 'works' ? (
          <div className="career-list">
            {filming.length === 0 && done.length === 0 ? <p className="muted">还没有进过组。</p> : null}
            {filming.map((booking) => {
              const s = scriptById(booking.scriptId)
              if (!s) return null
              return (
                <div key={booking.scriptId} className="career-card">
                  <h3 className="serif">《{s.title}》</h3>
                  <p>
                    {s.type} · {s.roleKind} · {s.roleName}
                  </p>
                  <p className="muted">
                    {GRADE_LABEL[s.grade]} · {roleLine(s)} · {booking.phase === 'promo' ? '在宣传' : s.track === 'music' ? '在棚里' : s.track === 'variety' ? '在录制' : '正在拍'}
                  </p>
                </div>
              )
            })}
            {done.map((id) => {
              const s = scriptById(id)
              if (!s) return null
              return (
                <div key={id} className="career-card">
                  <h3 className="serif">《{s.title}》</h3>
                  <p>
                    {s.type} · {s.roleKind} · {s.roleName}
                  </p>
                    <p className="muted">{GRADE_LABEL[s.grade]} · {roleLine(s)} · 杀青了</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="career-list">
            {awards.length === 0 ? (
              <p className="muted">还没有你的奖。</p>
            ) : (
              awards.map((award) => {
                const work = award.scriptId ? scriptById(award.scriptId) : undefined
                return (
                  <div key={award.id} className="career-card">
                    <h3 className="serif">{award.name}</h3>
                    <p>{award.org}</p>
                    <p className="muted">
                      第 {award.week} 周{work ? ` · 《${work.title}》` : ''}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        )}
        <div className="row" style={{ marginTop: 16 }}>
          <button className="ghost" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

function HousePane({
  state,
  onClose,
  onPatch,
}: {
  state: GameState
  onClose: () => void
  onPatch: (next: GameState) => void
}) {
  const house = houseById(state.houseId)
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>住所</h2>
        <p>
          现在住{house.name}。{house.desc}
        </p>
        <p className="muted">回来睡一觉，大约能回 {Math.round(60 * house.staMul)} 体力。</p>
        {state.lastNote === '卡里不够' || state.lastNote === '你已经住在这里' || state.lastNote === '你已经住得比这里好。' ? <p className="note">{state.lastNote}</p> : null}
        {HOUSES.filter((h) => h.price > 0).map((row) => (
          <div key={row.id} className="shop-item">
            <div>
              <b>{row.name}</b>
              <div className="muted">
                {yuan(row.price)} · 睡一觉大约回 {Math.round(60 * row.staMul)} 体力 · {row.desc}
              </div>
            </div>
            {state.houseId === row.id ? (
              <span className="muted">住在这里</span>
            ) : (
              <button
                className="tiny"
                onClick={() => {
                  const next = buyHouse(state, row.id)
                  onPatch(next)
                  if (next.event) onClose()
                }}
              >
                看
              </button>
            )}
          </div>
        ))}
        <div className="row" style={{ marginTop: 16 }}>
          <button className="ghost" onClick={onClose}>
            关上
          </button>
        </div>
      </div>
    </div>
  )
}

function NewsFlash({
  news,
  onClose,
}: {
  news: { text: string; tone: 'good' | 'bad' | 'mixed'; kind?: 'hot' | 'trade' | 'gossip' | 'award' | 'fashion' }
  onClose: () => void
}) {
  return (
    <div className="modal-back">
      <div className={`modal news-card ${news.tone}`}>
        <p className="kicker news-kicker">
          {news.kind === 'trade' ? '行业' : news.kind === 'gossip' ? '八卦' : news.kind === 'award' ? '颁奖' : news.kind === 'fashion' ? '时装周' : '热搜'}
        </p>
        <h2>{news.text}</h2>
        <div className="row invite-actions">
          <button className="primary" onClick={onClose}>
            划掉
          </button>
        </div>
      </div>
    </div>
  )
}

type Overlay = 'none' | 'shop' | 'phone' | 'attrs' | 'people' | 'career' | 'house'

export function App() {
  const [state, setState] = useState<GameState>(() => loadState() ?? titleState())
  const [overlay, setOverlay] = useState<Overlay>('none')
  const [name, setName] = useState('林澄')
  const [identity, setIdentity] = useState<IdentityId>('college')

  useEffect(() => {
    if (state.phase !== 'title') saveState(state)
  }, [state])

  const eff = useMemo(() => effectiveAttrs(state), [state])
  const house = houseById(state.houseId)
  const tableOffers = useMemo(() => {
    const id = state.event?.id
    if (id === 'label') return currentOffers(state, 'music')
    if (id === 'media') return currentOffers(state, 'variety')
    return currentOffers(state, 'film')
  }, [state])
  const comments = useMemo(() => phoneComments(state), [state])

  function patch(next: GameState) {
    setState(next)
  }

  if (state.phase === 'title') {
    const saved = loadState()
    return (
      <div className="app title-screen">
        <p className="kicker">第一年</p>
        <h1>星途</h1>
        <p className="lede">没人认识你。这一年才刚开始。</p>
        <div className="row">
          <button className="primary" onClick={() => patch({ ...titleState(), phase: 'create' })}>
            从头来过
          </button>
          {saved && saved.phase !== 'title' ? (
            <button className="ghost" onClick={() => patch(saved)}>
              继续
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  if (state.phase === 'create') {
    const def = identityById(identity)
    return (
      <div className="app create-screen">
        <p className="kicker">入行之前</p>
        <h1>你是谁</h1>
        <label>
          名字
          <br />
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={8} />
        </label>
        <div className="identities">
          {IDENTITIES.map((item) => (
            <button
              key={item.id}
              className={`card pick${identity === item.id ? ' is-on' : ''}`}
              onClick={() => setIdentity(item.id)}
            >
              <h3>{item.name}</h3>
              <p>{item.blurb}</p>
            </button>
          ))}
        </div>
        <p className="lede">
          {identity === 'college'
            ? `卡里剩 ${yuan(def.money)}。演戏这件事，你几乎是从零开始。`
            : identity === 'film'
              ? `卡里 ${yuan(def.money)}。宿舍对门还在对词。`
              : `卡里 ${yuan(def.money)}。家里能帮你进门，剩下的要靠自己。`}
        </p>
        <button className="primary" onClick={() => patch(createState(name, identity))}>
          入行
        </button>
      </div>
    )
  }

  const planning = state.phase === 'plan'

  return (
    <div className="app">
      <header className="hud">
        <div>
          <p className="kicker">
            第 {playYear(state.week)} 年 · 第 {weekInYear(state.week)} 周 · 周{WEEKDAYS[state.weekday]} ·{' '}
            {state.slot === 'day' ? '白天' : '晚上'}
            {state.phase === 'ended' ? (state.week > 156 ? ' · 三年过完了' : ' · 这一年过完了') : ''}
          </p>
          <h1>{state.name}</h1>
          <p className="muted">
            {identityById(state.identity).name} · {influenceLabel(state)} · {statusLabel(state)} · {house.name}
          </p>
        </div>
        <div className="meters">
          <span>
            金钱 <b>{yuan(state.money)}</b>
          </span>
          <span>
            体力 <b>{state.stamina}</b>
          </span>
          <span>
            心情 <b>{state.mood}</b>
          </span>
          <span>
            粉丝 <b>{state.fans}</b>
          </span>
          <span>
            认可 <b>{state.recognition}</b>
          </span>
        </div>
      </header>

      <nav className="hud-nav">
        <button className="ghost" onClick={() => setOverlay('career')}>
          履历
        </button>
        <button className="ghost" onClick={() => setOverlay('attrs')}>
          镜子
        </button>
        <button className="ghost" onClick={() => setOverlay('people')}>
          通讯录
        </button>
        <button className="ghost" onClick={() => setOverlay('shop')}>
          衣橱
        </button>
        <button className="ghost" onClick={() => setOverlay('house')}>
          住所
        </button>
        <button className="ghost" onClick={() => setOverlay('phone')}>
          手机
        </button>
        <button
          className="ghost"
          onClick={() => {
            clearSave()
            patch(titleState())
          }}
        >
          重新开始
        </button>
      </nav>

      {planning || state.phase === 'play' ? (
        <main className="panel">
          <Planner state={state} planning={planning} onPatch={patch} />
          {planning && state.lastNote && state.lastNote !== '新的一周。' ? <p className="note">{state.lastNote}</p> : null}
        </main>
      ) : null}

      {state.event?.id === 'company' || state.event?.id === 'label' || state.event?.id === 'media' ? (
        <div className="modal-back">
          <div className="modal wide">
            <h2>{state.event.title}</h2>
            <EventText event={state.event} />
            {tableOffers.map((s) => (
              <div key={s.id} className={`script-card g-${s.grade}`}>
                <h3 className="serif">《{s.title}》</h3>
                <div className="script-meta">
                  <span className={`grade-chip g-${s.grade}`}>{GRADE_LABEL[s.grade]}</span>
                  <span>{roleLine(s)}</span>
                  <span>片酬 {s.pay > 0 ? yuan(s.pay) : '无'}</span>
                  <span>{s.director}</span>
                </div>
                {s.awardTrack ? <p className="award-hint">颁奖季会盯这部。</p> : null}
                {s.press[0] ? <p className="award-hint">{s.press[0]}</p> : null}
                {s.hype === 'ip' && !s.press[0] ? <p className="award-hint">原著读者很多，选角已经传开了。</p> : null}
                {s.unlock && highlightLine(s) ? <p className="award-hint">{highlightLine(s)}</p> : null}
                {s.hype !== 'ip' && !s.awardTrack && !s.unlock && !s.press[0] && hypeLine(s) ? (
                  <p className="award-hint">{hypeLine(s)}</p>
                ) : null}
                <p>{s.outline}</p>
                <div className="script-card-foot">
                  <button className="tiny" onClick={() => patch(choose(state, `view:${s.id}`))}>
                    翻开
                  </button>
                </div>
              </div>
            ))}
            <div className="row invite-actions">
              <button className="ghost" onClick={() => patch(choose(state, 'leave'))}>
                再说，先回去
              </button>
            </div>
          </div>
        </div>
      ) : state.event?.id === 'invite' && state.event.scriptId && scriptById(state.event.scriptId) ? (
        <div className="modal-back">
          <div className="modal extra">
            <h2>{state.event.title}</h2>
            <ScriptSheet
              script={scriptById(state.event.scriptId)!}
              attrs={eff}
              revealNeed={(state.auditionedIds ?? []).includes(state.event.scriptId)}
            />
            <div className="row invite-actions">
              <button className="ghost" onClick={() => patch(choose(state, 'decline'))}>
                婉拒
              </button>
              <button className="ghost" onClick={() => patch(choose(state, 'back'))}>
                先放下
              </button>
              <button className="primary" onClick={() => patch(choose(state, 'audition'))}>
                {scriptById(state.event.scriptId)!.track === 'music'
                  ? '进棚试'
                  : scriptById(state.event.scriptId)!.track === 'variety'
                    ? '试录'
                    : '试镜'}
              </button>
            </div>
          </div>
        </div>
      ) : state.event?.id === 'audition-ok' || state.event?.id === 'audition-fail' ? (
        <div className="modal-back">
          <div className="modal wide">
            <h2>{state.event.title}</h2>
            <EventStory
              event={state.event}
              onChoose={(id) => patch(choose(state, id))}
              extra={
                state.event.scriptId && scriptById(state.event.scriptId) ? (
                  <div style={{ marginTop: 14 }}>
                    <ScriptNeed script={scriptById(state.event.scriptId)!} attrs={eff} />
                  </div>
                ) : null
              }
            />
          </div>
        </div>
      ) : state.event?.id === 'sign' ? (
        <div className="modal-back">
          <div className="modal sign-card">
            <h2>通告签约</h2>
            <EventText event={signEventView(state.event)} />
            <div className="row invite-actions">
              <button className="ghost" onClick={() => patch(choose(state, 'abort'))}>
                把笔放下
              </button>
              <button className="primary" onClick={() => patch(choose(state, 'ok'))}>
                签订合约
              </button>
            </div>
          </div>
        </div>
      ) : state.event?.id === 'mall' ? (
        <div className="modal-back">
          <div className="modal wide">
            <h2>{state.event.title}</h2>
            <EventText event={state.event} />
            {state.lastNote === '卡里不够' || state.lastNote === '衣橱里已经有一件了' ? <p className="note">{state.lastNote}</p> : null}
            {(
              [
                ['cosmetic', '专柜'],
                ['clothes', '成衣'],
                ['jewelry', '首饰'],
              ] as const
            ).map(([kind, label]) => (
              <div key={kind}>
                <h3 className="phone-sec">{label}</h3>
                {ITEMS.filter((item) => item.kind === kind).map((item) => {
                  const have = state.items.some((o) => o.itemId === item.id)
                  return (
                    <div key={item.id} className="shop-item">
                      <div>
                        <b>{item.name}</b>
                        <div className="muted">
                          {yuan(item.price)} · {item.desc}
                        </div>
                      </div>
                      {have && item.kind !== 'cosmetic' ? (
                        <span className="muted">衣橱里有了</span>
                      ) : (
                        <button className="tiny" onClick={() => patch(buyItem(state, item.id))}>
                          买
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
            <div className="row invite-actions">
              <button className="ghost" onClick={() => patch(choose(state, 'leave'))}>
                离开
              </button>
            </div>
          </div>
        </div>
      ) : state.event?.id === 'agency' ? (
        <div className="modal-back">
          <div className="modal wide">
            <h2>{state.event.title}</h2>
            <EventText event={state.event} />
            <p>现在住{house.name}。</p>
            {state.lastNote && !state.lastNote.startsWith('你进了中介') ? <p className="note">{state.lastNote}</p> : null}
            {HOUSES.filter((h) => h.price > 0).map((house) => (
              <div key={house.id} className="shop-item">
                <div>
                  <b>{house.name}</b>
                  <div className="muted">
                    {yuan(house.price)} · 睡一觉大约回 {Math.round(60 * house.staMul)} 体力 · {house.desc}
                  </div>
                </div>
                {state.houseId === house.id ? (
                  <span className="muted">住在这里</span>
                ) : (
                  <button className="tiny" onClick={() => patch(buyHouse(state, house.id))}>
                    看
                  </button>
                )}
              </div>
            ))}
            <div className="row invite-actions">
              <button className="ghost" onClick={() => patch(choose(state, 'leave'))}>
                离开
              </button>
            </div>
          </div>
        </div>
      ) : state.event?.id === 'travel' ? (
        <div className="modal-back">
          <div className="modal wide">
            <h2>{state.event.title}</h2>
            <p>{state.event.body}</p>
            {state.lastNote === '卡里不够' || state.lastNote.startsWith('这周排不开') || state.lastNote === '这周已经订了行程。' ? (
              <p className="note">{state.lastNote}</p>
            ) : null}
            {TRIPS.map((trip) => (
              <div key={trip.id} className="shop-item">
                <div>
                  <b>{trip.name}</b>
                  <div className="muted">
                    {trip.days} 天 · {yuan(trip.price)} · {trip.desc}
                  </div>
                </div>
                <button className="tiny" onClick={() => patch(bookTrip(state, trip.id))}>
                  订
                </button>
              </div>
            ))}
            <div className="row invite-actions">
              <button className="ghost" onClick={() => patch({ ...state, event: null })}>
                先不下单
              </button>
            </div>
          </div>
        </div>
      ) : state.event ? (
        <div className="modal-back">
          <div className="modal">
            {state.event.id.startsWith('cal-') || state.event.id.startsWith('ceremony-') ? (
              <p className="kicker news-kicker">
                {(() => {
                  const raw = state.event.id
                  const sid = raw.startsWith('cal-nom-')
                    ? raw.slice(8)
                    : raw.startsWith('ceremony-')
                      ? raw.slice(10)
                      : raw.slice(4)
                  const kind = seasonById(sid)?.kind
                  return kind === 'fashion' ? '时装周' : '颁奖'
                })()}
              </p>
            ) : null}
            <h2>{state.event.title}</h2>
            <EventStory event={state.event} onChoose={(id) => patch(choose(state, id))} />
          </div>
        </div>
      ) : null}

      {state.recapWeek != null && !state.event && !state.news ? (
        <Recap state={state} onClose={() => patch(afterRecap(state))} />
      ) : null}

      {overlay === 'house' ? <HousePane state={state} onClose={() => setOverlay('none')} onPatch={patch} /> : null}

      {overlay === 'career' ? <Career state={state} onClose={() => setOverlay('none')} /> : null}

      {overlay === 'attrs' ? (
        <div className="modal-back" onClick={() => setOverlay('none')}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>镜子</h2>
            <RankGlance state={state} />
            {(Object.keys(ATTR_LABEL) as (keyof typeof ATTR_LABEL)[]).map((k) => (
              <div key={k} className="stat-row">
                <span>{ATTR_LABEL[k]}</span>
                <span>
                  {eff[k]}
                  {eff[k] !== state.attrs[k] ? ` (${state.attrs[k]})` : ''}
                </span>
              </div>
            ))}
            <div className="row" style={{ marginTop: 16 }}>
              <button className="ghost" onClick={() => setOverlay('none')}>
                关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {overlay === 'people' ? (
        <div className="modal-back" onClick={() => setOverlay('none')}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>通讯录</h2>
            {NPC_ORDER.every((id) => !state.met[id]) ? (
              <p className="muted">还没有人的电话。</p>
            ) : (
              NPC_ORDER.filter((id) => state.met[id]).map((id) => {
                const verb = inviteVerb(id)
                const blocked = verb ? inviteBlocked(state, id) : null
                const canRefer = id === 'zhouheng' && !brokerCanRefer(state)
                return (
                  <div key={id} className="npc-card">
                    <div className="who">
                      <b>
                        {NPC_NAME[id]} · {NPC_BIO[id].role}
                      </b>
                      <span>{state.favor[id]}</span>
                    </div>
                    <p className="muted">{NPC_BIO[id].who}</p>
                    <div className="bar">
                      <i style={{ width: `${state.favor[id]}%` }} />
                    </div>
                    <div className="npc-actions">
                      {verb ? (
                        <button
                          className="tiny"
                          disabled={Boolean(blocked)}
                          onClick={() => patch(inviteNpc(state, id))}
                        >
                          {verb}
                        </button>
                      ) : null}
                      {canRefer ? (
                        <button
                          className="tiny"
                          onClick={() => {
                            const next = brokerRefer(state)
                            setOverlay('none')
                            patch(next)
                          }}
                        >
                          引荐
                        </button>
                      ) : null}
                    </div>
                    {verb && blocked === '这周已经约过。' ? <p className="muted">{blocked}</p> : null}
                  </div>
                )
              })
            )}
            {state.lastNote && /^(周[一二三四五六日]晚|这一周晚上)/.test(state.lastNote) ? (
              <p className="note">{state.lastNote}</p>
            ) : null}
            <div className="row" style={{ marginTop: 16 }}>
              <button className="ghost" onClick={() => setOverlay('none')}>
                关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {overlay === 'shop' ? (
        <div className="modal-back" onClick={() => setOverlay('none')}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>衣橱</h2>
            {wornLine(state) ? <p>现在穿着：{wornLine(state)}</p> : <p className="muted">身上是空的。</p>}
            {wardrobeItems(state).length === 0 ? <p className="muted">衣橱是空的。</p> : null}
            {(['clothes', 'jewelry'] as const).map((kind) => {
              const rows = wardrobeItems(state).filter((row) => row.item.kind === kind)
              if (!rows.length) return null
              return (
                <div key={kind}>
                  <h3 className="phone-sec">{kind === 'clothes' ? '衣服' : '首饰'}</h3>
                  {rows.map(({ own, item }) => (
                    <div key={own.itemId} className="shop-item">
                      <div>
                        <b>
                          {item.name}
                          {own.worn ? ' · 穿着' : ''}
                        </b>
                        <div className="muted">{item.desc}</div>
                      </div>
                      <button className={`tiny${own.worn ? ' on' : ''}`} onClick={() => patch(wearItem(state, own.itemId))}>
                        {own.worn ? '脱下' : '换上'}
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
            <div className="row" style={{ marginTop: 16 }}>
              <button className="ghost" onClick={() => setOverlay('none')}>
                关上
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {overlay === 'phone' ? (
        <div className="modal-back" onClick={() => setOverlay('none')}>
          <div className="modal phone-modal" onClick={(e) => e.stopPropagation()}>
            <h2>手机</h2>
            <div className="phone-head">
              <div>
                <p className="phone-rank">{influenceLabel(state)}</p>
                <p className="phone-name">{state.name}</p>
              </div>
              <div className="phone-fans">
                <b>{fanText(state.fans)}</b>
                <span>粉丝</span>
              </div>
            </div>

            <h3 className="phone-sec">热搜</h3>
            {state.hotSearch ? (
              <div className={`hot ${state.hotSearch.tone}`}>
                {state.hotSearch.text}
              </div>
            ) : (
              <p className="muted">热搜上没有你。</p>
            )}

            <h3 className="phone-sec">留言</h3>
            {comments.length === 0 ? (
              <p className="muted">还没有人留言。</p>
            ) : (
              <div className="phone-comments">
                {comments.map((c, i) => (
                  <div key={`${c.user}-${i}`} className="phone-comment">
                    <span className="who">{c.user}</span>
                    <p>{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            <button className="ghost" onClick={() => setOverlay('none')}>
              合上
            </button>
          </div>
        </div>
      ) : null}

      {state.news && !state.event ? (
        <NewsFlash
          news={state.news}
          onClose={() => patch({ ...state, news: null })}
        />
      ) : null}
    </div>
  )
}
