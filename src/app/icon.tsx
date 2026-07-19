import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            background: "#111111",
            color: "#ffffff",
            fontSize: 13,
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
