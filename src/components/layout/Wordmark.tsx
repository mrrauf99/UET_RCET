import Image from "next/image";
import Link from "next/link";

interface WordmarkProps {
  name: string;
}

export function Wordmark({ name }: WordmarkProps) {
  return (
    <Link href="/" className="flex min-h-11 min-w-0 items-center gap-3 no-underline">
      <Image src="/images/rcet-logo.png" alt="" width={52} height={52} preload className="size-12 shrink-0 sm:size-13" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="font-display text-sm font-semibold sm:text-base">{name}</span>
        <span className="hidden text-xs text-on-band-muted sm:block">UET Lahore · Gujranwala</span>
      </span>
    </Link>
  );
}
