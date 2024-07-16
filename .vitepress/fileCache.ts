import { fileURLToPath } from "node:url";
import { join, dirname, relative } from "node:path";
import { normalize } from "node:path/posix";
import fs from "node:fs/promises";

const cachePath = fileURLToPath(
  import.meta.url.replace("fileCache.ts", "cache")
);

const rootDir = join(cachePath, "../..");

async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function getFileCache(
  key: string,
  factory: (path: string) => Promise<void>
) {
  const path = join(cachePath, "fileCache", key);
  const hasFile = await fileExists(path);
  if (!hasFile) {
    const dirPath = dirname(path);
    await fs.mkdir(dirPath, { recursive: true });
    await factory(path);
  }
  return `/` + normalize(relative(rootDir, path)).replace(/\\/g, '/');
}

export async function getJsonCache<T>(
  key: string,
  invalidation: (data: T) => boolean | Promise<boolean>,
  factory: () => Promise<T>
): Promise<T> {
  const path = join(cachePath, "jsonCache", key);
  const hasFile = await fileExists(path);
  if (!hasFile) {
    const dirPath = dirname(path);
    await fs.mkdir(dirPath, { recursive: true });
    const data = await factory();
    await fs.writeFile(path, JSON.stringify(data));
  }
  const data = await fs.readFile(path, "utf-8");
  const jsonData = JSON.parse(data);
  if (await invalidation(jsonData)) {
    const newData = await factory();
    await fs.writeFile(path, JSON.stringify(newData));
    return newData;
  }
  return jsonData;
}
