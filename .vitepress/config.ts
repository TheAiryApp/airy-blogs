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
            { icon: "github", link: "https://github.com/vuejs/vitepress" },
        ],
    },
    transformPageData: (pageData, { siteConfig }) => {
        if (pageData.params?.title) {
            pageData.title = `${pageData.params.title}`;
        }
    },
});
