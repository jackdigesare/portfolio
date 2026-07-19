import { projects, site } from "@/content";
import { SiteNav } from "@/components/SiteNav";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="top" className="mx-auto max-w-xl px-6 py-16 md:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {site.name}
        </h1>
        <p className="mt-2 text-muted">Based in {site.location}</p>

        <section id="about" className="mt-14 scroll-mt-16">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            About
          </h2>
          <p className="mt-3 text-ink">{site.about}</p>
        </section>

        <section id="work" className="mt-14 scroll-mt-16">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            Projects
          </h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {projects.map((project) => {
              const isExternal = project.href.startsWith("http");
              return (
                <li key={project.title}>
                  <a
                    href={project.href}
                    className="block py-4 no-underline"
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

        <section id="contact" className="mt-14 scroll-mt-16">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            Contact
          </h2>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-ink">
            <a href={`mailto:${site.email}`}>Email</a>
            <a href={site.social.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={site.social.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </p>
        </section>
      </main>
    </>
  );
}
