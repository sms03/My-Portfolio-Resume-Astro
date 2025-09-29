import React, { useMemo, useState } from 'react';
import Masonry from './Masonry';

interface Artwork {
    image: string;
    text: string;
}

interface SortableMasonryProps {
    artworks: Artwork[];
    heights: number[];
    defaultUrl?: string;
}

type SortMode = 'newest' | 'oldest' | 'alpha' | 'rev-alpha' | 'random';

const SortableMasonry: React.FC<SortableMasonryProps> = ({ artworks, heights, defaultUrl = 'https://www.behance.net/SMSXART' }) => {
    const [mode, setMode] = useState<SortMode>('newest');
    const [seed, setSeed] = useState<number>(Date.now());

    const sorted = useMemo(() => {
        const withIndex = artworks.map((a, i) => ({ ...a, __index: i }));
        switch (mode) {
            case 'oldest':
                return withIndex;
            case 'newest':
                return [...withIndex].reverse();
            case 'alpha':
                return [...withIndex].sort((a, b) => a.text.localeCompare(b.text));
            case 'rev-alpha':
                return [...withIndex].sort((a, b) => b.text.localeCompare(a.text));
            case 'random': {
                let s = seed % 2147483647;
                const rand = () => (s = (s * 48271) % 2147483647) / 2147483647;
                const arr = [...withIndex];
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(rand() * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                return arr;
            }
            default:
                return withIndex;
        }
    }, [artworks, mode, seed]);

    const items = useMemo(
        () =>
            sorted.map((art, idx) => ({
                id: String(art.__index + 1),
                img: art.image,
                url: defaultUrl,
                height: heights[idx % heights.length]
            })),
        [sorted, heights, defaultUrl]
    );

    const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as SortMode;
        if (value === 'random') setSeed(Date.now());
        setMode(value);
    };

    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-2 items-center justify-end mb-4">
                <label
                    htmlFor="sort-mode"
                    className="text-sm font-medium text-[var(--text-main)] dark:text-[var(--text-main)]"
                >
                    Sort
                </label>
                <div className="relative">
                    <select
                        id="sort-mode"
                        value={mode}
                        onChange={handleModeChange}
                        className="appearance-none pr-8 pl-3 py-1.5 text-sm rounded-md border border-[color:var(--border-main)]/30 dark:border-[color:var(--border-main)]/40 bg-[color:var(--bg-muted)]/60 dark:bg-[color:var(--bg-muted)]/40 backdrop-blur-sm shadow-sm hover:border-[color:var(--border-main)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--border-main)]/30 focus:border-[color:var(--border-main)]/70 transition-colors cursor-pointer"
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="alpha">A → Z</option>
                        <option value="rev-alpha">Z → A</option>
                        <option value="random">Shuffle</option>
                    </select>
                    <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-2 text-xs opacity-60">▾</span>
                </div>
            </div>
            <Masonry
                items={items}
                ease="power3.out"
                duration={0.6}
                stagger={0.05}
                animateFrom="bottom"
                scaleOnHover={true}
                hoverScale={0.97}
                blurToFocus={true}
                colorShiftOnHover={false}
            />
        </div>
    );
};

export default SortableMasonry;
