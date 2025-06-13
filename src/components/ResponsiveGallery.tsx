import { useEffect, useState } from "react";
import CircularGallery from './CircularGallery';
import StackedGallery from './StackedGallery';

interface ResponsiveGalleryProps {
    items: { image: string; text: string }[];
    bend?: number;
    textColor?: string;
    borderRadius?: number;
    font?: string;
}

export default function ResponsiveGallery({
    items,
    bend = 3,
    textColor = "#ffffff",
    borderRadius = 0.05,
    font = "600 20px 'Inter Variable', system-ui, -apple-system, sans-serif"
}: ResponsiveGalleryProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        const checkIsMobile = () => {
            // More refined mobile detection
            const mobile = window.innerWidth < 1024; // Changed from 768 to 1024 for better tablet experience
            setIsMobile(mobile);
            setIsLoaded(true);
        };

        // Initial check
        checkIsMobile();

        // Listen for resize events with debouncing
        let timeoutId: NodeJS.Timeout;
        const debouncedCheck = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(checkIsMobile, 150);
        };

        window.addEventListener('resize', debouncedCheck);

        return () => {
            window.removeEventListener('resize', debouncedCheck);
            clearTimeout(timeoutId);
        };
    }, []);
    // Show loading state until we determine the device type
    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4 animate-pulse">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                    <p className="text-sm text-white/70 font-medium">Loading Gallery...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {isMobile ? (
                <StackedGallery items={items} />
            ) : (
                <CircularGallery
                    items={items}
                    bend={bend}
                    textColor={textColor}
                    borderRadius={borderRadius}
                    font={font}
                />
            )}
        </>
    );
}
