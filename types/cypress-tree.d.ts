// <cypress-tree> custom element (public/cypress/cypress.js).
import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "cypress-tree": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string;
        side: "left" | "right";
        mode?: "both" | "intro" | "wind" | "still";
      };
    }
  }
}
