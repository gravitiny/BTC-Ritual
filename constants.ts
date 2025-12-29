export const SYMBOL = 'BTC';
export const DEFAULT_MARGIN_USD = 5;
export const LEVERAGE = 40;
export const DAILY_LIMIT_ENABLED = false;
export const MIN_NOTIONAL_USD = 10;

export const LUCK_TICK_MS = 200;
export const PRICE_TICK_MS = 1000;
export const RUN_DURATION_MS = 30000;
export const RESULT_THRESHOLD_SUCCESS = 0.7;
export const RESULT_THRESHOLD_FAIL = 0.3;
export const MAX_HISTORY_DAYS = 90;

export const TP_MULTIPLE_OPTIONS = [0.1, 0.25, 0.5, 1, 2];

export const CURRENT_SESSION_KEY = 'currentDaySession';
export const HISTORY_SESSIONS_KEY = 'historySessions';

export const MOCK_BASE_PRICE = 68000;
export const MOCK_PRICE_VARIANCE = 800;

export const LUCK_TIER_LABELS = [
  { min: 0.9, label: '欧皇', labelEn: 'Blessed', emoji: '👑' },
  { min: 0.7, label: '顺风', labelEn: 'Smooth', emoji: '✨' },
  { min: 0.4, label: '一般', labelEn: 'Okay', emoji: '😐' },
  { min: 0.2, label: '危险', labelEn: 'Risky', emoji: '😬' },
  { min: 0, label: '地狱', labelEn: 'Hell', emoji: '💀' },
];

export const CROWN_TIERS = [
  {
    id: 'fragment',
    multiple: 0,
    name: '碎片',
    nameEn: 'Shard',
    nickname: '战损残片',
    nicknameEn: 'Battle Scrap',
    luck: '低迷',
    luckEn: 'Low',
    emoji: '💩',
    label: '灰碎片',
    labelEn: 'Ash Shard',
    color: 'text-white/60',
    badge: 'border-white/30 bg-white/10',
  },
  {
    id: 'green',
    multiple: 0.1,
    name: '新兵战绩',
    nameEn: 'Rookie Record',
    nickname: '小胜一波',
    nicknameEn: 'Small Win',
    luck: '一般',
    luckEn: 'Fair',
    emoji: '🍀',
    label: '绿冠',
    labelEn: 'Green Crown',
    color: 'text-success',
    badge: 'border-success/60 bg-success/10',
  },
  {
    id: 'blue',
    multiple: 0.25,
    name: '稳健连胜',
    nameEn: 'Steady Streak',
    nickname: '状态在线',
    nicknameEn: 'In Form',
    luck: '顺风',
    luckEn: 'Smooth',
    emoji: '🧿',
    label: '蓝冠',
    labelEn: 'Blue Crown',
    color: 'text-sky-400',
    badge: 'border-sky-400/60 bg-sky-400/10',
  },
  {
    id: 'purple',
    multiple: 0.5,
    name: '战神觉醒',
    nameEn: 'Warlord Awake',
    nickname: '操作拉满',
    nicknameEn: 'Play Maxed',
    luck: '高能',
    luckEn: 'Charged',
    emoji: '🔮',
    label: '紫冠',
    labelEn: 'Purple Crown',
    color: 'text-purple-400',
    badge: 'border-purple-400/60 bg-purple-400/10',
  },
  {
    id: 'orange',
    multiple: 1,
    name: '天选战绩',
    nameEn: 'Chosen Record',
    nickname: '暴击起飞',
    nicknameEn: 'Crit Pump',
    luck: '爆表',
    luckEn: 'Overclock',
    emoji: '🔥',
    label: '橙冠',
    labelEn: 'Orange Crown',
    color: 'text-orange-400',
    badge: 'border-orange-400/60 bg-orange-400/10',
  },
  {
    id: 'prism',
    multiple: 2,
    name: '传奇战神',
    nameEn: 'Legend Warlord',
    nickname: '离谱连胜',
    nicknameEn: 'Absurd Streak',
    luck: '封神',
    luckEn: 'God Mode',
    emoji: '🌈',
    label: '彩冠',
    labelEn: 'Prism Crown',
    color: 'text-pink-400',
    badge: 'border-pink-400/60 bg-gradient-to-r from-pink-500/20 via-yellow-400/20 to-sky-400/20',
  },
];

export const RESULT_COPY = {
  zh: {
    success: ['止盈到手，战绩+1。', '稳稳拿下，战神启动。', '🎊：战神上分成功。'],
    fail: ['爆仓别慌，下一把还你。', '失误一波，战神继续。', '💩：回血再战。'],
    aborted: ['及时止损也是战术。', '撤退是为了更猛的反击。', '你撤了，但战绩还在。'],
  },
  en: {
    success: ['TP hit, record +1.', 'Clean win. Warlord on.', '🎊: Rank up.'],
    fail: ['Liquidated. Reload.', 'Missed this one. Keep going.', '💩: Recharge and retry.'],
    aborted: ['Cutting early is a tactic.', 'Retreat to hit harder.', 'You dipped, record stays.'],
  },
};
