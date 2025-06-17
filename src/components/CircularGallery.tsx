import {
    Camera,
    Mesh,
    Plane,
    Program,
    Renderer,
    Texture,
    Transform,
} from "ogl";
import { useEffect, useRef } from "react";

type GL = Renderer["gl"];

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
    let timeout: number;
    return function (this: any, ...args: Parameters<T>) {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(() => func.apply(this, args), wait);
    };
}

function lerp(p1: number, p2: number, t: number): number {
    return p1 + (p2 - p1) * t;
}

function autoBind(instance: any): void {
    const proto = Object.getPrototypeOf(instance);
    Object.getOwnPropertyNames(proto).forEach((key) => {
        if (key !== "constructor" && typeof instance[key] === "function") {
            instance[key] = instance[key].bind(instance);
        }
    });
}

function getFontSize(font: string): number {
    const match = font.match(/(\d+)px/);
    return match ? parseInt(match[1], 10) : 30;
}

function createTextTexture(
    gl: GL,
    text: string,
    font: string = "600 20px 'Newsreader Variable', 'Newsreader', serif",
    color: string = "black"
): { texture: Texture; width: number; height: number } {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2d context");

    context.font = font;
    const metrics = context.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const fontSize = getFontSize(font);
    const textHeight = Math.ceil(fontSize * 1.2);

    canvas.width = textWidth + 20;
    canvas.height = textHeight + 20;

    context.font = font;
    context.fillStyle = color;
    context.textBaseline = "middle";
    context.textAlign = "center";
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new Texture(gl, { generateMipmaps: false });
    texture.image = canvas;
    return { texture, width: canvas.width, height: canvas.height };
}

interface TitleProps {
    gl: GL;
    plane: Mesh;
    renderer: Renderer;
    text: string;
    textColor?: string;
    font?: string;
}

class Title {
    gl: GL;
    plane: Mesh;
    renderer: Renderer;
    text: string;
    textColor: string;
    font: string;
    mesh!: Mesh;

    constructor({
        gl,
        plane,
        renderer,
        text,
        textColor = "#ffffff",
        font = "600 20px 'Newsreader Variable', 'Newsreader', serif",
    }: TitleProps) {
        autoBind(this);
        this.gl = gl;
        this.plane = plane;
        this.renderer = renderer;
        this.text = text;
        this.textColor = textColor;
        this.font = font;
        this.createMesh();
    }

    createMesh() {
        const { texture, width, height } = createTextTexture(
            this.gl,
            this.text,
            this.font,
            this.textColor
        );
        const geometry = new Plane(this.gl);
        const program = new Program(this.gl, {
            vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
            uniforms: { tMap: { value: texture } },
            transparent: true,
        });
        this.mesh = new Mesh(this.gl, { geometry, program });
        const aspect = width / height;

        // Mobile-responsive text scaling
        const isMobile = window.innerWidth < 768;
        const textScaleFactor = isMobile ? 0.12 : 0.15;
        const textHeightScaled = this.plane.scale.y * textScaleFactor;
        const textWidthScaled = textHeightScaled * aspect;

        this.mesh.scale.set(textWidthScaled, textHeightScaled, 1);

        // Adjust text position for mobile
        const textOffset = isMobile ? 0.04 : 0.05;
        this.mesh.position.y =
            -this.plane.scale.y * 0.5 - textHeightScaled * 0.5 - textOffset;
        this.mesh.setParent(this.plane);
    }
}

interface ScreenSize {
    width: number;
    height: number;
}

interface Viewport {
    width: number;
    height: number;
}

interface MediaProps {
    geometry: Plane;
    gl: GL;
    image: string;
    index: number;
    length: number;
    renderer: Renderer;
    scene: Transform;
    screen: ScreenSize;
    text: string;
    viewport: Viewport;
    bend: number;
    textColor: string;
    borderRadius?: number;
    font?: string;
}

class Media {
    extra: number = 0;
    geometry: Plane;
    gl: GL;
    image: string;
    index: number;
    length: number;
    renderer: Renderer;
    scene: Transform;
    screen: ScreenSize;
    text: string;
    viewport: Viewport;
    bend: number;
    textColor: string;
    borderRadius: number;
    font?: string;
    program!: Program;
    plane!: Mesh;
    title!: Title;
    scale!: number;
    padding!: number;
    width!: number;
    widthTotal!: number;
    x!: number;
    speed: number = 0;
    isBefore: boolean = false;
    isAfter: boolean = false;

    constructor({
        geometry,
        gl,
        image,
        index,
        length,
        renderer,
        scene,
        screen,
        text,
        viewport,
        bend,
        textColor,
        borderRadius = 0,
        font,
    }: MediaProps) {
        this.geometry = geometry;
        this.gl = gl;
        this.image = image;
        this.index = index;
        this.length = length;
        this.renderer = renderer;
        this.scene = scene;
        this.screen = screen;
        this.text = text;
        this.viewport = viewport;
        this.bend = bend;
        this.textColor = textColor;
        this.borderRadius = borderRadius;
        this.font = font; this.createShader();
        this.createMesh();
        this.createTitle();
        this.onResize();

        // Set initial position immediately to prevent stacking
        this.plane.position.x = this.x;
        this.extra = 0;

        // Apply initial circular formation
        this.applyCircularPosition(0);
    }

    createShader() {
        const texture = new Texture(this.gl, { generateMipmaps: false });
        this.program = new Program(this.gl, {
            depthTest: false,
            depthWrite: false,
            vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
            fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          if(d > 0.0) {
            discard;
          }
          
          gl_FragColor = vec4(color.rgb, 1.0);
        }
      `,
            uniforms: {
                tMap: { value: texture },
                uPlaneSizes: { value: [0, 0] },
                uImageSizes: { value: [0, 0] },
                uSpeed: { value: 0 },
                uTime: { value: 100 * Math.random() },
                uBorderRadius: { value: this.borderRadius },
            },
            transparent: true,
        });
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = this.image;
        img.onload = () => {
            texture.image = img;
            this.program.uniforms.uImageSizes.value = [
                img.naturalWidth,
                img.naturalHeight,
            ];
        };
    }

    createMesh() {
        this.plane = new Mesh(this.gl, {
            geometry: this.geometry,
            program: this.program,
        });
        this.plane.setParent(this.scene);
    }

    createTitle() {
        this.title = new Title({
            gl: this.gl,
            plane: this.plane,
            renderer: this.renderer,
            text: this.text,
            textColor: this.textColor,
            font: this.font,
        });
    } update(
        scroll: { current: number; last: number },
        direction: "right" | "left"
    ) {
        // Apply circular positioning
        this.applyCircularPosition(scroll.current);

        // Handle animation and speed
        this.speed = scroll.current - scroll.last;
        this.program.uniforms.uTime.value += 0.04;
        this.program.uniforms.uSpeed.value = this.speed;

        // Handle infinite scrolling
        const planeOffset = this.plane.scale.x / 2;
        const viewportOffset = this.viewport.width / 2;
        this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
        this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
        if (direction === "right" && this.isBefore) {
            this.extra -= this.widthTotal;
            this.isBefore = this.isAfter = false;
        }
        if (direction === "left" && this.isAfter) {
            this.extra += this.widthTotal;
            this.isBefore = this.isAfter = false;
        }
    }

    onResize({
        screen,
        viewport,
    }: { screen?: ScreenSize; viewport?: Viewport } = {}) {
        if (screen) this.screen = screen;
        if (viewport) {
            this.viewport = viewport;
            if (this.plane.program.uniforms.uViewportSizes) {
                this.plane.program.uniforms.uViewportSizes.value = [
                    this.viewport.width,
                    this.viewport.height,
                ];
            }
        }

        // Mobile-optimized scaling
        const isMobile = this.screen.width < 768;
        const baseScale = isMobile ? this.screen.height / 1200 : this.screen.height / 1500;
        this.scale = Math.max(baseScale, 0.3); // Minimum scale for very small screens

        // Adjust plane sizes for mobile
        const heightMultiplier = isMobile ? 700 : 900;
        const widthMultiplier = isMobile ? 550 : 700;

        this.plane.scale.y =
            (this.viewport.height * (heightMultiplier * this.scale)) / this.screen.height;
        this.plane.scale.x =
            (this.viewport.width * (widthMultiplier * this.scale)) / this.screen.width;

        this.plane.program.uniforms.uPlaneSizes.value = [
            this.plane.scale.x,
            this.plane.scale.y,
        ];

        // Adjust padding for mobile
        this.padding = isMobile ? 1.5 : 2;
        this.width = this.plane.scale.x + this.padding;
        this.widthTotal = this.width * this.length;
        this.x = this.width * this.index;
    }

    applyCircularPosition(scrollCurrent: number = 0) {
        // Set horizontal position
        this.plane.position.x = this.x - scrollCurrent - this.extra;

        const x = this.plane.position.x;
        const H = this.viewport.width / 2;

        // Apply circular bend effect
        if (this.bend === 0) {
            this.plane.position.y = 0;
            this.plane.rotation.z = 0;
        } else {
            const B_abs = Math.abs(this.bend);
            const R = (H * H + B_abs * B_abs) / (2 * B_abs);
            const effectiveX = Math.min(Math.abs(x), H);

            const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
            if (this.bend > 0) {
                this.plane.position.y = -arc;
                this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
            } else {
                this.plane.position.y = arc;
                this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
            }
        }
    }
}

interface AppConfig {
    items?: { image: string; text: string }[];
    bend?: number;
    textColor?: string;
    borderRadius?: number;
    font?: string;
}

class App {
    container: HTMLElement;
    scroll: {
        ease: number;
        current: number;
        target: number;
        last: number;
        position?: number;
    };
    onCheckDebounce: (...args: any[]) => void;
    renderer!: Renderer;
    gl!: GL;
    camera!: Camera;
    scene!: Transform;
    planeGeometry!: Plane;
    medias: Media[] = [];
    mediasImages: { image: string; text: string }[] = [];
    screen!: { width: number; height: number };
    viewport!: { width: number; height: number };
    raf: number = 0;

    boundOnResize!: () => void;
    boundOnWheel!: () => void;
    boundOnTouchDown!: (e: MouseEvent | TouchEvent) => void;
    boundOnTouchMove!: (e: MouseEvent | TouchEvent) => void;
    boundOnTouchUp!: () => void;

    isDown: boolean = false;
    start: number = 0;
    constructor(
        container: HTMLElement,
        {
            items,
            bend = 1,
            textColor = "#ffffff",
            borderRadius = 0,
            font = "600 20px 'Newsreader Variable', 'Newsreader', serif",
        }: AppConfig
    ) {
        document.documentElement.classList.remove("no-js");
        this.container = container;        // Mobile-optimized scroll configuration - Enhanced for smoother swiping
        const isMobile = window.innerWidth < 768;
        this.scroll = {
            ease: isMobile ? 0.12 : 0.08, // Increased easing for smoother transitions
            current: 0,
            target: 0,
            last: 0
        }; this.onCheckDebounce = debounce(this.onCheck.bind(this), isMobile ? 100 : 150); // Reduced debounce for faster response
        this.createRenderer();
        this.createCamera();
        this.createScene();
        this.onResize();
        this.createGeometry();
        this.createMedias(items, bend, textColor, borderRadius, font);
        // Initialize positions to prevent stacking on page load
        this.scroll.current = 0;
        this.scroll.target = 0;
        this.scroll.last = 0;

        // Ensure all media are properly positioned in circular formation
        if (this.medias) {
            this.medias.forEach((media) => {
                media.plane.position.x = media.x;
                media.extra = 0;
                // Apply circular formation immediately
                media.applyCircularPosition(0);
            });
        }

        // Small delay to ensure smooth initialization
        requestAnimationFrame(() => {
            this.update();
        });
        this.addEventListeners();
    } createRenderer() {
        this.renderer = new Renderer({ alpha: true });
        this.gl = this.renderer.gl;
        this.gl.clearColor(0, 0, 0, 0);

        const canvas = this.renderer.gl.canvas as HTMLCanvasElement;        // Add styling for desktop centering - increased width for wider viewing
        const isDesktop = window.innerWidth >= 768;
        if (isDesktop) {
            canvas.style.width = '1200px';
            canvas.style.height = '720px';
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '100%';
            canvas.style.objectFit = 'contain';
        } else {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        }

        this.container.appendChild(canvas);
    }

    createCamera() {
        this.camera = new Camera(this.gl);
        this.camera.fov = 45;
        this.camera.position.z = 20;
    }

    createScene() {
        this.scene = new Transform();
    }

    createGeometry() {
        this.planeGeometry = new Plane(this.gl, {
            heightSegments: 50,
            widthSegments: 100,
        });
    }

    createMedias(
        items: { image: string; text: string }[] | undefined,
        bend: number = 1,
        textColor: string,
        borderRadius: number,
        font: string
    ) {
        const defaultItems = [
            {
                image: `/3d-art/dbz.png`,
                text: "Dragon Ball Z Art",
            },
            {
                image: `/3d-art/dezi.png`,
                text: "Desert Scene",
            },
            {
                image: `/3d-art/edo.jpg`,
                text: "Edo Period",
            },
            {
                image: `/3d-art/fiddle.jpg`,
                text: "Fiddle Leaf",
            },
            {
                image: `/3d-art/gibli.png`,
                text: "Studio Ghibli Style",
            },
            {
                image: `/3d-art/roz.png`,
                text: "Rose Garden",
            },
            {
                image: `/3d-art/skull.png`,
                text: "Skull Study",
            },
            {
                image: `/3d-art/tree.png`,
                text: "Tree Landscape",
            },
            {
                image: `/3d-art/tulip.jpg`,
                text: "Tulip Fields",
            },
        ];
        const galleryItems = items && items.length ? items : defaultItems;
        this.mediasImages = galleryItems.concat(galleryItems);
        this.medias = this.mediasImages.map((data, index) => {
            return new Media({
                geometry: this.planeGeometry,
                gl: this.gl,
                image: data.image,
                index,
                length: this.mediasImages.length,
                renderer: this.renderer,
                scene: this.scene,
                screen: this.screen,
                text: data.text,
                viewport: this.viewport,
                bend,
                textColor,
                borderRadius,
                font,
            });
        });
    }

    onTouchDown(e: MouseEvent | TouchEvent) {
        this.isDown = true;
        this.scroll.position = this.scroll.current;
        this.start = "touches" in e ? e.touches[0].clientX : e.clientX;

        // Prevent default scroll behavior on mobile
        if ("touches" in e) {
            e.preventDefault();
        }
    } onTouchMove(e: MouseEvent | TouchEvent) {
        if (!this.isDown) return;

        const x = "touches" in e ? e.touches[0].clientX : e.clientX;
        const isMobile = window.innerWidth < 768;

        // Enhanced sensitivity for smoother swiping
        const sensitivity = isMobile ? 0.12 : 0.08; // Increased sensitivity for more responsive feel
        const distance = (this.start - x) * sensitivity;
        this.scroll.target = (this.scroll.position ?? 0) + distance;

        // Prevent default scroll behavior on mobile
        if ("touches" in e) {
            e.preventDefault();
        }
    }

    onTouchUp() {
        this.isDown = false;
        this.onCheck();
    } onWheel(e?: WheelEvent) {
        if (!e) return;

        // Check if user is holding Shift key for horizontal scrolling
        // or if they're scrolling horizontally (e.deltaX)
        const isHorizontalIntent = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);

        if (isHorizontalIntent) {
            // Only handle gallery scrolling when user intends horizontal movement
            const isMobile = window.innerWidth < 768;
            const increment = isMobile ? 1.5 : 0.8;

            // Use deltaX if available, otherwise use deltaY with shift key
            const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
            const direction = delta > 0 ? 1 : -1;
            const speed = Math.min(Math.abs(delta) / 100, 2);

            this.scroll.target += direction * increment * speed;
            this.onCheckDebounce();

            // Only prevent default for horizontal scrolling
            e.preventDefault();
        }
        // Allow normal vertical page scrolling when not holding Shift
    }

    onCheck() {
        if (!this.medias || !this.medias[0]) return;
        const width = this.medias[0].width;
        const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
        const item = width * itemIndex;
        this.scroll.target = this.scroll.target < 0 ? -item : item;
    } onResize() {
        // Check if desktop view
        const isDesktop = window.innerWidth >= 768; if (isDesktop) {
            // Set fixed canvas size for desktop - wider aspect ratio
            this.screen = {
                width: 1280,
                height: 1024,
            };
        } else {
            // Use container dimensions for mobile
            this.screen = {
                width: this.container.clientWidth,
                height: this.container.clientHeight,
            };
        }        // Update canvas styling based on screen size
        const canvas = this.renderer.gl.canvas as HTMLCanvasElement;
        if (isDesktop) {
            canvas.style.width = '1280px';
            canvas.style.height = '1024px';
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '100%';
            canvas.style.objectFit = 'contain';
        } else {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.maxWidth = 'none';
            canvas.style.maxHeight = 'none';
            canvas.style.objectFit = 'initial';
        }

        this.renderer.setSize(this.screen.width, this.screen.height);
        this.camera.perspective({
            aspect: this.screen.width / this.screen.height,
        });
        const fov = (this.camera.fov * Math.PI) / 180;
        const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
        const width = height * this.camera.aspect;
        this.viewport = { width, height };
        if (this.medias) {
            this.medias.forEach((media) =>
                media.onResize({ screen: this.screen, viewport: this.viewport })
            );
        }
    } update() {
        // Optimized scroll interpolation for smoother transitions
        this.scroll.current = lerp(
            this.scroll.current,
            this.scroll.target,
            this.scroll.ease
        );

        // Always update media positions for circular formation, but with threshold for performance
        const scrollDelta = Math.abs(this.scroll.current - this.scroll.last);
        const hasMovement = scrollDelta > 0.0001; // Very small threshold for smooth circular updates

        if (this.medias) {
            if (hasMovement) {
                const direction = this.scroll.current > this.scroll.last ? "right" : "left";
                this.medias.forEach((media) => media.update(this.scroll, direction));
            } else {
                // Even when not moving, ensure circular formation is maintained
                this.medias.forEach((media) => media.applyCircularPosition(this.scroll.current));
            }
        }

        this.renderer.render({ scene: this.scene, camera: this.camera });
        this.scroll.last = this.scroll.current;
        this.raf = window.requestAnimationFrame(this.update.bind(this));
    } addEventListeners() {
        this.boundOnResize = this.onResize.bind(this);
        this.boundOnWheel = this.onWheel.bind(this);
        this.boundOnTouchDown = this.onTouchDown.bind(this);
        this.boundOnTouchMove = this.onTouchMove.bind(this);
        this.boundOnTouchUp = this.onTouchUp.bind(this);

        window.addEventListener("resize", this.boundOnResize, { passive: true });

        // Use passive: false for wheel to enable preventDefault
        window.addEventListener("mousewheel", this.boundOnWheel, { passive: false });
        window.addEventListener("wheel", this.boundOnWheel, { passive: false });

        // Desktop events - optimized for smooth interaction
        window.addEventListener("mousedown", this.boundOnTouchDown, { passive: true });
        window.addEventListener("mousemove", this.boundOnTouchMove, { passive: true });
        window.addEventListener("mouseup", this.boundOnTouchUp, { passive: true });

        // Mobile touch events - optimized for smooth swiping
        window.addEventListener("touchstart", this.boundOnTouchDown, { passive: false });
        window.addEventListener("touchmove", this.boundOnTouchMove, { passive: false });
        window.addEventListener("touchend", this.boundOnTouchUp, { passive: true });
    }

    destroy() {
        window.cancelAnimationFrame(this.raf);
        window.removeEventListener("resize", this.boundOnResize);
        window.removeEventListener("mousewheel", this.boundOnWheel);
        window.removeEventListener("wheel", this.boundOnWheel);
        window.removeEventListener("mousedown", this.boundOnTouchDown);
        window.removeEventListener("mousemove", this.boundOnTouchMove);
        window.removeEventListener("mouseup", this.boundOnTouchUp);
        window.removeEventListener("touchstart", this.boundOnTouchDown);
        window.removeEventListener("touchmove", this.boundOnTouchMove);
        window.removeEventListener("touchend", this.boundOnTouchUp);
        if (
            this.renderer &&
            this.renderer.gl &&
            this.renderer.gl.canvas.parentNode
        ) {
            this.renderer.gl.canvas.parentNode.removeChild(
                this.renderer.gl.canvas as HTMLCanvasElement
            );
        }
    }
}

interface CircularGalleryProps {
    items?: { image: string; text: string }[];
    bend?: number;
    textColor?: string;
    borderRadius?: number;
    font?: string;
}

export default function CircularGallery({
    items,
    bend = 3,
    textColor = "#ffffff",
    borderRadius = 0.05,
    font = "600 20px 'Inter Variable', system-ui, -apple-system, sans-serif",
}: CircularGalleryProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!containerRef.current) return;

        // Adjust font size for mobile
        const isMobile = window.innerWidth < 768;
        const adjustedFont = isMobile
            ? font.replace(/\d+px/, '18px')
            : font;

        const app = new App(containerRef.current, {
            items,
            bend,
            textColor,
            borderRadius,
            font: adjustedFont,
        });
        return () => {
            app.destroy();
        };
    }, [items, bend, textColor, borderRadius, font]); return <div
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center"
        ref={containerRef}
        style={{
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent'
        }}
    />;
}
