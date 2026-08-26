import { university } from "@/content/university";
import type { ChatErrorKind } from "@/lib/rachna-gpt/types";

// Client-safe copy only. Scripted answers live in src/lib/rachna-gpt/mock-answers.ts (server-only).
export const rachnaGpt = {
  name: "RachnaGPT",
  greeting: "Assalam-o-Alaikum! Ask me about admissions, programmes, fees, transport or hostels.",
  suggestedPrompts: [
    "How do I apply for admission?",
    "Which programmes does RCET offer?",
    "What are the fees?",
    "Is there transport for students?",
    "Tell me about hostels",
    "How can I contact the college?",
  ],
  phone: university.phone,
  disclaimer: {
    text: "Answers can be wrong. Confirm with the",
    linkLabel: "admissions office",
    href: "/admissions",
  },
  errors: {
    network: "Couldn't reach RachnaGPT. Check your connection and try again.",
    rate_limited: "You're sending messages too quickly. Please wait a moment.",
    server: "I couldn't get an answer just now. Please try again.",
    invalid: "Something went wrong with that message. Please try again.",
  } satisfies Record<ChatErrorKind, string>,
} as const;
