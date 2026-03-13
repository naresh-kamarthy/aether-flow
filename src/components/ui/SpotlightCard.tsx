import { useRef,type MouseEvent as ReactMouseEvent } from 'react';
import type { SpotlightCardProps } from '../../types';

function SpotlightCard({
    children,
    spotlightColor = 'rgba(120, 119, 198, 0.3)',
    className = '',
}: SpotlightCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--spotlight-x', `${x}px`);
        card.style.setProperty('--spotlight-y', `${y}px`);
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className={`spotlight-card ${className}`}
            style={
                {
                    '--spotlight-color': spotlightColor,
                } as React.CSSProperties
            }
        >
            {children}
        </div>
    );
}

export default SpotlightCard;
