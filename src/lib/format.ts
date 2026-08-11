export function shortDepartmentName(name: string) {
  return name.replace(/^Department of /, "");
}

export function firstSentence(text: string | null) {
  if (!text) return null;
  const match = text.match(/^.+?[.!?](?=\s|$)/);
  return match ? match[0] : text;
}
