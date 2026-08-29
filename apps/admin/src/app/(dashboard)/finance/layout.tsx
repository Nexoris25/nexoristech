/**
 * The Finance module gate.
 *
 * Every page below this point is behind it, which is the point: guarding pages one at a time is how
 * the finance area ended up with nine pages demanding the base admin role, so granting somebody Finance Viewer let them into nothing. A layout runs for
 * every route in its subtree, including ones added later by someone who has never read this file.
 *
 * Holding any role in the module gets you in. What each role may then *do* is checked per action
 * with requireCapability, because reading the pipeline and changing the settings behind it are not
 * the same permission.
 */
import type { ReactNode } from "react";
import { requireModule } from "../../../lib/auth.js";

export default async function FinanceLayout({ children }: { children: ReactNode }): Promise<ReactNode> {
  await requireModule("finance");
  return <>{children}</>;
}
