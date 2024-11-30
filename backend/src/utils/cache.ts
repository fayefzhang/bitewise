import fs from "fs";
import path from "path";

const cacheFilePath = path.join(__dirname, "../../cache/cache.json");

export function readCache(): Record<string, any> {
    if (!fs.existsSync(cacheFilePath)) {
        fs.writeFileSync(cacheFilePath, JSON.stringify({}), "utf-8");
    }
    const cacheData = fs.readFileSync(cacheFilePath, "utf-8");
    return JSON.parse(cacheData);
}

export function writeCache(cache: Record<string, any>): void {
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), "utf-8");
}