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
  'w-teahouse': 2,
  'w-sideline': 2,
  'w-loopbus': 2,
  'w-supper': 2,
  'w-phototime': 2,
  'w-bund': 3,
  'w-rivermouth': 3,
  'w-exitvisa': 3,
  'w-mythcamp': 3,
  'w-signedname': 3,
}

function worldOpen(week: number, w: WorldLine) {
  return (WORLD_FROM[w.id] ?? 1) <= playYear(week)
}

const WORLD: WorldLine[] = [
  { id: 'w-rank', text: '当红女星江晚宁在拍古装权谋《庭前雪》。浪潮时代的A级网剧。海报上谁的名字排前面，又改了一版：片方说按合同，原著粉说按人气。女三小郡主那栏还空着。', tone: 'mixed' },
  { id: 'w-late', text: '流量小生陆承宴片场迟到三个小时。同组的老戏骨何朗把盒饭盖上，没说话。通告没法按点拍，组里已经有人在问今晚还改不改。', tone: 'bad' },
  { id: 'w-double', text: '一线男星韩迟和当红女星江晚宁前后脚出机场，被拍到一起过安检。工作室说只是偶遇，粉丝已经写成官宣。', tone: 'mixed' },
  { id: 'w-dress', text: '颁奖红毯上，顾辞晚和新锐女演员白疏影穿了同一套。跟拍的人先吵是谁先订的，品牌后发声明，说两套本来就不是同一场。', tone: 'mixed' },
  { id: 'w-ad', text: '当红女星江晚宁的护肤品代言被曝夸大宣传。评论区在问她自己用不用，品牌先删评，她这边还没出声。', tone: 'bad' },
  { id: 'w-cut', text: '长剧女主宋知夏的《人间长夏》有一场吻戏被剪掉。原著粉骂片方毁原著，路人说早该剪。她工作室只回了一句：以播出为准。', tone: 'mixed' },
  { id: 'w-double-body', text: '动作男星裴渡有一场动作戏，替身的现场照片先传出去了。粉丝说那是角度，骂的人说那是整个人。片方还没认，视频还在转。', tone: 'bad' },
  { id: 'w-director', text: '导演齐衡的组拍过一半，换了执行导演。盛宴到场那天，监视器后面多了一排人。组里说是进度，也有人说是投资方不放心。', tone: 'mixed' },
  { id: 'w-money', text: '流量小生陆承宴那部戏传要撤资。杀青宴取消，工作群里只剩等通知。演员还在酒店，没人敢自己发。', tone: 'bad' },
  { id: 'w-water', text: '长剧女主宋知夏那部上星剧，集数被拉到八十集。编剧把一顿饭写成三集。有人说好歹有她撑着，有人说看到第三十集已经不想追了。', tone: 'bad' },
  { id: 'w-pay', text: '新锐女演员白疏影的片酬被写成比当红女星江晚宁还高。片方说没有这回事，两边粉丝已经开始对名单。', tone: 'mixed' },
  { id: 'w-seat', text: '一线男星韩迟的杀青照少了半边人。有人说是档期撞了，有人说不欢而散。他工作室发了全员合影，缺的那个人还是不在。', tone: 'mixed' },
  { id: 'w-promo', text: '流量小生陆承宴不出来宣传。宣传片子只发他，当红女星江晚宁那边已经在问是不是被冷处理。官方账号隔了很久才补她一张。', tone: 'mixed' },
  { id: 'w-leak', text: '有人把影后陈晚秋旧剧的妆造P进新组，当成现场照片发出去。营销号照转，妆造连夜发长文辟谣，说等正片。', tone: 'mixed' },
  { id: 'w-buy', text: '有人发帖爆料一线男星韩迟，帖子发出去不到一小时又没了。有人说花钱撤的，有人说被压的。他本人还没出声。', tone: 'mixed' },
  { id: 'w-hug', text: '流量小生陆承宴和红毯女星顾辞晚在机场拥抱，被拍了。他说同事，她说风大。两边评论已经写成一出戏。', tone: 'mixed' },
  { id: 'w-ignore', text: '一线男星韩迟和当红女星江晚宁同框，两个人几乎没说话。粉丝剪了「眼神」十六秒，路人说那叫看提词器。', tone: 'mixed' },
  { id: 'w-work', text: '红毯女星顾辞晚同一天连着三场直播。评论区问她还睡不睡觉，她回了一句合同写的，又被截去骂。', tone: 'mixed' },
  { id: 'w-hate', text: '当红女星江晚宁新剧选角刚出，原著粉已经准备退款。戏还没拍，评论区已经在骂脸、骂人设、骂又是她。', tone: 'bad' },
  { id: 'w-audit', text: '新锐女演员白疏影被写成没试镜就进组。经纪公司发了候场照，时间对得上，还是没人信。', tone: 'mixed' },
  { id: 'w-school', text: '电影学院有老师出来说流量小生陆承宴不会演戏。陆承宴回：票房不会说谎。学院帖子还在，他那条已经上了热搜。', tone: 'mixed' },
  { id: 'w-award', text: '金桂奖又有人说名次内定。组委会点名影后陈晚秋，让大家等公布。她这边没回应，陪跑名单已经先传了一圈。', tone: 'mixed' },
  { id: 'w-close', text: '沈照组又不让探班。跟拍的人在酒店走廊等到天亮，只拍到一箱道具。地址谁泄的还没查清，组里先清场。', tone: 'mixed' },
  { id: 'w-end', text: '长剧女主宋知夏的大结局，角色死了。粉丝连夜说不粉了，骂得比正片还响。片方说早有伏笔，没人听。', tone: 'bad' },
  { id: 'w-contract', text: '一线男星韩迟解约。前经纪公司凌晨发声明，新工作室下午挂牌。两边都说和平分开，评论在问谁先不要谁。', tone: 'mixed' },
  { id: 'w-assist', text: '流量小生陆承宴前助理实名发帖。录音真假还没人鉴定，律师函已经到了。代言那边开始问今晚还撤不撤。', tone: 'bad' },
  { id: 'w-age', text: '红毯女星顾辞晚的年龄被扒。户口本和简历差四岁，她说演的是心态。旧采访被翻出来，数字对不上。', tone: 'bad' },
  { id: 'w-filter', text: '新锐女演员白疏影的生图和精修差出一张脸。品牌方还在用精修，广场已经在叠没修过的那张。', tone: 'mixed' },
  { id: 'w-lip', text: '一线男星韩迟演唱会被指假唱。耳返漏音那一下，粉丝从维护变成对骂。节目组说设备问题，原片还在。', tone: 'bad' },
  { id: 'w-talk', text: '当红女星江晚宁采访口误，把老戏骨何朗的名字叫错。她后来补了一句抱歉，被剪出来的还是那一下。', tone: 'bad' },
  { id: 'w-carpet', text: '颁奖红毯上，顾辞晚踩到裙摆。她笑着捡起来继续走，剪辑只留那一下踉跄，评论已经写成翻车。', tone: 'mixed' },
  { id: 'w-surgery', text: '新锐女演员白疏影被配了整容对比图。她发了旧照，评论说角度。品牌活动照还在用精修。', tone: 'mixed' },
  { id: 'w-chart', text: '流量小生陆承宴打榜的后台被晒出来。粉丝说爱豆不容易，路人说那是数据。平台先把页面藏了，截图已经出去了。', tone: 'bad' },
  { id: 'w-unfan', text: '当红女星江晚宁被前粉写了长文，一张张翻旧宣传片子，比骂她的人还细。她工作室回祝好，评论区没停。', tone: 'bad' },
  { id: 'w-hanchi', text: '一线男星韩迟被写成新恋情。女方侧脸只有半张，已经有人P成官宣海报。两边工作室都说不认识。', tone: 'mixed' },
  { id: 'w-wine', text: '一桌饭局照片流出来。有人指认导演盛宴坐主位，有人说那是杀青宴。座位比剧情传得还细。', tone: 'mixed' },
  { id: 'w-stream', text: '长剧女主宋知夏的剧被提前点播，弹幕比正片快两集。有人骂割韭菜，剧透组已经开张，官方还在用敬请期待。', tone: 'mixed' },
  { id: 'w-extra', text: '群演实名说在动作男星裴渡组里被骂。片方回沟通问题，现场录音还在转。裴渡本人还没出声。', tone: 'bad' },
  { id: 'w-wig', text: '当红女星江晚宁古装假发的现场照片先出了，边缘看得出来。妆造连夜发长文，说等正片，评论已经在笑头套。', tone: 'mixed' },
  { id: 'w-seat2', text: '颁奖季座位表流出来。影后陈晚秋在第一排，新锐女演员白疏影在侧边。跟拍的人比名单先吵谁该坐哪。', tone: 'mixed' },
  { id: 'w-collapse', text: '流量小生陆承宴那段录音还没鉴定完，代言已经撤了三支。品牌说合同到期，评论说那是赶紧撇清。', tone: 'bad' },
  { id: 'w-oldlove', text: '一线男星韩迟旧恋情录音流出来。他这边说酒桌玩笑，女方工作室连夜切割，说不认识现在的他。', tone: 'bad' },
  { id: 'w-cutstudio', text: '流量小生陆承宴工作室发声明，说和他不是一伙的。他本人过了三条热搜才转发，粉丝已经撕开了。', tone: 'bad' },
  { id: 'w-livefail', text: '红毯女星顾辞晚直播连麦，把提词器念出声了。对面没关麦，那几秒被剪出去，品牌先把回放关了。', tone: 'mixed' },
  { id: 'w-showfail', text: '红毯女星顾辞晚走秀踩空。品牌先删视频，路人先截了原片。她后来发了没修的现场，评论还是在循环那一下。', tone: 'mixed' },
  { id: 'w-nbrush', text: '影后陈晚秋的旧剧被翻出来连着刷。弹幕全是在找现在的她，原班人马在骂滚去播新的。', tone: 'mixed' },
  { id: 'w-biao', text: '当红女星江晚宁新剧海报一出，评论只记得影后陈晚秋十年前那部。片方说这次不靠旧的活，原著粉不买账。', tone: 'mixed' },
  { id: 'w-runner', text: '新锐女演员白疏影第五次陪跑。她笑着说提名就是认可，镜头切到旁边空着的座位。颁奖礼回放把这句留了。', tone: 'mixed' },
  { id: 'w-vote', text: '流量小生陆承宴在一个年度人气投票里排第一。倒计时还没走完，有人把后台截图发出来：票数一下跳几十万，不像真人点的。主办方说系统波动，但名次已经定了，改不了。', tone: 'bad' },
  { id: 'w-sub', text: '字幕组把长剧女主宋知夏的情话译成了口号。原著粉连夜出对照，官方还在用译错的那版。', tone: 'mixed' },
  { id: 'w-cam', text: '沈照组的拍摄机位被抓到。组里清场，跟拍的人在停车场对骂是谁把地址泄出去的。', tone: 'mixed' },
  { id: 'w-split', text: '流量小生陆承宴和当红女星江晚宁的宣传片子分开发。官方账号隔了十一分钟，两边都说被冷。谁也不解释。', tone: 'mixed' },
  { id: 'w-namejoke', text: '当红女星江晚宁的角色名被谐音梗玩疯。她发了澄清，梗比澄清跑得快，连主持人都在念那个错的。', tone: 'mixed' },
  { id: 'w-table', text: '酒桌座位表流出来。导演盛宴坐主位，流量小生陆承宴倒酒，比剧情还细。有人说杀青宴，有人说不是。', tone: 'mixed' },
  { id: 'w-copy', text: '版权方换人。当红女星江晚宁那部的粉丝图和视频全下架，大家连夜存图。官方只说配合调整。', tone: 'mixed' },
  { id: 'w-throw', text: '一线男星韩迟的应援物被扔出场。安保说按规定，粉丝连夜说不粉了。他工作室回了一句配合现场，更吵了。', tone: 'bad' },
  { id: 'w-behind', text: '影后陈晚秋一段花絮比正片好看。正片评论区在求导演去看花絮组，官方账号转了剧照，没转那段。', tone: 'good' },
  { id: 'w-revive', text: '选秀复活位票数一夜翻倍。节目组说是海外票，骂的人说那是房间里刷的。倒数计时已经走完，名次改不了。', tone: 'bad' },
  { id: 'w-ghost', text: '代拍号被揭穿。同一张「偶遇一线男星韩迟」出现在三个城市，定位还开着。账号删帖，截图还在。', tone: 'mixed' },
  { id: 'w-pr', text: '公关稿把当红女星江晚宁写成了新锐女演员白疏影。十分钟删帖，截图已经进了广场。两边粉丝先吵是谁的团队写的。', tone: 'mixed' },
  { id: 'w-starferry', text: '裴衡在拍大IP网剧《星河渡》。嘉尚影业的S级，上神渡劫，小仙进天界。提前点播的预告先出了女二。一半说原著就是这样，一半说又改成恶毒女二。', tone: 'mixed' },
  { id: 'w-starcast', text: '裴衡在拍大IP网剧《星河渡》。嘉尚影业的S级。选角名单漏了：江晚宁女主、陆承宴上神，女二那栏还空着。原著粉连夜列出不能改的人设。', tone: 'mixed' },
  { id: 'w-starwig', text: '裴衡在拍大IP网剧《星河渡》。嘉尚影业的S级。服装造型的现场照片先出了，假发套边缘看得出来，妆造连夜发长文，说等正片。', tone: 'mixed' },
  { id: 'w-snowbanquet', text: '邢未在拍古装权谋《庭前雪》。浪潮时代的A级网剧。对词传出联姻宴席：女三不用打架，只敬酒和落座。有人说难演。', tone: 'mixed' },
  { id: 'w-sweetclip', text: '赵浅在拍甜宠《请你偏爱》。提前点播只剪了退婚。切片号在等摘戒指那一下，女三换了几轮。', tone: 'mixed' },
  { id: 'w-goldtable', text: '《金座》在拍滨江夜宴。投资人把项目按在转盘边上谈。酒桌戏先传出去了，女三那席还没定。', tone: 'mixed' },
  { id: 'w-coat', text: '齐衡在拍医疗剧《白大褂》。嘉尚影业的A级，三甲急诊。医学顾问已经进组，口型、病历、推床路线都要过。齐衡不爱重来。', tone: 'mixed' },
  { id: 'w-noise', text: '闻疏在拍都市剧《白噪音》。嘉尚影业的A级，写字楼里一家心理门诊。围读流出几页，没有血腥，全是谈话。', tone: 'mixed' },
  { id: 'w-north', text: '老钱在拍电影《北站》。嘉尚影业的S级，春运，广播室通宵念延误。车站是真的，广播词改了十一稿。有人说能进预告。', tone: 'mixed' },
  { id: 'w-summerip', text: '陆深在拍青春网剧《盛夏未完》。浪潮时代的B级，音乐学院。琴房加练的现场照片先出了，唱的是现场还是后期配的，评论已经吵开了。', tone: 'mixed' },
  { id: 'w-unclewater', text: '《我的二舅爷》预告出了通水那天。弹幕在刷我们县也是这样过来的。不是女主戏，是那种看着像自家的戏。', tone: 'good' },
  { id: 'w-unnameddoor', text: '沈照在拍文艺电影《未命名》。星汉文化的S级，旧书店，几乎没有台词。不让探班，跟拍的人只拍到一箱退货的书。圈里当冲奖看。', tone: 'mixed' },
  { id: 'w-cpmeet', text: '《对手戏》拍会议室对吵。现场照片先出了，弹幕已经在嗑，官配粉已经在骂又发糖。', tone: 'mixed' },
  { id: 'w-pepper', text: '《椒房春》还在选女二蕙嫔。后宫、年家、更衣。圈里拿它跟一部在宫里活十年的戏比。', tone: 'mixed' },
  { id: 'w-redcase', text: '《赤焰案》围读流出拒婚词。梁郡主挂帅，不是来联姻的。女主还在试。', tone: 'mixed' },
  { id: 'w-dust', text: '沈照在拍电影《隐尘》。西北种地，找女主。片酬低，圈里当冲奖看。', tone: 'mixed' },
  { id: 'w-youngbook', text: '老钱在拍电影《少年书》。审查盯尺度：校园、录像、保护。片方要拍得不像说教。', tone: 'mixed' },
  { id: 'w-northwind', text: '邢伟在拍上星剧《风过北河》。已经有人说集数被拉得很长。律师那场，顾问盯口型。', tone: 'mixed' },
  { id: 'w-returner', text: '《故人归》女主试了三轮。原著粉准备退款。有人和裴衡那部《星河渡》对打热度。', tone: 'mixed' },
  { id: 'w-shore', text: '沈照在拍电影《岸边》。海边、返乡，找女主。圈里当冲影后看。', tone: 'mixed' },
  { id: 'w-weiyang', text: '《未央辞》女主还在选。从更衣到掌事。海报一出，评论只记得旧的那部宫里的戏。', tone: 'mixed' },
  { id: 'w-brocade', text: '《锦衣夜》女二盛宜还在选。宅门、嫡庶、女工。原著粉说别写成恶毒嫡姐。', tone: 'mixed' },
  { id: 'w-longnight', text: '《长夜未明》询问室那场先传。证人不是来解释案情的。真案件的联想已经压了一轮。', tone: 'mixed' },
  { id: 'w-counter', text: '老钱在拍电影《柜台》。审查来过一轮。药房把仿制药递过玻璃。冲奖，片酬普通。', tone: 'mixed' },
  { id: 'w-painted', text: '沈照在拍电影《扮相》。戏班、真唱，找女主。有人说这是今年电影最难的女主。', tone: 'mixed' },
  { id: 'w-cipher', text: '邢未在拍电影《密信》。试镜要一场把茶端稳。一张脸两套话。审查已经改了两稿。', tone: 'mixed' },
  { id: 'w-citylamp', text: '《城中灯》贺岁档要笑，片方要别演成鸡汤。女主还空着。', tone: 'mixed' },
  { id: 'w-teahouse', text: '《茶酒录》温酒那场围读流出来。酒牌不是花瓶掌柜。市井古装，不靠宫斗。', tone: 'mixed' },
  { id: 'w-sideline', text: '《旁观录》夜账先传。内库女二还空着。有人当轻喜，成片要她把钥匙留下。', tone: 'mixed' },
  { id: 'w-loopbus', text: '老钱在拍网剧《循环线》。审查来过。同一趟车，女二不是来解释规则的。', tone: 'mixed' },
  { id: 'w-supper', text: '《晚饭以后》预告出了晚饭那一桌。弹幕在刷我家也是这样。女二还空着。', tone: 'mixed' },
  { id: 'w-phototime', text: '《旧照》暗房的现场照片先出了。同一张脸两叠照片。原著粉先写成爱情，片方要先把灯关掉。', tone: 'mixed' },
  { id: 'w-bund', text: '闻疏在拍年代剧《外滩灯》。上海九十年代，夜里的灯。女主还在选，服装造型先传开。', tone: 'mixed' },
  { id: 'w-rivermouth', text: '《大江口》厂门口预告出了。弹幕在刷我们厂也是这样过来的。女主栏空着。', tone: 'mixed' },
  { id: 'w-exitvisa', text: '电影《出境》在找女主。窗口、手续。找到的不一定是她要的人。圈里当冲奖看。', tone: 'mixed' },
  { id: 'w-mythcamp', text: '《祭台》女二还没定。大制作，给国外看的宣传已经在做。质子府别写成诱饵。', tone: 'mixed' },
  { id: 'w-signedname', text: '邢伟在拍上星剧《署名》。女二检察还空着。顾问盯口型。已经有人说集数被拉得很长。', tone: 'mixed' },
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
    text: (n) => `${n} 经纪人被拍到在片场说话很冲`,
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
    text: (n) => `${n} 旧花絮被翻出来`,
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

type TipCtx = {
  title: string
  role: string
  lead: string
}

function tipCtx(s: GameState): TipCtx {
  const b = (s.bookings ?? []).find((x) => x.phase === 'shoot') ?? s.bookings?.[0]
  const script = b ? scriptById(b.scriptId) : null
  const from = script ?? (s.finishedScripts.length ? scriptById(s.finishedScripts[s.finishedScripts.length - 1]) : undefined)
  if (!from) return { title: '', role: '这个角色', lead: '同组那个' }
  const role = from.roleName === '刀马旦' || from.roleName === '戏班女角' ? '那个翻跟头的客串' : from.roleName
  return {
    title: from.title,
    role,
    lead: from.leads[0] || '同组那个',
  }
}

function inShow(ctx: TipCtx, withTitle: string, without: string) {
  return ctx.title ? withTitle : without
}

type TipTape = {
  id: string
  scene: string
  said: (ctx: TipCtx) => string[]
}

const TIP_TAPES: TipTape[] = [
  {
    id: 'lines',
    scene: '能听出是化妆间，门外有人走过。',
    said: (ctx) => [
      inShow(ctx, `《${ctx.title}》这个角色的词写得像说明书。我对着镜子念，自己都想快进。`, '这个角色的词写得像说明书。我对着镜子念，自己都想快进。'),
      '别发给别人。我就是拍完了发发牢骚。',
    ],
  },
  {
    id: 'wait',
    scene: '能听出是片场角落，空调声很响。',
    said: (ctx) => [
      inShow(ctx, `《${ctx.title}》候场候到妆都花了。轮到我，镜头扫一下就过。`, '候场候到妆都花了。轮到我，镜头扫一下就过。'),
      '我不是不干。就是今天有点累。',
    ],
  },
  {
    id: 'hog',
    scene: '能听出是楼梯间，声音压得很低。',
    said: (ctx) => [
      `${ctx.lead}一条能拍八遍。我不是说人家不好，就是我干等，脸都僵了。`,
      '这话你当没听见。真传出去我没法进组。',
    ],
  },
  {
    id: 'nameless',
    scene: '能听出是停车场，你大概在打电话。',
    said: (ctx) => [
      inShow(ctx, `《${ctx.title}》这个${ctx.role}，有的场次连名字都没有。我还练了两天。`, '这个角色有的场次连名字都没有。我还练了两天。'),
      '我就是说说。你别当真，也别存。',
    ],
  },
  {
    id: 'toast',
    scene: '能听出是片场后面，有人在收灯。',
    said: (ctx) => [
      inShow(ctx, `《${ctx.title}》这场不打架，就敬酒、落座、把笑挂住。演完妆还在，人已经没了。`, '这场不打架，就敬酒、把笑挂住。演完妆还在，人已经没了。'),
      '我知道这是工作。就是有点没劲。',
    ],
  },
  {
    id: 'wig',
    scene: '能听出是造型间，假发套边在响。',
    said: () => [
      '这顶假发戴一天，头皮都木了。还得对着镜头笑，像没事。',
      '你别告诉造型。我就是跟你抱怨一下。',
    ],
  },
  {
    id: 'lunch',
    scene: '能听出是片场门口，盒饭盖子响了一下。',
    said: () => [
      '盒饭凉了还要补一条笑的。导演说情绪不对，我现在真没什么情绪。',
      '我不是针对谁。就是今天排得太满。',
    ],
  },
  {
    id: 'again',
    scene: '能听出是监视器后面，有人在翻场记。',
    said: () => [
      '再来一条。再来一条。我脸都笑僵了，还说不够自然。',
      '回去别让经纪人听见。我就是拍完了骂两句。',
    ],
  },
  {
    id: 'cut',
    scene: '能听出是回酒店的车上，引擎声很稳。',
    said: (ctx) => [
      inShow(ctx, `《${ctx.title}》我这场要是被剪掉，大概也没人问。我自己都快背完别人的词了。`, '我这场要是被剪掉，大概也没人问。我自己都快背完别人的词了。'),
      '你当我开玩笑。明天还要拍。',
    ],
  },
  {
    id: 'bg',
    scene: '能听出是走廊，脚步声过来又走了。',
    said: (ctx) => [
      `我这场就是给${ctx.lead}当背景。站得近一点，镜头都不一定收得到。`,
      '我知道自己什么位置。就是说出来顺口。',
    ],
  },
  {
    id: 'latepal',
    scene: '能听出是候场室，有人把椅子拖了一下。',
    said: (ctx) => [
      `${ctx.lead}又晚到。我们妆都补完了，还在等。不是第一次。`,
      '别外传。传出去变成我在骂人。',
    ],
  },
  {
    id: 'friend',
    scene: '能听出是卫生间外面，水声刚关。',
    said: () => [
      '我跟你说啊，同组有人一条能磨半天。我不是不服，就是觉得自己像道具。',
      '说完了。你别笑，也别发给第三个人。',
    ],
  },
]

export const CODEX_TAPES = TIP_TAPES.map((t) => t.id)

function pickTipTape(s: GameState): TipTape {
  const fresh = TIP_TAPES.filter((t) => !s.flags[`tip:${t.id}`])
  const pool = fresh.length ? fresh : TIP_TAPES
  const tape = pool[Math.floor(rng(s, 88)() * pool.length)] ?? TIP_TAPES[0]
  if (fresh.length) s.flags[`tip:${tape.id}`] = true
  return tape
}

function tipOpenEvent(s: GameState): GameEvent {
  const tape = pickTipTape(s)
  const ctx = tipCtx(s)
  const lines = [
    `你点开了。录音不长，${tape.scene}`,
    ...tape.said(ctx).map((line) => `你说：「${line}」`),
    '听得出来是你的声音。话说得不太好听，但也没到能把人怎样的程度。听完可以当没这回事。也可以花钱，让他们把话题引到别人身上。第二种不违法，但也不体面。',
  ]
  return {
    id: 'gossip-tip-open',
    title: '爆料',
    body: lines.join('\n\n'),
    lines,
    options: [
      { id: 'ignore', label: '当没收到' },
      { id: 'push', label: '让他们写别人' },
    ],
  }
}

function applyTipPush(s: GameState): string {
  s.money = Math.max(0, s.money - 6000)
  s.opinion -= 4
  s.news = { text: '圈内爆料 指向不明', tone: 'bad', kind: 'gossip' }
  return '营销号把注意力转向了另一个人。你的名字没有出现，但你很清楚这件事并没有消失。'
}

const BEATS: GossipBeat[] = [
  {
    id: 'gossip-raw',
    when: (s) => s.fans >= 600,
    event: (s) => ({
      id: 'gossip-raw',
      title: '生图',
      body: `活动刚结束，营销号就发了${s.name}的现场照片。角度不太好，脸上也没什么光。

评论里已经有人拿精修图做对比。`,
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

过了一会儿，他又补了一句：「不是催你。我这边都行。」`,
      options: [
        { id: 'kill', label: '压热度' },
        { id: 'leave', label: '当没看见' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'kill') {
        s.money = Math.max(0, s.money - 8000)
        bumpFavor(s, 'liangshi', -4)
        bumpFavor(s, 'zhouheng', 3)
        s.news = { text: `${s.name} 工作室回应机场路透`, tone: 'mixed', kind: 'hot' }
        return '热度被压了下去。梁时回了一句“知道了”，之后没再提。'
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
    event: () => ({
      id: 'gossip-resource',
      title: '资源咖',
      body: `有人把你坐过的车、最近进的组和一张模糊的饭局照片拼在一起，发了条长微博，问你背后到底是谁。

评论区已经替你编出了好几个版本。`,
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

两边开始翻旧路透。有一张你让位，有一张她抢戏。真假已经不重要。`,
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

营销号夸你“接地气”，评论里也有人觉得只是普通工作照。`,
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

你记得自己踩着通告时间进门，没有提前，但也没有迟到。帖子里没有完整视频，只有一张工作人员看表的照片。当天的进场记录还在。`,
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

评论里有人纠正读音，也有人说你根本没做功课。`,
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

两边都是收钱写稿。可以买一篇正常的工作宣传，也可以一篇都不碰。买了不保证没人骂，只是让真正的通告别被这些话盖住。`,
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
      body: `一个营销号私信你，说手里有一段你片场的录音，问你想不想先听。

后面跟了一个链接。`,
      options: [
        { id: 'skip', label: '不点' },
        { id: 'open', label: '点开' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'open') {
        s.event = tipOpenEvent(s)
        return '链接打开了。'
      }
      if (optionId === 'push') {
        return applyTipPush(s)
      }
      return '你没点。过了几个小时，对方撤回了消息。'
    },
  },
  {
    id: 'gossip-tip-open',
    when: () => false,
    event: () => ({
      id: 'gossip-tip-open',
      title: '爆料',
      body: '',
      options: [],
    }),
    apply: (s, optionId) => {
      if (optionId === 'push') return applyTipPush(s)
      s.mood = clamp(s.mood - 2, 0, 108)
      return '你听完了，没有回。过了几个小时，对方撤回了消息。'
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

评论意外不错，很多人说比正式预告更有意思。官方账号来问，要投诉删除，还是顺势当作预热。`,
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
        return '官方账号没有删，还转发了一张正式剧照。有人顺着花絮开始关注这部戏。'
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

弹幕里有人第一次注意到你，也有人拿当时的造型和现在比较。`,
        options: [
          { id: 'repost', label: '让官方转旧花絮' },
          { id: 'quiet', label: '不掺和' },
        ],
      }
    },
    apply: (s, optionId) => {
      if (optionId === 'repost') {
        s.fans += 240
        s.news = { text: `${s.name} 旧作为什么火了`, tone: 'mixed', kind: 'gossip' }
        return '官方账号转发了旧花絮。有人开始补剧，也有人嫌团队太会抓热度。'
      }
      return '你没有参与。那支剪辑自然传播了几天，给你带来了一些新关注。'
    },
  },
  {
    id: 'gossip-leak',
    when: (s) => (s.bookings?.length ?? 0) > 0 && s.fans >= 1500,
    event: (s) => {
      const title = filmingTitle(s) ?? '这部戏'
      return {
        id: 'gossip-leak',
        title: '超点',
        body: `《${title}》还有两集没播，已经有人先丢到网上。弹幕比正片快，剧透号已经开张。

官方还在发敬请期待。评论里有人骂割韭菜，也有人说反正都要播。

法务问你：追不追。`,
        options: [
          { id: 'cut', label: '让法务投诉下架' },
          { id: 'keep', label: '当预热，不追' },
        ],
      }
    },
    apply: (s, optionId) => {
      const title = filmingTitle(s) ?? '新剧'
      if (optionId === 'cut') {
        s.money = Math.max(0, s.money - 5000)
        s.opinion = clamp(s.opinion + 2, -40, 40)
        s.fans = Math.max(0, s.fans - Math.max(60, Math.round(s.fans * 0.015)))
        s.news = { text: `《${title}》未播集被投诉`, tone: 'mixed', kind: 'hot' }
        if (s.met.zhouheng) bumpFavor(s, 'zhouheng', 3)
        return '法务发了投诉。链接少了，路人说心虚。片方回了一句配合处理。'
      }
      s.fans += 360
      s.opinion = clamp(s.opinion - 4, -40, 40)
      s.hotSearch = { text: `《${title}》被提前点播`, tone: 'mixed', daysLeft: 4 }
      s.news = { text: `《${title}》被提前点播`, tone: 'mixed', kind: 'hot' }
      return '你没有追。那两集还在传，追剧的人骂割韭菜，也有人顺着超点开始认识你。'
    },
  },
  {
    id: 'gossip-cast',
    when: (s) => (s.bookings?.length ?? 0) > 0 && s.fans >= 1200,
    event: (s) => {
      const title = filmingTitle(s) ?? '新组'
      return {
        id: 'gossip-cast',
        title: '内定',
        body: `有人把《${title}》的候场时间轴发了出来，说你没试镜就进组。时间对得上的人说那是通告，不信的人说那是后补。

经纪公司问：旧试镜还在硬盘里，发不发。`,
        options: [
          { id: 'post', label: '把试镜花絮丢出去' },
          { id: 'quiet', label: '不解释' },
        ],
      }
    },
    apply: (s, optionId) => {
      if (optionId === 'post') {
        s.fans += 140
        s.mood = clamp(s.mood - 2, 0, 108)
        s.news = { text: `${s.name} 晒试镜`, tone: 'mixed', kind: 'hot' }
        if (s.met.zhouheng) bumpFavor(s, 'zhouheng', 2)
        return '工作室发了试镜那天的片段。大部分人接受，仍有人说是后补的。热度转到「她到底试没试」。'
      }
      const loss = Math.max(90, Math.round(s.fans * 0.03))
      s.fans = Math.max(0, s.fans - loss)
      s.opinion = clamp(s.opinion - 3, -40, 40)
      s.hotSearch = { text: `${s.name} 未试镜进组`, tone: 'bad', daysLeft: 4 }
      s.news = { text: `${s.name} 未试镜进组`, tone: 'bad', kind: 'hot' }
      return '你没有解释。「没试镜」三个字越传越像默认。'
    },
  },
  {
    id: 'gossip-edit',
    when: (s) => s.fans >= 2000,
    event: () => ({
      id: 'gossip-edit',
      title: '丑剪',
      body: `一档综艺把你剪成爱插话、爱哭。正片评论比你本人还像人设。

节目组来问：要不要把未剪的那段也挂上去。发了像撕，不发就像认了。`,
      options: [
        { id: 'raw', label: '自己发未剪的那段' },
        { id: 'quiet', label: '不撕节目组' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'raw') {
        s.fans += 280
        s.opinion = clamp(s.opinion - 2, -40, 40)
        s.flags.uglyCutFight = true
        s.news = { text: `${s.name} 发综艺未剪版`, tone: 'mixed', kind: 'hot' }
        return '你把未剪的那段挂了出去。路人说终于看清了，节目组这周没再约你。'
      }
      s.mood = clamp(s.mood - 6, 0, 108)
      s.opinion = clamp(s.opinion - 1, -40, 40)
      s.news = { text: `${s.name} 综艺人设`, tone: 'mixed', kind: 'gossip' }
      return '你没有发。那版剪辑还在播，人设被钉了一阵。节目组过了两周又来问档期。'
    },
  },
  {
    id: 'gossip-cutcp',
    when: (s) => (s.bookings?.length ?? 0) > 0 && s.fans >= 1800,
    event: (s) => {
      const b = (s.bookings ?? []).find((x) => x.phase === 'shoot') ?? s.bookings?.[0]
      const script = b ? scriptById(b.scriptId) : null
      const lead = script?.leads[0] || '男主'
      const title = script?.title ?? '这部戏'
      return {
        id: 'gossip-cutcp',
        title: '切片',
        body: `有人把你和${lead}在《${title}》里的对手戏剪成十六秒。弹幕写眼神，官配粉骂你消费，路人当官宣。

他那边让助理问你：切割，还是当没看见。`,
        options: [
          { id: 'kill', label: '切割，说只是角色' },
          { id: 'leave', label: '不回，当营业' },
        ],
      }
    },
    apply: (s, optionId) => {
      const b = (s.bookings ?? []).find((x) => x.phase === 'shoot') ?? s.bookings?.[0]
      const lead = b ? scriptById(b.scriptId)?.leads[0] : '男主'
      if (optionId === 'kill') {
        s.fans = Math.max(0, s.fans - Math.max(120, Math.round(s.fans * 0.04)))
        s.opinion = clamp(s.opinion + 1, -40, 40)
        if (s.met.liangshi) bumpFavor(s, 'liangshi', -3)
        s.news = { text: `${s.name} 回应只是角色`, tone: 'mixed', kind: 'hot' }
        return `工作室发了「戏里的事」。官配粉消停了，切片粉走了一批。${lead}那边没再问。`
      }
      s.fans += 520
      s.opinion = clamp(s.opinion - 3, -40, 40)
      s.hotSearch = { text: `${s.name} ${lead} 十六秒`, tone: 'mixed', daysLeft: 5 }
      s.news = { text: `${s.name} ${lead} 十六秒`, tone: 'mixed', kind: 'hot' }
      return '你们都没有回。那十六秒挂了几天，后来有人开始写你蹭。'
    },
  },
  {
    id: 'gossip-face',
    when: (s) => s.fans >= 1600,
    event: (s) => ({
      id: 'gossip-face',
      title: '换脸',
      body: `有人用${s.name}的脸生成了不合适的视频。平台先限流，评论已经在转。截图比原片跑得快。

助理问你：走投诉，还是当没看见。`,
      options: [
        { id: 'cut', label: '投诉下架' },
        { id: 'quiet', label: '当看不见' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'cut') {
        s.money = Math.max(0, s.money - 4000)
        s.mood = clamp(s.mood - 3, 0, 108)
        s.news = { text: `${s.name} 投诉换脸视频`, tone: 'mixed', kind: 'hot' }
        return '投诉走完，链接少了。截图还在。有人说你在管，也有人说你心虚。'
      }
      s.mood = clamp(s.mood - 8, 0, 108)
      s.opinion = clamp(s.opinion - 3, -40, 40)
      s.hotSearch = { text: `${s.name} 换脸视频`, tone: 'bad', daysLeft: 4 }
      s.news = { text: `${s.name} 换脸视频`, tone: 'bad', kind: 'hot' }
      return '你没有回。视频还在转，有人当成你默许。'
    },
  },
  {
    id: 'gossip-credit',
    when: (s) => (s.bookings?.length ?? 0) > 0 && s.fans >= 2200,
    event: (s) => {
      const title = filmingTitle(s) ?? '新剧'
      return {
        id: 'gossip-credit',
        title: '番位',
        body: `《${title}》新海报出来，你的名字缩到几乎看不见。跟拍的人先吵谁该排前面，片方说按合同。

周衡把海报转给你：「谈不谈。谈了像争，不谈这一版就定了。」`,
        options: [
          { id: 'fight', label: '让公司去谈' },
          { id: 'smile', label: '发祝贺，当没看见' },
        ],
      }
    },
    apply: (s, optionId) => {
      const title = filmingTitle(s) ?? '新剧'
      if (optionId === 'fight') {
        s.money = Math.max(0, s.money - 9000)
        s.opinion = clamp(s.opinion + 2, -40, 40)
        s.fans = Math.max(0, s.fans - Math.max(40, Math.round(s.fans * 0.01)))
        if (s.met.zhouheng) bumpFavor(s, 'zhouheng', 4)
        s.news = { text: `《${title}》海报名字顺序`, tone: 'mixed', kind: 'hot' }
        return '公司去谈了。后来补了一版，你的名字大了一号。粉说你争，片方这周没再拖通告。'
      }
      s.fans += 160
      s.opinion = clamp(s.opinion - 2, -40, 40)
      s.news = { text: `${s.name} 祝贺新海报`, tone: 'good', kind: 'gossip' }
      return '你发了祝贺，没提名字。这一版就定了。后来的通告里，你的名字仍靠后。'
    },
  },
  {
    id: 'gossip-vote',
    when: (s) => s.fans >= 5000,
    event: (s) => ({
      id: 'gossip-vote',
      title: '控评',
      body: `夸${s.name}的热搜被扒出是买的。倒计时还没走完，票数一下跳了几十万，不像真人点的。

平台把页面藏了，截图已经出去。粉丝连夜说是自发，路人说那是房间里刷的。`,
      options: [
        { id: 'cut', label: '工作室切割，说粉丝自愿' },
        { id: 'quiet', label: '装不知道' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'cut') {
        const loss = Math.max(150, Math.round(s.fans * 0.05))
        s.fans = Math.max(0, s.fans - loss)
        s.opinion = clamp(s.opinion + 1, -40, 40)
        if (s.met.zhouheng) bumpFavor(s, 'zhouheng', 2)
        s.news = { text: `${s.name} 回应热搜数据`, tone: 'mixed', kind: 'hot' }
        return '工作室发了声明，说投票是粉丝自愿。路人觉得你至少回了。粉走了一截。'
      }
      const loss = Math.max(80, Math.round(s.fans * 0.02))
      s.fans = Math.max(0, s.fans - loss)
      s.opinion = clamp(s.opinion - 4, -40, 40)
      s.hotSearch = { text: `${s.name} 热搜数据异常`, tone: 'bad', daysLeft: 5 }
      s.news = { text: `${s.name} 热搜数据异常`, tone: 'bad', kind: 'hot' }
      return '你没有回。截图挂了更久，观感比掉粉难看。'
    },
  },
  {
    id: 'gossip-senior',
    when: (s) => s.fans >= 2500,
    event: () => ({
      id: 'gossip-senior',
      title: '前辈',
      body: `活动后台，你和影后陈晚秋前后脚。跟拍只留你低头看手机那三秒，写成没打招呼、耍大牌。

她助理没联系你。你这边助理问：发合照，还是让他们解释流程。`,
      options: [
        { id: 'photo', label: '发合照，说没看见' },
        { id: 'flow', label: '让助理解释流程' },
      ],
    }),
    apply: (s, optionId) => {
      if (optionId === 'photo') {
        s.fans += 110
        s.mood = clamp(s.mood - 2, 0, 108)
        s.news = { text: `${s.name} 陈晚秋 后台合照`, tone: 'mixed', kind: 'hot' }
        return '你发了合照，说当时在看提词。大部分人收场，仍有人说补拍。她本人没转发，也没再被写成不愉快。'
      }
      s.fans = Math.max(0, s.fans - Math.max(70, Math.round(s.fans * 0.02)))
      s.opinion = clamp(s.opinion - 3, -40, 40)
      s.hotSearch = { text: `${s.name} 后台耍大牌`, tone: 'bad', daysLeft: 4 }
      s.news = { text: `${s.name} 后台耍大牌`, tone: 'bad', kind: 'hot' }
      return '助理解释了动线。越描越细。热搜还是「耍大牌」，她那边这周没有同框。'
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
