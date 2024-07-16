import { Client } from "@notionhq/client";
import {
  BlockObjectResponse,
  FileBlockObjectResponse,
  ImageBlockObjectResponse,
  PageObjectResponse,
  PdfBlockObjectResponse,
  QueryDatabaseResponse,
  RichTextItemResponse,
  UserObjectResponse,
  VideoBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { loadEnv } from "vitepress";
import dayjs from "dayjs";
import { getFileCache, getJsonCache } from "./fileCache";
import { createWriteStream } from "node:fs";
import { finished } from "node:stream/promises";
import { Readable } from "node:stream";
import { hash } from "node:crypto";
import type { ReadableStream } from "node:stream/web";
import { extname } from "node:path";
import { NotionToMarkdown } from "notion-to-md";
import * as md from 'notion-to-md/build/utils/md'
import { ListBlockChildrenResponseResult } from "notion-to-md/build/types";
import {extension} from "mime-types";

const env = loadEnv("", process.cwd(), "");
const notion = new Client({ auth: env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({
  notionClient: notion,
  config: {
    parseChildPages: false,
  },
});

const authorCache = {};

async function queryUser(userId) {
  if (authorCache[userId]) {
    return authorCache[userId];
  }

  const user = await notion.users.retrieve({ user_id: userId });
  authorCache[userId] = user;
  return user;
}

async function cacheFile(key: string, url: string): Promise<string> {
  const cachePath = await getFileCache(key, async (newPath) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`unexpected response ${response.statusText}`);
    }
    const fileStream = createWriteStream(newPath);
    await finished(
      Readable.fromWeb(response.body! as ReadableStream<Uint8Array>).pipe(
        fileStream
      )
    );
    fileStream.close();
  });
  return cachePath;
}

async function cacheNotionFile(url: string): Promise<string> {
  const fileURL = new URL(url);
  const extension = extname(fileURL.pathname);
  const urlHash = hash("sha256", `${fileURL.pathname}`);
  const key = `notion/${fileURL.hostname}/${urlHash}${extension}`;
  return cacheFile(key, url);
}

async function getExternalFileExtension(url: string) {
  const response = await fetch(url, { method: "HEAD" });
  const contentType = response.headers.get("content-type");
  if (contentType) {
    return '.' + extension(contentType);
  }
  return "";
}

async function cacheAvatarFile(url: string): Promise<string> {
  if (url.includes("notion-static.com")) {
    return cacheNotionFile(url);
  } else {
    return cacheExternalFile(url);
  }
}

async function cacheExternalFile(url: string): Promise<string> {
  const fileURL = new URL(url);
  const fileExt = await getExternalFileExtension(url);
  const urlHash = hash("sha256", `${fileURL.pathname}${fileURL.search}`);
  const key = `external/${fileURL.hostname}/${urlHash}${fileExt}`;
  return cacheFile(key, url);
}

type FileObject = {
  type: 'external',
  external: {
    url: string
  }
} | {
  type: 'file',
  file: {
    url: string
  }
}

function getFileObjectUrl(file: FileObject) {
  if (file.type === "external") {
    return file.external.url;
  } else {
    return file.file.url;
  }
}

async function cacheFileObject(file: FileObject) {
  if (file.type === "external") {
    return cacheExternalFile(file.external.url);
  } else if (file.type === "file") {
    return cacheNotionFile(file.file.url);
  } else {
    throw new Error(`Invalid type`);
  }
}

n2m.setCustomTransformer('image', async (block: unknown) => {
  const { image } = block as ImageBlockObjectResponse;
  const url = getFileObjectUrl(image);
  const link = await cacheFileObject(image);
  const caption = image.caption.map(i => i.plain_text).join("");
  let title = caption;
  if (caption.trim().length === 0) {
    const matches = url.match(
      /[^\/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/
    );
    title = matches ? matches[0] : title;
  }
  return md.image(title, link, false);
})

type N2MFileTransformArgs = VideoBlockObjectResponse | FileBlockObjectResponse | PdfBlockObjectResponse;

const n2mFileTransform = async (
  block: N2MFileTransformArgs
) => {
  let blockContent: VideoBlockObjectResponse['video'] | FileBlockObjectResponse['file'] | PdfBlockObjectResponse['pdf'];
  let title: string = block.type;

  if (block.type === "video") blockContent = block.video;
  else if (block.type === "file") blockContent = block.file;
  else if (block.type === "pdf") blockContent = block.pdf;
  else throw new Error(`Invalid type`);

  const caption = blockContent?.caption
    .map((item: any) => item.plain_text)
    .join("");

  if (blockContent) {
    const file_type = blockContent.type;
    let link = await cacheFileObject(blockContent);
    
    if (caption && caption.trim().length > 0) {
      title = caption;
    } else if (link) {
      const matches = link.match(/[^\/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/);
      title = matches ? matches[0] : block.type;
    }

    if (block.type === "file") {
      return md.link(title, link);
    } else if (block.type === "pdf") {
      return `<figure>
        <iframe src="${link}"></iframe>
        <figcaption>${
          blockContent?.caption
            ? await n2m.blockToMarkdown(
                blockContent?.caption as unknown as ListBlockChildrenResponseResult
              )
            : title
        }</figcaption>
      </figure>`;
    } else if (block.type === "video") {
      return `<figure>
        <video controls>
          <source src="${link}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <figcaption>${title}</figcaption>
      </figure>`;
    } else {
      throw new Error(`Invalid type`);
    }
  } else {
    return false;
  }
};

n2m.setCustomTransformer("video", async (block: unknown) => {
  return n2mFileTransform(block as VideoBlockObjectResponse);
});

n2m.setCustomTransformer("file", async (block: unknown) => {
  return n2mFileTransform(block as FileBlockObjectResponse);
});

n2m.setCustomTransformer("pdf", async (block: unknown) => {
  return n2mFileTransform(block as PdfBlockObjectResponse);
});

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
            block.heading_1.rich_text.map((item) => transformRichText(item))
          )
        ).join("")
      );
    }
    case "heading_2": {
      return (
        "## " +
        (
          await Promise.all(
            block.heading_2.rich_text.map((item) => transformRichText(item))
          )
        ).join("")
      );
    }
    case "heading_3": {
      return (
        "### " +
        (
          await Promise.all(
            block.heading_3.rich_text.map((item) => transformRichText(item))
          )
        ).join("")
      );
    }
    case "paragraph": {
      return (
        await Promise.all(
          block.paragraph.rich_text.map((item) => transformRichText(item))
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
          ? await cacheExternalFile(block.image.external.url)
          : await cacheNotionFile(block.image.file.url);
      return `![${block.image.caption}](${url})`;
    }
    // case "video": {
    //     return `![${block.video.caption}](${block.video.external.url})`;
    // }
    case "quote": {
      return `> ${block.quote.rich_text
        .map((item) => transformRichText(item))
        .join("")}`;
    }
  }
  return "";
}

async function getContentImpl1(pageId) {
  const contentBlocks: string[] = [];
  let blocks = await notion.blocks.children.list({
    block_id: pageId,
  });

  contentBlocks.push(
    ...(await Promise.all(
      blocks.results.map((blk) => transformBlock(blk as BlockObjectResponse))
    ))
  );

  while (blocks.has_more) {
    blocks = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: blocks.next_cursor ?? undefined,
    });
    contentBlocks.push(
      ...(await Promise.all(
        blocks.results.map((blk) => transformBlock(blk as BlockObjectResponse))
      ))
    );
  }

  return contentBlocks.join("\n\n");
}

interface ContentCache {
  lastModified: string;
  content: string;
}

async function getContent(pageId: string, lastModified: string) {
  const cached = await getJsonCache<ContentCache>(`notion/page/${pageId}`, (data) => data.lastModified !== lastModified, async () => {
    const mdBlocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdBlocks);
    return { lastModified, content: mdString.parent.trim() };
  });
  return cached.content;
}

async function renderDatabaseRecord(record: PageObjectResponse) {
  const titleCol = (record.properties.Name as { title: RichTextItemResponse[] })
    .title;
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
  const published_at =
    (record.properties["Published At"] as { date: { start: string } })?.date
      ?.start ?? record.created_time;

  const excerpt = (
    record.properties["Excerpt"] as { rich_text: RichTextItemResponse[] }
  )?.rich_text
    .map((item) => item.plain_text)
    .join("");

  return {
    id: record.id,
    title: titleContent,
    path,
    cover: (record.cover && await cacheFileObject(record.cover)) ?? undefined,
    author: await Promise.all(authors.map(async (author) => ({
      name: author?.name ?? undefined,
      avatar: (author?.avatar_url && await cacheAvatarFile(author?.avatar_url)) ?? undefined,
    }))),
    published_at: published_at ? dayjs(published_at) : undefined,
    excerpt,
    last_modified: record.last_edited_time,
  };
}

export type SimplifiedDatabaseRecord = Awaited<
  ReturnType<typeof renderDatabaseRecord>
>;
export type SimplifiedPageRecord = SimplifiedDatabaseRecord & {
  content: string;
};

const queryDatabaseCache = new Map<string, QueryDatabaseResponse>();

export async function queryDatabase(next_cursor) {
  if (next_cursor && queryDatabaseCache.has(next_cursor)) {
    return queryDatabaseCache.get(next_cursor)!;
  }

  const result = await notion.databases.query({
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

  if (next_cursor) {
    queryDatabaseCache.set(next_cursor, result);
  }

  return result;
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
      result: await renderDatabaseRecord(item as PageObjectResponse),
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
        result: await renderDatabaseRecord(item as PageObjectResponse),
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
        content: await getContent(item.result.id, item.result.last_modified),
      },
      cursor: item.cursor,
      offset: item.offset,
    };
  }
}
