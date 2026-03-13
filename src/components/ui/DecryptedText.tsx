import { useEffect, useState, useRef } from 'react';
import type { DecryptedTextProps } from '../../types';


const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

function DecryptedText({
    text,
    speed = 50,
    maxIterations = 10,
    sequential = true,
    className = '',
    animateOn = 'mount',
    reveal = false,
}: DecryptedTextProps) {
    const [displayText, setDisplayText] = useState(
        animateOn === 'mount' ? text.replace(/[^\s]/g, '█') : text
    );
    const [isAnimating, setIsAnimating] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const containerRef = useRef<HTMLSpanElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const animate = () => {
        if (isAnimating || reveal) return;
        setIsAnimating(true);

        const chars = text.split('');
        const iterations = new Array<number>(chars.length).fill(0);
        let currentIndex = 0;

        intervalRef.current = setInterval(() => {
            const newText = chars
                .map((char, i) => {
                    if (char === ' ') return ' ';

                    if (sequential) {
                        if (i < currentIndex) return char;
                        if (i === currentIndex) {
                            iterations[i] = (iterations[i] ?? 0) + 1;
                            if ((iterations[i] ?? 0) >= maxIterations) {
                                currentIndex++;
                                return char;
                            }
                            return CHARS[Math.floor(Math.random() * CHARS.length)] ?? '█';
                        }
                        return CHARS[Math.floor(Math.random() * CHARS.length)] ?? '█';
                    }

                    iterations[i] = (iterations[i] ?? 0) + 1;
                    if ((iterations[i] ?? 0) >= maxIterations) return char;
                    return CHARS[Math.floor(Math.random() * CHARS.length)] ?? '█';
                })
                .join('');

            setDisplayText(newText);

            const allDone = sequential
                ? currentIndex >= chars.length
                : iterations.every((it) => it >= maxIterations);

            if (allDone) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setDisplayText(text);
                setIsAnimating(false);
                setHasAnimated(true);
            }
        }, speed);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    };

    // Handle reveal prop
    useEffect(() => {
        if (reveal) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setDisplayText(text);
            setIsAnimating(false);
            setHasAnimated(true);
        }
    }, [reveal, text]);

    // Mount-based animation
    useEffect(() => {
        if (animateOn === 'mount' && !hasAnimated && !reveal) {
            const cleanup = animate();
            return cleanup;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, reveal]);

    // View-based animation (IntersectionObserver)
    useEffect(() => {
        if (animateOn !== 'view' || hasAnimated || reveal) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    animate();
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        const el = containerRef.current;
        if (el) observer.observe(el);

        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [animateOn, hasAnimated, reveal]);

    const handleMouseEnter = () => {
        if (animateOn === 'hover' && !isAnimating && !reveal) {
            animate();
        }
    };

    return (
        <span
            ref={containerRef}
            className={`decrypted-text ${className}`}
            onMouseEnter={handleMouseEnter}
            data-testid="decrypted-text"
        >
            {displayText}
        </span>
    );
}

export default DecryptedText;
