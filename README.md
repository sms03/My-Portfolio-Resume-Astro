# 🚀 My Portfolio Resume | Built with Astro

![Astro Badge](https://img.shields.io/badge/Built%20with-Astro-orange?style=for-the-badge&logo=astro)
![License](https://img.shields.io/github/license/sms03/My-Portfolio-Resume-Astro?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/sms03/My-Portfolio-Resume-Astro?style=for-the-badge)

A modern, fast, and responsive portfolio-resume website built with Astro. Perfect for developers, designers, and professionals looking to showcase their work and experience in a clean, elegant interface.

![Portfolio Website Preview](https://smsx.netlify.app)

## ✨ Features

- **⚡️ Lightning Fast Performance**: Built with Astro for optimized loading speeds
- **📱 Fully Responsive**: Looks great on all devices - desktop, tablet, and mobile
- **🎨 Customizable**: Easily modify colors, sections, and content
- **🔍 SEO Optimized**: Structured for maximum search engine visibility
- **📊 Project Showcase**: Highlight your best work with project cards and details
- **📝 Dynamic Resume**: Display your professional experience and education
- **🔧 Skills Section**: Showcase your technical and soft skills
- **📬 Contact Form**: Allow visitors to reach out directly from your website
- **🌙 Dark Mode**: Support for light and dark themes

## 🛠️ Technologies Used

- [Astro](https://astro.build/) - The web framework for content-driven websites
- HTML5, CSS3, JavaScript
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [Tailwind CSS](https://tailwindcss.com/) for styling (presumed)
- [React](https://reactjs.org/) for interactive components (presumed)
- Responsive design principles

## 🚀 Getting Started

### Prerequisites

- Node.js (v14.18.0 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/sms03/My-Portfolio-Resume-Astro.git
```

2. Navigate to the project directory
```bash
cd My-Portfolio-Resume-Astro
```

3. Install dependencies
```bash
npm install
# or
yarn install
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open your browser and visit `http://localhost:3000`

## 📝 Customization

### Personal Information
Edit the `src/data/personal.js` file to update your:
- Name
- Title
- Bio
- Contact information
- Social media links

### Projects
Add your projects in the `src/data/projects.js` file:
```javascript
{
  title: "Project Name",
  description: "Short description of the project",
  tags: ["Astro", "React", "Tailwind"],
  image: "/images/project-1.webp",
  link: "https://project-link.com",
  github: "https://github.com/username/project"
}
```

### Experience & Education
Update your professional experience and education in `src/data/resume.js`.

### Skills
Modify your skills in `src/data/skills.js`.

## 🌐 Deployment

### Build for Production
```bash
npm run build
# or
yarn build
```

Deploy the contents of the `dist` folder to your hosting provider of choice:
- [Netlify](https://netlify.com)
- [Vercel](https://vercel.com)
- [GitHub Pages](https://pages.github.com/)
- Any static site hosting service

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**SMS03**

- GitHub: [@sms03](https://github.com/sms03)

## 🙏 Acknowledgments

- [Astro](https://astro.build/) for the amazing framework
- The open source community for inspiration and resources

---

⭐️ If you found this helpful, please star the repository! ⭐️

Made with ❤️ by SMS03