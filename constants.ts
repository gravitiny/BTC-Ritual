export const SYMBOL = 'BTC';
export const DEFAULT_MARGIN_USD = 0.5;
export const LEVERAGE = 40;
export const DAILY_LIMIT_ENABLED = false;

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
  { min: 0.9, label: '欧皇', emoji: '👑' },
  { min: 0.7, label: '顺风', emoji: '✨' },
  { min: 0.4, label: '一般', emoji: '😐' },
  { min: 0.2, label: '危险', emoji: '😬' },
  { min: 0, label: '地狱', emoji: '💀' },
];

export const CROWN_TIERS = [
  {
    id: 'fragment',
    profit: 0,
    name: '碎片',
    nickname: '倒霉碎片',
    luck: '地狱',
    emoji: '💩',
    label: '灰碎片',
    color: 'text-white/60',
    badge: 'border-white/30 bg-white/10',
  },
  {
    id: 'green',
    profit: DEFAULT_MARGIN_USD * 0.1,
    name: '好运连连',
    nickname: '绿到发光',
    luck: '一般',
    emoji: '🍀',
    label: '绿冠',
    color: 'text-success',
    badge: 'border-success/60 bg-success/10',
  },
  {
    id: 'blue',
    profit: DEFAULT_MARGIN_USD * 0.25,
    name: '大吉大利',
    nickname: '蓝蓝好运',
    luck: '顺风',
    emoji: '🧿',
    label: '蓝冠',
    color: 'text-sky-400',
    badge: 'border-sky-400/60 bg-sky-400/10',
  },
  {
    id: 'purple',
    profit: DEFAULT_MARGIN_USD * 0.5,
    name: '紫气东来',
    nickname: '史诗鸿运',
    luck: '欧皇',
    emoji: '🔮',
    label: '紫冠',
    color: 'text-purple-400',
    badge: 'border-purple-400/60 bg-purple-400/10',
  },
  {
    id: 'orange',
    profit: DEFAULT_MARGIN_USD * 1,
    name: '天选之子',
    nickname: '橙运爆棚',
    luck: '爆表',
    emoji: '🔥',
    label: '橙冠',
    color: 'text-orange-400',
    badge: 'border-orange-400/60 bg-orange-400/10',
  },
  {
    id: 'prism',
    profit: DEFAULT_MARGIN_USD * 2,
    name: '宇宙亲儿',
    nickname: '彩光护体',
    luck: '离谱',
    emoji: '🌈',
    label: '彩冠',
    color: 'text-pink-400',
    badge: 'border-pink-400/60 bg-gradient-to-r from-pink-500/20 via-yellow-400/20 to-sky-400/20',
  },
];

export const RESULT_COPY: Record<string, string[]> = {
  success: [
    '好运 buff 已获得。',
    '今天的你自带神秘加成。',
    '🎊：这把，你就是天命。',
  ],
  fail: [
    '💩：再来一单，重铸尊严。',
    '今天的宇宙有点皮。',
    '输是暂时的，梗是永恒的。',
  ],
  aborted: [
    '你怂了，但也算一种运气。',
    '逃跑的兔子也能活到明天。',
    '怂即是稳。',
  ],
};
