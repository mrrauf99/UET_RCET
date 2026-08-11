// Turns the extracted department-tab text (src/content/pages.ts) into structured blocks for rendering.

const TAB_NAV = new Set(["Introduction", "Programs Offered", "Faculty", "Labs", "PLOs", "PEOs"]);

export type TabBlock = { id: string } & (
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "table"; header: string[]; rows: string[][] }
);

export interface FacultyMember {
  name: string;
  designation: string;
  email: string | null;
  qualification: string | null;
  role: string | null;
}

/** Drops the old site's tab navigation, which is repeated at the top of every tab body. */
function contentLines(body: string) {
  const lines = body.split("\n").map((line) => line.trim());
  let start = 0;
  while (start < lines.length && (TAB_NAV.has(lines[start] ?? "") || lines[start] === "")) start++;
  return lines.slice(start).filter((line) => line !== "Read More" && line !== "See Profile");
}

export function parseTabBody(body: string): TabBlock[] {
  const blocks: TabBlock[] = [];
  const lines = contentLines(body);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line) {
      index++;
      continue;
    }
    if (line.includes("\t")) {
      const rows: string[][] = [];
      while (index < lines.length && (lines[index] ?? "").includes("\t")) {
        rows.push((lines[index] ?? "").split("\t").map((cell) => cell.trim()));
        index++;
      }
      const [header = [], ...rest] = rows;
      blocks.push({ id: `block-${blocks.length}`, kind: "table", header, rows: rest });
      continue;
    }
    // Short lines followed by a blank are section titles in the extracted text (lab names, "Equipment:").
    const next = lines[index + 1];
    const isHeading = line.length < 60 && !/[.:]$/.test(line) && (next === "" || next === undefined || next.startsWith("Equipment"));
    const id = `block-${blocks.length}`;
    blocks.push(isHeading ? { id, kind: "heading", text: line } : { id, kind: "paragraph", text: line });
    index++;
  }
  return blocks;
}

const ROLES = new Set(["Chairman", "Chairperson", "Head of Department", "Incharge", "In-charge"]);

export function parseFaculty(body: string): FacultyMember[] {
  const lines = new Set(
    body
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !TAB_NAV.has(line) && line !== "Faculty:"),
  );
  const people: FacultyMember[] = [];
  let chunk: string[] = [];

  const flush = () => {
    if (chunk.length === 0) return;
    const role = ROLES.has(chunk[0] ?? "") ? (chunk.shift() ?? null) : null;
    const [name, designation, ...rest] = chunk;
    if (name && designation) {
      const email = rest.find((value) => value.includes("@")) ?? null;
      const qualification = rest.find((value) => !value.includes("@")) ?? null;
      people.push({ name, designation, email, qualification, role });
    }
    chunk = [];
  };

  for (const line of body.split("\n").map((value) => value.trim())) {
    if (line === "See Profile") flush();
    else if (lines.has(line)) chunk.push(line);
  }
  flush();
  return people;
}

export interface Lab {
  name: string;
  equipment: string[];
}

export function parseLabs(body: string): Lab[] {
  const labs: Lab[] = [];
  const lines = contentLines(body).filter((line) => line !== "Labs");
  let current: Lab | null = null;
  for (const [index, line] of lines.entries()) {
    if (!line || line === "Equipment:") continue;
    // A lab name is the line just before "Equipment:" (allowing for the blank line between them).
    const next = lines.slice(index + 1).find(Boolean);
    if (next === "Equipment:") {
      current = { name: line, equipment: [] };
      labs.push(current);
    } else if (current && !current.equipment.includes(line)) {
      current.equipment.push(line);
    }
  }
  return labs;
}

export interface ChairmanMessage {
  paragraphs: string[];
  name: string;
}

/** The old department landing page ends with the chairman's message followed by the chairman's name. */
export function parseChairmanMessage(body: string): ChairmanMessage | null {
  const [, after] = body.split(/Chairman's Message|Chairperson's Message/);
  if (!after) return null;
  const lines = after
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const name = lines.pop()?.replace(/\.$/, "");
  if (!name || lines.length === 0) return null;
  return { paragraphs: lines, name };
}
