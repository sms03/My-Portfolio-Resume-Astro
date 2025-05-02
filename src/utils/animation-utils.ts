import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Page transition animations
export const pageTransition = () => {
    // Timeline for page exit
    const exitTimeline = gsap.timeline({
        defaults: { duration: 0.5, ease: 'power2.out' }
    });

    exitTimeline.to('.content-wrapper', {
        opacity: 0,
        y: 20,
    });

    return exitTimeline;
};

// Page enter animation
export const pageEnter = () => {
    const contentWrapper = document.querySelector('.content-wrapper');
    const headerElements = gsap.utils.toArray('h1, h2, h3, .hero-image');
    const paragraphs = gsap.utils.toArray('p, .button-wrapper, figure');

    gsap.set([headerElements, paragraphs], { opacity: 0, y: 30 });

    const enterTimeline = gsap.timeline({
        defaults: { duration: 0.6, ease: 'power2.out' }
    });

    enterTimeline
        .to(contentWrapper, { opacity: 1, duration: 0.3 })
        .to(headerElements, { opacity: 1, y: 0, stagger: 0.1 }, '-=0.1')
        .to(paragraphs, { opacity: 1, y: 0, stagger: 0.1 }, '-=0.3');

    return enterTimeline;
};

// Project card animations
export const animateProjectCards = () => {
    const projects = gsap.utils.toArray('.project-card');

    projects.forEach(project => {
        gsap.set(project, { opacity: 0, y: 50 });

        ScrollTrigger.create({
            trigger: project,
            start: 'top bottom-=100',
            once: true,
            onEnter: () => {
                gsap.to(project, {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            }
        });
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
        defaults: { duration: 0.8, ease: 'power3.out' }
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
        .fromTo(heroText,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0 },
            '-=0.6'
        )
        .fromTo(heroButtons,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0 },
            '-=0.6'
        );

    return tl;
};

// Initialize animations
export const initAnimations = () => {
    // Add class to body when animations are complete
    document.body.classList.add('animations-ready');

    // Initialize hero animation
    animateHero();

    // Initialize project card animations
    animateProjectCards();

    // Setup scroll animations
    gsap.utils.toArray('.animate-on-scroll').forEach(element => {
        gsap.set(element, { opacity: 0, y: 30 });

        ScrollTrigger.create({
            trigger: element,
            start: 'top bottom-=100',
            once: true,
            onEnter: () => {
                gsap.to(element, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power2.out'
                });
            }
        });
    });
};