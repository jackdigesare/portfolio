import { NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/content";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_HEADER_CONTROL_RE = /[\u0000-\u001f\u007f]/;
const MAX_BODY_BYTES = 24 * 1024;

type ContactBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let body: ContactBody;

  if (
    request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return NextResponse.json(
      { error: "Content-Type must be application/json." },
      { status: 415 },
    );
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Request body is too large." },
      { status: 413 },
    );
  }

  try {
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body is too large." },
        { status: 413 },
      );
    }

    const parsedBody: unknown = JSON.parse(bodyText);
    if (
      !parsedBody ||
      typeof parsedBody !== "object" ||
      Array.isArray(parsedBody)
    ) {
      throw new TypeError("Request body must be an object.");
    }

    body = parsedBody as ContactBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields; humans leave them empty.
  if (asTrimmedString(body.website)) {
    return NextResponse.json({ ok: true });
  }

  const name = asTrimmedString(body.name);
  const email = asTrimmedString(body.email);
  const message = asTrimmedString(body.message);

  if (
    !name ||
    name.length > 100 ||
    EMAIL_HEADER_CONTROL_RE.test(name)
  ) {
    return NextResponse.json(
      { error: "Please enter a valid name." },
      { status: 400 },
    );
  }

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (!message || message.length > 5000) {
    return NextResponse.json(
      { error: "Please enter a message." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return NextResponse.json(
      { error: "Email is not configured right now." },
      { status: 500 },
    );
  }

  const to = process.env.CONTACT_TO_EMAIL?.trim() || site.email;
  const notificationFrom =
    process.env.CONTACT_FROM_EMAIL?.trim() ||
    `${site.name} <contact@jackdigesare.dev>`;
  const confirmationFrom = `${site.name} <contact@jackdigesare.dev>`;
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: notificationFrom,
    to: [to],
    replyTo: email,
    subject: `Portfolio message from ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      message,
    ].join("\n"),
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json(
      { error: "Could not send your message. Please try again." },
      { status: 500 },
    );
  }

  const { error: confirmationError } = await resend.emails.send({
    from: confirmationFrom,
    to: [email],
    subject: `Thanks for reaching out, ${name}`,
    text: [
      `Hi ${name},`,
      "",
      "Thanks for your message — I got it and will get back to you soon.",
      "",
      "Here's what you sent:",
      "",
      message,
      "",
      "—",
      site.name,
    ].join("\n"),
  });

  if (confirmationError) {
    console.error("Resend confirmation error:", confirmationError);
  }

  return NextResponse.json({ ok: true });
}
