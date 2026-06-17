/**
 * Entry point for Remotion.
 *
 * This file is referenced by remotion.config.ts and is the main
 * entry for both `remotion studio` and `remotion render`.
 */
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);