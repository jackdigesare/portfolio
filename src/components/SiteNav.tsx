"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "about", label: "About" },
  { id: "work", label: "Projects" },
  { id: "contact", label: "Contact" },
] as const;

export function SiteNav() {
  const [activeId, setActiveId] = useState<string>("about");
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    for (const el of elements) observer.observe(el);

    const onScroll = () => {
      setShowTop(window.scrollY > 320);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <nav
        aria-label="Sections"
        className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-[880px] items-center gap-5 px-6 py-3 text-sm">
          {sections.map((section) => {
            const isActive = activeId === section.id;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={
                  isActive
                    ? "font-medium text-ink no-underline hover:text-ink"
                    : "text-muted no-underline hover:text-ink"
                }
                aria-current={isActive ? "true" : undefined}
              >
                {section.label}
              </a>
            );
          })}
        </div>
      </nav>

      {showTop ? (
        <a
          href="#top"
          className="fixed bottom-6 right-6 z-20 rounded-soft border border-line bg-surface px-3 py-2 text-sm text-ink no-underline hover:bg-accent/12 hover:text-ink"
        >
          Top ↑
        </a>
      ) : null}
    </>
  );
}
