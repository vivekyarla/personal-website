export type InboundItem = {
  title: string;
  url: string;
  source: string;
  date: string; // ISO yyyy-mm-dd
  note: string;
};

// Add items here as you read things worth saving. Newest first.
export const inboundItems: InboundItem[] = [
  // Example:
  // {
  //   title: "The Bitter Lesson",
  //   url: "http://www.incompleteideas.net/IncIdeas/BitterLesson.html",
  //   source: "Rich Sutton",
  //   date: "2019-03-13",
  //   note: "Short essay arguing that general methods that leverage compute always win out over methods that encode human knowledge. A useful lens for evaluating new AI architectures.",
  // },
];

export function formatInboundDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
