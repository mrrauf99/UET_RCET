import type { Program } from "@/types/content";

export const levelLabels: Record<Program["level"], string> = {
  undergraduate: "Undergraduate",
  postgraduate: "Postgraduate",
};

export function telHref(phone: string) {
  return `tel:+92${phone.replace(/\D/g, "").replace(/^0/, "")}`;
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function shortDepartmentName(name: string) {
  return name.replace(/^Department of /, "");
}

export function firstSentence(text: string | null) {
  if (!text) return null;
  const match = text.match(/^.+?[.!?](?=\s|$)/);
  return match ? match[0] : text;
}
