import { Language } from './types';

type TranslationValue = string | string[] | Record<string, TranslationValue>;

export const detectLanguage = (): Language => {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language?.toLowerCase() ?? '';
  return lang.startsWith('zh') ? 'zh' : 'en';
};

const translations: Record<Language, Record<string, TranslationValue>> = {
  zh: {
    nav: {
      trade: '下单',
      history: '历史',
      leaderboard: '排行榜',
    },
    header: {
      tagline: '小资金 · 大杠杆',
      brand: '5U 战神',
    },
    wallet: {
      balanceLoading: 'USDC 加载中',
      deposit: '充值',
      connected: '钱包已连接',
      connecting: '连接中...',
      connect: '连接钱包',
    },
    trade: {
      title: '开单',
      fixedLeverage: '固定 {leverage}x',
      marginSummary: '保证金 {margin}U',
      notionalSummary: '名义 {notional}',
      marginInput: '保证金输入',
      direction: '方向',
      multiple: '翻倍数',
      multipleItem: '翻 {multiple}',
      rewardEstimate: '预计奖励：{label} · {name}',
      customMultiple: '自定义翻倍',
      customPlaceholder: '0.05 起',
      customMin: '最低 0.05 倍',
      targetProfit: '目标收益 ≈ {value}U',
      chartTitle: 'BTC 走势预览',
      referencePrice: '参考价 {price}',
      priceLoading: '实时价加载中',
      readyTitle: '准备好了？',
      readyCopy: '确认方向与目标后直接开战。',
      submitting: '下单中...',
      submit: '立即开单 ⚡️',
    },
    footer: {
      disclaimer: '高杠杆玩法 • 风险自担 • {year}',
    },
    toast: {
      connectFirst: '先连接钱包再开战。',
      dailyLimit: '今日次数已用完。明天再来。',
      marginPositive: '保证金需要大于 0。',
      balanceLow: '余额不足，先充值再战。',
      minNotional: '名义金额不足 10U，请提高保证金。',
      multipleMin: '自定义倍数建议不低于 0.05 倍。',
      prepSign: '准备签名，读取实时价格...',
      walletReady: '钱包已就绪，拉取 BTC 价格...',
      priceReady: '价格就绪，创建下单并签名...',
      signed: '签名完成，发送 /exchange...',
      orderReceived: '收到订单响应，解析状态...',
      orderFailed: '下单失败：{message}',
      orderNotFilled: '下单失败：主单未成交，请重新下单。',
      tpFailed: '止盈单失败：{message}',
      tpPlaced: '已挂止盈单（限价）。',
      signCanceled: '已取消钱包签名。',
      walletUnauthorized: '钱包连接未授权，请关闭 WalletConnect 或确认允许域名。',
      orderFailedGeneric: '下单失败，系统在卡顿。',
    },
    run: {
      progressWin: '离🎊只差一步',
      progressRisk: '别眨眼，风险高',
      progressSwing: '摇摆中…',
      closeSuccess: '已尝试市价平仓。',
      closeCanceled: '已取消钱包签名。',
      closeFailed: '平仓失败，请检查钱包签名。',
      currentPrice: '当前价格',
      blink: '别眨眼！',
      entryPrice: '开仓价 {price}',
      liqPrice: '爆仓价 {price}',
      tpPrice: '止盈价 {price}',
      sessionSummary: '{side} · 翻 {multiple} 倍 · 目标 {target}U · {leverage}x',
      closeWindow: '关闭窗口 ✖️',
      abort: '中止这单 🛑',
    },
    history: {
      status: {
        success: '止盈达成，战绩+1。',
        fail: '爆仓也算战损记录。',
        aborted: '及时撤退，保命要紧。',
        running: '待结算',
      },
      stats: {
        streak: '连续天数',
        successRate: '成功率',
        todayCount: '今日次数',
      },
      badgesTitle: '战绩勋章',
      badgesEmpty: '还没有勋章，去开一单攒战绩',
      recordsTitle: '战绩记录',
      empty: '还没战绩，先去开一单吧。',
      resume: '点击继续',
      recordLine: '{date} · {side} · 翻 {multiple} 倍 · 目标 {target}U',
    },
    leaderboard: {
      title: '排行榜',
      scoreRule: '计分：绿1 / 蓝5 / 紫20 / 橙100 / 彩500',
      tabs: {
        champions: '历史王者',
        winrate: '胜率榜',
        clown: '小丑榜',
      },
      noCrown: '暂无王冠',
      score: '总分 {score}',
      record: '成功 {wins} / 失败 {losses}',
      winrate: '胜率 {rate}%',
      clownrate: '小丑率 {rate}%',
    },
    result: {
      rewardLabel: '获得{label} x{count}',
      settling: '结算中...',
      title: {
        success: '止盈达成',
        fail: '爆仓记录',
        aborted: '中止记录',
      },
      label: {
        side: '方向 {side}',
        target: '目标 {target}U',
        entry: '开仓 {price}',
        reward: '奖励 {label} +{count}',
        combine: '合成',
      },
      backHome: '回到首页 🏠',
    },
    relative: {
      win: '离🎊只差 {value}%',
      fail: '你离💩还有 {value}%',
      liqLabel: '爆仓 💩',
      tpLabel: '止盈 🎊',
    },
    share: {
      button: '分享',
      running: '进行中',
      success: '止盈',
      fail: '爆仓',
      aborted: '中止',
      pnlLabel: '未结算收益',
      targetLabel: '目标收益',
      shareCardTitle: '5U 战神战报',
      shareCardSub: '小资金 · 大杠杆',
      entryLabel: '开仓',
      liqLabel: '爆仓',
      tpLabel: '止盈',
      tweetRunning: [
        '喜不喜欢爸爸的大阳线？订单进行中，目标{target}U。',
        '开单就别眨眼，正在冲刺目标{target}U。',
        '盘面在抖，我在冲，目标{target}U。',
      ],
      tweetSuccess: [
        '喜不喜欢爸爸的大阳线？止盈达成，目标{target}U。',
        '这波拿下了，止盈到手，目标{target}U。',
        '战神又赢了，目标{target}U 成功。',
      ],
      tweetFail: [
        '喜不喜欢爸爸的大阳线？爆仓复盘中，目标{target}U。',
        '交了学费，再来一局，目标{target}U。',
        '今日手滑，爆仓记录+1，目标{target}U。',
      ],
      tweetAborted: [
        '喜不喜欢爸爸的大阳线？我先撤了，目标{target}U。',
        '撤退是为了更猛，目标{target}U。',
        '先保命再出击，目标{target}U。',
      ],
      generating: '生成分享图中...',
      downloaded: '分享图已生成。',
      failed: '分享失败：{message}',
    },
    misc: {
      you: '你',
      noData: '暂无数据',
      loading: '加载中',
    },
    units: {
      days: '天',
      times: '次',
    },
  },
  en: {
    nav: {
      trade: 'Trade',
      history: 'History',
      leaderboard: 'Leaderboard',
    },
    header: {
      tagline: 'Small margin · Big leverage',
      brand: '5U Warlord',
    },
    wallet: {
      balanceLoading: 'USDC loading',
      deposit: 'Deposit',
      connected: 'Wallet connected',
      connecting: 'Connecting...',
      connect: 'Connect wallet',
    },
    trade: {
      title: 'Trade',
      fixedLeverage: 'Fixed {leverage}x',
      marginSummary: 'Margin {margin}U',
      notionalSummary: 'Notional {notional}',
      marginInput: 'Margin input',
      direction: 'Side',
      multiple: 'Multiple',
      multipleItem: 'x {multiple}',
      rewardEstimate: 'Reward: {label} · {name}',
      customMultiple: 'Custom multiple',
      customPlaceholder: '0.05 min',
      customMin: 'Min 0.05x',
      targetProfit: 'Target ≈ {value}U',
      chartTitle: 'BTC chart',
      referencePrice: 'Ref {price}',
      priceLoading: 'Live price loading',
      readyTitle: 'Ready?',
      readyCopy: 'Confirm side and target before you fire.',
      submitting: 'Placing...',
      submit: 'Place order ⚡️',
    },
    footer: {
      disclaimer: 'High leverage play • Risk on you • {year}',
    },
    toast: {
      connectFirst: 'Connect your wallet first.',
      dailyLimit: 'Daily limit reached. Try tomorrow.',
      marginPositive: 'Margin must be greater than 0.',
      balanceLow: 'Insufficient balance. Deposit first.',
      minNotional: 'Notional below $10. Increase margin.',
      multipleMin: 'Custom multiple should be ≥ 0.05x.',
      prepSign: 'Preparing signature, fetching price...',
      walletReady: 'Wallet ready, loading BTC price...',
      priceReady: 'Price ready, creating order...',
      signed: 'Signed, sending /exchange...',
      orderReceived: 'Order response received...',
      orderFailed: 'Order failed: {message}',
      orderNotFilled: 'Order failed: main order not filled.',
      tpFailed: 'TP order failed: {message}',
      tpPlaced: 'TP order placed (limit).',
      signCanceled: 'Signature cancelled.',
      walletUnauthorized: 'Wallet not authorized. Close WalletConnect or allow the domain.',
      orderFailedGeneric: 'Order failed. System busy.',
    },
    run: {
      progressWin: 'One step to 🎊',
      progressRisk: 'Heads up, risky',
      progressSwing: 'Swinging…',
      closeSuccess: 'Tried market close.',
      closeCanceled: 'Signature cancelled.',
      closeFailed: 'Close failed. Check wallet signature.',
      currentPrice: 'Current price',
      blink: 'Don’t blink!',
      entryPrice: 'Entry {price}',
      liqPrice: 'Liq {price}',
      tpPrice: 'TP {price}',
      sessionSummary: '{side} · x{multiple} · Target {target}U · {leverage}x',
      closeWindow: 'Close window ✖️',
      abort: 'Abort 🛑',
    },
    history: {
      status: {
        success: 'TP hit. Record +1.',
        fail: 'Liquidated. Still logged.',
        aborted: 'Retreated. Stay alive.',
        running: 'Pending',
      },
      stats: {
        streak: 'Streak',
        successRate: 'Win rate',
        todayCount: 'Today',
      },
      badgesTitle: 'Badges',
      badgesEmpty: 'No badges yet. Place a trade.',
      recordsTitle: 'Records',
      empty: 'No records yet. Place a trade.',
      resume: 'Resume',
      recordLine: '{date} · {side} · x{multiple} · Target {target}U',
    },
    leaderboard: {
      title: 'Leaderboard',
      scoreRule: 'Score: G1 / B5 / P20 / O100 / R500',
      tabs: {
        champions: 'Champions',
        winrate: 'Win rate',
        clown: 'Clown',
      },
      noCrown: 'No crowns',
      score: 'Score {score}',
      record: 'Wins {wins} / Losses {losses}',
      winrate: 'Win {rate}%',
      clownrate: 'Clown {rate}%',
    },
    result: {
      rewardLabel: 'Reward {label} x{count}',
      settling: 'Settling...',
      title: {
        success: 'TP hit',
        fail: 'Liquidation',
        aborted: 'Aborted',
      },
      label: {
        side: 'Side {side}',
        target: 'Target {target}U',
        entry: 'Entry {price}',
        reward: 'Reward {label} +{count}',
        combine: 'Combine',
      },
      backHome: 'Back home 🏠',
    },
    relative: {
      win: '{value}% to 🎊',
      fail: '{value}% from 💩',
      liqLabel: 'Liquidation 💩',
      tpLabel: 'Take-profit 🎊',
    },
    share: {
      button: 'Share',
      running: 'Running',
      success: 'TP Hit',
      fail: 'Liquidated',
      aborted: 'Aborted',
      pnlLabel: 'Unrealized PnL',
      targetLabel: 'Target',
      shareCardTitle: '5U Warlord Report',
      shareCardSub: 'Small margin · Big leverage',
      entryLabel: 'Entry',
      liqLabel: 'Liq',
      tpLabel: 'TP',
      tweetRunning: [
        'Like that big green candle? Order running, target {target}U.',
        'No blinking. Chasing {target}U.',
        'Market is moving. I am too. Target {target}U.',
      ],
      tweetSuccess: [
        'Like that big green candle? TP hit, target {target}U.',
        'Clean win. Target {target}U secured.',
        'Warlord wins again. Target {target}U.',
      ],
      tweetFail: [
        'Like that big green candle? Liquidated, target {target}U.',
        'Paid tuition, back for more. Target {target}U.',
        'Slipped today. Liquidated. Target {target}U.',
      ],
      tweetAborted: [
        'Like that big green candle? I bailed, target {target}U.',
        'Retreat first, strike later. Target {target}U.',
        'Survival mode. Target {target}U.',
      ],
      generating: 'Generating share image...',
      downloaded: 'Share image ready.',
      failed: 'Share failed: {message}',
    },
    misc: {
      you: 'You',
      noData: 'No data',
      loading: 'Loading',
    },
    units: {
      days: 'days',
      times: 'times',
    },
  },
};

const resolveKey = (dict: Record<string, TranslationValue>, key: string): TranslationValue | null => {
  const segments = key.split('.');
  let current: TranslationValue = dict;
  for (const segment of segments) {
    if (typeof current !== 'object' || current === null || !(segment in current)) {
      return null;
    }
    current = (current as Record<string, TranslationValue>)[segment];
  }
  return current;
};

export const t = (language: Language, key: string, vars?: Record<string, string | number>) => {
  const resolved = resolveKey(translations[language], key) ?? resolveKey(translations.zh, key) ?? key;
  const template = Array.isArray(resolved)
    ? resolved[Math.floor(Math.random() * resolved.length)]
    : typeof resolved === 'string'
      ? resolved
      : key;
  if (!vars) return template;
  return Object.entries(vars).reduce((result, [k, value]) => {
    return result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(value));
  }, template);
};

export const getTierText = (
  tier: {
    label: string;
    labelEn: string;
    name: string;
    nameEn: string;
    nickname: string;
    nicknameEn: string;
    luck: string;
    luckEn: string;
  },
  language: Language
) => {
  return {
    label: language === 'en' ? tier.labelEn : tier.label,
    name: language === 'en' ? tier.nameEn : tier.name,
    nickname: language === 'en' ? tier.nicknameEn : tier.nickname,
    luck: language === 'en' ? tier.luckEn : tier.luck,
  };
};
