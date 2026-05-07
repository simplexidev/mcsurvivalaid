# Survival Aid Implementation Checklist (Bedrock Beta)

Legend: [x] done, [~] partial, [ ] not started

## 1) Pack and manifest foundation
- [x] BP manifest exists and parses.
- [x] RP manifest exists and parses.
- [x] BP depends on RP header UUID.
- [x] Script entry point configured (`behavior/scripts/main.js`).
- [x] Script modules declared in BP dependencies.
- [~] Script module versions validated against your exact target client build in-world.
- [x] Placeholder UUID token removed.
- [x] Min engine version set in both manifests.
- [~] Final pre-release UUID rotation pass (recommended just before ship).

## 2) Binary-free placeholder asset workflow
- [x] Placeholder marker files for chest textures and book icon.
- [x] Placeholder marker files for pack icons.
- [x] CI checks for placeholder marker presence.
- [ ] Swap placeholders with real PNG assets before packaging.

## 3) Core custom content registration
- [x] Custom block behavior file for `simplexidev:survival_chest`.
- [x] Custom item behavior file for `simplexidev:book_of_survival`.
- [x] Resource atlases map intended texture identifiers.
- [~] In-game render verification of block/item textures (pending real PNGs).

## 4) First-spawn setup flow
- [x] One-time initial prompt shown on first spawn.
- [x] Disable choice persisted per player.
- [x] Enable flow opens class selection.
- [x] Selected class persisted and class-track initialized.
- [x] Starter items issued.
- [x] Starter issuance idempotent (no duplicate grant if already owned).
- [~] Retry UX when class-selection is canceled (currently returns silently).

## 5) Survival Chest behavior
- [x] One chest per player (enforced by state).
- [x] Interaction claims rewards.
- [x] Ownership/location check for claiming.
- [x] Duplicate placement rollback/refund best effort.
- [x] Destroy event clears registered chest location.
- [x] Reward-ready permutation switching.
- [x] Periodic visual sync tick.
- [~] Robust anti-abuse checks for race conditions in multiplayer edge cases.

## 6) Book of Survival main menu
- [x] Structure Locator button.
- [x] Item Requests button.
- [x] Teleport to Respawn button.
- [x] Teleport to Last Death button.
- [x] In-game Documentation button.
- [x] Add-On Settings button.

## 7) HUD and status
- [x] HUD action bar update loop.
- [x] Days survived display toggle.
- [x] Days-until-reward display toggle.
- [x] Reward-ready display toggle.
- [x] Reward ready considers class + quest + ready requests.
- [~] Anti-flicker smoothing/per-player rate limiter (basic 1s loop only).

## 8) Class track and class-change lifecycle
- [x] Class track start day stored.
- [x] Death resets class-track start and survival counter.
- [x] Pending rewards preserved across death.
- [x] Class reward days scheduled and queued.
- [x] Class-change prompt gating and deferral.
- [x] Completed class tracking on change.
- [x] Prompt de-dupe guard (`activePrompts`).
- [~] Completion rule correctness (currently completion on class switch; may need stricter Tier-5 check).
- [ ] Prevent class switch if class not truly completed per final design.

## 9) Reward claim pipeline
- [x] Class rewards claim queue.
- [x] Quest rewards claim queue.
- [x] Ready item requests claim queue.
- [x] Inventory-first then overflow drop.
- [x] Partial-stack overflow handling fixed.
- [~] Transactional rollback semantics for mid-claim failures (currently best-effort).

## 10) Item requests
- [x] Curated item list implemented.
- [x] Quantity slider (1..64).
- [x] Duration formula `ceil(qty * 1.25)` seconds.
- [x] Active request persistence in player state.
- [x] Active request listing UI.
- [x] Completed request cleanup/pruning.
- [~] Hard cap on simultaneous active requests per player.
- [ ] Request cancellation flow.

## 11) Quest tracking
### Travel
- [x] Horizontal movement approximation.
- [x] Swim movement approximation.
- [x] Jump approximation.
- [x] Fall-distance approximation.
- [ ] Boat-specific travel metric.
- [ ] Elytra/glide-specific metric.

### Blocks
- [x] Break tracking grouped by category.
- [x] Place tracking grouped by category.
- [x] Ground / ore / fauna / decorative categorization.
- [~] Category taxonomy tuning against full vanilla block set.

### Combat
- [x] Hostile kills.
- [x] Passive kills.
- [x] Damage dealt.
- [x] Damage taken.
- [ ] Crafted weapon/armor metric (if detectable).
- [ ] Smelted weapon/armor metric (if detectable).
- [ ] Broken weapon/armor metric (if detectable).

### Quest rewards
- [x] Data-driven thresholds.
- [x] Pending queueing with anti-duplicate token check.
- [x] Claimed token persistence.
- [~] Broader reward table balancing by tier/category.

## 12) Teleports
- [x] Respawn teleport action.
- [x] Last death teleport action.
- [x] Last death location/dimension/day/tick persistence.
- [x] Cooldown enforcement per action.
- [x] Settings toggle gates.
- [x] Error handling + player-facing messages.
- [~] Safe-landing logic (currently +Y offset only).

## 13) Structure locator
- [x] UI for target structure types.
- [x] `locate structure` command integration.
- [x] Coordinate parsing + direction + distance output.
- [x] Graceful failure message fallback.
- [ ] Persistent discovered-structure registry fallback if locate unavailable.

## 14) Documentation and settings UX
- [x] Multi-page documentation menu.
- [x] Quest snapshot view.
- [x] Settings toggles for HUD fields.
- [x] Chest texture toggle.
- [x] Teleport feature toggles.
- [x] Teleport cooldown slider.
- [x] Recover starter items action.

## 15) Persistence and migration
- [x] Player dynamic-property state wrapper.
- [x] Player default-state merge for schema evolution.
- [x] World dynamic-property state wrapper.
- [x] World initialization on startup.
- [~] Explicit migration step framework beyond default-merge (`stateVersion` currently informational).

## 16) Multiplayer safety
- [x] Per-player state keys.
- [x] Per-player cooldowns.
- [x] Chest ownership/location check.
- [~] Strong anti-theft guarantee beyond location binding.

## 17) Validation, docs, and repo hygiene
- [x] README baseline install notes.
- [x] LICENSE + governance docs.
- [x] Issue templates + PR template.
- [x] JSON + required-file CI validation workflow.
- [ ] Add Bedrock runtime smoke-test script/checklist automation.

## 18) Manual Bedrock playtest checklist (still required)
- [ ] First-join flow works on clean profile.
- [ ] Enable path class selection works for all 4 classes.
- [ ] Disable path never grants starter items.
- [ ] Chest placement/claim/duplicate destroy cycle tested.
- [ ] Reward-ready texture flips correctly in-world.
- [ ] Item request timer + claim flow tested at multiple quantities.
- [ ] Teleport cooldown and edge failures tested in all dimensions.
- [ ] Structure locator tested for each listed structure.
- [ ] Quest progress increments verified for each implemented metric.
- [ ] Multiplayer ownership checks tested with 2+ players.

## 19) Pre-release gates for your original plan
- [ ] Replace placeholder assets with real textures/icons.
- [ ] Finalize reward balance tables and quest thresholds.
- [ ] Implement remaining quest metrics (boat/glide/crafting-smelting-breaking).
- [ ] Implement structure fallback registry for worlds where locate is unavailable.
- [ ] Add final migration strategy and bump `stateVersion` policy docs.
- [ ] Perform final UUID rotation (optional) and lock release versions.
- [ ] Full in-game regression pass on target Bedrock version.
