import { Dayjs } from "dayjs";
import { getPosts } from "../.vitepress/cms";

interface Post {
    params: {
        id: string;
        title: string;
        authors: { name?: string; avatar?: string; }[];
        date?: Dayjs;
        cover?: string;
        excerpt?: string;
    }
    content: string;
}

export default {
    async paths() {
        // use respective CMS client library if needed
        const data = getPosts();
        const entries: Post[] = [];
        for await (const entry of data) {
            entries.push({
                params: {
                    id: entry.result.path,
                    title: entry.result.title,
                    authors: entry.result.author,
                    date: entry.result.published_at,
                    cover: entry.result.cover,
                    excerpt: entry.result.excerpt,
                },
                content: entry.result.content,
            });
        
        }
        return entries;
    }
};
