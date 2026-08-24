import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// PNG favicon fallback (browsers without SVG-favicon support) — the same
// sun-glow mark as icon1.svg, on a transparent background.
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
            width: 64,
            height: 64,
            backgroundImage:
              "radial-gradient(circle at 50% 50%, #fff5b8 0%, #ffe27a 12%, #ffb454 26%, #ff8a3c 42%, rgba(255,122,61,0.28) 68%, rgba(255,122,61,0) 100%)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
