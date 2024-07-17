import { getPosts, SimplifiedDatabaseRecord } from "./.vitepress/cms";

interface PostExcerpt {
    title: string;
    path: string;
    excerpt: string;
    date?: string;
    authors: { name?: string; avatar?: string; }[];
    cover?: string;
}

export default {
    async load() {
        const data = getPosts(10);
        const result: PostExcerpt[] = [];
        for await (const entry of data) {
            result.push({
                title: entry.result.title,
                path: `/posts/${entry.result.path}`,
                excerpt: entry.result.excerpt,
                date: entry.result.published_at?.format("MM/DD/YYYY"),
                authors: entry.result.author,
                cover: entry.result.cover,
            });
        }
        return result;
    }
}
