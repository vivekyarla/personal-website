"use client";

export default function NameToggle() {
  function toggle() {
    document.documentElement.classList.toggle("dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Invert color scheme"
      className="text-2xl font-semibold tracking-tight text-left cursor-pointer hover:opacity-70 transition-opacity"
    >
      Vivek Yarlagedda
    </button>
  );
}
