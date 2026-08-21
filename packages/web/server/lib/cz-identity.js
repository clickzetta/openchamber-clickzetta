//======================== cz_change (new file) ========================
// ClickZetta product-identity shim.
//
// WHY THIS FILE EXISTS
// -------------------
// OpenChamber assumes the agent runtime it drives is upstream `opencode`, and
// hardcodes that product's on-disk identity in ~113 places. We drive `cz-cli`
// instead, a ClickZetta fork whose on-disk identity differs:
//
//   upstream opencode            cz-cli
//   -----------------            ------
//   ~/.config/opencode           ~/.config/clickzetta      (core/src/global.ts: app = "clickzetta")
//   ~/.local/share/opencode      ~/.local/share/clickzetta
//   ~/.cache/opencode            ~/.cache/clickzetta
//   ~/.opencode                  ~/.clickzetta             (opencode/src/config/paths.ts)
//   <repo>/.opencode             <repo>/.opencode          <-- DELIBERATELY UNCHANGED
//
// THE CRITICAL ASYMMETRY
// ----------------------
// cz-cli renamed the HOME-level config dir but deliberately kept the
// PROJECT-level one as `.opencode`. See the cz-cli change banner in
// `packages/opencode/src/config/paths.ts`: only the `afs.up({ targets })` call
// rooted at `Global.Path.home` was renamed; the project-level one rooted at the
// working directory still reads `.opencode`.
//
// So `PROJECT_CONFIG_DIRNAME` below is `.opencode` ON PURPOSE. Rewriting
// project-level reads to `.clickzetta` would make OpenChamber look in a
// directory cz-cli never reads — every project-scoped agent, command, skill,
// snippet and plugin would silently disappear. That failure mode is the exact
// opposite of the one this shim exists to fix, so it is spelled out here rather
// than left to be rediscovered.
//
// MERGE DISCIPLINE
// ----------------
// Every call site that consumes this module is marked with a `cz_change:`
// comment so `rg "cz_change" packages` enumerates the whole adaptation. When
// merging upstream OpenChamber, conflicts land on one-line substitutions next to
// an explanatory comment rather than on scattered string literals. New upstream
// code that hardcodes `.opencode` or `share/opencode` will merge cleanly and be
// silently wrong -- re-run the audit in `CZ-ADAPTATION.md` after every merge.
//======================================================================

import os from 'os'
import path from 'path'

/** XDG app directory name. Mirrors `app` in cz-cli's packages/core/src/global.ts. */
export const PRODUCT_DIR = 'clickzetta'

/** Home-level config dir name. Mirrors cz-cli's config/paths.ts home-level target. */
export const HOME_CONFIG_DIRNAME = '.clickzetta'

/**
 * Project-level config dir name. INTENTIONALLY `.opencode` -- cz-cli did not
 * rename this one. Do not "fix" it. See THE CRITICAL ASYMMETRY above.
 */
export const PROJECT_CONFIG_DIRNAME = '.opencode'

/** Default agent-runtime binary. Overridable with OPENCODE_BINARY. */
export const DEFAULT_CLI_BINARY = 'cz-cli'

/** `~/.local/share/clickzetta` -- where cz-cli keeps auth.json, worktrees, state. */
export function dataDir() {
  return path.join(os.homedir(), '.local', 'share', PRODUCT_DIR)
}

/** `~/.config/clickzetta` -- cz-cli's global config root. */
export function configDir() {
  return path.join(os.homedir(), '.config', PRODUCT_DIR)
}

/** `~/.clickzetta` -- cz-cli's home-level config dir. */
export function homeConfigDir() {
  return path.join(os.homedir(), HOME_CONFIG_DIRNAME)
}

/** `<dir>/.opencode` -- project-level config dir for any ancestor directory. */
export function projectConfigDir(dir) {
  return path.join(dir, PROJECT_CONFIG_DIRNAME)
}

/**
 * Home-level directories that may hold cz-cli config. `.opencode` is included
 * as a READ-ONLY fallback so a machine mid-migration still shows its old
 * content; `.clickzetta` is listed first so it wins. Writes must always target
 * homeConfigDir().
 */
export function homeConfigDirCandidates() {
  return [homeConfigDir(), path.join(os.homedir(), '.opencode')]
}

/** Brand strings for user-visible copy. */
export const BRAND = {
  productName: 'ClickZetta CLI',
  cliName: 'cz-cli',
  agentsMdPath: `~/.config/${PRODUCT_DIR}/AGENTS.md`,
}
