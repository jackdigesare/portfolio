"use client";

import { useId, useState, type ReactNode } from "react";

type Status = "idle" | "pending" | "success" | "error";

export function ContactForm({ children }: { children: ReactNode }) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "pending") return;

    setStatus("pending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          website: honeypot,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(
          data?.error ?? "Something went wrong. Please try again.",
        );
        return;
      }

      setName("");
      setEmail("");
      setMessage("");
      setHoneypot("");
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-0 text-ink hover:opacity-65"
          aria-expanded={open}
          aria-controls={`${formId}-panel`}
          onClick={() => {
            setOpen((prev) => !prev);
            if (status === "success" || status === "error") {
              setStatus("idle");
              setErrorMessage("");
            }
          }}
        >
          Email
        </button>
        {children}
      </div>

      <div
        className={`contact-form-panel ${open ? "is-open" : ""}`}
        aria-hidden={!open}
      >
        <div className="contact-form-panel-inner">
          <form
            id={`${formId}-panel`}
            className="mt-4 space-y-3"
            onSubmit={handleSubmit}
            noValidate
            inert={!open ? true : undefined}
          >
            <div
              className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
              aria-hidden="true"
            >
              <label htmlFor={`${formId}-website`}>Website</label>
              <input
                id={`${formId}-website`}
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor={`${formId}-name`}
                className="block text-sm text-muted"
              >
                Name
              </label>
              <input
                id={`${formId}-name`}
                name="name"
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full border border-line bg-bg px-3 py-2 text-ink outline-none focus:border-ink"
                disabled={status === "pending"}
                tabIndex={open ? undefined : -1}
              />
            </div>

            <div>
              <label
                htmlFor={`${formId}-email`}
                className="block text-sm text-muted"
              >
                Your email
              </label>
              <input
                id={`${formId}-email`}
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full border border-line bg-bg px-3 py-2 text-ink outline-none focus:border-ink"
                disabled={status === "pending"}
                tabIndex={open ? undefined : -1}
              />
            </div>

            <div>
              <label
                htmlFor={`${formId}-message`}
                className="block text-sm text-muted"
              >
                Message
              </label>
              <textarea
                id={`${formId}-message`}
                name="message"
                required
                rows={4}
                maxLength={5000}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-1 w-full resize-y border border-line bg-bg px-3 py-2 text-ink outline-none focus:border-ink"
                disabled={status === "pending"}
                tabIndex={open ? undefined : -1}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="submit"
                disabled={status === "pending"}
                className="cursor-pointer border border-ink bg-ink px-3 py-2 text-sm text-bg disabled:cursor-not-allowed disabled:opacity-50"
                tabIndex={open ? undefined : -1}
              >
                {status === "pending" ? "Sending…" : "Send message"}
              </button>
              {status === "success" ? (
                <p className="text-sm text-muted" role="status">
                  Message sent. Thanks for writing.
                </p>
              ) : null}
              {status === "error" ? (
                <p className="text-sm text-muted" role="alert">
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
