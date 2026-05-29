import { lazy } from "react";

const isMobile =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export const PlatformApp = lazy(() =>
  isMobile ? import("./mobile/App") : import("./desktop/App")
);
