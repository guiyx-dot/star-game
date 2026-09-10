import { GRADE_LABEL, NEED_NAME, highlightLine, hypeLine, needGaps, roleLine, type ScriptDef } from './engine/scripts'
import { type Attrs } from './engine/types'

function yuan(n: number): string {
  if (Math.abs(n) >= 10000) return `${(n / 10000).toFixed(1)}万`
  return `${n}元`
}

export function ScriptNeed({ script, attrs }: { script: ScriptDef; attrs: Attrs }) {
  const gaps = needGaps(attrs, script)
  return (
    <section className="invite-box">
      <h4>试镜以后</h4>
      {gaps.map((g) => (
        <p key={g.key} className={g.have >= g.need ? '' : 'need-short'}>
          {NEED_NAME[g.key]} {g.need}
          {g.have >= g.need ? ' · 过了' : ` · 现在 ${g.have}`}
        </p>
      ))}
    </section>
  )
}

export function ScriptSheet({
  script,
  attrs,
  revealNeed = false,
}: {
  script: ScriptDef
  attrs: Attrs
  revealNeed?: boolean
}) {
  return (
    <div className="invite">
      <header className="invite-hd">
        <div>
          <h3 className="serif">《{script.title}》</h3>
          <p className="muted">
            {GRADE_LABEL[script.grade]} · {roleLine(script)} · 片酬 {script.pay > 0 ? yuan(script.pay) : '无'}
          </p>
        </div>
        <div className="invite-tags">
          {script.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
          {script.awardTrack ? <span>冲奖向</span> : null}
        </div>
      </header>
      <div className="invite-grid">
        <div className="invite-col">
          <section className="invite-box">
            <h4>概况</h4>
            <p>题材：{script.theme}</p>
            <p>内容：{script.keywords.join('、')}</p>
          </section>
          <section className="invite-box">
            <h4>制片</h4>
            <p>制片：{script.company}</p>
            <p>导演：{script.director}</p>
            <p>编剧：{script.writer}</p>
            <p>片酬：{script.pay > 0 ? yuan(script.pay) : '无'}</p>
            {script.deposit > 0 ? <p>定金：{yuan(script.deposit)}</p> : null}
            <p>
              工时：{script.shootNeed} 场 / {script.deadlineDays} 天
            </p>
            <p>
              宣传：{script.promoNeed} 场 / {script.promoDays} 天
            </p>
            {hypeLine(script) ? <p>{hypeLine(script)}</p> : null}
            {highlightLine(script) ? <p>{highlightLine(script)}</p> : null}
          </section>
          <section className="invite-box">
            <h4>演员</h4>
            {script.leads.length ? <p>主演：{script.leads.join('、')}</p> : <p>主演未公布</p>}
            {script.supporting.length ? <p>参演：{script.supporting.join('、')}</p> : null}
            <p>
              你的角色：{script.roleName} · {roleLine(script)}
            </p>
          </section>
          {revealNeed ? (
            <ScriptNeed script={script} attrs={attrs} />
          ) : (
            <section className="invite-box">
              <h4>试镜</h4>
              <p>通告没有写具体要求。现场会试一段角色戏。</p>
            </section>
          )}
        </div>
        <div className="invite-col">
          <section className="invite-box">
            <h4>剧情提要</h4>
            <p>{script.outline}</p>
            <p>{script.plot}</p>
          </section>
          {script.press.length ? (
            <section className="invite-box">
              <h4>圈内消息</h4>
              {script.press.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </section>
          ) : null}
          <section className="invite-box">
            <h4>角色</h4>
            <p>{script.roleBio}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
