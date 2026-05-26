# PLANS.md — Complete Codex Implementation Plan for SimplexiDev's MAP

## Project identity

Project name: **SimplexiDev's MAP**  
Expanded name: **SimplexiDev's Massive Add-On Pack**  
Short name: **MAP**

This project is **not Survival Aid**. Some existing files, concepts, identifiers, and assets still reference Survival Aid because the codebase evolved from earlier work. Codex must migrate naming and behavior toward SimplexiDev's MAP without treating Survival Aid as the current project.

The central player-facing item is the **Guidebook**. The Guidebook is a non-craftable starter/recoverable item that opens the main add-on menu.

## Where this file belongs

Place this file at the repository root:

```text
mcbemods/PLANS.md
```

That means it should sit next to:

```text
mcbemods/README.md
mcbemods/LICENSE.md
mcbemods/scripts/
mcbemods/sources/
```

Codex should use this file as the main implementation plan for completing the add-on. If both `PLAN.md` and `PLANS.md` exist, `PLANS.md` is the active plan and `PLAN.md` is legacy/reference only.

---

# -2. Existing API preservation contract

This project already has meaningful `core/` and `features/` API surfaces. Codex must treat those APIs as the user's intended architecture.

The goal is **not** to replace the existing APIs with a smaller generic framework.

The goal is to **repair, complete, connect, and bootstrap** the existing APIs so the add-on works as one monolithic mod with many simultaneous features.

## -2.1 Core rule

Codex must preserve existing public APIs unless one of the following is true:

1. The API is impossible to compile because it references invalid or unavailable Minecraft API types and no adapter can fix it.
2. The API is an obvious duplicate of another existing project API and keeping both would create a broken conflict.
3. The API is dead placeholder code with no meaningful contract.
4. The active implementation requires a very small signature change to wire systems together.

Even when one of these applies, Codex must prefer the smallest compatible repair over replacement.

## -2.2 What “preserve” means

Codex must preserve, whenever practical:

- exported interfaces
- exported classes
- exported enums
- exported type aliases
- DTO shapes
- method names
- property names
- file names
- feature/domain separation
- existing comments that describe intended behavior
- existing dynamic property abstractions
- existing result/error abstractions
- existing form abstractions
- existing logging abstractions
- existing migration abstractions
- existing player/location abstractions
- existing reward/quest/world-event/portal API concepts

Codex may add overloads, optional parameters, adapter methods, wrappers, index exports, glue classes, or compatibility aliases.

Codex must not simplify a rich API down to a minimal placeholder just because doing so compiles faster.

## -2.3 Prohibited replacement behavior

Codex must not:

- delete the `core/` directory and replace it with a tiny generic utility file
- collapse multiple existing APIs into a single catch-all service
- replace domain-specific APIs with loosely typed `any` records
- remove DTOs just because they are not fully wired yet
- remove feature APIs because feature implementation is incomplete
- remove existing abstractions such as result/error, JSON store, dynamic property store, logging, forms, migrations, player refs, or location refs
- rewrite the project as a minimal demo add-on
- reduce the project to only Guidebook stubs
- remove public APIs to avoid fixing imports
- remove public APIs to avoid fixing TypeScript errors

## -2.4 Allowed repair behavior

Codex may:

- fix imports
- add missing imports
- add missing exports
- split large files into subfiles only if public exports remain available
- add `index.ts` barrel exports
- add concrete implementations behind existing interfaces
- add adapter classes to bridge existing APIs to `ServiceHost`
- add compatibility aliases for renamed symbols
- add thin `*Feature` wrapper classes around existing feature APIs
- move a type to a better file only if old import paths are preserved through re-export
- add missing constructor parameters
- add missing methods required by an existing interface
- add narrow type guards around Minecraft API objects
- add fallback implementations for early-execution constraints
- add TODO comments for API-limited behavior while keeping the contract intact

## -2.5 Deletion rule

Before deleting or replacing any existing `.ts` file under:

```text
sources/behaviors/scripts.ts/core/
sources/behaviors/scripts.ts/features/
```

Codex must prove that deletion is safe by checking all of these:

1. The file is not imported anywhere.
2. The file does not export a public API intended by the project.
3. The file is not named in this plan.
4. The file is not part of the existing architecture.
5. The file is either empty, obsolete, or purely duplicative.

If any condition is uncertain, Codex must not delete the file.

Prefer marking obsolete exports as compatibility wrappers over deletion.

## -2.6 Refactor rule

Refactors must be compatibility-preserving.

If Codex renames a symbol, it must either:

1. update every reference safely, or
2. provide an alias export with the old name.

Example:

```ts
export { NewFeatureContext as FeatureContext };
```

or:

```ts
export type FeatureContext = NewFeatureContext;
```

Do this only when needed. Prefer not to rename existing public APIs.

## -2.7 ServiceHost glue rule

`ServiceHost` should connect the existing APIs.

It should not replace them.

The correct implementation pattern is:

```text
existing core APIs
        ↓
concrete service implementations
        ↓
ServiceHost dependency wiring
        ↓
feature wrapper classes
        ↓
Guidebook integration
```

The incorrect pattern is:

```text
delete existing APIs
        ↓
create tiny generic service objects
        ↓
stub feature behavior
```

## -2.8 Feature wrapper rule

When an existing feature API file exists, such as:

```text
features/Quests.ts
features/Rewards.ts
features/Achievements.ts
features/WorldEvents.ts
features/Portals.ts
features/Guidebook.ts
```

Codex should usually keep it and add a wrapper/initializer file:

```text
features/QuestsFeature.ts
features/RewardsFeature.ts
features/AchievementsFeature.ts
features/WorldEventsFeature.ts
features/PortalsFeature.ts
features/GuidebookFeature.ts
```

The wrapper should instantiate/configure/use the existing API.

Do not replace the existing API file with a tiny feature stub.

## -2.9 Compile-error repair priority

When existing APIs do not compile, fix them in this order:

1. Missing imports.
2. Missing exports.
3. Wrong relative paths.
4. Type name mismatch.
5. Incomplete interface implementation.
6. Bedrock API type mismatch.
7. Missing concrete implementation.
8. Missing glue/adapter.
9. Last resort: small compatibility-preserving signature adjustment.

Do not delete the API as a compile-error fix.

## -2.10 “Make consistent” does not mean “rewrite”

When this plan says to make names consistent, Codex must interpret that as:

- align imports/exports
- add aliases where needed
- pick the existing dominant naming convention
- repair conflicting references

It does **not** mean deleting the existing API and replacing it with a new minimal convention.

## -2.11 If removal truly makes sense

If removing something truly makes sense, Codex must keep the removal narrow.

Acceptable removals:

- empty placeholder files
- stale generated output when regenerated by build
- obsolete Survival Aid recipes that conflict with Guidebook requirements
- duplicate aliases after all references are migrated
- broken imports that point to nonexistent files

Unacceptable removals:

- established core API files
- feature domain API files
- DTO definitions
- result/error abstractions
- dynamic property abstractions
- form abstractions
- logging abstractions
- migration abstractions

## -2.12 Required preservation audit

Before the final response, Codex must report:

```text
API preservation audit:
- core files preserved:
  - ...
- feature API files preserved:
  - ...
- files deleted:
  - ... plus reason
- public APIs renamed:
  - ... plus compatibility alias or migration note
- adapters/wrappers added:
  - ...
```

If Codex deletes or replaces a core/feature API file, it must explicitly justify why no repair path was reasonable.


---

# -3. TypeScript source preservation contract

This project is a TypeScript-first Minecraft Bedrock add-on.

Codex must not replace TypeScript source files with plain JavaScript.

The source of truth is TypeScript under:

```text
sources/behaviors/scripts.ts/
```

Compiled JavaScript belongs only under:

```text
sources/behaviors/scripts/
```

## -3.1 Hard rule

Codex must preserve and repair TypeScript source.

Codex must not:

- delete `.ts` source files and replace them with `.js`
- move runtime source authoring from `.ts` to `.js`
- convert classes/interfaces/enums/types into untyped JavaScript objects
- remove TypeScript interfaces to avoid type errors
- remove TypeScript enums to avoid type errors
- remove type annotations to make code easier to compile
- replace typed APIs with `any`-heavy JavaScript-style code
- hand-author files in `sources/behaviors/scripts/` instead of fixing files in `sources/behaviors/scripts.ts/`
- treat compiled JavaScript output as the editable source of truth

## -3.2 Allowed JavaScript files

JavaScript files are allowed only when they are generated build output or already-existing build/tooling files.

Allowed examples:

```text
sources/behaviors/scripts/main.js
sources/behaviors/scripts/**/*.js
eslint.config.js
prettier.config.js
webpack.config.js
rollup.config.js
```

Codex may update build/tooling JavaScript config files when necessary.

Codex must not implement gameplay logic directly in generated-output JavaScript.

## -3.3 Build output rule

If a JavaScript file under:

```text
sources/behaviors/scripts/
```

needs to change, Codex should change the corresponding TypeScript file under:

```text
sources/behaviors/scripts.ts/
```

then run the build.

Do not manually edit compiled JavaScript unless there is no TypeScript source equivalent and Codex documents why.

## -3.4 TypeScript repair rule

When TypeScript errors occur, Codex must fix the TypeScript.

Preferred fixes:

1. add correct imports
2. add correct exports
3. repair type names
4. add missing interfaces/classes/enums
5. add concrete implementations
6. add narrow type guards
7. use compatibility aliases
8. add adapter types around Bedrock API differences
9. use local, justified `unknown` or `any` only as a last resort

Do not “solve” TypeScript errors by converting files to JavaScript.

## -3.5 Public type preservation

Codex must preserve meaningful TypeScript constructs, including:

- interfaces
- classes
- enums
- type aliases
- readonly DTO shapes
- generic result/error types
- service interfaces
- feature interfaces
- reward/quest/world-event/portal definitions
- discriminated unions, if already present
- namespace-safe key builders
- typed form models

If Codex must change a public type, it must keep compatibility where practical.

## -3.6 Generated content must be TypeScript

Generated content files must be TypeScript modules, not JSON or JavaScript, unless the existing repository already uses JSON content definitions.

Preferred:

```text
dailyQuestDefinitions.ts
weeklyQuestDefinitions.ts
worldEventDefinitions.ts
achievementDefinitions.ts
documentationPages.ts
```

These files should export typed readonly arrays.

Example:

```ts
export const dailyQuestDefinitions: readonly QuestDefinition[] = [
  // ...
];
```

Do not generate:

```text
dailyQuestDefinitions.js
weeklyQuestDefinitions.js
```

as source files.

## -3.7 No downgrade to plain objects

Codex must not replace established TypeScript models with anonymous plain objects if typed models already exist.

Acceptable:

```ts
const definition: QuestDefinition = { ... };
```

Not acceptable as an API replacement:

```js
const definition = { ... };
```

## -3.8 TypeScript audit

Before the final response, Codex must report:

```text
TypeScript preservation audit:
- TypeScript source files preserved:
  - ...
- TypeScript files added:
  - ...
- JavaScript files generated by build:
  - ...
- JavaScript files manually edited:
  - ... plus reason, or "none"
- Any use of `any`:
  - ... plus reason
```

If Codex converted TypeScript source to JavaScript, the project is incomplete and must be repaired before final completion.


---

# -1. Codex autonomy rules for no-human-intervention execution

This section exists so Codex can run this plan to completion without stopping for routine clarification.

## -1.1 Operating command

Preferred Codex command:

```text
/goal Read AGENTS.md and PLANS.md. Implement PLANS.md completely. Do not ask for human clarification unless continuing would require deleting user-authored source files, changing project scope, or making an unsafe/destructive choice. For normal ambiguity, use the defaults in PLANS.md, document the assumption in the final summary, and continue.
```

## -1.2 Authority order

If project instructions conflict, apply them in this order:

1. Safety and platform constraints.
2. `AGENTS.md`.
3. `PLANS.md`.
4. Existing repository behavior.
5. Existing naming/style conventions.
6. Codex's implementation judgment.

If `PLAN.md` and `PLANS.md` both exist, use `PLANS.md`.

## -1.3 Do not stop for these routine issues

Codex must not stop to ask about:

- exact quest names
- exact reward amounts
- exact wording of Guidebook documentation
- whether to use enums or string unions
- whether to create feature wrapper files
- whether to add missing index exports
- whether to create `.txt` asset placeholders
- whether to align manifest/package Minecraft API versions
- whether to migrate obvious Survival Aid leftovers
- whether to split large files when TypeScript imports are broken
- whether to create minimal tests/validation helpers when no test framework exists

Use the defaults in this plan and continue.

## -1.4 Stop only for true blockers

Codex may stop only if:

1. The repository is missing essential files needed to determine the pack structure.
2. The build toolchain cannot be repaired from available files.
3. Continuing would require deleting substantial user-authored gameplay logic with no safe migration path.
4. A required dependency cannot be installed or resolved and no local fallback is possible.
5. The implementation would require generating binary art assets, which is prohibited.

If stopped, Codex must provide:

```text
Blocked because:
- ...

Completed before block:
- ...

Exact file/line or command causing block:
- ...

Safest next human action:
- ...
```

## -1.5 Default decisions Codex must make automatically

Use these defaults unless existing repository files clearly require otherwise:

| Question | Default decision |
|---|---|
| Active plan filename | `PLANS.md` |
| Source root | `sources/behaviors/scripts.ts` |
| Compile output | `sources/behaviors/scripts` |
| Behavior script entry | `scripts/main.js` |
| Namespace | `simplexidev` |
| Add-on short namespace in keys | `map` |
| Main item id | `simplexidev:guidebook` |
| Guidebook craftability | Not craftable |
| Reward delivery | Pending claim through Guidebook |
| Quest rotation time | Minecraft in-game absolute time |
| Daily active quest count | 5 per player |
| Weekly active quest count | 7 per player |
| Daily quest definition minimum | 100 |
| Weekly quest definition minimum | 50 |
| World event definition minimum | 5 |
| Minecraft day ticks | 24,000 |
| Minecraft in-game hour ticks | 1,000 |
| Minecraft week ticks | 168,000 |
| API version alignment | Prefer installed `@minecraft/server` package version; update manifest to match when valid |
| Binary asset handling | Never generate; create `.txt` placeholder |
| TypeScript target | Preserve existing target unless compile requires a newer ES lib |
| TypeScript style | Prefer explicit exported types/classes; use enums where appropriate |
| Feature startup | `main.ts` -> `ServiceHost` -> required `*Feature` classes |

## -1.6 Assumptions Codex is allowed to make

Codex may make and document these assumptions without asking:

1. The user wants a working implementation over a perfect final API surface.
2. Compile success is more important than preserving broken draft APIs exactly.
3. Existing incomplete API files may be refactored if names and concepts are preserved.
4. If Bedrock API support is uncertain, implement a safe adapter and document the limitation.
5. If a gameplay event cannot be observed directly, implement the closest supported approximation and add a clear TODO.
6. If generated content is required, Codex may generate text/data definitions but not binary assets.
7. If a reward amount is not specified, choose a modest survival-balanced amount.
8. If settings UI controls are too complex for one pass, implement readable menus first and add editable controls where feasible.
9. If tests are not configured, build/typecheck/lint plus lightweight internal validation is acceptable.
10. If project metadata contains both Survival Aid and MAP branding, new/active content should use MAP while old files may remain only as compatibility leftovers.

## -1.7 Progress and validation loop

For every milestone, Codex must:

1. Make the smallest coherent implementation change set.
2. Run the relevant validation command.
3. Fix failures.
4. Re-run validation.
5. Continue to the next milestone.

Do not proceed with known TypeScript compile errors unless the error is external tooling unrelated to the changed source and is documented.

## -1.8 Required final response from Codex

At completion, Codex must provide:

```text
Completed:
- ...

Files changed:
- ...

Generated content counts:
- Daily quests: N
- Weekly quests: N
- World events: N
- Achievements: N

Validation:
- npm install: pass/fail/not run + reason
- npm run typecheck: pass/fail/not run + reason
- npm run build: pass/fail/not run + reason
- npm run lint: pass/fail/not run + reason

Manual follow-up required:
- Replace these placeholder assets:
  - ...
```

If there are no manual follow-ups besides replacing art placeholders, say so.

## -1.9 No partial completion claim

Codex must not claim the project is complete unless:

- required feature classes exist
- required content counts are met
- build/typecheck passes or the failure is purely external and documented
- Guidebook item exists
- Guidebook opens UI
- rewards are pending and claimable
- inventory-full reward behavior is all-or-nothing
- quest rotation uses in-game time
- missing assets have `.txt` placeholders
- no new binary assets were generated


---

# 0. Hard rules for Codex

## 0.1 Do not generate binary assets

Codex must not generate binary image files, including:

```text
.png
.tga
.jpg
.jpeg
.webp
.ico
```

If an image/texture/icon is missing, Codex must create a placeholder text file beside the expected location.

Example:

```text
sources/resources/textures/items/guidebook.png.txt
```

The placeholder text file should explain:

```text
Expected real asset: guidebook.png
Expected location: sources/resources/textures/items/guidebook.png
Purpose: Guidebook item icon.
Suggested dimensions: 16x16 or 32x32 unless the pack uses another convention.
Replace this .txt file with the real binary image manually.
```

Existing binary files may remain, but Codex should not edit, regenerate, or replace them.

## 0.2 Keep the project monolithic

This is currently a single add-on, not separate independent add-ons. Keep the codebase monolithic, separated by directory namespaces/features.

Do not create separate behavior packs or resource packs for each feature.

## 0.3 Use TypeScript and the existing source/output pattern

The repo currently uses:

```text
sources/behaviors/scripts.ts/   TypeScript source
sources/behaviors/scripts/      compiled JavaScript output
```

Codex must keep this pattern. If build tooling is broken, fix the tooling around this TypeScript source/output pattern instead of replacing TypeScript with JavaScript.

## 0.4 Preserve user-owned art workflow

Codex may update JSON references to use correct asset names, but any newly required image should be represented only by `.txt` placeholders.

## 0.5 Rewards are claimed through the Guidebook

All player rewards from quests, weekly quests, achievements, world events, and future systems must become pending reward claims visible and claimable through the Guidebook.

Do not automatically grant completion rewards directly into inventory.

## 0.6 Inventory-full reward rule

When claiming a pending reward:

1. Validate that the player has enough inventory capacity for all item rewards.
2. If the player does not have enough room, do not grant any partial rewards.
3. Leave the reward claim pending.
4. Show a useful message in the Guidebook.
5. Only mark the claim as claimed after every reward is safely granted.

## 0.7 Reward persistence rule

Unclaimed rewards must never be deleted by daily/weekly quest rotation.

If daily quests refresh, old incomplete daily quests are replaced, but completed/unclaimed reward claims remain.

If weekly quests refresh, old incomplete weekly quests are replaced, but completed/unclaimed reward claims remain.

Pending rewards do not count against the active quest count.

After refresh, every player should still have:

```text
5 active daily quests
7 active weekly quests
```

## 0.8 Quest time is in-game time

Daily and weekly quest rotation must be based on Minecraft in-game time, not real-world Date/UTC time.

Use world time / absolute time and define deterministic in-game periods.

Recommended model:

```text
1 Minecraft day = 24,000 ticks
1 daily quest period = floor(worldAbsoluteTime / 24,000)
1 weekly quest period = floor(worldAbsoluteTime / (24,000 * 7))
```

If the current API uses real-world dates, replace that behavior.

---

# 1. Current repository observations

These observations are based on the uploaded repo contents.

## 1.1 Existing root structure

Current root appears to be:

```text
mcbemods/
├─ README.md
├─ LICENSE.md
├─ scripts/
├─ sources/
└─ .github/
```

## 1.2 Existing script source structure

Current TypeScript source exists under:

```text
sources/behaviors/scripts.ts/
├─ ServiceHost.ts
├─ core/
│  ├─ Common.ts
│  ├─ Configuration.ts
│  ├─ Features.ts
│  ├─ Forms.ts
│  ├─ Json.ts
│  ├─ Location.ts
│  ├─ Logging.ts
│  ├─ Migration.ts
│  ├─ Player.ts
│  └─ index.ts
└─ features/
   ├─ Achievements.ts
   ├─ Guidebook.ts
   ├─ Portals.ts
   ├─ Quests.ts
   ├─ Rewards.ts
   └─ WorldEvents.ts
```

## 1.3 Important current problems to fix first

Codex must fix these before implementing gameplay content:

1. `sources/tsconfig.json` currently has the wrong include path:

   ```json
   "include": ["scripts.ts/**/*.ts"]
   ```

   It should include the actual source folder, likely:

   ```json
   "include": ["behaviors/scripts.ts/**/*.ts"]
   ```

2. `sources/behaviors/manifest.json` points to:

   ```json
   "entry": "scripts/main.js"
   ```

   But there is currently no:

   ```text
   sources/behaviors/scripts.ts/main.ts
   ```

   Create it.

3. `ServiceHost.ts` imports a non-existent module path:

   ```ts
   import { QuestModule } from "./modules/QuestModule";
   ```

   The repo currently uses `features/`, not `modules/`. Repair this wiring to use the existing `features/` architecture and add a consistent `Feature` initialization layer around the existing APIs. Do not replace the existing core/feature APIs.

4. Several files use names from the earlier API draft inconsistently:

   ```text
   Result vs SDResult
   CoreError vs SDError
   GameModule vs Feature
   SimplexiCoreServices vs SDServiceProvider
   ModuleContext vs FeatureContext
   modules vs features
   ```

   Pick one naming convention and make the whole codebase consistent. Since the current core uses `SDResult`, `SDError`, `Feature`, and `SDServiceProvider`, prefer those unless a full rename is performed safely.

5. Many feature files appear to be large API surfaces without correct imports. Add explicit imports or split files into subfolders so TypeScript compiles.

6. `sources/package.json` has script issues:

   ```json
   "lint": "eslint scripts"
   "lint:fix": "eslint scripts --fix"
   ```

   There is no `scripts` source folder under `sources/`. Update lint paths to the actual TypeScript source folder.

7. `sources/package.json` depends on `@minecraft/server` `^2.7.0`, but `sources/behaviors/manifest.json` declares `@minecraft/server` version `2.6.0`. Align these intentionally.

8. Resource/behavior metadata still contains Survival Aid names/identifiers. Migrate to SimplexiDev's MAP naming.

---

# 2. Naming and identifier migration

## 2.1 Target project strings

Use these strings consistently:

```text
SimplexiDev's MAP
SimplexiDev's Massive Add-On Pack
MAP
```

## 2.2 Namespace target

Use a consistent namespace. Recommended:

```text
simplexidev
```

Recommended item identifier:

```text
simplexidev:guidebook
```

Recommended custom component identifier:

```text
simplexidev:guidebook_component
```

Recommended reward chest/block identifier if it remains:

```text
simplexidev:reward_chest
```

Do not keep new content under `survival_aid:*` unless implementing a temporary compatibility migration.

## 2.3 Existing Survival Aid files

Current files include Survival Aid remnants, such as:

```text
sources/behaviors/items/book_of_survival.json
sources/behaviors/recipes/book_of_survival.json
sources/behaviors/blocks/survival_aid_chest.block.json
sources/resources/textures/items/book_of_survival.png
sources/resources/textures/blocks/survival_aid_chest.png
sources/resources/manifest.json
sources/resources/texts/en_US.lang
sources/behaviors/texts/en_US.lang
```

Codex should migrate these carefully.

## 2.4 Guidebook item migration

The old `book_of_survival` concept should become `Guidebook`.

Required behavior:

1. The Guidebook item exists.
2. The Guidebook item opens the Guidebook UI when used.
3. The Guidebook item is not craftable.
4. The Guidebook can be recovered through the Guidebook recovery menu or developer tools.
5. The Guidebook should not be duplicated if the player already has one.

Required file changes:

1. Replace or migrate:

   ```text
   sources/behaviors/items/book_of_survival.json
   ```

   to something like:

   ```text
   sources/behaviors/items/guidebook.json
   ```

2. Remove or disable:

   ```text
   sources/behaviors/recipes/book_of_survival.json
   ```

   because the Guidebook must not be craftable.

3. Update language files:

   ```text
   item.simplexidev:guidebook.name=Guidebook
   ```

4. Update item texture references from `book_of_survival` to `guidebook`.

5. If a new guidebook PNG is required, create:

   ```text
   sources/resources/textures/items/guidebook.png.txt
   ```

   Do not generate a binary PNG.

---

# 3. Required final script architecture

Codex must produce a complete, compiling, bootstrapped scripting structure.

Recommended final shape:

```text
sources/behaviors/scripts.ts/
├─ main.ts
├─ ServiceHost.ts
├─ core/
│  ├─ Common.ts
│  ├─ Configuration.ts
│  ├─ Features.ts
│  ├─ Forms.ts
│  ├─ Json.ts
│  ├─ Location.ts
│  ├─ Logging.ts
│  ├─ Migration.ts
│  ├─ Player.ts
│  ├─ Settings.ts                 optional if split from Configuration
│  └─ index.ts
├─ features/
│  ├─ AchievementsFeature.ts
│  ├─ DeveloperToolsFeature.ts
│  ├─ DocumentationFeature.ts
│  ├─ GuidebookFeature.ts
│  ├─ PortalsFeature.ts
│  ├─ QuestsFeature.ts
│  ├─ RewardsFeature.ts
│  ├─ SettingsFeature.ts
│  ├─ StarterItemsFeature.ts
│  ├─ TeleportFeature.ts
│  └─ WorldEventsFeature.ts
├─ content/
│  ├─ achievements/
│  ├─ documentation/
│  ├─ quests/
│  └─ worldEvents/
└─ shared/
   └─ optional reusable helpers
```

If Codex chooses to keep API files like `features/Quests.ts` and add feature entry files beside them, that is acceptable. The important requirement is that each feature has a concrete initializer class.

## 3.1 Existing API preservation in final architecture

The final script architecture must be built by preserving the existing `core/` API files and existing feature-domain API files.

The listed final shape is an integration target, not permission to replace rich existing files with stubs.

If a file already exists, Codex should repair it.

If a required `*Feature.ts` file does not exist, Codex should add it as glue around the existing feature API.

If an existing file is too large or has mixed concerns, Codex may split implementation details into subfiles, but must preserve the original public exports through re-export or compatibility aliases.



---

# 4. Required `main.ts`

Create:

```text
sources/behaviors/scripts.ts/main.ts
```

`main.ts` should be small. It should:

1. Import `system` from `@minecraft/server`.
2. Import `ServiceHost`.
3. Create the host with namespace `simplexidev`.
4. Run initialization inside `system.run` or equivalent safe startup scheduling.
5. Log fatal startup errors to console.

Target behavior:

```text
main.ts -> creates ServiceHost -> calls initialize -> ServiceHost initializes all features
```

Do not put feature logic directly in `main.ts`.

---

# 5. Required `ServiceHost.ts`

Repair and complete the current `ServiceHost.ts` into a complete host. Preserve existing API contracts and imports where practical.

The host must:

1. Create the core service provider.
2. Create one shared feature context.
3. Register all feature classes.
4. Initialize features in dependency order.
5. Provide typed access to important feature systems where needed.
6. Wire shared events only where they truly belong globally.
7. Log initialization success/failure.

Required features to create/register:

```text
RewardsFeature
SettingsFeature
DocumentationFeature
DeveloperToolsFeature
AchievementsFeature
QuestsFeature
WorldEventsFeature
PortalsFeature
TeleportFeature
StarterItemsFeature
GuidebookFeature
```

Suggested dependency order:

```text
1. RewardsFeature
2. SettingsFeature
3. DocumentationFeature
4. DeveloperToolsFeature
5. AchievementsFeature
6. QuestsFeature
7. WorldEventsFeature
8. PortalsFeature
9. TeleportFeature
10. StarterItemsFeature
11. GuidebookFeature
```

Guidebook should initialize late because it integrates all the other feature systems.

---

# 6. Core feature/module API cleanup

The current code has `core/Features.ts` and partial service-provider concepts. Finish this and use it consistently.

Required core abstractions:

```ts
export interface FeatureMetadata {
  readonly id: string;
  readonly displayName: string;
  readonly version: string;
  readonly description?: string;
  readonly dependencies?: readonly string[];
}

export enum FeatureState {
  Created = "created",
  Initializing = "initializing",
  Initialized = "initialized",
  Failed = "failed",
  Disabled = "disabled",
}

export interface Feature {
  readonly metadata: FeatureMetadata;
  readonly state: FeatureState;
  initialize(context: FeatureContext): SDResult<void> | Promise<SDResult<void>>;
  shutdown?(): SDResult<void> | Promise<SDResult<void>>;
}

export interface FeatureContext {
  readonly keys: KeyBuilder;
  readonly logger: Logger;
  readonly jsonStore: JsonStore;
  readonly forms: FormService;
  readonly config: ConfigService;
  readonly rewards: RewardService;
  readonly migrations: MigrationService;
  readonly features: FeatureRegistry;
}
```

If current names differ, repair references and add compatibility aliases where needed. Prefer the existing dominant project naming and do not rewrite established APIs solely for naming consistency.

Add `jsonStore` and `logger` to the feature context. Several systems need both.

---

# 7. Core service provider cleanup

The current `SDServiceProvider` in `core/Common.ts` references types that are not imported in that file. Prefer adding correct imports or a compatibility-preserving wrapper. Move it to its own file only if old exports remain available through `core/index.ts` or compatibility re-exports.

Recommended:

```text
sources/behaviors/scripts.ts/core/ServiceProvider.ts
```

The service provider should expose:

```ts
keys
properties
jsonStore
forms
config
rewards
migrations
features
players
loggerFactory
logger
```

It should have:

```ts
createFeatureKeys(featureId: string): KeyBuilder
createFeatureLogger(feature: Feature): Logger
createFeatureContext(feature: Feature): FeatureContext
```

Update `core/index.ts` to export it.

---

# 8. Logging cleanup

Keep the object-oriented logging API and ensure every feature receives a feature logger.

Required behavior:

1. Console log sink works.
2. Trace/info/warn/error levels work.
3. Dynamic-property-backed logger config works or safely falls back if dynamic properties are unavailable during early execution.
4. Feature logs include the feature display name or feature id.
5. Developer tools can toggle or inspect log level.

---

# 9. RewardsFeature

Create:

```text
sources/behaviors/scripts.ts/features/RewardsFeature.ts
```

The rewards feature is a shared service used by:

```text
Quests
Weekly quests
World events
Achievements
Developer tools
Future systems
```

## 9.1 Required reward model

Rewards must support at minimum:

```text
item rewards
experience rewards
command rewards
custom rewards
```

## 9.2 Pending reward claims

All completion rewards become pending claims. The Guidebook displays and claims them.

Unify reward claims if possible. If current APIs have separate pending reward claim stores for quests, achievements, and world events, either:

1. implement a common `PendingRewardClaim` service and migrate feature-specific claims into it, or
2. provide a guidebook aggregation layer that treats all feature-specific pending claims consistently.

Preferred: common reward-claim service.

## 9.3 Inventory-space validation

Implement all-or-nothing item reward claiming.

Before granting any item reward:

1. Calculate whether the player's inventory can accept every item stack.
2. Account for stacking where possible.
3. If insufficient space, return a failure result with a user-facing message.
4. Do not mark the claim as claimed.
5. Do not grant partial rewards.

## 9.4 Guidebook integration

Guidebook must have a pending rewards screen that shows all pending rewards from:

```text
quests
weekly quests
world events
achievements
future systems
```

The player claims rewards from this menu.

---

# 10. QuestsFeature

Create:

```text
sources/behaviors/scripts.ts/features/QuestsFeature.ts
```

This feature should wrap and initialize the quest system currently in:

```text
sources/behaviors/scripts.ts/features/Quests.ts
```

## 10.1 Required quest content

Codex must create at least:

```text
100 daily quest definitions
50 weekly quest definitions
```

Recommended content location:

```text
sources/behaviors/scripts.ts/content/quests/dailyQuestDefinitions.ts
sources/behaviors/scripts.ts/content/quests/weeklyQuestDefinitions.ts
```

or:

```text
sources/behaviors/scripts.ts/features/quests/content/dailyQuestDefinitions.ts
sources/behaviors/scripts.ts/features/quests/content/weeklyQuestDefinitions.ts
```

Use whichever structure best matches the codebase after cleanup.

## 10.2 Quest categories

The definitions should cover a broad spread:

```text
mining
woodcutting
farming
combat
building
crafting
smelting
gathering
exploration
nether
end
fishing
animal handling
villager/trading
portal usage
quest completion
world event participation
```

## 10.3 Quest assignment rules

Each player must have:

```text
5 active daily quests
7 active weekly quests
```

Assignments are per-player.

Quest definitions are not per-player, but assigned quest state is.

## 10.4 In-game-time rotation

Replace any real-world Date-based quest rotation.

Use in-game time.

Recommended implementation:

```ts
const MinecraftDayTicks = 24000;
const MinecraftWeekTicks = MinecraftDayTicks * 7;
const dailyPeriodKey = `day:${Math.floor(world.getAbsoluteTime() / MinecraftDayTicks)}`;
const weeklyPeriodKey = `week:${Math.floor(world.getAbsoluteTime() / MinecraftWeekTicks)}`;
```

If `world.getAbsoluteTime()` behaves differently in the target API version, use the best supported in-game tick/time alternative and document it.

## 10.5 Refresh behavior

On daily refresh:

1. Replace incomplete daily quests.
2. Preserve completed quest history.
3. Preserve unclaimed daily quest rewards.
4. Assign new daily quests until the player has exactly 5 active daily quests.

On weekly refresh:

1. Replace incomplete weekly quests.
2. Preserve completed quest history.
3. Preserve unclaimed weekly quest rewards.
4. Assign new weekly quests until the player has exactly 7 active weekly quests.

## 10.6 Quest progress events

Wire Minecraft events to quest events where feasible:

```text
block break
block place
entity kill
item use if useful
crafting if supported by the API
experience gain if supported by the API
player travel/distance via periodic tracking
enter dimension via periodic dimension tracking
```

If an event is not directly supported by Bedrock Script API, create a safe approximation or leave a documented future extension point.

## 10.7 Guidebook integration

Guidebook must show:

```text
daily quests
weekly quests
progress per subtask
completion state
pending rewards
refresh period text based on in-game period
```

---

# 11. WorldEventsFeature

Create:

```text
sources/behaviors/scripts.ts/features/WorldEventsFeature.ts
```

This feature should wrap and initialize the world event system currently in:

```text
sources/behaviors/scripts.ts/features/WorldEvents.ts
```

## 11.1 Required world event content

Codex must create at least:

```text
5 world event definitions
```

Recommended categories:

```text
village boss attack
structure horde
nether incursion
cave swarm
illager ambush
```

## 11.2 Trigger rules

World events affect all participants but are triggered by player activity.

Required rule:

```text
A player can trigger at most 1 world event per in-game hour.
```

Recommended implementation:

```ts
const MinecraftHourTicks = 1000;
```

Minecraft's day is 24,000 ticks. If the add-on defines an hour differently for gameplay purposes, document it and use a constant.

If two players enter separate valid trigger areas at the same time, evaluate cooldown per triggering player.

## 11.3 Event state

World event state must include:

```text
active events
participants
origin location
progress
spawned entity ids if used
completion/failure/expiration state
reward claims
history
```

## 11.4 Guidebook integration

Guidebook must show:

```text
active world events
recent completed/failed/expired world events
progress for active events
pending world event rewards
```

Do not show exact coordinates unless intentionally configured. Use vague location hints.

---

# 12. AchievementsFeature

Create:

```text
sources/behaviors/scripts.ts/features/AchievementsFeature.ts
```

This feature should wrap and initialize the achievement system currently in:

```text
sources/behaviors/scripts.ts/features/Achievements.ts
```

## 12.1 Achievement rules

Achievements are:

```text
per-player
lifetime/permanent
always visible
not random
not refreshed
separately earnable by every player
```

## 12.2 Required achievement content

Create a meaningful initial achievement set with categories such as:

```text
Mining
Combat
Building
Exploration
Portals
Quests
World Events
Survival
Guidebook
```

Include milestone-based achievements. At minimum include a block-breaking milestone achievement equivalent to:

```text
break 50 blocks
break 500 blocks
break 2,500 blocks
break 5,000 blocks
break 10,000 blocks
```

Also include other milestone chains, such as:

```text
kill hostile mobs
complete daily quests
complete weekly quests
claim rewards
use portals
travel distance
enter Nether
enter End
participate in world events
complete world events
```

## 12.3 Rewards

Achievement rewards must become pending Guidebook reward claims.

Do not auto-grant achievement rewards.

---

# 13. PortalsFeature

Create:

```text
sources/behaviors/scripts.ts/features/PortalsFeature.ts
```

This feature should wrap and initialize the portal system currently in:

```text
sources/behaviors/scripts.ts/features/Portals.ts
```

## 13.1 Required portal behavior

Use the intended portal behavior already present in the API/codebase. Ensure at minimum:

```text
portal persistence
per-player portal ownership if intended by current API
portal naming
portal validation before teleport
Guidebook portal list
Guidebook teleport-to-portal action
settings integration
developer tools
```

## 13.2 Guidebook integration

Implement the guidebook adapter:

```ts
PortalGuidebookService
```

It must provide:

```text
portal list for current player
portal availability/status text
teleport to selected portal
```

## 13.3 Settings

Settings should include at minimum:

```text
enable/disable portals
max portals per player
validate portal before teleport
```

---

# 14. GuidebookFeature

Create:

```text
sources/behaviors/scripts.ts/features/GuidebookFeature.ts
```

This is the main player UI feature.

## 14.1 Guidebook item

The Guidebook item must:

```text
be named Guidebook
use identifier simplexidev:guidebook unless a repository-specific namespace is chosen consistently
open the Guidebook UI when used
be non-craftable
be recoverable from recovery/dev tools if missing
not duplicate if already present
```

## 14.2 Guidebook menus

Required main menu buttons:

```text
Achievements
Quests
World Events
Portals
Rewards
Utilities
Documentation
Settings
```

Required settings submenu buttons:

```text
Gameplay Settings
Recover Starter Items
Developer Tools
Back
```

Required utility buttons:

```text
Teleport to Respawn
Teleport to Last Death Location
Documentation
Settings
Back
```

## 14.3 Rewards screen

Guidebook must show pending rewards from all systems and allow the player to claim them.

Reward claim behavior must follow the inventory-full rules in this plan.

## 14.4 Starter recovery

Recovery menu must support:

```text
Recover Guidebook
```

The Guidebook cannot be crafted. Remove or disable any old Guidebook/Book of Survival recipe.

## 14.5 Last death tracking

Record last death location for each player.

Guidebook utility menu should allow teleporting to last death location if enabled.

If no death location is stored, show a useful message.

## 14.6 Respawn teleport

Guidebook utility menu should allow teleporting to respawn if enabled.

If no valid respawn is available, show a useful message.

---

# 15. SettingsFeature

Create:

```text
sources/behaviors/scripts.ts/features/SettingsFeature.ts
```

Settings should be visible/editable from the Guidebook.

Required settings:

```text
quests.enabled
quests.progress_messages
world_events.enabled
world_events.player_cooldown_in_game_hours
achievements.enabled
portals.enabled
portals.max_per_player
guidebook.teleport_respawn_enabled
guidebook.teleport_last_death_enabled
guidebook.developer_tools_enabled
rewards.claim_messages
```

Settings should support:

```text
global settings
per-player settings
boolean values
number values
choice values if useful
validation
reset to default
```

---

# 16. DocumentationFeature

Create:

```text
sources/behaviors/scripts.ts/features/DocumentationFeature.ts
```

Create Guidebook documentation pages for:

```text
What is SimplexiDev's MAP?
Using the Guidebook
Achievements
Daily Quests
Weekly Quests
World Events
Portals
Rewards
Settings
Developer Tools
```

Documentation pages should be text-driven and easy to extend.

---

# 17. DeveloperToolsFeature

Create:

```text
sources/behaviors/scripts.ts/features/DeveloperToolsFeature.ts
```

Developer tools should be accessible only when enabled by setting.

Required developer tools:

```text
Recover Guidebook
Ensure player quests
Force refresh daily quests
Force refresh weekly quests
Create test pending reward
Show pending reward count
Clear current player's pending rewards with confirmation
Show achievement state summary
Grant test achievement progress
Trigger test world event
List active world events
Record current location as fake last death
Teleport to last death
List current player's portals
Validate current player's portals
Toggle debug/trace logging
```

If a tool depends on a feature that is not initialized, show a graceful message.

---

# 18. StarterItemsFeature

Create:

```text
sources/behaviors/scripts.ts/features/StarterItemsFeature.ts
```

This feature handles initial/recovery starter items.

For now, required starter item:

```text
Guidebook
```

On player initial spawn, ensure the player gets a Guidebook if intended by settings.

Recovery must be available from Guidebook settings.

Do not add a crafting recipe for the Guidebook.

---

# 19. TeleportFeature

Create:

```text
sources/behaviors/scripts.ts/features/TeleportFeature.ts
```

Responsibilities:

```text
respawn teleport provider
last death tracking
last death teleport
safe teleport validation if available
settings checks
Guidebook integration
```

It may be implemented as part of GuidebookFeature if the current codebase is simpler, but there must still be a clear service boundary.

---

# 20. Content definition generation

## 20.1 Daily quests

Create at least 100 daily quest definitions.

Requirements:

```text
Each has a unique id.
Each has title/description.
Each has one or more tasks.
Most may have one task.
Each has at least one reward.
Weights should vary.
Categories/tags should be diverse.
```

Suggested daily quest distribution:

```text
15 mining
10 woodcutting/gathering
10 farming/food
15 combat
10 building/placing blocks
10 crafting/smelting
10 exploration/travel
5 fishing
5 animal/villager interaction
5 portal/utility
5 miscellaneous
```

## 20.2 Weekly quests

Create at least 50 weekly quest definitions.

Requirements:

```text
Unique ids
Longer progress requirements than daily quests
Many may have multiple subtasks
At least one reward each
Diverse categories
```

Suggested weekly quest distribution:

```text
10 mining
10 combat
5 building
5 farming
5 exploration
5 nether/end
5 quests/achievements/world-events meta
5 miscellaneous
```

## 20.3 World events

Create at least 5 world event definitions.

Each should include:

```text
trigger
scenario
objectives
rewards
max duration
radius
weight
tags
```

Suggested events:

```text
Village boss attack
Village horde defense
Abandoned structure ambush
Cave swarm
Nether incursion
```

## 20.4 Achievements

Create a meaningful base set of achievements.

At minimum:

```text
block breaking milestones: 50, 500, 2500, 5000, 10000
quest completion milestones
weekly quest completion milestones
reward claim milestones
portal use milestones
world event participation/completion milestones
combat milestones
mining milestones
exploration milestones
```

---

# 21. Minecraft event wiring

Wire events centrally through feature services, not random global code.

Required event sources where supported:

```text
world.afterEvents.itemUse                 Guidebook item opens menu
world.afterEvents.playerSpawn             initial spawn and state initialization
world.afterEvents.playerBreakBlock        quests/achievements progress
world.afterEvents.playerPlaceBlock        quests/achievements progress
world.afterEvents.entityDie               kill/death tracking progress
system.runInterval                        periodic travel, dimension, world event, rotation checks
```

If a desired action is not directly supported by the installed Bedrock API version, implement a documented approximation or create a TODO extension point.

---

# 22. Resource and behavior pack cleanup

## 22.1 Manifest names

Update pack names/descriptions away from Survival Aid.

Behavior pack target:

```text
SimplexiDev's MAP Behavior Pack
Behavior Pack for SimplexiDev's Massive Add-On Pack.
```

Resource pack target:

```text
SimplexiDev's MAP Resource Pack
Resource Pack for SimplexiDev's Massive Add-On Pack.
```

## 22.2 Guidebook JSON

Create or update item JSON for:

```text
simplexidev:guidebook
```

Ensure it has a custom component that opens the Guidebook if using custom item components, or ensure the item use event checks this item id.

## 22.3 Remove craftability

Remove, rename, or disable:

```text
sources/behaviors/recipes/book_of_survival.json
```

The Guidebook is not craftable.

## 22.4 Language files

Update language files under both behavior and resource packs as needed.

At minimum:

```text
item.simplexidev:guidebook.name=Guidebook
```

Remove or leave legacy Survival Aid keys only if they are needed for compatibility. Do not use them for new content.

## 22.5 Asset placeholder text files

When JSON references new images, add `.txt` placeholders and do not generate binary assets.

---

# 23. Build tooling cleanup

## 23.1 Fix TypeScript compile inputs

Update:

```text
sources/tsconfig.json
```

Expected:

```json
"rootDir": "behaviors/scripts.ts",
"outDir": "behaviors/scripts",
"include": ["behaviors/scripts.ts/**/*.ts"]
```

Consider adding a modern lib if needed because current code uses APIs such as `replaceAll`:

```json
"lib": ["ES2021"]
```

Only add libraries compatible with the Bedrock scripting environment.

## 23.2 Fix lint paths

Update package scripts from incorrect `scripts` path to the actual source path.

Recommended:

```json
"lint": "eslint behaviors/scripts.ts",
"lint:fix": "eslint behaviors/scripts.ts --fix"
```

## 23.3 Verify manifest script entry

Behavior manifest uses:

```text
scripts/main.js
```

Ensure TypeScript build outputs:

```text
sources/behaviors/scripts/main.js
```

## 23.4 Align Minecraft dependency versions

Check package dependency and manifest dependency for `@minecraft/server`.

Currently package says `^2.7.0`, manifest says `2.6.0`.

Pick the correct target version and align both.

---

# 24. Acceptance criteria

Codex is not finished until all of these are true.

## 24.1 Compile/build

From `sources/`:

```bash
npm run typecheck
npm run build
```

must pass.

If lint is configured:

```bash
npm run lint
```

should pass or be documented if external plugin resolution prevents it.

## 24.2 Entry point

The behavior pack manifest script entry points to a generated file that exists after build:

```text
sources/behaviors/scripts/main.js
```

## 24.3 Feature initialization

`main.ts` creates `ServiceHost`.

`ServiceHost` initializes all required features.

Every required feature has a concrete `*Feature` class:

```text
RewardsFeature
SettingsFeature
DocumentationFeature
DeveloperToolsFeature
AchievementsFeature
QuestsFeature
WorldEventsFeature
PortalsFeature
TeleportFeature
StarterItemsFeature
GuidebookFeature
```

## 24.4 Guidebook

The Guidebook:

```text
exists as an item
is named Guidebook
is not craftable
opens the main menu when used
has Achievements menu
has Quests menu
has World Events menu
has Portals menu
has Rewards menu
has Utilities menu
has Documentation menu
has Settings menu
has Developer Tools menu when enabled
```

## 24.5 Rewards

Rewards:

```text
are pending claims until claimed through Guidebook
are preserved through quest refresh
fail safely if inventory space is insufficient
are not partially granted
are marked claimed only after successful grant
```

## 24.6 Quests

Quests:

```text
100+ daily definitions exist
50+ weekly definitions exist
5 daily quests are active per player
7 weekly quests are active per player
rotation uses in-game time
unclaimed rewards survive rotation
pending rewards do not affect active quest count
```

## 24.7 World events

World events:

```text
5+ definitions exist
active events can be stored
progress can be tracked
completion/failure/expiration can be represented
pending rewards are claimable through Guidebook
per-player trigger cooldown is enforced
```

## 24.8 Achievements

Achievements:

```text
are per-player
are lifetime/permanent
are always visible
are not randomized
have milestone progress
include block breaking milestones 50/500/2500/5000/10000
rewards are Guidebook pending claims
```

## 24.9 Portals

Portals:

```text
initialize as a feature
persist player portal state
show in Guidebook
can be selected for teleport from Guidebook
validate before teleport
respect settings
```

## 24.10 Asset placeholders

No new binary image assets are generated.

Every missing required asset has a `.txt` placeholder explaining what the user must create manually.

---

# 25. Recommended Codex execution order

Codex should work in this order:

1. Fix `tsconfig.json`, package scripts, and missing `main.ts`.
2. Fix core imports and naming consistency without removing or collapsing core APIs.
3. Finish `SDServiceProvider` / core service provider.
4. Repair and complete the existing `Feature`, `FeatureContext`, and `FeatureRegistry` APIs.
5. Repair `ServiceHost.ts` into a complete feature host without deleting established core APIs.
6. Create required `*Feature` classes.
7. Make the project compile before adding large content.
8. Finish RewardsFeature and Guidebook reward claiming.
9. Finish SettingsFeature.
10. Finish DocumentationFeature.
11. Finish DeveloperToolsFeature.
12. Finish AchievementsFeature and content.
13. Finish QuestsFeature and content.
14. Finish WorldEventsFeature and content.
15. Finish PortalsFeature integration.
16. Finish TeleportFeature and StarterItemsFeature.
17. Migrate Guidebook item JSON and remove craftability.
18. Clean Survival Aid metadata/identifiers.
19. Add `.txt` placeholders for missing assets.
20. Run typecheck/build/lint.
21. Perform final cleanup and update README if useful.

---

# 27. Implementation defaults for uncertain Bedrock API details

This section gives Codex safe implementation paths when Bedrock Script API behavior differs by installed version.

## 27.1 World absolute time

Preferred:

```ts
world.getAbsoluteTime()
```

Fallbacks, in order:

1. Use the available world absolute/game time API if renamed.
2. Use a persisted world tick counter incremented by `system.runInterval`.
3. Use world day/time only if absolute time is impossible, and document the limitation.

Do not use JavaScript `Date` for daily/weekly quest rotation.

## 27.2 Inventory capacity validation

Preferred:

1. Use the player's inventory container component.
2. Simulate adding every item reward into a copy of slot state.
3. Respect max stack sizes where exposed.
4. If max stack size is unavailable, use conservative defaults:
   - 64 for normal stackable items
   - 16 for known limited-stack items if identifiable
   - 1 for unstackable items if identifiable
5. If stack size cannot be determined, use a safe conservative capacity check and document it.

All item rewards must be granted atomically. If simulation fails, grant nothing.

## 27.3 Crafting and smelting quest progress

If direct crafting/smelting events are unavailable:

1. Track item acquisition deltas periodically where feasible.
2. Or implement these quest objectives as future extension points.
3. Prefer using quest categories that can be tracked reliably for the generated content.
4. Do not leave the quest system broken because some objective types are unavailable.

Generated daily/weekly quests should primarily use objective types that the current API can observe.

## 27.4 Entity kill detection

Preferred:

```ts
world.afterEvents.entityDie
```

Use damage source/player killer information if available.

If the exact killer cannot be identified, only progress generic world-level or proximity-based objectives where safe. Do not credit random players.

## 27.5 Player death location

Preferred:

1. Use player death/entity die events when a player entity dies.
2. Capture dimension and location immediately.
3. Persist a serializable location reference.

If death events do not expose enough information, use the best available entity event and document the limitation.

## 27.6 Player initial spawn

Preferred:

```ts
world.afterEvents.playerSpawn
```

Use the event's initial spawn flag if exposed.

If no initial flag exists, store a per-player `starterItemsGranted` state and grant once.

## 27.7 UI forms

Use the existing `FormService` abstraction.

If some form API call is unavailable, implement a graceful fallback message and keep feature APIs intact.

## 27.8 Custom item use

Preferred:

1. Use `world.afterEvents.itemUse`.
2. Check `event.itemStack.typeId === "simplexidev:guidebook"`.
3. Open the Guidebook for `event.source` if source is a player.

If custom item components are already implemented correctly in the repo, preserve them. Otherwise item-use event handling is sufficient.

## 27.9 Portal validation

If full frame detection is not practical in one pass:

1. Persist portal records with owner, name, dimension, origin, frame color/type, and created time.
2. Validate before teleport using nearby block checks.
3. Mark invalid portals unavailable instead of deleting immediately.
4. Provide developer tool validation.
5. Add TODOs for enhanced frame detection.

The Guidebook must still list portals and prevent teleporting to invalid portals.

## 27.10 World event spawning

If controlled entity spawning is supported, use it.

If spawning is limited or unsafe:

1. Implement event state/progress/reward logic first.
2. Use player proximity and tracked objectives.
3. Document spawn integration as a future extension point.
4. Keep Guidebook display and rewards working.

## 27.11 Commands

Command rewards are allowed but must be gated and sanitized.

Do not run user-controlled arbitrary command text.

Built-in command reward definitions are acceptable if they are static and controlled by content definitions.

---

# 28. Required generated content shape

Codex must not create 100 daily quests and 50 weekly quests as meaningless duplicates.

## 28.1 Quest definition interface

Use or adapt a strongly typed definition shape equivalent to:

```ts
export interface QuestDefinition {
  readonly id: string;
  readonly kind: QuestKind;
  readonly title: string;
  readonly description: string;
  readonly category: QuestCategory | string;
  readonly weight: number;
  readonly tasks: readonly QuestTaskDefinition[];
  readonly rewards: readonly RewardDefinition[];
  readonly tags?: readonly string[];
}
```

## 28.2 Quest task definition interface

Use or adapt:

```ts
export interface QuestTaskDefinition {
  readonly id: string;
  readonly type: QuestTaskType | string;
  readonly target?: string;
  readonly amount: number;
  readonly description: string;
}
```

## 28.3 Quest ids

Daily ids should follow a stable pattern:

```text
daily.mining.001
daily.combat.001
daily.exploration.001
```

Weekly ids should follow:

```text
weekly.mining.001
weekly.combat.001
weekly.meta.001
```

Do not use random ids in source definitions.

## 28.4 Reward ids

Reward ids should be stable:

```text
reward.daily.mining.001
reward.weekly.combat.001
reward.achievement.blocks.050
reward.world_event.village_boss
```

## 28.5 Achievement definition interface

Use or adapt:

```ts
export interface AchievementDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly milestones?: readonly number[];
  readonly hidden?: boolean;
  readonly rewards: readonly RewardDefinition[];
}
```

Achievements should be visible by default.

## 28.6 World event definition interface

Use or adapt:

```ts
export interface WorldEventDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly triggerType: string;
  readonly maxDurationTicks: number;
  readonly radius: number;
  readonly weight: number;
  readonly objectives: readonly WorldEventObjectiveDefinition[];
  readonly rewards: readonly RewardDefinition[];
  readonly tags?: readonly string[];
}
```

## 28.7 Documentation page shape

Use or adapt:

```ts
export interface DocumentationPage {
  readonly id: string;
  readonly title: string;
  readonly body: readonly string[];
  readonly sortOrder: number;
}
```

---

# 29. Required persistence keys

Use a consistent dynamic property key scheme.

Preferred:

```text
simplexidev:map:world:{feature}:{name}
simplexidev:map:player:{playerId}:{feature}:{name}
```

Required state categories:

```text
simplexidev:map:world:migrations:version
simplexidev:map:world:settings:global
simplexidev:map:world:events:active
simplexidev:map:player:{playerId}:settings:player
simplexidev:map:player:{playerId}:quests:daily
simplexidev:map:player:{playerId}:quests:weekly
simplexidev:map:player:{playerId}:rewards:pending
simplexidev:map:player:{playerId}:achievements:state
simplexidev:map:player:{playerId}:portals:records
simplexidev:map:player:{playerId}:teleport:last_death
simplexidev:map:player:{playerId}:starter_items:state
```

If dynamic property size limits are encountered:

1. Split state by feature and/or record id.
2. Keep indexes small.
3. Store compact DTOs.
4. Do not abandon persistence.

---

# 30. Required README update

If `README.md` exists, Codex should update it with:

```text
Project name
Build commands
Source/output paths
Guidebook behavior
No-binary-asset rule
Placeholder asset workflow
Basic testing/deploy notes
```

Do not overwrite useful existing README content. Append or revise carefully.

---

# 31. Final repository checklist

Before finishing, Codex must inspect the repository and confirm every item below.

## 31.1 Files that must exist

```text
sources/behaviors/scripts.ts/main.ts
sources/behaviors/scripts.ts/ServiceHost.ts
sources/behaviors/scripts.ts/features/RewardsFeature.ts
sources/behaviors/scripts.ts/features/SettingsFeature.ts
sources/behaviors/scripts.ts/features/DocumentationFeature.ts
sources/behaviors/scripts.ts/features/DeveloperToolsFeature.ts
sources/behaviors/scripts.ts/features/AchievementsFeature.ts
sources/behaviors/scripts.ts/features/QuestsFeature.ts
sources/behaviors/scripts.ts/features/WorldEventsFeature.ts
sources/behaviors/scripts.ts/features/PortalsFeature.ts
sources/behaviors/scripts.ts/features/TeleportFeature.ts
sources/behaviors/scripts.ts/features/StarterItemsFeature.ts
sources/behaviors/scripts.ts/features/GuidebookFeature.ts
```

If Codex chooses a subfolder structure, these exact top-level feature files may be thin wrappers/re-exports, but they must exist so the architecture is easy to verify.

## 31.2 Content files that must exist

Use these paths unless the repository structure strongly favors another location:

```text
sources/behaviors/scripts.ts/content/quests/dailyQuestDefinitions.ts
sources/behaviors/scripts.ts/content/quests/weeklyQuestDefinitions.ts
sources/behaviors/scripts.ts/content/worldEvents/worldEventDefinitions.ts
sources/behaviors/scripts.ts/content/achievements/achievementDefinitions.ts
sources/behaviors/scripts.ts/content/documentation/documentationPages.ts
```

## 31.3 JSON files to verify

Codex must verify or create/update equivalents for:

```text
sources/behaviors/manifest.json
sources/resources/manifest.json
sources/behaviors/items/guidebook.json
sources/resources/item_texture.json
sources/resources/texts/en_US.lang
sources/behaviors/texts/en_US.lang
```

If exact paths differ, update the actual repository files.

## 31.4 Files to remove/disable if present

```text
sources/behaviors/recipes/book_of_survival.json
```

Preferred action: delete if safe.

Fallback action: rename to `.disabled` or remove its recipe behavior so the Guidebook is not craftable.

## 31.5 Placeholders to create if missing

At minimum, if no real Guidebook texture exists:

```text
sources/resources/textures/items/guidebook.png.txt
```

If other JSON references missing textures, create corresponding `.txt` placeholders.

---

# 32. Milestone-by-milestone done gates



## 32.T TypeScript preservation gate

Passes when:

- gameplay source remains in `sources/behaviors/scripts.ts/`
- no `.ts` source file was replaced by handwritten `.js`
- generated JavaScript, if present, exists only under the compiled output folder
- required content definitions are TypeScript modules unless repository convention requires otherwise
- public interfaces/classes/enums/types are preserved or compatibility aliases exist
- TypeScript compilation is attempted after repairs

This gate must pass before Codex proceeds to final completion.


## 32.0 API preservation gate

Passes when:

- existing `core/` API files are still present unless individually justified
- existing feature API files are still present unless individually justified
- `ServiceHost` wires existing APIs instead of replacing them
- `*Feature` classes act as glue/initializers around domain APIs
- public exports remain available through original files or compatibility re-exports
- no established API was replaced by a tiny generic placeholder

This gate must pass before Codex proceeds to large content generation.



Codex must not move to the next milestone unless the current gate passes or the failure is documented and non-blocking.

## 32.1 Infrastructure gate

Passes when:

- `sources/tsconfig.json` includes the real source folder
- package scripts point to real folders
- manifest entry matches TypeScript output
- `main.ts` exists
- `npm run typecheck` or `npm run build` gets past missing-entry errors

## 32.2 Core gate

Passes when:

- core exports compile
- `SDResult` / `SDError` naming is consistent
- service provider compiles
- feature context compiles
- logger compiles
- JSON/dynamic property store compiles

## 32.3 Feature host gate

Passes when:

- `ServiceHost` compiles
- required feature classes compile
- features initialize in order
- each feature receives a context/logger
- missing optional APIs fail gracefully

## 32.4 Rewards gate

Passes when:

- pending reward DTO exists
- reward store persists claims
- Guidebook can list pending claims
- inventory-full simulation prevents partial grant
- successful grant marks claim claimed

## 32.5 Guidebook gate

Passes when:

- Guidebook item id exists
- item use opens menu
- main menu has all required buttons
- recovery flow exists
- utility flow exists
- settings/docs/rewards screens exist

## 32.6 Content gate

Passes when:

- daily quest definitions count >= 100
- weekly quest definitions count >= 50
- world event definitions count >= 5
- achievement definitions include required milestones
- all generated ids are unique

## 32.7 Integration gate

Passes when:

- quests create pending rewards
- achievements create pending rewards
- world events create pending rewards
- portals show in Guidebook
- teleport utilities call TeleportFeature
- settings influence features

## 32.8 Final gate

Passes when:

- install/build/typecheck/lint status is documented
- no new binary assets were generated
- placeholder list is documented
- Survival Aid active branding is replaced where safe
- README is updated if present
- final summary includes content counts

---

# 33. Codex repair strategy for compile errors

If TypeScript compile fails, fix errors in this order:

1. Missing imports/exports.
2. Wrong source paths.
3. Inconsistent naming.
4. Type-only import issues.
5. Bedrock API type mismatches.
6. DTO serialization mismatches.
7. Feature context contract mismatches.
8. Actual logic errors.

Do not paper over compile errors with `any` unless the Bedrock API type is unavailable and a narrow adapter makes `any` the safest local workaround.

When `any` is used, keep it local and add a short comment explaining why.

---

# 34. Codex repair strategy for ESLint/Prettier errors

If lint fails:

1. Run formatter if configured.
2. Fix unused imports/variables.
3. Fix explicit type violations.
4. Avoid broad disable comments.
5. Use narrow disable comments only when the rule conflicts with Bedrock API requirements.

Do not change unrelated files solely to satisfy style unless they are part of the active build/lint path.

---

# 35. Codex repair strategy for manifest/resource issues

If Minecraft JSON validation fails or obvious JSON references are broken:

1. Fix identifiers.
2. Fix format versions only when needed.
3. Fix item texture references.
4. Fix language keys.
5. Fix manifest module/dependency versions.
6. Add placeholders for missing textures.
7. Do not generate binary assets.

---

# 36. Explicit non-goals

Do not implement these unless already present and trivial to preserve:

- separate add-ons per feature
- custom binary art generation
- custom entity models
- online services
- external databases
- web dashboards
- paid/economy systems
- cross-world global player identity
- real-world calendar quest resets
- automatic upload/deployment to a server
- encryption/obfuscation

---

# 37. Final Codex self-audit

Before final response, Codex must answer internally and then summarize externally:

```text
Did I read AGENTS.md?
Did I use PLANS.md as active plan?
Did I preserve monolithic pack structure?
Did I avoid binary assets?
Did I create placeholders for missing art?
Did I create main.ts?
Did I replace/fix ServiceHost?
Did I create all required Feature classes?
Did I make rewards Guidebook-claimable?
Did I prevent inventory-full partial grants?
Did I preserve unclaimed rewards through quest rotation?
Did I use in-game time for quest periods?
Did I generate at least 100 daily quests?
Did I generate at least 50 weekly quests?
Did I generate at least 5 world events?
Did I include required achievement milestones?
Did I migrate active branding to SimplexiDev's MAP?
Did I preserve TypeScript source under sources/behaviors/scripts.ts?
Did I avoid replacing TypeScript with handwritten JavaScript?
Did I run validation?
Did I document anything that could not be validated?
```

If any answer is no, Codex must either fix it or clearly mark the project incomplete.


---

# 26. Final instruction to Codex

Implement the project to completion according to this plan. Do not stop after planning. Prefer compiling, working code that preserves the existing API architecture over speculative rewrites or simplifications. Preserve the user's existing architecture and public API contracts by default, but fix broken imports, missing entry points, inconsistent naming, and Survival Aid leftovers. Do not generate binary assets. Use placeholder `.txt` files for missing art. Ensure the final add-on is clearly branded as **SimplexiDev's MAP** and that all player-facing rewards are claimed through the **Guidebook**. If a normal implementation detail is ambiguous, use the defaults in this file, document the assumption, and continue.


---

# 38. If a prior Codex run deleted or simplified APIs

If Codex starts from a branch where a previous Codex run already deleted, collapsed, or simplified the user's `core/` or feature APIs, Codex must attempt recovery.

Recovery order:

1. Inspect git history if available.
2. Restore deleted API files from the previous commit if available.
3. If git history is unavailable, reconstruct the public API surfaces from references, imports, comments, and remaining files.
4. Keep simplified code only as an internal implementation if it can sit behind the restored APIs.
5. Do not continue building content on top of the simplified replacement until the API preservation gate passes.

Codex should use commands like these when available:

```bash
git status
git diff
git log --oneline -- sources/behaviors/scripts.ts/core sources/behaviors/scripts.ts/features
git checkout HEAD~1 -- sources/behaviors/scripts.ts/core
git checkout HEAD~1 -- sources/behaviors/scripts.ts/features
```

Only use checkout/restore commands when they will not discard intentional user manual edits. If uncertain, inspect diffs first and prefer manual restoration.



---

# 39. If a prior Codex run converted TypeScript to JavaScript

If Codex starts from a branch where a prior run deleted `.ts` files or replaced gameplay source with plain `.js`, Codex must restore TypeScript source before continuing.

Recovery order:

1. Inspect `git status` and `git diff`.
2. Inspect history for deleted `.ts` files.
3. Restore deleted `.ts` files from the last good commit where possible.
4. Move any useful logic from handwritten `.js` back into `.ts`.
5. Delete or regenerate handwritten output `.js` only after TypeScript source is restored.
6. Run the TypeScript build.
7. Do not proceed to feature/content implementation until the TypeScript preservation gate passes.

Useful commands when safe:

```bash
git status
git diff -- sources/behaviors/scripts.ts sources/behaviors/scripts
git log --oneline -- sources/behaviors/scripts.ts
git checkout HEAD~1 -- sources/behaviors/scripts.ts
npm run build
```

Do not discard intentional manual user edits. If uncertain, inspect diffs first and port manual logic back into TypeScript.

