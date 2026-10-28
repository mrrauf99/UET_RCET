"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { collectOutline, highlightOutline, STRUCTURE_VIEWS, type OutlineItem, type StructureView } from "@/lib/a11y/page-structure";

export function PageStructurePanel({ view, onViewChange, onNavigate }: {
  view: StructureView;
  onViewChange: (view: StructureView) => void;
  onNavigate: () => void;
}) {
  const id = useId();
  const [items, setItems] = useState<OutlineItem[]>(() => collectOutline(view));
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = () => setItems(collectOutline(view));
    refresh();
    contentRef.current?.closest<HTMLElement>("[data-panel]")?.scrollTo({ top: 0 });
    let frame = 0;
    const observer = new MutationObserver((records) => {
      if (records.every((record) => (record.target instanceof Element ? record.target : record.target.parentElement)?.closest(".a11y-toolbar"))) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refresh);
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "aria-labelledby", "aria-hidden", "hidden", "href", "alt"] });
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [view]);

  const changeView = (next: StructureView) => {
    onViewChange(next);
    setItems(collectOutline(next));
    contentRef.current?.closest<HTMLElement>("[data-panel]")?.scrollTo({ top: 0 });
  };
  const go = (element: HTMLElement) => {
    if (!element.isConnected) return;
    highlightOutline(element, view);
    setSelectedElement(element);
    element.scrollIntoView({ block: "center", behavior: "instant" });
    if (window.matchMedia("(max-width: 1023px)").matches) onNavigate();
  };
  const backToTop = () => {
    window.scrollTo({ top: 0, behavior: document.documentElement.dataset.motion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    contentRef.current?.closest<HTMLElement>("[data-panel]")?.scrollTo({ top: 0 });
  };
  return <>
    <div className="a11y-structure-rule" />
    <p className="a11y-structure-description">Provides an overview of the webpage's layout by displaying key elements such as headings, landmarks, and links.</p>
    <div className="a11y-structure-tabs" role="tablist" aria-label="Page structure">
      {STRUCTURE_VIEWS.map((tab) => <button type="button" key={tab} id={`${id}-tab-${tab}`} role="tab" aria-selected={view === tab} aria-controls={`${id}-content`} tabIndex={view === tab ? 0 : -1} onClick={() => changeView(tab)} onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const index = event.key === "Home" ? 0 : event.key === "End" ? 2 : (STRUCTURE_VIEWS.indexOf(tab) + (event.key === "ArrowRight" ? 1 : 2)) % 3;
        const next = STRUCTURE_VIEWS[index];
        changeView(next); document.getElementById(`${id}-tab-${next}`)?.focus();
      }}>{tab[0].toUpperCase() + tab.slice(1)}</button>)}
    </div>
    <div ref={contentRef} id={`${id}-content`} role="tabpanel" aria-labelledby={`${id}-tab-${view}`} tabIndex={0}>
      {view === "landmarks" ? <div className="a11y-landmark-guide">
        <h3>What do the Landmarks mean?</h3>
        <button type="button" className="a11y-landmark-expander" aria-label={`${guideExpanded ? "Hide" : "Show"} landmark description`} aria-expanded={guideExpanded} aria-controls={`${id}-landmark-help`} onClick={() => setGuideExpanded(!guideExpanded)}>
          <svg className="a11y-landmark-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 7 9 9 9-9" /></svg><span>{guideExpanded ? "Hide" : "Show"}<br />section</span>
        </button>
        <div id={`${id}-landmark-help`} className="a11y-landmark-explanations" hidden={!guideExpanded}>
          <p><strong>Navigation</strong> — A menu or set of links to help you move around the site.</p>
          <p><strong>Header</strong> — The top part of the page, usually containing the logo and navigation links.</p>
          <p><strong>Main</strong> — The main content for this page.</p>
          <p><strong>Form</strong> — An area where you can enter and submit information.</p>
          <p><strong>Footer</strong> — The bottom of the page, usually containing contact information, copyright, or links.</p>
        </div>
        <hr />
      </div> : null}
      <ul className={`a11y-structure-list a11y-${view}-list`}>
        {items.map((item) => <li key={item.key}><span className="a11y-structure-badge" aria-hidden="true">{view === "headings" ? item.badge : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{view === "landmarks" ? <path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-10-2 12" /> : <><path d="M9 7H7a5 5 0 0 0 0 10h2m6-10h2a5 5 0 0 1 0 10h-2" /><path d="M7 12h10" /></>}</svg>}</span>{view === "links" ? <a href={item.href} target={item.target} rel={item.target === "_blank" ? `${item.rel ?? ""} noopener noreferrer`.trim() : item.rel} title={item.label}>{item.label}</a> : <button type="button" onClick={() => go(item.element)} aria-current={selectedElement === item.element ? "location" : undefined} aria-label={view === "headings" ? `${item.badge}: ${item.label}` : item.label} title={item.label}>{item.label}</button>}</li>)}
      </ul>
      {!items.length ? <p>No {view} found on this page.</p> : null}
      <button type="button" className="a11y-structure-back-to-top" onClick={backToTop}>
        <Icon name="arrow-up" className="size-6 [stroke-width:2]" />
        <span>Back to top</span>
      </button>
    </div>
  </>;
}
