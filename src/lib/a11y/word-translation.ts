import { LANGUAGES } from "@/lib/a11y/languages";

const cache = new Map<string, string>();

export async function translateWord(word: string, source: string, target: string, signal: AbortSignal) {
  if (!LANGUAGES.some((language) => language.code === source) || (target !== "en" && !LANGUAGES.some((language) => language.code === target))) {
    throw new Error("unsupported_language");
  }
  const key = `${source}:${target}:${word.toLocaleLowerCase()}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url = new URL("https://translate.googleapis.com/translate_a/single");
  const from = source === "fil" ? "tl" : source;
  const to = target === "fil" ? "tl" : target;
  url.search = new URLSearchParams({ client: "gtx", sl: from, tl: to, dt: "t", q: word }).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("translation_unavailable");
  const data: unknown = await response.json();
  const translated = Array.isArray(data) && Array.isArray(data[0])
    ? data[0].map((segment) => Array.isArray(segment) ? segment[0] : "").join("").trim()
    : "";
  if (!translated) throw new Error("translation_unavailable");
  if (cache.size > 200) cache.clear();
  cache.set(key, translated);
  return translated;
}
