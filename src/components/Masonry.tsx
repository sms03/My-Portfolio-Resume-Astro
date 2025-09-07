import { gsap } from 'gsap';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
    const get = () => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return defaultValue;
        }
        const idx = queries.findIndex(q => window.matchMedia(q).matches);
        return values[idx] ?? defaultValue;
    };

    const [value, setValue] = useState<number>(get);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        const mqls = queries.map(q => window.matchMedia(q));
        const handler = () => setValue(get());
        mqls.forEach(mql => {
            // addEventListener supported in modern browsers
            if (typeof mql.addEventListener === 'function') mql.addEventListener('change', handler);
            // fallback
            else if (typeof (mql as any).addListener === 'function') (mql as any).addListener(handler);
        });
        return () => {
            mqls.forEach(mql => {
                if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', handler);
                else if (typeof (mql as any).removeListener === 'function') (mql as any).removeListener(handler);
            });
        };
    }, [queries]);

    return value;
};

const useMeasure = <T extends HTMLElement>() => {
    const ref = useRef<T | null>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        if (typeof window === 'undefined' || !ref.current || !(window as any).ResizeObserver) return;
        const ro = new (window as any).ResizeObserver(([entry]: any) => {
            const { width, height } = entry.contentRect;
            setSize({ width, height });
        });
        ro.observe(ref.current);
        return () => ro.disconnect();
    }, []);

    return [ref, size] as const;
};

// (Preloading removed for instant render)

interface Item {
    id: string;
    img: string;
    url: string;
    height: number;
}

interface GridItem extends Item {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface MasonryProps {
    items: Item[];
    ease?: string;
    duration?: number;
    stagger?: number;
    animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random';
    scaleOnHover?: boolean;
    hoverScale?: number;
    blurToFocus?: boolean;
    colorShiftOnHover?: boolean;
}

const Masonry: React.FC<MasonryProps> = ({
    items,
    ease = 'power3.out',
    duration = 0.6,
    stagger = 0.05,
    animateFrom = 'bottom',
    scaleOnHover = true,
    hoverScale = 0.95,
    blurToFocus = true,
    colorShiftOnHover = false
}) => {
    const columns = useMedia(
        ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
        [5, 4, 3, 2],
        1
    );

    const [containerRef, { width }] = useMeasure<HTMLDivElement>();
    const [imagesReady, setImagesReady] = useState(true); // always true for immediate render
    // Lightbox removed – clicks now do nothing

    const toSafeUrl = (src: string) => {
        try {
            return encodeURI(src);
        } catch {
            return src;
        }
    };

    const getInitialPosition = (item: GridItem) => {
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return { x: item.x, y: item.y };

        let direction = animateFrom;
        if (animateFrom === 'random') {
            const dirs = ['top', 'bottom', 'left', 'right'];
            direction = dirs[Math.floor(Math.random() * dirs.length)] as typeof animateFrom;
        }

        switch (direction) {
            case 'top':
                return { x: item.x, y: -200 };
            case 'bottom':
                return { x: item.x, y: window.innerHeight + 200 };
            case 'left':
                return { x: -200, y: item.y };
            case 'right':
                return { x: window.innerWidth + 200, y: item.y };
            case 'center':
                return {
                    x: containerRect.width / 2 - item.w / 2,
                    y: containerRect.height / 2 - item.h / 2
                };
            default:
                return { x: item.x, y: item.y + 100 };
        }
    };

    // Removed image preloading + entrance animation for immediate layout

    const grid = useMemo<GridItem[]>(() => {
        if (!width) return [];
        const colHeights = new Array(columns).fill(0);
        const gap = 16;
        const totalGaps = (columns - 1) * gap;
        const columnWidth = (width - totalGaps) / columns;

        return items.map(child => {
            const col = colHeights.indexOf(Math.min(...colHeights));
            const x = col * (columnWidth + gap);
            const height = child.height / 2;
            const y = colHeights[col];

            colHeights[col] += height + gap;
            return { ...child, x, y, w: columnWidth, h: height };
        });
    }, [columns, items, width]);

    // Compute container height so the layout occupies space in document flow
    const containerHeight = useMemo(() => {
        if (!grid.length) return 0;
        let max = 0;
        for (const item of grid) {
            const bottom = item.y + item.h;
            if (bottom > max) max = bottom;
        }
        return max;
    }, [grid]);

    const hasMounted = useRef(false);

    useLayoutEffect(() => {
        if (typeof window === 'undefined') return;
        // Instant positioning (no entrance animation)
        grid.forEach(item => {
            const selector = `[data-key="${item.id}"]`;
            gsap.set(selector, { x: item.x, y: item.y, width: item.w, height: item.h, opacity: 1, clearProps: 'filter' });
        });
        hasMounted.current = true;
    }, [grid]);

    const handleMouseEnter = (id: string, element: HTMLElement) => {
        if (scaleOnHover) {
            gsap.to(`[data-key="${id}"]`, {
                scale: hoverScale,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        if (colorShiftOnHover) {
            const overlay = element.querySelector('.color-overlay') as HTMLElement;
            if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.3 });
        }
    };

    const handleMouseLeave = (id: string, element: HTMLElement) => {
        if (scaleOnHover) {
            gsap.to(`[data-key="${id}"]`, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
        if (colorShiftOnHover) {
            const overlay = element.querySelector('.color-overlay') as HTMLElement;
            if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 });
        }
    };

    // (Lightbox logic removed)

    const effectiveHeight = containerHeight || 720; // Fallback so it's visible before measure

    // During SSR, render a simple placeholder to avoid hook/runtime issues
    if (typeof window === 'undefined') {
        return <div className="w-full" style={{ height: 720 }} />;
    }

    return (
        <>
            <div ref={containerRef} className="relative w-full" style={{ height: effectiveHeight, minHeight: 480 }}>
                {!grid.length && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-60">
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                    </div>
                )}
                {grid.map(item => (
                    <div
                        key={item.id}
                        data-key={item.id}
                        className="absolute box-content select-none" /* cursor removed; no click action */
                        style={{ willChange: 'transform, width, height, opacity' }}
                        onMouseEnter={e => handleMouseEnter(item.id, e.currentTarget)}
                        onMouseLeave={e => handleMouseLeave(item.id, e.currentTarget)}
                    >
                        <div
                            className="relative w-full h-full bg-cover bg-center rounded-[10px] shadow-[0px_10px_50px_-10px_rgba(0,0,0,0.2)] uppercase text-[10px] leading-[10px]"
                            style={{ backgroundImage: `url("${toSafeUrl(item.img)}")` }}
                        >
                            {colorShiftOnHover && (
                                <div className="color-overlay absolute inset-0 rounded-[10px] bg-gradient-to-tr from-pink-500/50 to-sky-500/50 opacity-0 pointer-events-none" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default Masonry;
