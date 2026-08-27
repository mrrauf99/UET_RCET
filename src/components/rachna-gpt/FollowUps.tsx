"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { rachnaGpt } from "@/content/rachna-gpt";
import { closePanel } from "@/lib/rachna-gpt/store";
import { SuggestedPrompts } from "./SuggestedPrompts";

const action =
  "inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 text-sm font-bold text-link underline underline-offset-2";

/** Next steps under the latest answer: unasked topics, plus a human route that never goes away. */
export function FollowUps({ asked }: { asked: ReadonlySet<string> }) {
  const unasked = rachnaGpt.suggestedPrompts.filter((prompt) => !asked.has(prompt));
  return (
    <div className="flex flex-col gap-2">
      {unasked.length > 0 ? <SuggestedPrompts variant="chips" prompts={unasked} limit={2} /> : null}
      <div className="flex flex-wrap gap-x-4">
        <a href={`tel:${rachnaGpt.phone}`} className={action}>
          <Icon name="phone" className="size-4" />
          Call admissions
        </a>
        {/* The panel stays mounted across navigation, so it is closed to reveal the page. */}
        <Link href="/admissions" onClick={closePanel} className={action}>
          Admissions page
        </Link>
      </div>
    </div>
  );
}
