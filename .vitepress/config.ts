import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "The Airy's Blog",
  description: "Updates from the builder of Airy.",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    // nav: [{ text: "Archives", link: "/archives" }],

    logo: "/Logo.svg",
    outline: [2, 4],
    sidebar: undefined,

    socialLinks: [
      { icon: "discord", link: "https://discord.gg/SEucvQz72g" },
      { icon: "github", link: "https://github.com/TheAiryApp" },
      { icon: "instagram", link: "https://www.instagram.com/airytheapp/" },
      { icon: "twitter", link: "https://twitter.com/TheAiryApp" },
      { icon: "linkedin", link: "https://www.linkedin.com/company/airyai/" },
    ],
  },
  transformPageData: (pageData, { siteConfig }) => {
    if (pageData.params?.title) {
      pageData.title = `${pageData.params.title}`;
    }
  },
});
