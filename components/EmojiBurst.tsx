import React from 'react';
import { motion } from 'framer-motion';

interface EmojiBurstProps {
  emojis: string[];
  tone?: 'success' | 'fail' | 'aborted';
}

export const EmojiBurst: React.FC<EmojiBurstProps> = ({ emojis, tone = 'success' }) => {
  const pieces = Array.from({ length: 18 }, (_, index) => ({
    id: `${tone}-${index}`,
    emoji: emojis[index % emojis.length],
    x: Math.random() * 240 - 120,
    y: Math.random() * 180 + 40,
    rotate: Math.random() * 160 - 80,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.2, 1],
            x: piece.x,
            y: piece.y,
            rotate: piece.rotate,
          }}
          transition={{ duration: 2.2, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 text-3xl"
        >
          {piece.emoji}
        </motion.span>
      ))}
    </div>
  );
};
