import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Habiquo — Smart living. Smart real estate.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#f6f2e9",
          color: "#100d09",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            opacity: 0.5,
          }}
        >
          Habiquo · 2026
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 180,
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
              display: "flex",
            }}
          >
            <span>habi</span>
            <span style={{ color: "#a77a45", fontStyle: "italic" }}>q</span>
            <span>uo</span>
          </div>
          <div style={{ fontSize: 36, fontStyle: "italic", maxWidth: 900, color: "#322a22" }}>
            Smart living. Smart real estate.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
