export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only z-50 rounded-md bg-accent px-5 py-3 font-bold text-on-accent focus:not-sr-only focus:fixed focus:top-[calc(var(--toolbar-offset)+0.75rem)] focus:left-3"
    >
      Skip to main content
    </a>
  );
}
