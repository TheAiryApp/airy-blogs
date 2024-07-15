import { Client } from "@notionhq/client";
import {
    BlockObjectResponse,
    PageObjectResponse,
    RichTextItemResponse,
    UserObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { loadEnv } from "vitepress";
import dayjs from "dayjs";

const env = loadEnv("", process.cwd(), "");
const notion = new Client({ auth: env.NOTION_API_KEY });

const authorCache = {};

async function queryUser(userId) {
    if (authorCache[userId]) {
        return authorCache[userId];
    }

    const user = await notion.users.retrieve({ user_id: userId });
    authorCache[userId] = user;
    return user;
}

async function transformRichText(richText: RichTextItemResponse) {
    switch (richText.type) {
        case "text": {
            if (richText.text.link) {
                return `[${richText.text.content}](${richText.text.link.url})`;
            }
            return richText.text.content;
        }
    }
}

async function transformBlock(block: BlockObjectResponse) {
    switch (block.type) {
        case "heading_1": {
            return (
                "# " +
                (
                    await Promise.all(
                        block.heading_1.rich_text.map((item) =>
                            transformRichText(item)
                        )
                    )
                ).join("")
            );
        }
        case "heading_2": {
            return (
                "## " +
                (
                    await Promise.all(
                        block.heading_2.rich_text.map((item) =>
                            transformRichText(item)
                        )
                    )
                ).join("")
            );
        }
        case "heading_3": {
            return (
                "### " +
                (
                    await Promise.all(
                        block.heading_3.rich_text.map((item) =>
                            transformRichText(item)
                        )
                    )
                ).join("")
            );
        }
        case "paragraph": {
            return (
                await Promise.all(
                    block.paragraph.rich_text.map((item) =>
                        transformRichText(item)
                    )
                )
            ).join("");
        }
        case "bulleted_list_item": {
            return (
                "- " +
                (
                    await Promise.all(
                        block.bulleted_list_item.rich_text.map((item) =>
                            transformRichText(item)
                        )
                    )
                ).join("")
            );
        }
        case "numbered_list_item": {
            return (
                "1. " +
                (
                    await Promise.all(
                        block.numbered_list_item.rich_text.map((item) =>
                            transformRichText(item)
                        )
                    )
                ).join("")
            );
        }
        case "image": {
            const url =
                block.image.type === "external"
                    ? block.image.external.url
                    : block.image.file.url;
            return `![${block.image.caption}](${url})`;
        }
    }
    return "";
}

async function getContent(pageId) {
    const contentBlocks: string[] = [];
    let blocks = await notion.blocks.children.list({
        block_id: pageId,
    });

    contentBlocks.push(
        ...(await Promise.all(
            blocks.results.map((blk) =>
                transformBlock(blk as BlockObjectResponse)
            )
        ))
    );

    while (blocks.has_more) {
        blocks = await notion.blocks.children.list({
            block_id: pageId,
            start_cursor: blocks.next_cursor ?? undefined,
        });
        contentBlocks.push(
            ...(await Promise.all(
                blocks.results.map((blk) =>
                    transformBlock(blk as BlockObjectResponse)
                )
            ))
        );
    }

    return contentBlocks.join("\n\n");
}

function renderDatabaseRecord(record: PageObjectResponse) {
    const titleCol = (
        record.properties.Name as { title: RichTextItemResponse[] }
    ).title;
    let titleContent = titleCol.map((item) => item.plain_text).join("");
    const titleWithDash = titleContent.replace(/\s+/g, "-").toLowerCase();
    if (record.icon?.type === "emoji") {
        titleContent = `${record.icon.emoji} ${titleContent}`;
    }
    const dateCreated = dayjs(record.created_time).format("YYYY-MM-DD");
    const path = `${titleWithDash}-${dateCreated}`;
    const authors = (
        record.properties["Author"] as { people: UserObjectResponse[] }
    ).people;
    const published_at = (
        record.properties["Published At"] as { date: { start: string } }
    )?.date?.start;

    const excerpt = (
        record.properties["Excerpt"] as { rich_text: RichTextItemResponse[] }
    )?.rich_text.map((item) => item.plain_text).join("");

    return {
        id: record.id,
        title: titleContent,
        path,
        cover: (record.cover as { external: { url: string } })?.external?.url,
        author: authors.map((author) => ({
            name: author?.name ?? undefined,
            avatar: author?.avatar_url ?? undefined,
        })),
        published_at: published_at ? dayjs(published_at) : undefined,
        excerpt,
    };
}

export type SimplifiedDatabaseRecord = Awaited<ReturnType<typeof renderDatabaseRecord>>;
export type SimplifiedPageRecord = SimplifiedDatabaseRecord & { content: string };

export async function queryDatabase(next_cursor) {
    return notion.databases.query({
        database_id: env.NOTION_DATABASE_ID,
        filter: {
            or: [
                {
                    property: "Publishing Tag",
                    multi_select: {
                        contains: "Website: Published",
                    },
                },
            ],
        },
        sorts: [
            {
                property: "Published At",
                direction: "descending",
            },
            {
                timestamp: "created_time",
                direction: "descending",
            },
        ],
        page_size: 10,
        start_cursor: next_cursor,
    });
}

interface Paginator<T> {
    result: T;
    cursor: string | undefined;
    offset: number;
}

async function* getDatabase(
    limit: number | undefined = undefined,
    cursor: string | undefined = undefined,
    offset: number = 0
): AsyncGenerator<Paginator<SimplifiedDatabaseRecord>> {
    let counter = 0,
        counterStop = 0;
    let result = await queryDatabase(cursor);

    for (const item of result.results) {
        if (offset > 0) {
            offset--;
            continue;
        }
        if (limit && counter >= limit) {
            return;
        }
        yield {
            result: renderDatabaseRecord(item as PageObjectResponse),
            cursor: undefined,
            offset: counter,
        };
        counter++;
    }

    while (result.has_more) {
        counterStop = counter;
        const thisCursor = result.next_cursor;
        result = await queryDatabase(result.next_cursor);
        for (const item of result.results) {
            if (offset > 0) {
                offset--;
                continue;
            }
            if (limit && counter >= limit) {
                return;
            }
            yield {
                result: renderDatabaseRecord(item as PageObjectResponse),
                cursor: thisCursor!,
                offset: counter - counterStop,
            };
            counter++;
        }
    }
}

export async function* getPosts(
    limit: number | undefined = undefined,
    cursor: string | undefined = undefined,
    offset: number = 0
): AsyncGenerator<Paginator<SimplifiedPageRecord>> {
    let result = getDatabase(limit, cursor, offset);

    for await (const item of result) {
        yield {
            result: {
                ...item.result,
                content: await getContent(item.result.id),
            },
            cursor: item.cursor,
            offset: item.offset,
        };
    }
}
