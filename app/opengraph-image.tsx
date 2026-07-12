import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Vivek Yarlagedda";

// Social share card: the name exactly as it appears on the home screen —
// SF Pro-style semibold with tight tracking (Inter is the closest embeddable
// match), centered on the site's white background.
export default async function OGImage() {
  const font = await fetch(
    "https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-600-normal.woff"
  )
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .catch(() => null);

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
            fontSize: 84,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "#111111",
            fontFamily: "Inter",
          }}
        >
          Vivek Yarlagedda
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Inter", data: font, weight: 600, style: "normal" }]
        : undefined,
    }
  );
}
