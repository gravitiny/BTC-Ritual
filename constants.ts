
import { FortuneContent } from './types';

export const MARGIN_USDT = 5;
export const LEVERAGE = 100;
export const NOTIONAL = MARGIN_USDT * LEVERAGE;

export const FORTUNE_CONTENT: FortuneContent = {
  omens: [
    "The Frog nods in approval.",
    "The Moon reflects green candles.",
    "A whale splashes in the distance.",
    "The dev wallet remains dormant.",
    "Your coffee cup shows a bull's horn.",
    "The wind whispers 'pump it'.",
    "A red pigeon landed on your window (dangerous vibes)."
  ],
  whispers: [
    "Send it...",
    "Wait for the signal...",
    "Fortune favors the brave jeets.",
    "The stars are misaligned, but the leverage is high.",
    "It's just numbers on a screen, anon.",
    "History is written by the liquidated.",
    "One trade to rule them all."
  ],
  narrations: {
    favorable: [
      "The universe is smiling.",
      "God candle incoming?",
      "Dev is definitely asleep.",
      "Green is the color of fate.",
      "Whale alert! Someone is buying your bag."
    ],
    unfavorable: [
      "The market feels your fear.",
      "Vibes are deteriorating.",
      "Is that a dump in the distance?",
      "The frog is looking away.",
      "Hands getting shaky?"
    ],
    neutral: [
      "The sideways demon beckons.",
      "Market is holding its breath.",
      "Silence before the storm.",
      "Fate is calculating...",
      "Crabbing along the edge of destiny."
    ]
  }
};
