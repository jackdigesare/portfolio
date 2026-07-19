import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <div
          style={{
            width: 180,
            height: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 90,
            background: "#111111",
            color: "#ffffff",
            fontSize: 78,
            fontWeight: 700,
            lineHeight: 1,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          JD
        </div>
      </div>
    ),
    { ...size },
  );
}
