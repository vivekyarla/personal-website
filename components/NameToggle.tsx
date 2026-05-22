"use client";

const isDev = process.env.NODE_ENV === "development";

export default function NameToggle() {
  function toggle() {
    document.documentElement.classList.toggle("dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Invert color scheme"
      className={`text-2xl tracking-tight text-left cursor-pointer hover:opacity-70 transition-opacity ${
        isDev ? "font-serif font-normal" : "font-semibold"
      }`}
    >
      Vivek Yarlagedda
    </button>
  );
}
