/**
 * Video Pipeline Integration
 *
 * Entry point for the composite video that integrates:
 * - Horizon news data (via data bridge)
 * - Broadcast-engine scripts
 * - Remotion video components with seendance effects
 *
 * This is the target file that Agent 5 will enhance into the final composite.
 */

import { registerRoot } from "remotion";
import { CompositeRoot } from "./composite-script/composite-video";

// Register the composite root which loads all pipeline outputs
registerRoot(CompositeRoot);