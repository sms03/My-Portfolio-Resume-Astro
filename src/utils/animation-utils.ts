import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Common animation configurations
const ANIMATION_CONFIG = {
    duration: {
        fast: 0.3,
        normal: 0.6,
        slow: 0.8
    },
    ease: {
        default: 'power2.out',
        smooth: 'power3.out'
    },
    stagger: 0.1
};

// Unified fade in animation
export const fadeInUp = (elements: string | Element | Element[], options = {}) => {
    const config = {
        duration: ANIMATION_CONFIG.duration.normal,
        y: 30,
        stagger: ANIMATION_CONFIG.stagger,
        ease: ANIMATION_CONFIG.ease.default,
        ...options
    };

    const targets = gsap.utils.toArray(elements);
    gsap.set(targets, { opacity: 0, y: config.y });

    return gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: config.duration,
        stagger: config.stagger,
        ease: config.ease
    });
};

// Scroll-triggered animations
export const animateOnScroll = (selector: string, options = {}) => {
    const elements = gsap.utils.toArray(selector);

    elements.forEach((element: any) => {
        gsap.set(element, { opacity: 0, y: 30 });

        ScrollTrigger.create({
            trigger: element,
            start: 'top bottom-=100',
            once: true,
            onEnter: () => fadeInUp(element, options)
        });
    });
};

// Navigation animations
export const animateNavItems = (items: string | Element[], delay = 0) => {
    return fadeInUp(items, {
        y: -20,
        delay,
        duration: ANIMATION_CONFIG.duration.normal
    });
};

// Mobile menu animation
export const animateMobileMenu = (menuItems: string | Element[], isOpening = true): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            if (isOpening) {
                const animation = gsap.fromTo(menuItems,
                    { opacity: 0, x: -20 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: ANIMATION_CONFIG.duration.fast,
                        stagger: ANIMATION_CONFIG.stagger,
                        ease: ANIMATION_CONFIG.ease.default,
                        delay: 0.2,
                        onComplete: () => resolve()
                    }
                );
                
                // Fallback timeout
                setTimeout(() => resolve(), 1000);
            } else {
                const animation = gsap.to(menuItems, {
                    opacity: 0,
                    x: -20,
                    duration: ANIMATION_CONFIG.duration.fast,
                    stagger: ANIMATION_CONFIG.stagger / 2,
                    onComplete: () => resolve()
                });
                
                // Fallback timeout
                setTimeout(() => resolve(), 500);
            }
        } catch (error) {
            console.warn('Animation error:', error);
            resolve(); // Resolve anyway to prevent hanging
        }
    });
};

// Hero section animation
export const animateHero = () => {
    const hero = document.querySelector('.hero-section');
    if (!hero) return;

    const heroTitle = hero.querySelector('h1');
    const heroImage = hero.querySelector('figure');
    const heroText = hero.querySelector('.prose');
    const heroButtons = hero.querySelector('.flex.flex-wrap');

    const tl = gsap.timeline({
        defaults: {
            duration: ANIMATION_CONFIG.duration.slow,
            ease: ANIMATION_CONFIG.ease.smooth
        }
    });

    tl.fromTo(heroTitle,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0 }
    )
        .fromTo(heroImage,
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1 },
            '-=0.6'
        )
        .fromTo([heroText, heroButtons],
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, stagger: 0.1 },
            '-=0.6'
        );

    return tl;
};

// Initialize all animations
export const initAnimations = () => {
    document.body.classList.add('animations-ready');

    // Initialize hero animation
    animateHero();

    // Initialize scroll-triggered animations
    animateOnScroll('.project-card, .animate-on-scroll');
};