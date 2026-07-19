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
          background: "#ffffff",
          color: "#111111",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.03em" }}>
          {site.name}
        </div>
        <div style={{ marginTop: 18, fontSize: 32, color: "#666666" }}>
          {site.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
