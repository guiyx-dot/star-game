/** 圈内固定面孔。八卦、颁奖、路人新闻都点名，不用「顶流」「女二」代替人。 */
export const STAR = {
  chenwanqiu: '陈晚秋',
  hanchi: '韩迟',
  luchengyan: '陆承宴',
  jiangwanning: '江晚宁',
  baishuying: '白疏影',
  helang: '何朗',
  songzhixia: '宋知夏',
  peidu: '裴渡',
  guciwan: '顾辞晚',
  longwushan: '龙武山',
  qiheng: '齐衡',
  shengyan: '盛宴',
} as const

export const STAR_WHO: Record<(typeof STAR)[keyof typeof STAR], string> = {
  陈晚秋: '影后',
  韩迟: '一线男星',
  陆承宴: '流量小生',
  江晚宁: '当红女星',
  白疏影: '新锐女演员',
  何朗: '老戏骨',
  宋知夏: '长剧女主',
  裴渡: '动作男星',
  顾辞晚: '红毯女星',
  龙武山: '动作片男主',
  齐衡: '导演',
  盛宴: '导演',
}
