import { lazy } from "react";

const isMobile = window.matchMedia("(pointer: coarse)").matches;

export const PlatformApp = lazy(() =>
  isMobile ? import("./mobile/App") : import("./desktop/App")
);
