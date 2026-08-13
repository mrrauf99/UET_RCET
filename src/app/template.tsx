import { ViewTransition } from "react";

// Templates remount on every navigation, so each route gets its own enter/exit pair.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
