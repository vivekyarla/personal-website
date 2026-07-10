"use client";

const isDev = process.env.NODE_ENV === "development";

export default function NameToggle() {
  function toggle() {
    const next = document.documentElement.classList.toggle("dark");
    // Manual choice wins over the automatic sunset theming for this session.
    try {
      sessionStorage.setItem("themeOverride", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Invert color scheme"
      className={`name-trigger text-2xl tracking-tight text-left cursor-pointer hover:opacity-70 transition-opacity ${
        isDev ? "font-serif font-normal" : "font-semibold"
      }`}
    >
      Vivek Yarlagedda
    </button>
  );
}
