import type { ActionId, Attrs, IdentityId, NpcId, Slot } from './types'
import { scriptById as scriptFromPool } from './scripts'

export type IdentityDef = {
  id: IdentityId
  name: string
  blurb: string
  money: number
  stamina: number
  mood: number
  attrs: Attrs
  houseId: string
  flags: string[]
  intro: string
}

export const IDENTITIES: IdentityDef[] = [
  {
    id: 'college',
    name: '刚毕业的大学生',
    blurb: '毕业三个月，家里还以为你在准备考研。',
    money: 20000,
    stamina: 80,
    mood: 70,
    attrs: {
      looks: 45,
      acting: 22,
      talent: 32,
      speech: 42,
      poise: 30,
      fashion: 28,
      wit: 55,
      fitness: 42,
      confidence: 38,
    },
    houseId: 'share',
    flags: [],
    intro: `毕业三个月。家里还以为你在准备考研。

书摊在桌上，书签停在第十七页。

手机倒是每天从早响到晚。群演群、剧组临时工、谁缺一个过马路的女生。

你点开过那些通告。片酬很少，地址更远，要求却写得很清楚：女，十八到二十五，会哭更好。

这个月房租还差一点。合租的那间房，隔壁夜里总在打电话，声音透过墙，像别人的戏。

群里有人发了家影视公司的地址。说可以去见经纪人，不收报名费。

你把那条消息置顶，又取消，再置顶。

衣服换了两套。镜子里的人还是学生的脸。

你出门的时候，把自己的简历折好，塞进包最里面。

万一呢。`,
  },
  {
    id: 'film',
    name: '电影学院毕业',
    blurb: '刚签了一家小公司，还住在学校附近的宿舍。',
    money: 50000,
    stamina: 70,
    mood: 58,
    attrs: {
      looks: 50,
      acting: 55,
      talent: 40,
      speech: 33,
      poise: 46,
      fashion: 36,
      wit: 44,
      fitness: 40,
      confidence: 34,
    },
    houseId: 'dorm',
    flags: ['signed', 'filmSchool'],
    intro: `毕业以后，你签了一家不大的公司。宿舍还是原来那间。

对门昨晚练哭戏练到两点。你隔着墙，能把她的台词背下来。

走廊里永远有人在对词。有人练到哭，有人练到笑，有人把同一句说了二十遍，还是不像。

你的毕业大戏得过系里的奖。那时候老师会说「你是这块料」。

出了校门，没有人再这样说。

上午，经纪人发来一句：「十点，公司见。别迟到。」

你把毕业大戏的照片从简历第一页拿掉，又放回去。

学校里的成绩已经结束了。

今天开始，没人因为你是科班，就多给你一次机会。`,
  },
  {
    id: 'rich',
    name: '富二代',
    blurb: '家里替你开了门，但没人保证你能留下。',
    money: 800000,
    stamina: 62,
    mood: 74,
    attrs: {
      looks: 62,
      acting: 15,
      talent: 24,
      speech: 30,
      poise: 52,
      fashion: 68,
      wit: 40,
      fitness: 34,
      confidence: 58,
    },
    houseId: 'share',
    flags: ['signed', 'familyWatch'],
    intro: `你说想当演员的那天，饭桌上没有人先开口。

父亲看了母亲一眼。母亲把杯子转了一圈。

第三天，经纪人的电话直接发到了你手机上。没有人问你为什么，也没有人说支持。

只是把门打开了。

车停在公司楼下。司机问要不要陪你上去。你说不用。

网上已经有人猜你是不是要出道。评论里一半说有钱真好，一半等着看笑话。

他们不知道的是，你连正式镜头都没站过。

包里有一份简历，是家里找人写的。你在车上把第一页的「资源」两个字折了起来。

你把手机调成静音。

自己推门进去。`,
  },
]

export type ActionDef = {
  id: ActionId
  name: string
  slot: Slot | 'any'
  kind: 'rest' | 'train' | 'job' | 'company' | 'film' | 'promo' | 'show' | 'live' | 'mall' | 'life' | 'social' | 'story' | 'agency'
  desc: string
  money?: number
  stamina?: number
  mood?: number
  attr?: Partial<Attrs>
  fans?: number
  need?: Partial<Attrs>
  npcId?: NpcId
}

export const ACTIONS: ActionDef[] = [
  { id: 'rest', name: '休息', slot: 'day', kind: 'rest', desc: '关掉闹钟，好好睡一觉。' },
  { id: 'salon', name: '美容院', slot: 'day', kind: 'train', desc: '做一次皮肤护理。', money: -1800, stamina: 4, mood: 10, attr: { looks: 2 } },
  { id: 'train-acting', name: '表演课', slot: 'day', kind: 'train', desc: '排一下午对手戏。', money: -3200, stamina: -22, mood: -4, attr: { acting: 3 } },
  { id: 'train-talent', name: '声乐 / 编舞', slot: 'day', kind: 'train', desc: '练声，再把舞顺一遍。', money: -3000, stamina: -24, mood: -3, attr: { talent: 3, fitness: 1 } },
  { id: 'train-speech', name: '口才课', slot: 'day', kind: 'train', desc: '练采访和临场回答。', money: -2400, stamina: -16, mood: -2, attr: { speech: 3 } },
  { id: 'train-confidence', name: '镜头课', slot: 'day', kind: 'train', desc: '对着机器练站、练看镜头。', money: -2400, stamina: -16, mood: -2, attr: { confidence: 3 } },
  { id: 'train-poise', name: '礼仪课', slot: 'day', kind: 'train', desc: '从走路坐姿重新练起。', money: -2800, stamina: -14, mood: 2, attr: { poise: 3 } },
  { id: 'train-fashion', name: '造型课', slot: 'day', kind: 'train', desc: '学着自己挑衣服和妆面。', money: -2600, stamina: -14, attr: { fashion: 3 } },
  { id: 'train-wit', name: '商业课', slot: 'day', kind: 'train', desc: '学合同、报价和行业规矩。', money: -2200, stamina: -12, attr: { wit: 3 } },
  { id: 'train-fit', name: '健身', slot: 'day', kind: 'train', desc: '跟着教练练一下午。', money: -900, stamina: -26, mood: 4, attr: { fitness: 3 } },
  { id: 'job-cafe', name: '咖啡店兼职', slot: 'day', kind: 'job', desc: '在咖啡店顶一天班。', money: 900, stamina: -18, attr: { speech: 1 } },
  { id: 'job-sing', name: '酒吧驻唱', slot: 'day', kind: 'job', desc: '唱完今晚的三轮歌。', money: 1500, stamina: -20, mood: 2, attr: { talent: 2 } },
  { id: 'job-extra', name: '剧组群演', slot: 'day', kind: 'job', desc: '跟着群演队伍跑一天。', money: 700, stamina: -24, attr: { acting: 1 } },
  { id: 'job-warmup', name: '商演暖场', slot: 'day', kind: 'job', desc: '带气氛。', money: 1200, stamina: -16, attr: { speech: 1, confidence: 1 } },
  { id: 'job-counter', name: '化妆品专柜', slot: 'day', kind: 'job', desc: '试妆、补货。', money: 500, stamina: -14, attr: { looks: 1 } },
  { id: 'company', name: '去影视公司', slot: 'day', kind: 'company', desc: '去坐一坐。', stamina: -10 },
  { id: 'label', name: '去唱片公司', slot: 'day', kind: 'company', desc: '去听小样。', stamina: -10 },
  { id: 'media', name: '去媒体公司', slot: 'day', kind: 'company', desc: '去看环节。', stamina: -10 },
  { id: 'film', name: '拍戏', slot: 'day', kind: 'film', desc: '去片场。' },
  { id: 'promo', name: '宣传通告', slot: 'day', kind: 'promo', desc: '路演、采访、物料。' },
  {
    id: 'show-variety',
    name: '垫场小综艺',
    slot: 'day',
    kind: 'show',
    desc: '小节目。',
    money: 4000,
    stamina: -28,
    mood: -6,
    attr: { speech: 2, fitness: 1, confidence: 1 },
    fans: 800,
    need: { speech: 42, fitness: 40 },
  },
  { id: 'live', name: '直播', slot: 'day', kind: 'live', desc: '开播。', stamina: -22, mood: -8, need: { speech: 38, looks: 42 } },
  { id: 'mall', name: '去商场', slot: 'day', kind: 'mall', desc: '买衣服。', mood: 8 },
  { id: 'agency', name: '房屋中介', slot: 'day', kind: 'agency', desc: '看房。', stamina: -8 },
  { id: 'park', name: '公园', slot: 'day', kind: 'life', desc: '走路。', stamina: 16, mood: 8 },
  { id: 'cinema', name: '电影院', slot: 'day', kind: 'life', desc: '坐两小时。', money: -80, stamina: 6, mood: 14 },
  { id: 'story-bar', name: '去听驻唱', slot: 'eve', kind: 'story', desc: '隔音房门口。', stamina: -8, mood: 2 },
  { id: 'story-home', name: '家里的局', slot: 'eve', kind: 'story', desc: '晚宴。', stamina: -8 },
  { id: 'story-dinner', name: '赴局', slot: 'eve', kind: 'story', desc: '投资人请客。', stamina: -8, mood: 2 },
  { id: 'date-zhouheng', name: '对行程 · 周衡', slot: 'eve', kind: 'social', desc: '对档期。', money: -600, stamina: -10, mood: 4, npcId: 'zhouheng' },
  { id: 'date-liangshi', name: '约会 · 梁时', slot: 'eve', kind: 'social', desc: '互呛。', money: -800, stamina: -12, mood: 8, npcId: 'liangshi' },
  { id: 'date-guyan', name: '约会 · 顾宴川', slot: 'eve', kind: 'social', desc: '局很大。', money: 0, stamina: -8, mood: 10, npcId: 'guyan' },
  { id: 'date-xuning', name: '见面 · 许宁', slot: 'eve', kind: 'social', desc: '不是朋友局。', money: -500, stamina: -10, mood: -2, npcId: 'xuning' },
  { id: 'date-ruanqing', name: '见面 · 阮清', slot: 'eve', kind: 'social', desc: '对词。', money: -400, stamina: -10, mood: 8, npcId: 'ruanqing' },
  { id: 'date-songwan', name: '见面 · 宋晚', slot: 'eve', kind: 'social', desc: '表面客气。', money: -700, stamina: -8, mood: 2, npcId: 'songwan' },
]

export type ItemDef = {
  id: string
  name: string
  kind: 'cosmetic' | 'clothes' | 'jewelry'
  wear?: 'daily' | 'carpet' | 'jewel'
  price: number
  desc: string
  looks?: number
  fashion?: number
  poise?: number
  confidence?: number
  days?: number
}

export const ITEMS: ItemDef[] = [
  { id: 'lip', name: '平价口红', kind: 'cosmetic', price: 800, desc: '日常颜色，上镜也不突兀。', looks: 2, days: 7 },
  { id: 'mask', name: '面膜', kind: 'cosmetic', price: 2400, desc: '连着熬夜以后正好用。', looks: 2, days: 6 },
  { id: 'nail', name: '美甲', kind: 'cosmetic', price: 1600, desc: '颜色干净，拍手部特写也合适。', looks: 1, fashion: 1, days: 5 },
  { id: 'base', name: '专柜粉底', kind: 'cosmetic', price: 3500, desc: '妆效自然，带妆久了也不容易斑驳。', looks: 3, confidence: 1, days: 10 },
  { id: 'scent', name: '香氛', kind: 'cosmetic', price: 4200, desc: '靠近才闻得见。', looks: 1, confidence: 2, days: 8 },
  { id: 'cream', name: '护肤套', kind: 'cosmetic', price: 6800, desc: '柜员说坚持用。', looks: 4, days: 12 },
  { id: 'device', name: '家用仪器', kind: 'cosmetic', price: 9800, desc: '晚上对着镜子用。', looks: 4, confidence: 1, days: 14 },
  { id: 'tee', name: '白 T 日常', kind: 'clothes', wear: 'daily', price: 1200, desc: '出门穿的。', fashion: 1 },
  { id: 'jeans', name: '牛仔裤', kind: 'clothes', wear: 'daily', price: 2600, desc: '洗过很多遍的那种。', fashion: 2 },
  { id: 'vintage', name: '古着外套', kind: 'clothes', wear: 'daily', price: 3200, desc: '版型特别，不太容易撞款。', fashion: 2 },
  { id: 'sport', name: '运动套', kind: 'clothes', wear: 'daily', price: 3400, desc: '舒服耐穿，训练和赶路都方便。', fashion: 1, confidence: 1 },
  { id: 'knit', name: '针织开衫', kind: 'clothes', wear: 'daily', price: 4800, desc: '领口干净。', fashion: 2, poise: 1 },
  { id: 'silk', name: '真丝衬衫', kind: 'clothes', wear: 'daily', price: 9600, desc: '剪裁利落，正式场合也能穿。', fashion: 3, looks: 1 },
  { id: 'coat', name: '风衣', kind: 'clothes', wear: 'daily', price: 12800, desc: '简单耐穿，路透里也不会出错。', fashion: 3, poise: 1 },
  { id: 'xiang', name: '小香风套装', kind: 'clothes', wear: 'daily', price: 18000, desc: '适合活动和正式见面。', fashion: 4, poise: 2 },
  { id: 'designer', name: '设计师裙', kind: 'clothes', wear: 'daily', price: 38000, desc: '认得出的人会点头。', fashion: 6, poise: 2, looks: 1 },
  { id: 'carpet-black', name: '黑礼裙', kind: 'clothes', wear: 'carpet', price: 22000, desc: '红毯才用得上。', fashion: 5, poise: 2 },
  { id: 'carpet-white', name: '白礼裙', kind: 'clothes', wear: 'carpet', price: 32000, desc: '站在灯下面会亮。', fashion: 5, poise: 3 },
  { id: 'carpet-film', name: '电影节套装', kind: 'clothes', wear: 'carpet', price: 56000, desc: '记者会先拍这一身。', fashion: 6, poise: 3 },
  { id: 'carpet-gold', name: '高定', kind: 'clothes', wear: 'carpet', price: 98000, desc: '借的和买的，镜头分得清。', fashion: 8, poise: 4, looks: 1 },
  { id: 'silver', name: '银耳钉', kind: 'jewelry', wear: 'jewel', price: 2000, desc: '小小的亮。', looks: 1 },
  { id: 'chain', name: '细项链', kind: 'jewelry', wear: 'jewel', price: 5600, desc: '领口里面。', looks: 1, fashion: 1 },
  { id: 'bag', name: '小包', kind: 'jewelry', wear: 'jewel', price: 16800, desc: '容量不大，参加活动刚好。', fashion: 3 },
  { id: 'pearl', name: '珍珠耳钉', kind: 'jewelry', wear: 'jewel', price: 15000, desc: '安静一点。', looks: 2, poise: 1 },
  { id: 'bangle', name: '金镯', kind: 'jewelry', wear: 'jewel', price: 28000, desc: '举手会被拍到。', looks: 2, poise: 2 },
  { id: 'watch', name: '手表', kind: 'jewelry', wear: 'jewel', price: 42000, desc: '对行程的时候会看一眼。', poise: 2, confidence: 1 },
  { id: 'diamond', name: '钻石耳钉', kind: 'jewelry', wear: 'jewel', price: 76000, desc: '近了才知道是真的。', looks: 3, poise: 1 },
]

export type HouseDef = {
  id: string
  name: string
  price: number
  staMul: number
  moodMul: number
  moodCapBonus: number
  desc: string
}

export const HOUSES: HouseDef[] = [
  { id: 'share', name: '合租', price: 0, staMul: 1, moodMul: 1, moodCapBonus: 0, desc: '隔音不好。' },
  { id: 'dorm', name: '宿舍', price: 0, staMul: 1, moodMul: 0.95, moodCapBonus: 0, desc: '走廊里全是对白。' },
  { id: 'room', name: '开间', price: 88000, staMul: 1.1, moodMul: 1.1, moodCapBonus: 2, desc: '门能锁。厨房在门口。' },
  { id: 'studio', name: '一居', price: 250000, staMul: 1.2, moodMul: 1.2, moodCapBonus: 4, desc: '能关门。' },
  { id: 'loft', name: '两居', price: 520000, staMul: 1.35, moodMul: 1.38, moodCapBonus: 6, desc: '衣帽间能挂礼裙。' },
  { id: 'river', name: '江景', price: 1200000, staMul: 1.5, moodMul: 1.5, moodCapBonus: 8, desc: '江从窗户里进来。' },
  { id: 'pent', name: '顶层', price: 2600000, staMul: 1.7, moodMul: 1.7, moodCapBonus: 14, desc: '电梯要刷卡。客厅能听见风。' },
]

export type TripDef = {
  id: string
  name: string
  days: number
  price: number
  desc: string
  attr: Partial<Attrs>
  daysText: string[]
  nightText: string
  endLine: string
}

export const TRIPS: TripDef[] = [
  {
    id: 'onsen',
    name: '近郊温泉',
    days: 2,
    price: 8000,
    desc: '出城住两晚，泡温泉，也去附近走走。',
    attr: { poise: 1, fitness: 1 },
    daysText: [
      '车开出城区以后，消息终于少了一点。傍晚到酒店，你在房间里看见了远处的山。',
      '你泡完温泉，在休息区睡了半小时。回程路上又从上车睡到了下车。',
    ],
    nightText: '晚上没有行程。你把手机调成静音，很早就睡了。',
    endLine: '两天过得很快。回程路上，你难得没有打开工作群。',
  },
  {
    id: 'mountain',
    name: '山里',
    days: 3,
    price: 12000,
    desc: '三天。信号差，客栈的被子有太阳味道。',
    attr: { fitness: 2, wit: 1 },
    daysText: [
      '山里信号不太好。你放下手机，在客栈院子里晒了很久太阳。',
      '你跟着民宿老板走了一段山路，回来以后胃口比平时好了很多。',
      '下山时腿还有点酸。车开回城区，手机一下跳出了几十条消息。',
    ],
    nightText: '山里入夜很安静。你早早睡下，一觉到天亮。',
    endLine: '三天没看通告，再打开工作群时，你竟然有点想念片场。',
  },
  {
    id: 'sea',
    name: '海边',
    days: 3,
    price: 22000,
    desc: '三天。风里是盐。没有镜头。',
    attr: { looks: 1, fitness: 1, confidence: 1 },
    daysText: [
      '飞机落地后，你直接去了酒店。房间窗外就是沙滩，工作群暂时没人找你。',
      '你认真涂了两层防晒，在海边待到傍晚。没人认识你，也没人举着手机拍。',
      '回程的航班晚点。你还是把最后那一点睡补上了。',
    ],
    nightText: '晚上只听得见海浪。你没有定闹钟。',
    endLine: '回程的航班晚点。你还是把最后那一点睡补上了。',
  },
  {
    id: 'abroad',
    name: '出国散心',
    days: 4,
    price: 48000,
    desc: '四天。没有人认识你。展馆比片场安静。',
    attr: { fashion: 2, poise: 1, confidence: 1 },
    daysText: [
      '落地以后，你一边找行李，一边手忙脚乱地打开翻译软件。',
      '你在展馆待了一下午。周围没人认识你，可以放心站在一幅画前看很久。',
      '你逛了旧街和市集，走到手机提醒今天已经两万步。',
      '回程前一晚，你还是没倒过时差，却已经开始收拾给朋友带的东西。',
    ],
    nightText: '时差让你半夜还很清醒。你看了会儿电影，困了才睡。',
    endLine: '回国时还没完全倒过时差，但整个人已经轻松了很多。',
  },
]

export function tripById(id: string): TripDef | undefined {
  return TRIPS.find((t) => t.id === id)
}

export function houseRank(id: string): number {
  if (id === 'share' || id === 'dorm') return 0
  if (id === 'room') return 1
  if (id === 'studio') return 2
  if (id === 'loft') return 3
  if (id === 'river') return 4
  if (id === 'pent') return 5
  return 0
}

export type NpcKind = 'agent' | 'romance' | 'peer' | 'director' | 'hidden'

export const NPC_KIND: Record<NpcId, NpcKind> = {
  zhouheng: 'agent',
  liangshi: 'romance',
  guyan: 'romance',
  xuning: 'peer',
  ruanqing: 'peer',
  songwan: 'peer',
  shenzhao: 'director',
  peiyu: 'hidden',
  hanchi: 'hidden',
}

export const NPC_ORDER: NpcId[] = ['zhouheng', 'liangshi', 'guyan', 'xuning', 'ruanqing', 'songwan', 'shenzhao']

export const NPC_BIO: Record<NpcId, { role: string; who: string }> = {
  zhouheng: {
    role: '经纪人',
    who: '三十二岁，做经纪人第八年。时间观念很重，说话直接，习惯把关心藏在行程表和合同批注里。常喝不加糖的美式，但其实怕苦。',
  },
  peiyu: {
    role: '同期',
    who: '独立厂牌的新人歌手。慢热，有点社恐，紧张时会反复确认歌词。驻唱多年，最怕别人夸他有天赋。',
  },
  shenzhao: {
    role: '导演',
    who: '拍文艺片出名的导演。片场话很少，不骂人，也几乎不夸人。讨厌演员提前设计漂亮表情，却会记得每一个认真准备过的人。',
  },
  liangshi: {
    role: '同期演员',
    who: '科班出身的同期演员，嘴快，胜负心强。对戏比做人耐心，发现问题一定要说，帮完人又怕被看出自己在意。',
  },
  guyan: {
    role: '投资人',
    who: '嘉尚影业的投资人。待人周到，情绪很少写在脸上。习惯先把选择摆到你面前，再看你敢不敢自己拿。',
  },
  hanchi: { role: '一线男星', who: '成名很早，镜头前滴水不漏。私下比传闻安静，几乎不参加没有必要的饭局。' },
  xuning: {
    role: '同期女演员',
    who: '同期女演员，行动比说话快。想要的镜头会直接争，脾气不算好，但不喜欢背后使阴招。最烦别人一边退让，一边怪她抢。',
  },
  ruanqing: {
    role: '同期女演员',
    who: '同期女演员，做事认真，记性很好。进组前会把所有人的词都熟一遍，嘴上说怕连累自己，其实很难真的不管别人。',
  },
  songwan: {
    role: '同期女演员',
    who: '同期女演员，很会和人打交道。永远知道镜头在哪，也知道一句话怎样说最不得罪人。她对你好时未必是假，只是从来不白做。',
  },
}

export function inviteVerb(id: NpcId): string {
  if (id === 'zhouheng') return '对行程'
  if (NPC_KIND[id] === 'romance') return '约会'
  if (NPC_KIND[id] === 'peer') return '见面'
  return ''
}

export function actionById(id: ActionId): ActionDef | undefined {
  return ACTIONS.find((a) => a.id === id)
}

export function actionGroup(action: ActionDef): 'work' | 'train' | 'leisure' | 'out' {
  if (action.kind === 'film' || action.kind === 'promo') return 'work'
  if (
    action.kind === 'company' ||
    action.kind === 'job' ||
    action.kind === 'mall' ||
    action.kind === 'agency' ||
    action.kind === 'show' ||
    action.kind === 'live'
  ) {
    return 'out'
  }
  if (action.id === 'salon') return 'leisure'
  if (action.kind === 'train') return 'train'
  return 'leisure'
}

export function groupLabel(id: ActionId | null): string {
  if (!id) return ''
  if (id.startsWith('trip:') || id.startsWith('tn:')) return '旅游'
  if (id.startsWith('shoot:') || id.startsWith('promo:')) return '通告'
  if (id.startsWith('ceremony:')) return '典礼'
  const action = actionById(id)
  if (!action) return ''
  if (action.kind === 'social') {
    if (action.npcId === 'zhouheng') return '行程'
    if (action.npcId === 'xuning' || action.npcId === 'ruanqing' || action.npcId === 'songwan') return '见面'
    return '约会'
  }
  if (action.kind === 'story') return '剧情'
  if (actionGroup(action) === 'work') return '通告'
  if (actionGroup(action) === 'train') return '培训'
  if (actionGroup(action) === 'out') return '外出'
  return '休闲'
}

export function scriptById(id: string) {
  return scriptFromPool(id)
}

export function itemById(id: string): ItemDef | undefined {
  return ITEMS.find((i) => i.id === id)
}

export function houseById(id: string): HouseDef {
  return HOUSES.find((h) => h.id === id) ?? HOUSES[0]
}

export function identityById(id: IdentityId): IdentityDef {
  return IDENTITIES.find((i) => i.id === id) ?? IDENTITIES[0]
}
