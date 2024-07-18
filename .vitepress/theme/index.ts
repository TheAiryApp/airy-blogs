// https://vitepress.dev/guide/custom-theme
import { h, toRefs } from 'vue'
import { useData, useRoute, type Theme } from 'vitepress'
import giscusTalk from "vitepress-plugin-comment-with-giscus";
import DefaultTheme from 'vitepress/theme'
import './style.css'
import './index.scss'

export default {
  extends: DefaultTheme,
  Layout: () => {

    const { frontmatter } = toRefs(useData());
    const route = useRoute();

    // Obtain configuration from: https://giscus.app/
    giscusTalk(
      {
        repo: "theairyapp/airy-blogs",
        repoId: "R_kgDOMWu8Rg",
        category: "General", // default: `General`
        categoryId: "DIC_kwDOMWu8Rs4Cg3Gs",
        mapping: "pathname", // default: `pathname`
        strict: true,
        reactionEnabled: true,
        loading: 'lazy',
        inputPosition: "top", // default: `top`
        lang: "en", // default: `zh-CN`
        // i18n setting (Note: This configuration will override the default language set by lang)
        // Configured as an object with key-value pairs inside:
        // [your i18n configuration name]: [corresponds to the language pack name in Giscus]
        locales: {
          "zh-Hans": "zh-CN",
          "en-US": "en",
        },
        homePageShowComment: false, // Whether to display the comment area on the homepage, the default is false
        lightTheme: "light", // default: `light`
        darkTheme: "transparent_dark", // default: `transparent_dark`
        // ...
      },
      {
        frontmatter,
        route,
      },
      // Whether to activate the comment area on all pages.
      // The default is true, which means enabled, this parameter can be ignored;
      // If it is false, it means it is not enabled.
      // You can use `comment: true` preface to enable it separately on the page.
      true
    );

    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app, router, siteData }) {
    // ...
  },
} satisfies Theme
