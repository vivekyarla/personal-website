import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Vivek x Rox";

// Share card for the unlisted trial page. Same construction as the site-wide
// card in app/opengraph-image.tsx — Inter 600, tight tracking, white ground —
// so a pasted link still looks like the rest of the site. Deliberately says
// nothing beyond the two names: this route is public (it has to be, or link
// previews can't render) while the page behind it is password-gated.
export default async function RoxOGImage() {
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
          Vivek x Rox
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
