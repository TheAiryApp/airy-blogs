/// <reference types="vite/client" />

export const fileCache = import.meta.glob("/.vitepress/cache/fileCache/**/*", {
    import: "default",
    eager: true,
});
