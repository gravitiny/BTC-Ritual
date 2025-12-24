export const SYMBOL = 'BTC';
export const DEFAULT_MARGIN_USD = 1;
export const LEVERAGE = 100;
export const DAILY_LIMIT_ENABLED = false;

export const LUCK_TICK_MS = 200;
export const PRICE_TICK_MS = 1000;
export const RUN_DURATION_MS = 30000;
export const RESULT_THRESHOLD_SUCCESS = 0.7;
export const RESULT_THRESHOLD_FAIL = 0.3;
export const MAX_HISTORY_DAYS = 90;

export const TARGET_PROFIT_OPTIONS = [0.5, 1, 2, 5, 10];

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
    id: 'green',
    profit: 0.5,
    name: '普通',
    label: '绿冠',
    color: 'text-success',
    badge: 'border-success/60 bg-success/10',
  },
  {
    id: 'blue',
    profit: 1,
    name: '稀有',
    label: '蓝冠',
    color: 'text-sky-400',
    badge: 'border-sky-400/60 bg-sky-400/10',
  },
  {
    id: 'purple',
    profit: 2,
    name: '史实',
    label: '紫冠',
    color: 'text-purple-400',
    badge: 'border-purple-400/60 bg-purple-400/10',
  },
  {
    id: 'orange',
    profit: 5,
    name: '传说',
    label: '橙冠',
    color: 'text-orange-400',
    badge: 'border-orange-400/60 bg-orange-400/10',
  },
  {
    id: 'prism',
    profit: 10,
    name: '棱彩',
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
