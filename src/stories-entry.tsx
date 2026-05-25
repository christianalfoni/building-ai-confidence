import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const params = new URLSearchParams(location.search);
const component = params.get("component");
const storyName = params.get("story");

if (!component || !storyName) {
  document.getElementById("root")!.textContent =
    "Usage: /stories.html?component=App&story=withTodos";
} else {
  import(`./components/${component}.stories.tsx`)
    .then((mod) => {
      const story = mod[storyName];
      if (!story) {
        document.getElementById("root")!.textContent =
          `Story "${storyName}" not found in ${component}.stories.tsx`;
        return;
      }
      const { element } = story();
      createRoot(document.getElementById("root")!).render(
        <StrictMode>{element}</StrictMode>,
      );
    })
    .catch(() => {
      document.getElementById("root")!.textContent =
        `Could not load ${component}.stories.tsx`;
    });
}
