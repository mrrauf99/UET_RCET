import "server-only";
import { departments, programs } from "@/content/academics";
import { university } from "@/content/university";
import { levelLabels, shortDepartmentName } from "@/lib/format";
import { ADMISSIONS_PORTAL_URL } from "@/lib/site";

const contact = `Phone: ${university.phone}\nEmail: ${university.email}`;

interface Topic {
  keywords: readonly string[];
  answer: string;
}

// Ordered by priority: a question that mentions admissions and says hello gets the admissions answer.
// Answers only state facts held in src/content; anything that changes yearly points to the office.
const topics: readonly Topic[] = [
  {
    keywords: ["fee", "fees", "tuition", "cost", "scholarship", "فیس", "اخراجات", "وظیف"],
    answer: `Fees change every academic year, so I can't quote figures. The current fee structure is published by UET Lahore with each admission notice.\n\nFor exact amounts and scholarships, contact the admissions office:\n${contact}`,
  },
  {
    keywords: ["admission", "apply", "application", "eligibility", "deadline", "merit", "ecat", "entry test", "داخل", "اپلائی", "میرٹ"],
    answer: `Applications for ${university.shortName} programmes are made through the UET Lahore admissions portal: ${ADMISSIONS_PORTAL_URL}\n\n1. Choose a programme on the Admissions page.\n2. Check this year's dates, eligibility and requirements on the portal.\n3. Apply through the portal.\n\nQuestions about your application:\n${contact}`,
  },
  {
    keywords: ["program", "programme", "degree", "course", "bsc", "b.sc", "msc", "m.sc", "bba", "پروگرام", "ڈگری"],
    answer: `Programmes listed at ${university.shortName}:\n${programs.map((program) => `• ${program.name} (${levelLabels[program.level]})`).join("\n")}\n\nAvailability can change from year to year, so confirm on the UET admissions portal before applying.`,
  },
  {
    keywords: ["department", "departments", "faculty", "engineering", "computer", "electrical", "mechanical", "شعب"],
    answer: `${university.shortName} has ${departments.length} departments:\n${departments.map((department) => `• ${shortDepartmentName(department.name)}`).join("\n")}\n\nOpen Departments on this site for each department's programmes, labs and faculty.`,
  },
  {
    keywords: ["contact", "phone", "email", "address", "location", "where", "map", "directions", "رابط", "پتہ", "فون", "مقام"],
    answer: `${university.name}\n${university.address}\n\n${contact}`,
  },
  {
    keywords: ["transport", "transportation", "bus", "buses", "route", "pick", "ٹرانسپورٹ", "بس"],
    answer: `The campus runs buses for students and staff. Routes and timings change each semester, so please confirm the current schedule with the college office:\n${contact}`,
  },
  {
    keywords: ["hostel", "hostels", "accommodation", "boarding", "residence", "ہاسٹل", "رہائش"],
    answer: `Hostel availability and allotment are handled by the college administration. For current vacancies and the application process, contact:\n${contact}`,
  },
  {
    keywords: ["hello", "hi", "hey", "salam", "assalam", "assalamualaikum", "aoa", "سلام", "السلام"],
    answer: `Hello! I'm RachnaGPT. I can help with admissions, programmes, departments, transport, hostels and contact details for ${university.shortName}. What would you like to know?`,
  },
];

export const FALLBACK_ANSWER = `I don't have an answer for that yet. I can help with admissions, programmes, departments, transport, hostels and contact details.\n\nFor anything else, the admissions office can help:\n${contact}`;

function normalise(text: string): string {
  return text.normalize("NFKC").trim().toLowerCase();
}

function matches(text: string, words: readonly string[], keyword: string): boolean {
  if (keyword.includes(" ")) return text.includes(keyword);
  // Short Latin keywords must match a whole word ("hi" must not match "this"); longer ones and
  // Urdu stems match as prefixes so plurals and inflections ("fees", "داخلے") still count.
  return keyword.length < 4 && /^[a-z]+$/.test(keyword)
    ? words.includes(keyword)
    : words.some((word) => word.startsWith(keyword));
}

export function matchAnswer(question: string): string {
  const text = normalise(question);
  // \p{M} keeps Urdu combining marks inside words; dots are kept for "b.sc" and trimmed elsewhere.
  const words = text
    .split(/[^\p{L}\p{M}\p{N}.]+/u)
    .map((word) => word.replace(/^\.+|\.+$/g, ""))
    .filter(Boolean);
  return topics.find((topic) => topic.keywords.some((keyword) => matches(text, words, keyword)))?.answer ?? FALLBACK_ANSWER;
}
