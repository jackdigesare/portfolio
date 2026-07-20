import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";
import { site } from "@/content";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_HEADER_CONTROL_RE = /[\u0000-\u001f\u007f]/;
const MAX_BODY_BYTES = 24 * 1024;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW = "10 m";

function createContactRateLimit(): Ratelimit | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Ratelimit({
    redis: new Redis({ url, token, enableTelemetry: false }),
    limiter: Ratelimit.fixedWindow(
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW,
    ),
    timeout: 3_000,
    analytics: false,
    prefix: "portfolio:contact",
  });
}

const contactRateLimit = createContactRateLimit();

type ContactBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getClientIp(request: Request): string | null {
  const forwardedFor =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for");

  return forwardedFor?.split(",", 1)[0].trim() || null;
}

async function hashIdentifier(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function enforceRateLimit(request: Request): Promise<NextResponse | null> {
  if (!contactRateLimit) {
    if (process.env.NODE_ENV === "development") {
      return null;
    }

    console.error("Contact rate limiting is not configured");
    return NextResponse.json(
      { error: "Contact form is temporarily unavailable." },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }

  try {
    const clientIp = getClientIp(request);
    if (!clientIp) {
      console.error("Contact request is missing a client IP");
      return NextResponse.json(
        { error: "Contact form is temporarily unavailable." },
        { status: 503, headers: { "Retry-After": "60" } },
      );
    }

    const identifier = await hashIdentifier(clientIp);
    const result = await contactRateLimit.limit(identifier);

    if (result.reason === "timeout") {
      console.error("Contact rate limit timed out");
      return NextResponse.json(
        { error: "Contact form is temporarily unavailable." },
        { status: 503, headers: { "Retry-After": "60" } },
      );
    }

    if (!result.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000),
      );

      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
  } catch (error) {
    console.error("Contact rate limit error:", error);
    return NextResponse.json(
      { error: "Contact form is temporarily unavailable." },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }

  return null;
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

  const rateLimitResponse = await enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
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

  if (
    !email ||
    email.length > 254 ||
    !EMAIL_RE.test(email) ||
    EMAIL_HEADER_CONTROL_RE.test(email)
  ) {
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

  return NextResponse.json({ ok: true });
}
