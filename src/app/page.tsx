import { projects, site } from "@/content";
import { ContactForm } from "@/components/ContactForm";
import { SiteNav } from "@/components/SiteNav";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="top" className="mx-auto max-w-[880px] px-6 py-12 md:py-16">
        <header className="mb-7">
          <h1 className="font-serif text-[clamp(2.4rem,7vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-ink">
            {site.name}
          </h1>
          <p className="mt-3 max-w-lg text-[1.08rem] leading-[1.55] text-muted">
            {site.tagline} Based in {site.location}.
          </p>
          <hr className="mt-[1.35rem] border-0 border-t border-line" />
        </header>

        <section id="about" className="mt-10 scroll-mt-16">
          <h2 className="font-serif text-[1.4rem] font-semibold tracking-[-0.015em] text-ink">
            About
          </h2>
          <p className="mt-2 text-ink">{site.about}</p>
        </section>

        <section id="work" className="mt-10 scroll-mt-16">
          <h2 className="font-serif text-[1.4rem] font-semibold tracking-[-0.015em] text-ink">
            Projects
          </h2>
          <ul className="mt-3 overflow-hidden rounded-soft border border-line bg-surface">
            {projects.map((project, index) => {
              const isExternal = project.href.startsWith("http");
              return (
                <li
                  key={project.title}
                  className={index > 0 ? "border-t border-line" : undefined}
                >
                  <a
                    href={project.href}
                    className="block px-4 py-4 no-underline transition-colors hover:bg-accent/12 hover:text-ink"
                    {...(isExternal
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                  >
                    <span className="font-medium text-ink">{project.title}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {project.description}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section id="contact" className="mt-10 scroll-mt-16">
          <h2 className="font-serif text-[1.4rem] font-semibold tracking-[-0.015em] text-ink">
            Contact
          </h2>
          <div className="mt-3 text-ink">
            <ContactForm>
              <a href={site.social.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href={site.social.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </ContactForm>
          </div>
        </section>
      </main>
    </>
  );
}
