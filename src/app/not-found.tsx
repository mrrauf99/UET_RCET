import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";

export default function NotFound() {
  return (
    <section aria-labelledby="not-found-title" className="py-(--space-section)">
      <Container width="prose">
        <p className="font-display text-3xl font-semibold text-fg-muted">404</p>
        <h1 id="not-found-title" className="mt-2 text-3xl">
          Page not found
        </h1>
        <p className="mt-4 text-lg">
          The page may have moved when the RCET website was rebuilt. Try one of these instead.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/">Home</LinkButton>
          <LinkButton href="/departments" variant="secondary">
            Departments
          </LinkButton>
          <LinkButton href="#footer-contact" variant="secondary">
            Contact
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
