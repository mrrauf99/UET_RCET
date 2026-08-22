interface SectionHeadingProps {
  id: string;
  title: string;
  lead?: string;
}

export function SectionHeading({ id, title, lead }: SectionHeadingProps) {
  return (
    <div className="reveal max-w-prose">
      <h2 id={id} className="text-2xl">
        {title}
      </h2>
      {lead ? <p className="mt-4 text-lg text-fg-muted">{lead}</p> : null}
    </div>
  );
}
