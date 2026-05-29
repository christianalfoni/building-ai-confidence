import { lazy } from "react";
import { isMobileUA } from "./utils.ts";

const isMobile =
  typeof navigator !== "undefined" ? isMobileUA(navigator.userAgent) : false;

export const PlatformApp = lazy(() =>
  isMobile ? import("./mobile/App") : import("./desktop/App")
);
