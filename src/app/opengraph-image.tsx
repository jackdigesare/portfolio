import { ImageResponse } from "next/og";
import { site } from "@/content";

export const alt = `${site.name} — portfolio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "#F9F6F1",
          color: "#141413",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
          }}
        >
          {site.name}
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 28,
            color: "#6F6E69",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {site.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
