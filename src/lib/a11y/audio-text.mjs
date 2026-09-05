export function speechChunks(text, limit = 240) {
  const sentences = new Intl.Segmenter("en", { granularity: "sentence" }).segment(text.replace(/\s+/g, " ").trim());
  const chunks = [];
  for (const { segment } of sentences) {
    let remaining = segment.trim();
    while (remaining.length > limit) {
      const prefix = remaining.slice(0, limit + 1);
      const clause = Math.max(prefix.lastIndexOf(", "), prefix.lastIndexOf("; "), prefix.lastIndexOf(": "));
      const space = prefix.lastIndexOf(" ");
      const end = clause >= limit / 2 ? clause + 1 : space > 0 ? space : limit;
      chunks.push(remaining.slice(0, end).trim());
      remaining = remaining.slice(end).trim();
    }
    if (remaining) chunks.push(remaining);
  }
  return chunks;
}
