export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
};

export type Hero = {
    title?: string;
    text?: string;
    image?: Image;
    actions?: Link[];
};

export type SiteConfig = {
    website: string;
    logo?: Image;
    title: string;
    subtitle?: string;
    description: string;
    image?: Image;
    headerNavLinks?: Link[];
    footerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    postsPerPage?: number;
    projectsPerPage?: number;
};

const siteConfig: SiteConfig = {
    website: 'https://smsx.netlify.app',
    title: 'Shivam M. Salunkhe',
    subtitle: '3D Artist & AI Developer',
    description: 'Portfolio of Shivam M. Salunkhe - CGI and VFX Artist, AI Developer, Prompt Engineer, and Web App Developer',
    image: {
        src: '/giblic.png',
        alt: 'Shivam M. Salunkhe - Portfolio'
    },
    headerNavLinks: [
        {
            text: 'Home',
            href: '/'
        },
        {
            text: 'Projects',
            href: '/projects'
        },
        {
            text: '3D Graphics',
            href: '/3d-work'
        },
        {
            text: 'Skills',
            href: '/skills'
        },
        {
            text: 'Education',
            href: '/education'
        }
    ],
    footerNavLinks: [
        {
            text: 'About',
            href: '/about'
        },
        {
            text: 'Contact',
            href: '/contact'
        }
    ],
    socialLinks: [
        {
            text: 'Behance',
            href: 'https://www.behance.net/SMSXART'
        },
        {
            text: 'GitHub',
            href: 'https://github.com/sms03'
        },
        {
            text: 'Email',
            href: 'mailto:shivamsal2000@gmail.com'
        }
    ],
    hero: {
        title: 'Welcome to My Portfolio 👋🏻',
        text: "Highly skilled **CGI and VFX Artist** with additional expertise as an **AI Developer**, **Prompt Engineer**, and **Web App Developer**. Adept at combining cutting-edge technology with creative artistry to produce innovative solutions in digital media, web applications, and AI-driven projects.\n\n" +
            "With a background in both **Interior Design** and **Computer Applications**, I bring a unique perspective to projects that bridges aesthetics and functionality. I've worked with international brands including **Future House Music** (Rotterdam) and artists like **Alan Walker**.\n\n" +
            "Currently building AI Agents with Google's A2A with ADK and MCP servers, exploring the possibilities of artificial intelligence in creative applications. Check out my projects [Ren3der](https://ren3der.vercel.app/) and [SharkSenz](https://sharksenz.vercel.app).",
        image: {
            src: '/gibli.png',
            alt: 'Shivam M. Salunkhe'
        },
        actions: [
            {
                text: 'Get in Touch',
                href: '/contact'
            }
        ]
    },
    projectsPerPage: 8
};

export default siteConfig;
