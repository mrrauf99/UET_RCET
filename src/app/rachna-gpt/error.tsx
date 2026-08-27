"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";

export default function RachnaGptError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-start gap-6 py-(--space-section)">
      <h1 className="text-2xl">RachnaGPT couldn&apos;t load</h1>
      <p className="max-w-prose text-lg">
        Something went wrong while opening the assistant. Your conversation is saved in this tab, so trying again
        should bring it back.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={retry} icon="reset">
          Try again
        </Button>
        <LinkButton href="/" variant="secondary">
          Back to home
        </LinkButton>
      </div>
    </Container>
  );
}
