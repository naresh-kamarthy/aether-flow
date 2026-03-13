import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DataPulseProps } from '../../types';

function DataPulse({ active, direction = 'down' }: DataPulseProps) {
    const isVertical = direction === 'down';


    return (
        <div
            className={`data-pulse-container ${isVertical ? 'data-pulse-vertical' : 'data-pulse-horizontal'}`}
            data-testid="data-pulse"
        >
            <svg
                viewBox={isVertical ? '0 0 40 60' : '0 0 120 40'}
                className="data-pulse-svg"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient
                        id={`pulseGrad-${direction}`}
                        x1={isVertical ? '0' : '0'}
                        y1={isVertical ? '0' : '0.5'}
                        x2={isVertical ? '0' : '1'}
                        y2={isVertical ? '1' : '0.5'}
                    >
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
                        <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                </defs>

                <path
                    d={isVertical ? 'M 20 0 L 20 60' : 'M 0 20 L 120 20'}
                    stroke="rgba(99, 102, 241, 0.2)"
                    strokeWidth="2"
                    fill="none"
                    style={{ opacity: active ? 1 : 0, transition: 'opacity 0.3s ease' }}
                />

                <motion.circle
                    r="4"
                    fill={`url(#pulseGrad-${direction})`}
                    filter="drop-shadow(0 0 6px rgba(99, 102, 241, 0.8))"
                    initial={isVertical ? { cx: 20, cy: 0 } : { cx: 0, cy: 20 }}
                    animate={
                        active ? (isVertical
                            ? { cy: [0, 60], opacity: [0, 1, 1, 0] }
                            : { cx: [0, 120], opacity: [0, 1, 1, 0] }) : {}
                    }
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{ opacity: active ? 1 : 0 }}
                />

                <motion.circle
                    r="3"
                    fill="#a5b4fc"
                    filter="drop-shadow(0 0 4px rgba(165, 180, 252, 0.6))"
                    initial={isVertical ? { cx: 20, cy: 0 } : { cx: 0, cy: 20 }}
                    animate={
                        active ? (isVertical
                            ? { cy: [0, 60], opacity: [0, 1, 1, 0] }
                            : { cx: [0, 120], opacity: [0, 1, 1, 0] }) : {}
                    }
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.3,
                    }}
                    style={{ opacity: active ? 1 : 0 }}
                />
            </svg>
        </div>
    );
}

export default memo(DataPulse);
