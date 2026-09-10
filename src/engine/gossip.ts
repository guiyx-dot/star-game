import { scriptById } from './scripts'
import { playYear, NPC_NAME, type GameEvent, type GameState, type NewsFlash } from './types'

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function rng(state: GameState, salt: number) {
  let t = (state.offerSeed + state.week * 1315423911 + salt) >>> 0
  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), t | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function monthOf(week: number): number {
  return Math.floor((week - 1) / 4)
}

function marked(state: GameState, id: string): boolean {
  return Boolean(state.flags[`g:${id}:${monthOf(state.week)}`])
}

function mark(state: GameState, id: string) {
  state.flags[`g:${id}:${monthOf(state.week)}`] = true
  state.flags[`gW:${state.week}`] = true
}

function bumpFavor(state: GameState, id: keyof GameState['favor'], n: number) {
  if (!state.met[id] && n > 0) state.met[id] = true
  state.favor[id] = clamp((state.favor[id] ?? 0) + n, 0, 100)
}

function filmingTitle(state: GameState): string | null {
  const b = (state.bookings ?? []).find((x) => x.phase === 'shoot') ?? state.bookings?.[0]
  if (!b) return null
  return scriptById(b.scriptId)?.title ?? null
}

type WorldLine = { id: string; text: string; tone: NewsFlash['tone'] }

const WORLD_FROM: Record<string, number> = {
  'w-pepper': 2,
  'w-redcase': 2,
  'w-dust': 2,
  'w-youngbook': 2,
  'w-northwind': 2,
  'w-returner': 2,
  'w-brocade': 2,
  'w-longnight': 2,
  'w-counter': 2,
  'w-weiyang': 3,
  'w-shore': 3,
  'w-painted': 3,
  'w-cipher': 3,
  'w-citylamp': 3,
}

function worldOpen(week: number, w: WorldLine) {
  return (WORLD_FROM[w.id] ?? 1) <= playYear(week)
}

const WORLD: WorldLine[] = [
  { id: 'w-rank', text: '江晚宁《庭前雪》海报顺序又改了一版。片方说「按合同」，原著粉说按人气。小郡主那栏还空着。', tone: 'mixed' },
  { id: 'w-late', text: '陆承宴片场迟到三小时。何朗把盒饭盖上，没说话。', tone: 'bad' },
  { id: 'w-double', text: '韩迟、江晚宁机场同框。工作室说「纯路透」，粉丝已经写成官宣。', tone: 'mixed' },
  { id: 'w-dress', text: '红毯上顾辞晚和白疏影撞衫。站姐先吵，品牌后发声明。', tone: 'mixed' },
  { id: 'w-ad', text: '江晚宁代言被曝夸大宣传。评论区在问她自己用不用。', tone: 'bad' },
  { id: 'w-cut', text: '宋知夏《人间长夏》吻戏被剪。原著粉骂片方，路人说早该剪。', tone: 'mixed' },
  { id: 'w-double-body', text: '裴渡动作戏替身路透流出。粉丝说「那是角度」，黑说「那是整个人」。', tone: 'bad' },
  { id: 'w-director', text: '齐衡组拍摄过半换执行导演。盛宴到场那天，监视器后面多了一排人。', tone: 'mixed' },
  { id: 'w-money', text: '传陆承宴那部撤资。杀青宴取消，群里只剩「等通知」。', tone: 'bad' },
  { id: 'w-water', text: '宋知夏上星剧注水到八十集。编剧把「吃饭」写成三集。', tone: 'bad' },
  { id: 'w-pay', text: '白疏影片酬倒挂传闻。她比江晚宁高，片方说「没有这回事」。', tone: 'mixed' },
  { id: 'w-seat', text: '韩迟杀青照少了半边人。有人说档期，有人说不欢而散。', tone: 'mixed' },
  { id: 'w-promo', text: '陆承宴不宣传。物料只发他，江晚宁那边已经在问是不是被冷处理。', tone: 'mixed' },
  { id: 'w-leak', text: '假路透把陈晚秋旧剧妆造P进新组，营销号照转。', tone: 'mixed' },
  { id: 'w-buy', text: '有人爆料韩迟，帖子又立刻没了。有人说花钱撤的，有人说被压的。', tone: 'mixed' },
  { id: 'w-hug', text: '机场拥抱被拍。陆承宴说同事，顾辞晚说风大。', tone: 'mixed' },
  { id: 'w-ignore', text: '韩迟、江晚宁同框不互动。粉丝剪了「眼神」十六秒，路人说那叫看提词器。', tone: 'mixed' },
  { id: 'w-work', text: '顾辞晚同一天三场直播。评论区问她还睡不睡觉。', tone: 'mixed' },
  { id: 'w-hate', text: '江晚宁新剧未播先骂。选角刚出，原著粉已经准备退款。', tone: 'bad' },
  { id: 'w-audit', text: '白疏影被写「没试镜」。经纪公司发了候场照，没人信。', tone: 'mixed' },
  { id: 'w-school', text: '学院派出来说陆承宴不会演戏。陆承宴回：票房不会说谎。', tone: 'mixed' },
  { id: 'w-award', text: '金桂奖内定传闻又起。组委会点名陈晚秋：「请以公布为准」。', tone: 'mixed' },
  { id: 'w-close', text: '沈照组又在传关门拍。探班的站姐在酒店走廊等到天亮。', tone: 'mixed' },
  { id: 'w-end', text: '宋知夏大结局角色死了。粉籍连夜脱粉，骂得比正片还响。', tone: 'bad' },
  { id: 'w-contract', text: '韩迟解约。前经纪公司凌晨声明，新工作室下午挂牌。', tone: 'mixed' },
  { id: 'w-assist', text: '陆承宴前助理实名爆料。录音真假还没鉴定，律师函已经到了。', tone: 'bad' },
  { id: 'w-age', text: '顾辞晚年龄被扒。户口本和简历差四岁，她说「演的是心态」。', tone: 'bad' },
  { id: 'w-filter', text: '白疏影生图和精修差出一张脸。品牌方还在用精修，广场已经在叠生图。', tone: 'mixed' },
  { id: 'w-lip', text: '韩迟演唱会假唱锤。耳返漏音那一下，粉丝从维护变成对线。', tone: 'bad' },
  { id: 'w-talk', text: '江晚宁采访口误。她把何朗的名字叫错，第二天还在被人剪。', tone: 'bad' },
  { id: 'w-carpet', text: '红毯上顾辞晚踩裙。她笑着捡起来，剪辑只留那一下踉跄。', tone: 'mixed' },
  { id: 'w-surgery', text: '白疏影整容传闻配对比图。她发了旧照，评论说「角度」。', tone: 'mixed' },
  { id: 'w-chart', text: '陆承宴打榜后台被晒。粉丝说「爱豆不容易」，路人说「那是数据」。', tone: 'bad' },
  { id: 'w-unfan', text: '江晚宁脱粉回踩长文。前粉把旧物料一张张翻出来，比黑还细。', tone: 'bad' },
  { id: 'w-hanchi', text: '韩迟新恋情疑云。女方侧脸只有半张，已经有人P成官宣海报。', tone: 'mixed' },
  { id: 'w-wine', text: '饭局照片流出。有人指认盛宴，有人说那是杀青宴。', tone: 'mixed' },
  { id: 'w-stream', text: '宋知夏剧超前点播被骂割。弹幕比正片快两集，剧透组已经开张。', tone: 'mixed' },
  { id: 'w-extra', text: '群演实名说被裴渡组骂。片方回「沟通问题」，视频还在转。', tone: 'bad' },
  { id: 'w-wig', text: '江晚宁古装假发路透。头套边缘比戏还出戏，妆造连夜发长文。', tone: 'mixed' },
  { id: 'w-seat2', text: '颁奖季座位表流出。陈晚秋在第一排，白疏影在侧边。站姐比名单先吵。', tone: 'mixed' },
  { id: 'w-collapse', text: '陆承宴录音还没鉴定完，代言已经撤了三支。', tone: 'bad' },
  { id: 'w-oldlove', text: '韩迟旧恋情录音流出。他这边说酒桌玩笑，女方工作室连夜切割。', tone: 'bad' },
  { id: 'w-cutstudio', text: '陆承宴工作室发声明割席。本人三条之后才转发，粉已经撕开了。', tone: 'bad' },
  { id: 'w-livefail', text: '顾辞晚直播连麦翻车。她把提词器念出声，对面没关麦。', tone: 'mixed' },
  { id: 'w-showfail', text: '顾辞晚走秀踩空。品牌先删视频，路人先截原片。', tone: 'mixed' },
  { id: 'w-nbrush', text: '陈晚秋旧剧被翻出来连刷。弹幕全是现任，原班人马在骂「滚去播新的」。', tone: 'mixed' },
  { id: 'w-biao', text: '江晚宁新剧海报一出，评论只记得陈晚秋那部十年前的。片方说这次不靠旧的活。', tone: 'mixed' },
  { id: 'w-runner', text: '白疏影陪跑第五次。她笑着说「提名就是认可」，镜头切到空座位。', tone: 'mixed' },
  { id: 'w-vote', text: '陆承宴投票倒计时被晒刷票后台。主办方说「系统波动」，榜单已经写死。', tone: 'bad' },
  { id: 'w-sub', text: '字幕组把宋知夏的情话译成口号。原著粉连夜出对照，官方还在用错的。', tone: 'mixed' },
  { id: 'w-cam', text: '路透机位被抓。沈照组清场，站姐在停车场对骂谁泄的地址。', tone: 'mixed' },
  { id: 'w-split', text: '剧宣物料陆承宴、江晚宁分开发。官博隔了十一分钟，两边都说被冷。', tone: 'mixed' },
  { id: 'w-namejoke', text: '江晚宁角色名被谐音梗玩疯。她发了澄清，梗比澄清跑得快。', tone: 'mixed' },
  { id: 'w-table', text: '酒桌座位流出。盛宴坐主位、陆承宴倒酒，比剧情还细。', tone: 'mixed' },
  { id: 'w-copy', text: '版权方换人。江晚宁原班二创全下架，粉丝连夜存图。', tone: 'mixed' },
  { id: 'w-throw', text: '韩迟应援物被扔出场。安保说「按规定」，粉籍连夜脱。', tone: 'bad' },
  { id: 'w-behind', text: '陈晚秋花絮比正片好看。正片评论区在求导演去看花絮组。', tone: 'good' },
  { id: 'w-revive', text: '选秀复活位票数一夜翻倍。节目组说「海外票」，黑说「那是房间」。', tone: 'bad' },
  { id: 'w-ghost', text: '代拍号被锤。同一张「偶遇韩迟」出现在三个城市，定位还开着。', tone: 'mixed' },
  { id: 'w-pr', text: '公关稿把江晚宁写成白疏影。十分钟删帖，截图已经进了广场。', tone: 'mixed' },
  { id: 'w-starferry', text: '《星河渡》超前点播预告先出女二。一半说原著就是这样，一半说又改成恶毒女二。', tone: 'mixed' },
  { id: 'w-starcast', text: '《星河渡》选角名单泄漏。江晚宁女主、陆承宴上神，女二那栏空着。原著粉连夜列不能碰的人设。', tone: 'mixed' },
  { id: 'w-starwig', text: '《星河渡》服化道路透。头套边缘出戏，妆造连夜发长文，说成片为准。', tone: 'mixed' },
  { id: 'w-snowbanquet', text: '《庭前雪》围读传出联姻宴席。女三没有拔剑，只有敬酒和落座。有人说难演。', tone: 'mixed' },
  { id: 'w-sweetclip', text: '《请你偏爱》超前点播只剪退婚。切片号在等摘戒指那一下，女三换了几轮。', tone: 'mixed' },
  { id: 'w-goldtable', text: '《金座》酒桌戏先传。滨江夜宴，投资人把项目按在转盘边上谈。女三那席还没定。', tone: 'mixed' },
  { id: 'w-coat', text: '《白大褂》医顾问组进组。口型、病历、推床路线都要过。齐衡不爱重来。', tone: 'mixed' },
  { id: 'w-noise', text: '《白噪音》剧本围读流出几页。写字楼心理门诊，没有血腥，全是谈话。', tone: 'mixed' },
  { id: 'w-north', text: '《北站》在车站实拍。春运是真的，广播词改了十一稿。有人说能进预告。', tone: 'mixed' },
  { id: 'w-summerip', text: '《盛夏未完》琴房加练路透。原声还是后期，评论已经吵开了。', tone: 'mixed' },
  { id: 'w-unclewater', text: '《我的二舅爷》预告出了通水那天。弹幕在刷我们县也是这样过来的。', tone: 'good' },
  { id: 'w-unnameddoor', text: '沈照《未命名》关门拍。探班只拍到一箱退货的书。圈里当冲奖看。', tone: 'mixed' },
  { id: 'w-cpmeet', text: '《对手戏》路透出了会议室对吵。弹幕已经在嗑，官配粉已经在骂又发糖。', tone: 'mixed' },
  { id: 'w-pepper', text: '《椒房春》女二蕙嫔还没定。后宫、年家、更衣。圈里拿它跟一宫里活十年的戏比。', tone: 'mixed' },
  { id: 'w-redcase', text: '《赤焰案》围读流出拒婚词。梁郡主挂帅，不是来联姻的。', tone: 'mixed' },
  { id: 'w-dust', text: '沈照《隐尘》找女主。西北、土地、病。片酬低，冲奖向。', tone: 'mixed' },
  { id: 'w-youngbook', text: '《少年书》尺度会审。校园、录像、保护。片方要不像说教。', tone: 'mixed' },
  { id: 'w-northwind', text: '《风过北河》注水传闻已经出来。律师那场，顾问组盯口型。', tone: 'mixed' },
  { id: 'w-returner', text: '《故人归》女主三轮试镜。原著粉准备退款。有人和《星河渡》对打热度。', tone: 'mixed' },
  { id: 'w-shore', text: '沈照《岸边》找女主。海边、返乡。圈里当冲影后看。', tone: 'mixed' },
  { id: 'w-weiyang', text: '《未央辞》女主还在选。从更衣到掌事。海报一出，评论只记得旧的那部。', tone: 'mixed' },
  { id: 'w-brocade', text: '《锦衣夜》女二盛宜还在选。宅门、嫡庶、女工。原著粉说别写成恶毒嫡姐。', tone: 'mixed' },
  { id: 'w-longnight', text: '《长夜未明》询问室那场先传。证人不是来解释案情的。真实案件联想已经压了一轮。', tone: 'mixed' },
  { id: 'w-counter', text: '《柜台》会审来过一轮。药房、仿制药、把药递过玻璃。冲奖向，片酬普通。', tone: 'mixed' },
  { id: 'w-painted', text: '沈照《扮相》找女主。戏班、真唱。有人说这是今年电影最难的女主。', tone: 'mixed' },
  { id: 'w-cipher', text: '《密信》试镜要一场把茶端稳。一张脸两套话。会审已经改了两稿。', tone: 'mixed' },
  { id: 'w-citylamp', text: '《城中灯》贺岁档要笑，片方要别演成鸡汤。女主还空着。', tone: 'mixed' },
]

type PlayerLine = {
  id: string
  text: (name: string, extra?: string) => string
  tone: NewsFlash['tone']
  harsh?: boolean
  when: (s: GameState) => boolean
}

const PLAYER: PlayerLine[] = [
  {
    id: 'p-box',
    text: (n) => `${n} 片场吃盒饭`,
    tone: 'good',
    when: (s) => (s.bookings?.length ?? 0) > 0,
  },
  {
    id: 'p-raw',
    text: (n) => `${n} 生图流出`,
    tone: 'mixed',
    when: (s) => s.fans >= 800,
  },
  {
    id: 'p-late',
    text: (n) => `${n} 被曝片场迟到`,
    tone: 'bad',
    harsh: true,
    when: (s) => s.fans >= 3000 && (s.bookings?.length ?? 0) > 0,
  },
  {
    id: 'p-cp',
    text: (n) => `${n} 梁时 机场同框`,
    tone: 'mixed',
    when: (s) => Boolean(s.met.liangshi) && s.favor.liangshi >= 20 && s.fans >= 1500,
  },
  {
    id: 'p-fanwar',
    text: (n) => `${n} 许宁 粉丝互撕`,
    tone: 'bad',
    harsh: true,
    when: (s) => Boolean(s.met.xuning) && s.fans >= 2000,
  },
  {
    id: 'p-rich',
    text: (n) => `${n} 资源咖实锤？`,
    tone: 'bad',
    harsh: true,
    when: (s) => s.identity === 'rich' || (s.met.guyan && s.favor.guyan >= 18),
  },
  {
    id: 'p-house',
    text: (n) => `${n} 新居疑似金主`,
    tone: 'bad',
    harsh: true,
    when: (s) => Boolean(s.flags.guyanHouse) || (s.houseId !== 'share' && s.houseId !== 'dorm' && s.fans >= 4000),
  },
  {
    id: 'p-role',
    text: (n, title) => (title ? `${n} 《${title}》被写成上位` : `${n} 被写成配角上位`),
    tone: 'mixed',
    when: (s) => Boolean(filmingTitle(s)),
  },
  {
    id: 'p-zhou',
    text: (n) => `${n} 经纪人很凶？路透录音`,
    tone: 'mixed',
    when: (s) => Boolean(s.met.zhouheng) && s.fans >= 1200,
  },
  {
    id: 'p-dress',
    text: (n) => `${n} 许宁 红毯撞衫`,
    tone: 'mixed',
    when: (s) => Boolean(s.met.xuning) && s.fans >= 2500,
  },
  {
    id: 'p-talk',
    text: (n) => `${n} 采访口误`,
    tone: 'bad',
    when: (s) => s.fans >= 2000,
  },
  {
    id: 'p-chart',
    text: (n) => `${n} 粉丝掉得很快`,
    tone: 'mixed',
    when: (s) => s.fans >= 8000,
  },
  {
    id: 'p-support',
    text: (n, title) => (title ? `${n} 《${title}》戏份被砍？` : `${n} 戏份被砍？`),
    tone: 'mixed',
    when: (s) => Boolean(filmingTitle(s)),
  },
  {
    id: 'p-ruan',
    text: (n) => `${n} 阮清 片场关系好`,
    tone: 'good',
    when: (s) => Boolean(s.met.ruanqing) && s.favor.ruanqing >= 20,
  },
  {
    id: 'p-song',
    text: (n) => `${n} 宋晚 营业照高度相似`,
    tone: 'mixed',
    when: (s) => Boolean(s.met.songwan),
  },
  {
    id: 'p-shen',
    text: (n) => `${n} 沈照组里那个人`,
    tone: 'good',
    when: (s) => Boolean(s.met.shenzhao) && s.fans >= 1000,
  },
  {
    id: 'p-nobody',
    text: (n) => `${n} 是谁`,
    tone: 'mixed',
    when: (s) => s.fans < 400 && s.week >= 4,
  },
  {
    id: 'p-live',
    text: (n) => `${n} 直播翻车`,
    tone: 'mixed',
    when: (s) => s.fans >= 1500,
  },
  {
    id: 'p-behind',
    text: (n, title) => (title ? `${n} 《${title}》花絮比正片好看` : `${n} 花絮被夸`),
    tone: 'good',
    when: (s) => Boolean(filmingTitle(s)) && s.fans >= 800,
  },
  {
    id: 'p-nbrush',
    text: (n) => `${n} 旧物料被翻出来`,
    tone: 'mixed',
    when: (s) => s.fans >= 2500 && s.finishedScripts.length > 0,
  },
  {
    id: 'p-pr',
    text: (n) => `${n} 公关稿写错名字`,
    tone: 'mixed',
    when: (s) => s.fans >= 1200 && Boolean(s.met.zhouheng),
  },
]

type GossipBeat = {
  id: string
  when: (s: GameState) => boolean
  event: (s: GameState) => GameEvent
  apply: (s: GameState, optionId: string) => string
}

const BEATS: GossipBeat[] = [
  {
    id: 'gossip-raw',
    when: (s) => s.fans >= 600,
    event: (s) => ({
      id: 'gossip-raw',
      title: '生图',
      body: `活动刚结束，营销号就发了${s.name}的现场照片。角度不太好，脸上也没什么光。

评论里已经有人拿精修图做对比。周衡把链接发过来：「不用为几张照片发声明。你要是想回应，就发张正常自拍；不想管也行，明天就有新的热闹。」`,
      options: [
        { id: 'quiet', label: '不回应' },
        { id: 'post', label: '发一张没修的' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'post') {
        s.fans += 180
        s.mood = clamp(s.mood + 4, 0, 108)
        s.news = { text: `${s.name} 发了生图`, tone: 'good', kind: 'hot' }
        return '你发了一张刚拍的自拍，没提那几张生图。评论很快被新照片带走了。'
      }
      s.opinion -= 1
      return '你没有回应。第二天有了新的热搜，那组照片慢慢沉了下去。'
    },
  },
  {
    id: 'gossip-cp',
    when: (s) => Boolean(s.met.liangshi) && s.favor.liangshi >= 18 && s.fans >= 1200,
    event: () => ({
      id: 'gossip-cp',
      title: '同框',
      body: `你和梁时前后脚到机场，被拍到一起过安检。照片里两个人隔着半步，还是被写成了“全程同行”。

梁时发来消息：「我助理说热搜上有我们。你介意的话，我配合回应。」

过了一会儿，他又补了一句：「不是催你。我这边都行。」

周衡问你，要不要联系平台降热度。`,
      options: [
        { id: 'kill', label: '让周衡压下去' },
        { id: 'leave', label: '当没看见' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'kill') {
        s.money = Math.max(0, s.money - 8000)
        bumpFavor(s, 'liangshi', -4)
        bumpFavor(s, 'zhouheng', 3)
        s.news = { text: `${s.name} 工作室回应机场路透`, tone: 'mixed', kind: 'hot' }
        return '周衡联系平台降了热度。梁时回了一句“知道了”，之后没再提。'
      }
      s.fans += 420
      bumpFavor(s, 'liangshi', 5)
      s.hotSearch = { text: `${s.name} 梁时 机场同框`, tone: 'mixed', daysLeft: 4 }
      s.news = { text: `${s.name} 梁时 机场同框`, tone: 'mixed', kind: 'hot' }
      return '你们都没有回应。那组机场照片传了两天，连同款外套都被找了出来。'
    },
  },
  {
    id: 'gossip-resource',
    when: (s) => s.identity === 'rich' || (s.met.guyan && s.fans >= 2000),
    event: (s) => ({
      id: 'gossip-resource',
      title: '资源咖',
      body: `有人把你坐过的车、最近进的组和一张模糊的饭局照片拼在一起，发了条长微博，问你背后到底是谁。

${s.met.zhouheng ? '周衡看完以后说：「家里的事没必要交代。可以发最近的工作记录，也可以不回应。你自己选。」' : '评论区已经替你编出了好几个版本。'}`,
      options: [
        { id: 'work', label: '只发通告照' },
        { id: 'fight', label: '让他们写' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'work') {
        s.fans += 120
        if (s.met.zhouheng) bumpFavor(s, 'zhouheng', 4)
        s.news = { text: `${s.name} 晒通告照`, tone: 'mixed', kind: 'hot' }
        return '你发了这段时间的通告照和剧本批注，没有解释家里的事。有人不信，也有人开始讨论你的戏。'
      }
      s.fans += 80
      s.opinion -= 3
      s.mood = clamp(s.mood - 6, 0, 108)
      s.hotSearch = { text: `${s.name} 资源咖`, tone: 'bad', daysLeft: 4 }
      s.news = { text: `${s.name} 资源咖`, tone: 'bad', kind: 'hot' }
      return '你没有回应。猜测越来越多，连几年前的家庭合照也被翻了出来。'
    },
  },
  {
    id: 'gossip-fans',
    when: (s) => Boolean(s.met.xuning) && s.fans >= 1800,
    event: () => ({
      id: 'gossip-fans',
      title: '两家',
      body: `许宁的粉丝先指责你借同组关系炒作。你的粉丝很快反击，说片场镜头本来就不属于谁。

两边开始翻旧路透。有一张你让位，有一张她抢戏。真假已经不重要。

周衡打来电话：「两边工作室可以一起发句话，也可以先冷处理。你想怎么做？」`,
      options: [
        { id: 'pay', label: '花钱压一压' },
        { id: 'open', label: '让他们吵' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'pay') {
        s.money = Math.max(0, s.money - 12000)
        bumpFavor(s, 'xuning', 4)
        s.news = { text: `${s.name} 许宁 粉丝互撕 降温`, tone: 'mixed', kind: 'gossip' }
        return '两边工作室发了同样的剧组宣传照，平台也降了热度。争吵慢慢停了。许宁没有联系你。'
      }
      const loss = Math.max(100, Math.round(s.fans * 0.03))
      s.fans = Math.max(0, s.fans - loss)
      bumpFavor(s, 'xuning', -6)
      s.hotSearch = { text: `${s.name} 许宁 粉丝互撕`, tone: 'bad', daysLeft: 5 }
      s.news = { text: `${s.name} 许宁 粉丝互撕`, tone: 'bad', kind: 'hot' }
      s.opinion -= 2
      return '你们都没有回应。两边越吵越凶，路人只记住了你和许宁关系不好。'
    },
  },
  {
    id: 'gossip-box',
    when: (s) => (s.bookings?.length ?? 0) > 0,
    event: (s) => {
      const title = filmingTitle(s) ?? '组里'
      return {
        id: 'gossip-box',
        title: '盒饭',
        body: `有人拍到你在《${title}》片场吃盒饭。你坐在道具箱旁边，头发还保持着上一场戏的造型。

营销号夸你“接地气”，评论里也有人觉得只是普通工作照。

周衡把照片发给你：「拍得还行。想转就转，不想转也不用配合。」`,
        options: [
          { id: 'post', label: '转了，配一句好饿' },
          { id: 'quiet', label: '当没看见' },
        ],
      }
    },
    apply: (s, optionId) => {
      if (optionId === 'post') {
        s.fans += 260
        s.mood = clamp(s.mood + 3, 0, 108)
        s.news = { text: `${s.name} 片场盒饭`, tone: 'good', kind: 'hot' }
        return '你转发照片，配了一句“那天真的很饿”。评论区开始问剧什么时候播。'
      }
      s.fans += 40
      return '你没有转发。那张照片在几个剧组账号之间传了两天。'
    },
  },
  {
    id: 'gossip-late',
    when: (s) => (s.bookings?.length ?? 0) > 0 && s.fans >= 2500,
    event: () => ({
      id: 'gossip-late',
      title: '迟到',
      body: `有人发帖说你昨天迟到，让全组等了很久。

你记得自己踩着通告时间进门，没有提前，但也没有迟到。帖子里没有完整视频，只有一张工作人员看表的照片。

周衡找到当天的进场记录：「可以把时间发出去。也可以不理，但这口锅暂时会在你头上。」`,
      options: [
        { id: 'deny', label: '发通告时间截图' },
        { id: 'quiet', label: '不解释' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'deny') {
        s.fans += 90
        if (s.met.zhouheng) bumpFavor(s, 'zhouheng', 3)
        s.news = { text: `${s.name} 回应片场迟到`, tone: 'mixed', kind: 'hot' }
        return '工作室发了进场记录。大部分人接受了解释，也有人坚持说你只是卡点。'
      }
      const loss = Math.max(80, Math.round(s.fans * 0.025))
      s.fans = Math.max(0, s.fans - loss)
      s.mood = clamp(s.mood - 5, 0, 108)
      s.hotSearch = { text: `${s.name} 片场迟到`, tone: 'bad', daysLeft: 4 }
      s.news = { text: `${s.name} 片场迟到`, tone: 'bad', kind: 'hot' }
      return '你没有解释。“全组等她”的说法越传越真，连不在现场的人也开始讲细节。'
    },
  },
  {
    id: 'gossip-tower',
    when: (s) => Boolean(s.met.guyan) && s.favor.guyan >= 16,
    event: () => ({
      id: 'gossip-tower',
      title: '楼下',
      body: `有人拍到你晚上进嘉尚影业所在的大楼。照片里脸不算清楚，车牌却拍得很完整。

顾宴川的助理联系你：「公司可以说明当晚有项目会，顾总让我先问你的意见。」

如果不回应，外面大概还会继续猜。`,
      options: [
        { id: 'cover', label: '当探班通稿' },
        { id: 'quiet', label: '什么都不发' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'cover') {
        bumpFavor(s, 'guyan', 4)
        s.fans += 150
        s.news = { text: `${s.name} 嘉尚探班`, tone: 'mixed', kind: 'hot' }
        return '公司发了当晚项目会的照片。有人接受解释，也有人说照片是后来补拍的。'
      }
      s.opinion -= 2
      bumpFavor(s, 'guyan', 2)
      s.hotSearch = { text: `${s.name} 夜访嘉尚`, tone: 'mixed', daysLeft: 3 }
      s.news = { text: `${s.name} 夜访嘉尚`, tone: 'mixed', kind: 'hot' }
      return '你们都没有回应。照片里的车和时间被来回分析，猜测越来越具体。'
    },
  },
  {
    id: 'gossip-talk',
    when: (s) => s.fans >= 1800,
    event: () => ({
      id: 'gossip-talk',
      title: '口误',
      body: `采访时，你把一部旧剧的导演名字念错了。原视频里只有半秒，很快被人单独剪出来，放慢重播了三遍。

评论里有人纠正读音，也有人说你根本没做功课。

周衡问你要不要直接认错。`,
      options: [
        { id: 'sorry', label: '发一条：是我念错了' },
        { id: 'quiet', label: '当音轨问题' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'sorry') {
        s.fans += 70
        s.opinion += 2
        s.news = { text: `${s.name} 回应采访口误`, tone: 'good', kind: 'hot' }
        return '你发文承认自己念错了，也补上了正确名字。导演本人回了一个笑脸。'
      }
      s.fans = Math.max(0, s.fans - Math.max(60, Math.round(s.fans * 0.02)))
      s.mood = clamp(s.mood - 4, 0, 108)
      s.hotSearch = { text: `${s.name} 采访口误`, tone: 'bad', daysLeft: 3 }
      s.news = { text: `${s.name} 采访口误`, tone: 'bad', kind: 'hot' }
      return '你没有回应。那段三秒视频继续传播，后来甚至有人以为你说错了整段采访。'
    },
  },
  {
    id: 'gossip-dress',
    when: (s) => Boolean(s.met.xuning || s.met.songwan) && s.fans >= 1500,
    event: (s) => {
      const who = s.met.xuning ? '许宁' : '宋晚'
      return {
        id: 'gossip-dress',
        title: '撞衫',
        body: `同场活动上，你和${who}穿了同系列的裙子，款式几乎一样，只差颜色。

${who}先发了后台自拍。很快有人把你们的照片放在一起，评论区开始争谁穿得更好看。

助理问你原定的照片还发不发。`,
        options: [
          { id: 'post', label: '再发一张，不当回事' },
          { id: 'quiet', label: '走完场，不回' },
        ],
      }
    },
    apply: (s, optionId) => {
      const who = s.met.xuning ? 'xuning' : 'songwan'
      if (optionId === 'post') {
        s.fans += 200
        bumpFavor(s, who, -3)
        s.news = { text: `${s.name} ${NPC_NAME[who]} 撞衫`, tone: 'mixed', kind: 'hot' }
        return '你照常发了原定的活动照片，没有提撞衫。评论还是比较了很久。'
      }
      bumpFavor(s, who, 2)
      return '你没有发照片。对比图依然传开了，但争论没有继续升级。'
    },
  },
  {
    id: 'gossip-weibo',
    when: (s) => s.fans >= 2500,
    event: () => ({
      id: 'gossip-weibo',
      title: '两篇稿',
      body: `同一天，两个营销号用了同一张路透。一个夸你状态好、资源稳，另一个说你后续乏力、很快会被新人替代。

周衡把对方的报价截图发来：「都是收钱写稿。可以买一篇正常的工作宣传，也可以一篇都不碰。」

她又提醒了一句：「买了不保证没人骂，只是让真正的通告别被这些话盖住。」`,
      options: [
        { id: 'buy', label: '买一条工作向的' },
        { id: 'leave', label: '让他们自己打' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'buy') {
        s.money = Math.max(0, s.money - 15000)
        s.fans += 380
        s.opinion -= 2
        s.news = { text: `${s.name} 通告曝光`, tone: 'good', kind: 'hot' }
        return '团队发了一篇正常的进组宣传。负面稿还在，但至少搜索结果里也出现了你的工作。'
      }
      s.mood = clamp(s.mood - 3, 0, 108)
      s.news = { text: `${s.name} 两极评价`, tone: 'mixed', kind: 'gossip' }
      return '你没有买稿。两篇文章吵了一天，第二天一起被新的热搜压了下去。'
    },
  },
  {
    id: 'gossip-tip',
    when: (s) => s.week >= 3 && s.fans >= 200,
    event: () => ({
      id: 'gossip-tip',
      title: '爆料',
      body: `一个营销号私信你，说手里有别的剧组的录音，问你想不想提前听。

周衡看完直接说：「链接别点。要么当没收到，要么花钱让他们把话题引到别人身上。」

她把手机放回你面前：「第二种做法不违法，但也不体面。你自己决定。」`,
      options: [
        { id: 'ignore', label: '当没收到' },
        { id: 'push', label: '让他们写别人' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'push') {
        s.money = Math.max(0, s.money - 6000)
        s.opinion -= 4
        if (s.met.zhouheng) bumpFavor(s, 'zhouheng', -2)
        s.news = { text: '圈内爆料 指向不明', tone: 'bad', kind: 'gossip' }
        return '营销号把注意力转向了另一个人。你的名字没有出现，但你很清楚这件事并没有消失。'
      }
      s.mood = clamp(s.mood - 2, 0, 108)
      if (s.met.zhouheng) bumpFavor(s, 'zhouheng', 2)
      return '你没有回复，也没有点开链接。过了几个小时，对方撤回了消息。'
    },
  },
  {
    id: 'gossip-behind',
    when: (s) => (s.bookings?.length ?? 0) > 0 && s.fans >= 500,
    event: (s) => {
      const title = filmingTitle(s) ?? '组里'
      return {
        id: 'gossip-behind',
        title: '花絮',
        body: `《${title}》的一段未公开花絮被人传了出来。视频里有你笑场、和同组演员对词，也有被导演叫停重来的画面。

评论意外不错，很多人说比正式预告更有意思。官博来问，要投诉删除，还是顺势当作预热。`,
        options: [
          { id: 'keep', label: '当预热' },
          { id: 'cut', label: '让他们删' },
        ],
      }
    },
    apply: (s, optionId) => {
      if (optionId === 'keep') {
        s.fans += 320
        s.news = { text: `${s.name} 花絮流出`, tone: 'good', kind: 'hot' }
        return '官博没有删，还转发了一张正式剧照。有人顺着花絮开始关注这部戏。'
      }
      if (s.met.zhouheng) bumpFavor(s, 'zhouheng', 2)
      return '泄露的视频很快被删除，但已经有人保存下来，偶尔还会在评论区出现。'
    },
  },
  {
    id: 'gossip-nbrush',
    when: (s) => s.finishedScripts.length > 0 && s.fans >= 1800,
    event: (s) => {
      const old = scriptById(s.finishedScripts[s.finishedScripts.length - 1])
      const title = old?.title ?? '旧剧'
      return {
        id: 'gossip-nbrush',
        title: '翻出来',
        body: `最近有人重新看《${title}》，把你的几场戏剪到了一起。

弹幕里有人第一次注意到你，也有人拿当时的造型和现在比较。

周衡问要不要联系官博转发旧物料，让这波讨论持续久一点。`,
        options: [
          { id: 'repost', label: '让官博转旧物料' },
          { id: 'quiet', label: '不掺和' },
        ],
      }
    },
    apply: (s, optionId) => {
      if (optionId === 'repost') {
        s.fans += 240
        s.news = { text: `${s.name} 旧作为什么火了`, tone: 'mixed', kind: 'gossip' }
        return '官博转发了旧花絮。有人开始补剧，也有人嫌团队太会抓热度。'
      }
      return '你没有参与。那支剪辑自然传播了几天，给你带来了一些新关注。'
    },
  },
]

export function gossipPlaza(state: GameState): { user: string; text: string }[] {
  const n = rng(state, 44)
  const open = WORLD.filter((w) => worldOpen(state.week, w))
  const pick = open[Math.floor(n() * open.length)]
  const extra = [
    { user: '营销号', text: pick.text },
    { user: '路人', text: n() > 0.5 ? '先转再看。真假以后再说。' : '又是这套。' },
    { user: '圈内小号', text: n() > 0.5 ? '这事组里传过。别写我。' : '声明一出，就是坐实了一半。' },
  ]
  if (state.news?.kind === 'gossip' || state.news?.kind === 'hot') {
    extra.push({ user: '截图的人', text: state.news.text })
  }
  return extra.slice(0, 3)
}

export function applyGossipChoice(state: GameState, eventId: string, optionId: string): string {
  const beat = BEATS.find((b) => b.id === eventId)
  if (!beat) return ''
  return beat.apply(state, optionId)
}

export function maybeGossip(state: GameState) {
  if (state.week < 2 || state.event) return
  if (state.flags[`gW:${state.week}`]) return
  const roll = rng(state, 9)()
  const events = BEATS.filter((b) => b.when(state) && !marked(state, b.id))

  if (state.news) {
    if (events.length && roll >= 0.22) {
      const beat = events[Math.floor(rng(state, 21)() * events.length)]
      mark(state, beat.id)
      state.event = beat.event(state)
    }
    return
  }

  if (roll < 0.16) return

  if (roll < 0.48 && events.length) {
    const beat = events[Math.floor(rng(state, 21)() * events.length)]
    mark(state, beat.id)
    state.event = beat.event(state)
    return
  }

  const playerPool = PLAYER.filter((p) => p.when(state) && !marked(state, p.id))
  if (roll < 0.72 && playerPool.length) {
    const line = playerPool[Math.floor(rng(state, 33)() * playerPool.length)]
    mark(state, line.id)
    const title = filmingTitle(state) ?? undefined
    const text = line.text(state.name, title ?? undefined)
    if (line.harsh && line.tone === 'bad') {
      const loss = Math.max(80, Math.round(state.fans * 0.04))
      state.fans = Math.max(0, state.fans - loss)
      state.opinion = clamp(state.opinion - 2, -40, 40)
      state.hotSearch = { text, tone: 'bad', daysLeft: 4 }
      state.news = { text, tone: 'bad', kind: 'hot' }
      return
    }
    if (line.tone === 'good') sFans(state, 80)
    state.news = { text, tone: line.tone, kind: line.tone === 'good' || line.tone === 'bad' ? 'hot' : 'gossip' }
    if (line.tone === 'bad') state.hotSearch = { text, tone: 'bad', daysLeft: 3 }
    return
  }

  const worldPool = WORLD.filter((w) => !marked(state, w.id) && worldOpen(state.week, w))
  const fallback = WORLD.filter((w) => worldOpen(state.week, w))
  const pool = worldPool.length ? worldPool : fallback
  const world = pool[Math.floor(rng(state, 71)() * pool.length)]
  mark(state, world.id)
  state.news = { text: world.text, tone: world.tone, kind: 'gossip' }
}

function sFans(state: GameState, n: number) {
  state.fans = Math.max(0, state.fans + n)
}
