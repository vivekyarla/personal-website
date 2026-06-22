import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon for "Add to Home Screen" — the sun-glow mark on white.
// (iOS applies its own rounded-corner mask and turns transparency black, so
// we paint a solid white background.)
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
          background: "#ffffff",
        }}
      >
        <div
          style={{
            width: 170,
            height: 170,
            backgroundImage:
              "radial-gradient(circle at 50% 50%, #fff5b8 0%, #ffe27a 12%, #ffb454 26%, #ff8a3c 42%, rgba(255,122,61,0.28) 68%, rgba(255,122,61,0) 100%)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
