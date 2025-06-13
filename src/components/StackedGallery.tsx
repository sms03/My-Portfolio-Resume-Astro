import { useEffect, useRef, useState } from "react";

interface StackedGalleryProps {
    items: { image: string; text: string }[];
}

export default function StackedGallery({ items }: StackedGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const [imageLoaded, setImageLoaded] = useState<{ [key: number]: boolean }>({});
    const [showHint, setShowHint] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Hide hint after first interaction
    useEffect(() => {
        if (currentIndex > 0) {
            setShowHint(false);
        }
    }, [currentIndex]);

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        setIsDragging(true);
        setShowHint(false);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        setStartX(clientX);
        setCurrentX(clientX);

        // Prevent default behavior to avoid scrolling issues
        if ('touches' in e) {
            e.preventDefault();
        }
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        setCurrentX(clientX);
        const diff = clientX - startX;

        // Add resistance at the edges for better UX
        const maxTranslate = 100;
        const resistance = 0.4;
        let adjustedDiff = diff;

        if ((currentIndex === 0 && diff > 0) || (currentIndex === items.length - 1 && diff < 0)) {
            adjustedDiff = diff * resistance;
        }

        setTranslateX(Math.max(-maxTranslate, Math.min(maxTranslate, adjustedDiff)));

        if ('touches' in e) {
            e.preventDefault();
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const diff = currentX - startX;
        const threshold = 70; // Optimized threshold for mobile

        if (Math.abs(diff) > threshold) {
            if (diff > 0 && currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
            } else if (diff < 0 && currentIndex < items.length - 1) {
                setCurrentIndex(prev => prev + 1);
            }
        }

        setTranslateX(0);
    };
    const handleImageLoad = (index: number) => {
        setImageLoaded(prev => ({ ...prev, [index]: true }));
    };
    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Main Image Container */}
            <div
                ref={containerRef}
                className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                style={{
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitTapHighlightColor: 'transparent'
                }}
            >
                {items.map((item, index) => {
                    const isActive = index === currentIndex;
                    const isPrev = index === currentIndex - 1;
                    const isNext = index === currentIndex + 1;

                    let transform = 'translateX(100%) scale(0.85)';
                    let zIndex = 1;
                    let opacity = 0;

                    if (isActive) {
                        transform = `translateX(${translateX}px) scale(1)`;
                        zIndex = 10;
                        opacity = 1;
                    } else if (isPrev) {
                        transform = `translateX(${translateX - 100}%) scale(0.92)`;
                        zIndex = 5;
                        opacity = 0.4;
                    } else if (isNext) {
                        transform = `translateX(${translateX + 100}%) scale(0.92)`;
                        zIndex = 5;
                        opacity = 0.4;
                    } else if (index < currentIndex) {
                        transform = 'translateX(-100%) scale(0.85)';
                    }

                    return (
                        <div
                            key={index}
                            className="absolute inset-0 transition-all duration-500 ease-out"
                            style={{
                                transform,
                                zIndex,
                                opacity,
                                pointerEvents: isActive ? 'auto' : 'none'
                            }}
                        >              <div className="relative w-full h-full p-3 sm:p-5">
                                <div className="relative w-full h-full bg-white/[0.02] backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300">
                                    {/* Loading placeholder */}
                                    {!imageLoaded[index] && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/90 to-gray-900/90 flex items-center justify-center">
                                            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                                        </div>
                                    )}

                                    <img
                                        src={item.image}
                                        alt={item.text}
                                        className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded[index] ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                                            }`}
                                        draggable={false}
                                        onLoad={() => handleImageLoad(index)}
                                        style={{
                                            objectPosition: 'center'
                                        }}
                                    />

                                    {/* Enhanced gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none"></div>

                                    {/* Title with improved mobile typography */}
                                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                                        <h3 className="text-white font-semibold text-lg sm:text-xl lg:text-2xl tracking-wide drop-shadow-2xl leading-tight">
                                            {item.text}
                                        </h3>
                                        <div className="mt-2 w-10 h-0.5 bg-white/60 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}      </div>
        </div>
    );
}