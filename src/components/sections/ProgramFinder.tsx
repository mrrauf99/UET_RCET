"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { levelLabels } from "@/lib/format";
import type { Program } from "@/types/content";

/** Only the fields the finder shows: rows cross to the client, and source notes are internal. */
interface ProgramRow {
  program: Pick<Program, "id" | "name" | "level" | "departmentId" | "duration">;
  departmentName: string;
}

interface ProgramFinderProps {
  rows: readonly ProgramRow[];
  departments: readonly { id: string; name: string }[];
}

const levelOptions = [
  { value: "all", label: "All levels" },
  { value: "undergraduate", label: levelLabels.undergraduate },
  { value: "postgraduate", label: levelLabels.postgraduate },
];

export function ProgramFinder({ rows, departments }: ProgramFinderProps) {
  const [departmentId, setDepartmentId] = useState("all");
  const [level, setLevel] = useState<"all" | Program["level"]>("all");
  // Results only animate after a filter change, so the first paint doesn't stack on the page transition.
  const [filtered, setFiltered] = useState(false);
  const departmentFieldId = useId();
  const levelFieldId = useId();

  const visible = rows.filter(
    ({ program }) =>
      (departmentId === "all" || program.departmentId === departmentId) &&
      (level === "all" || program.level === level),
  );

  return (
    <div className="mt-10">
      <div className="surface grid gap-4 rounded-lg border border-border-strong p-5 sm:grid-cols-2 md:p-6">
        <div className="flex flex-col gap-2">
          <label htmlFor={departmentFieldId} className="font-bold">
            Department
          </label>
          <Select
            id={departmentFieldId}
            value={departmentId}
            onValueChange={(value) => {
              setDepartmentId(value);
              setFiltered(true);
            }}
            options={[
              { value: "all", label: "All departments" },
              ...departments.map((department) => ({ value: department.id, label: department.name })),
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={levelFieldId} className="font-bold">
            Level
          </label>
          <Select
            id={levelFieldId}
            value={level}
            onValueChange={(value) => {
              setLevel(value as typeof level);
              setFiltered(true);
            }}
            options={levelOptions}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm font-bold text-fg-muted">
          {visible.length === 1 ? "1 program" : `${visible.length} programs`}
        </p>
        <Button variant="secondary" icon="reset" onClick={() => { setDepartmentId("all"); setLevel("all"); }}>Reset filters</Button>
      </div>

      {visible.length > 0 ? (
        <ul key={`${departmentId}:${level}`} className={cn("mt-3 divide-y divide-border border-y border-border", filtered && "swap-in")}>
          {visible.map(({ program, departmentName }) => (
            <li key={program.id} className="group relative grid gap-1 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
              <div>
                <h3 className="text-xl">
                  <Link
                    href={`/departments/${program.departmentId}#programs`}
                    className="decoration-accent decoration-2 underline-offset-4 after:absolute after:inset-0 group-hover:underline"
                  >
                    {program.name}
                    <span className="sr-only"> — view department programs</span>
                  </Link>
                </h3>
                <p className="mt-1 text-fg-muted">{departmentName}</p>
              </div>
              <p className="flex items-center gap-3 text-sm font-bold">
                {levelLabels[program.level]}
                {program.duration ? <span className="font-normal text-fg-muted">{program.duration}</span> : null}
                <Icon name="arrow-right" className="size-5 text-accent transition-transform duration-(--dur-fast) group-hover:translate-x-1" />
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("mt-3 rounded-md border border-border-strong p-6", filtered && "swap-in")}>
          No programs match these filters. Choose “All departments” or “All levels” to see more.
        </p>
      )}
    </div>
  );
}
