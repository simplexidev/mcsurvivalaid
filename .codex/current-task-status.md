# Survival Aid — Definitive Code-Complete Checklist (Bedrock Edition)

> This file is the **source of truth** for implementation completion.
> Scope: **code complete** only (not playtested/polished/balanced unless noted).

Legend:
- [x] Implemented in codebase
- [~] Partially implemented (usable, but missing parts)
- [ ] Not implemented

---

## A. Project identity and invariants
- [x] Add-on identity uses name “Survival Aid”.
- [x] Creator/author identified as “SimplexiDev” in docs/manifests.
- [x] Namespace `simplexidev` used for custom content.
- [x] Custom block id fixed to `simplexidev:survival_chest`.
- [x] Custom item id fixed to `simplexidev:book_of_survival`.
- [x] Java Edition concepts intentionally avoided in implementation.

## B. Pack structure and manifests
### B1. Behavior/Resource manifests
- [x] Behavior manifest exists and parses.
- [x] Resource manifest exists and parses.
- [x] Behavior header UUID present and non-placeholder.
- [x] Resource header UUID present and non-placeholder.
- [x] Behavior module UUID(s) present and non-placeholder.
- [x] Resource module UUID(s) present and non-placeholder.
- [x] Behavior depends on Resource by RP header UUID.
- [x] Behavior declares script module entry `scripts/main.js`.
- [x] Behavior includes `@minecraft/server` dependency.
- [x] Behavior includes `@minecraft/server-ui` dependency.
- [x] Min engine versions set in both packs.
- [~] Exact module version compatibility confirmed on target Bedrock runtime build.

### B2. Manifest maintenance
- [x] Placeholder dependency token removed (`REPLACE_WITH_*`).
- [x] Version arrays present in headers/modules/dependencies where required.
- [ ] Final “release-time” UUID refresh pass (optional before public release).

## C. Resource placeholders and binary-free workflow
- [x] Binary-free placeholder policy documented.
- [x] Placeholder text markers for Survival Chest normal texture.
- [x] Placeholder text markers for Survival Chest ready texture.
- [x] Placeholder text markers for Book of Survival icon.
- [x] Placeholder marker for behavior pack icon.
- [x] Placeholder marker for resource pack icon.
- [ ] Real PNG replacements created and committed for release packaging.

## D. Block/item content definitions
### D1. Survival Chest block content
- [x] Block definition file exists under behavior pack.
- [x] Custom component wiring exists (`simplexidev:survival_chest_component`).
- [x] Reward-ready state/permutation exists (`simplexidev:has_reward`).
- [x] Material/texture references for normal and ready states exist.
- [~] Final visual behavior validated in-world with real textures.

### D2. Book of Survival item content
- [x] Item definition file exists under behavior pack.
- [x] Max stack size set to 1.
- [x] Custom component wiring exists (`simplexidev:book_of_survival_component`).
- [x] Icon key reference exists.

## E. Script bootstrap and service loop
- [x] Script entrypoint imports all core services.
- [x] World initialize registers custom block component.
- [x] World initialize registers custom item component.
- [x] World initialize ensures world state initialization.
- [x] Initial-spawn event triggers first-spawn flow.
- [x] Entity-death event triggers death handling.
- [x] Block quest tracker subscribed.
- [x] Combat quest tracker subscribed.
- [x] Tick loop runs reward service.
- [x] Tick loop runs travel tracker.
- [x] Tick loop updates HUD.
- [x] Tick loop syncs chest visual state.

## F. State model and persistence
### F1. Player state schema
- [x] `stateVersion` field present.
- [x] `hasSeenInitialPrompt` present.
- [x] `enabled` flag present.
- [x] Class track fields present (`currentClass`, `start`, claims, pending, prompts).
- [x] Death metadata field present (`lastDeathLocation`).
- [x] Chest fields present (`placed`, `location`).
- [x] Request list present.
- [x] Quest progress buckets present.
- [x] Claimed/pending quest reward lists present.
- [x] Settings object present.
- [x] Cooldowns object present.

### F2. Player state behavior
- [x] Default player state factory exists.
- [x] Dynamic-property read wrapper exists.
- [x] Corrupt JSON fallback handled.
- [x] Nested merge behavior for schema evolution present.
- [x] Dynamic-property write wrapper exists.
- [x] Update-helper wrapper exists.

### F3. World state schema/behavior
- [x] World state object has `stateVersion`.
- [x] World state object has `initialized` marker.
- [x] World state object has `createdAtTick`.
- [x] World state object has `notes` list.
- [x] Ensure-initialized helper exists and persists default.

## G. First-spawn onboarding flow
- [x] Prompt asks enable/disable.
- [x] Disable path persists `hasSeenInitialPrompt=true` and `enabled=false`.
- [x] Disable path does not grant starter items.
- [x] Enable path opens class selection form.
- [x] Class list includes Adventurer.
- [x] Class list includes Warrior.
- [x] Class list includes Miner.
- [x] Class list includes Mage.
- [x] Selected class persisted.
- [x] Class track start initialized at current world day.
- [x] Last death day initialized at current world day.
- [x] Starter chest issuance attempted.
- [x] Starter book issuance attempted.
- [x] Starter issuance idempotency enforced (no duplicate if already in inventory).
- [~] Canceled class selection retry UX (currently exits).

## H. Class system and progression
- [x] Class definitions exist with names/descriptions.
- [x] Class setter for initial class exists.
- [x] Class change action exists.
- [x] Completed class tracking list exists.
- [x] Next class-change prompt day tracked.
- [x] Class-change availability prompt exists.
- [x] “Keep current class” path exists.
- [x] “Select new class” form exists.
- [x] Excludes currently active class in switch list.
- [x] Excludes completed classes in switch list.
- [x] Prompt de-duping guard prevents overlap.
- [x] “Completed class” rule aligned to Tier-5 claimed semantics (day 20 claimed required).

## I. Reward schedule and claiming
### I1. Schedule
- [x] Class reward schedule table exists.
- [x] Milestones include day 3.
- [x] Milestones include day 7.
- [x] Milestones include day 10.
- [x] Milestones include day 15.
- [x] Milestones include day 20.
- [x] Recurring reward support exists after configured start day.
- [x] Next reward day computation helper exists.
- [x] Earned reward-day computation helper exists.

### I2. Reward queueing and claiming
- [x] Pending class reward queue populated from schedule.
- [x] Pending quest reward queue claim path exists.
- [x] Completed item request claim path exists.
- [x] Claimed class reward-day tracking exists.
- [x] Claimed quest token tracking exists.
- [x] “No rewards ready” player message exists.
- [x] “Claimed rewards” player message exists.
- [x] Inventory add-then-overflow-drop behavior exists.
- [x] Partial overflow handling fixed to drop leftover only.
- [~] Transaction-like atomicity for mixed reward bundles (best effort currently).

## J. Survival Chest runtime behavior
- [x] One chest per player check.
- [x] Duplicate placement rejection message.
- [x] Duplicate placement rollback attempt (set air).
- [x] Duplicate placement item refund best effort.
- [x] Chest location persisted with dimension and xyz.
- [x] Owner id persisted in chest location payload.
- [x] Interaction validates chest matches stored location.
- [x] Non-owned/non-registered chest claim blocked.
- [x] Interacting own chest triggers claim pipeline.
- [x] Interacting own chest updates texture state.
- [x] Destroying registered chest clears chest state.
- [x] Periodic chest visual sync helper exists.
- [~] Hard anti-cheat ownership (beyond location-owner best effort) not fully guaranteed.

## K. Book of Survival UI
- [x] Main menu opens from custom item use.
- [x] Button: Structure Locator.
- [x] Button: Item Requests.
- [x] Button: Teleport to Respawn.
- [x] Button: Teleport to Last Death.
- [x] Button: In-Game Documentation.
- [x] Button: Add-On Settings.

## L. HUD behavior
- [x] HUD can be toggled globally per player.
- [x] Days survived display toggle.
- [x] Days until next reward display toggle.
- [x] Reward-ready display toggle.
- [x] Reward-ready computed from full pending sources.
- [x] Update cadence ~once per second.
- [~] Additional anti-flicker debouncing not implemented.

## M. Item request system
- [x] Curated request item list includes coal.
- [x] Includes raw_iron.
- [x] Includes raw_copper.
- [x] Includes raw_gold.
- [x] Includes redstone.
- [x] Includes lapis_lazuli.
- [x] Includes oak_log/spruce_log/birch_log.
- [x] Includes cobblestone/sand/gravel/clay_ball.
- [x] Includes wheat_seeds/sugar_cane.
- [x] Request quantity input implemented (1..64).
- [x] Timer formula uses `ceil(qty*1.25)` seconds.
- [x] Active request list UI exists.
- [x] Request persistence stored in player state.
- [x] Ready requests become claimable via chest.
- [x] Claimed request pruning exists.
- [x] Active request cap implemented (5).
- [ ] Request cancellation/edit flow.

## N. Quest system
### N1. Infrastructure
- [x] Data-driven quest threshold table exists.
- [x] Quest reward table exists.
- [x] Generic progress increment helper exists.
- [x] Anti-duplicate pending/claimed token checks exist.

### N2. Travel metrics
- [x] Horizontal distance approximation.
- [x] Swim distance approximation.
- [x] Jump count approximation.
- [x] Fall distance approximation.
- [x] Boat-specific detection (best-effort via riding component).
- [x] Elytra glide detection (best-effort via `player.isGliding`).

### N3. Block metrics
- [x] Block break event subscribed.
- [x] Block place event subscribed.
- [x] Ground classification.
- [x] Ore/quartz classification.
- [x] Fauna classification.
- [x] Decorative fallback classification.
- [~] Extended fine-grained vanilla taxonomy coverage.

### N4. Combat metrics
- [x] Hostile kill counting.
- [x] Passive kill counting.
- [x] Damage dealt accumulation.
- [x] Damage taken accumulation.
- [ ] Crafted gear metric (if detectable).
- [ ] Smelted gear metric (if detectable).
- [ ] Broken gear metric (if detectable).

## O. Teleport systems
- [x] Teleport to Respawn implemented.
- [x] Teleport to Last Death implemented.
- [x] Last-death dimension stored.
- [x] Last-death coordinates stored.
- [x] Last-death day stored.
- [x] Last-death tick stored.
- [x] Respawn teleport setting gate.
- [x] Last-death teleport setting gate.
- [x] Per-teleport cooldown checks.
- [x] Cooldown remaining message.
- [x] Teleport success messaging.
- [x] Teleport failure messaging.
- [x] Console warning on teleport exception.
- [~] True safe-spot resolver (currently Y offset).

## P. Structure locator
- [x] Structure type list includes village.
- [x] Includes shipwreck.
- [x] Includes desert pyramid.
- [x] Includes jungle pyramid.
- [x] Includes pillager outpost.
- [x] Includes stronghold.
- [x] Includes ancient city.
- [x] Includes trail ruins.
- [x] Includes mineshaft.
- [x] Includes monument.
- [x] Includes fortress.
- [x] Includes bastion remnant.
- [x] Uses `locate structure` command.
- [x] Parses coordinates from status message when available.
- [x] Computes approximate direction (8-way compass).
- [x] Computes approximate distance.
- [x] Fallback messaging when locate unavailable.
- [ ] Persisted discovered-structure registry fallback.

## Q. Documentation and settings UX
### Q1. Documentation
- [x] Multi-topic docs menu exists.
- [x] Topic: what Survival Aid is.
- [x] Topic: Survival Chest.
- [x] Topic: Book of Survival.
- [x] Topic: classes and rewards.
- [x] Topic: quests.
- [x] Topic: item requests.
- [x] Topic: teleports.
- [x] Topic: settings.
- [x] Quest progress snapshot page exists.

### Q2. Settings
- [x] Toggle: HUD enabled.
- [x] Toggle: show days survived.
- [x] Toggle: show days until reward.
- [x] Toggle: show reward availability.
- [x] Toggle: chest texture changes.
- [x] Toggle: allow teleport to respawn.
- [x] Toggle: allow teleport to last death.
- [x] Slider: teleport cooldown seconds.
- [x] Action: recover starter items.

## R. Multiplayer and ownership safety
- [x] Per-player dynamic property keying.
- [x] Per-player class/reward/quest/request state separation.
- [x] Per-player teleport cooldown separation.
- [x] Chest location ownership check on interaction.
- [~] Comprehensive anti-grief controls for all edge cases.

## S. Validation and repository quality
- [x] `.editorconfig` present.
- [x] `.gitignore` present.
- [x] `LICENSE.md` present.
- [x] `CHANGELOG.md` present.
- [x] `CONTRIBUTING.md` present.
- [x] `SECURITY.md` present.
- [x] `CODE_OF_CONDUCT.md` present.
- [x] Bug issue template present.
- [x] Feature request template present.
- [x] PR template present.
- [x] CI validate workflow present.
- [x] CI validates required file presence.
- [x] CI parses all JSON files.
- [x] CI checks placeholder UUID token removal.

## T. README completeness
- [x] Bedrock-only warning included.
- [x] Beta status indicated.
- [x] Install instructions for development packs.
- [x] Placeholder/binary-free asset note.
- [x] Known limitations section.
- [x] Troubleshooting section.
- [x] Link to implementation checklist.
- [ ] Packaging instructions beyond dev-pack copy (optional enhancement).

## U. Manual test execution checklist (required before release)
- [ ] Clean-world first-spawn flow (enable).
- [ ] Clean-world first-spawn flow (disable).
- [ ] One-time prompt non-repeat behavior.
- [ ] Starter items idempotency check.
- [ ] Chest duplicate placement rollback/refund behavior.
- [ ] Chest claim behavior for each reward source.
- [ ] Chest ready texture transitions over time.
- [ ] Item request timer accuracy spot-check.
- [ ] Active request cap behavior.
- [ ] Quest progress increments for each implemented metric.
- [ ] Class reward unlock days 3/7/10/15/20.
- [ ] Recurring reward unlock behavior.
- [ ] Class-change prompt schedule and deferral.
- [ ] Respawn teleport in overworld.
- [ ] Last-death teleport in overworld.
- [ ] Last-death teleport in nether/end.
- [ ] Teleport cooldown messaging and enforcement.
- [ ] Structure locator each listed structure type.
- [ ] Multiplayer chest ownership check with 2+ players.
- [ ] Multiplayer reward isolation checks.

## V. Remaining code-complete items (must all be implemented)

### V1. Quest metric expansion (travel)
- [ ] Implement boat travel metric source hardening (dimension changes, dismount edge cases, speed spike guard tuning).
- [ ] Implement boat travel tier balancing pass for thresholds and rewards.
- [ ] Implement glide/elytra metric source hardening (launch/landing edge cases, teleport false positives).
- [ ] Implement glide/elytra tier balancing pass for thresholds and rewards.

### V2. Quest metric expansion (combat/equipment lifecycle)
- [ ] Implement crafted weapon/armor metric collection (exact supported event path, category mapping).
- [ ] Implement smelted weapon/armor metric collection (exact supported event path, category mapping).
- [ ] Implement broken weapon/armor metric collection (durability break detection path).
- [ ] Add 5-tier thresholds for each new combat/equipment metric.
- [ ] Add reward hooks and anti-duplicate token rules for each new metric.

### V3. Structure locator fallback registry
- [ ] Add persistent world-level discovered-structure registry schema.
- [ ] Add script API for registering discovered structures by type and dimension.
- [ ] Add locator fallback resolution to nearest known structure when `locate` command unavailable.
- [ ] Add user-facing messaging path for “no known structure yet” fallback state.
- [ ] Add registry cleanup/migration hooks in world state versioning.

### V4. Teleport safety hardening
- [ ] Implement safe-landing resolver that probes vertical space for non-suffocating target.
- [ ] Add fallback to nearby safe offsets when direct target is blocked.
- [ ] Add short post-teleport safety mitigation (effect and/or reposition retry) where API allows.
- [ ] Add failure path that preserves cooldown fairness and gives actionable user message.

### V5. Class progression correctness hardening
- [ ] Enforce class completion rule through explicit Tier-5 claim marker persisted independently from claimed-day list.
- [ ] Add migration for existing player states to new explicit completion marker.
- [ ] Block class switching for classes not meeting completion rule in all prompt flows.
- [ ] Add regression checks for death/reset interactions with completion markers.

### V6. Reward-claim transaction robustness
- [ ] Add per-reward grant result capture (inventory add/drop status).
- [ ] Only mark reward token/day claimed after confirmed grant/drop success.
- [ ] Add retry-safe handling for partial failures within multi-reward bundles.
- [ ] Add defensive logging for failed grant/drop operations.

### V7. Multiplayer ownership hardening
- [ ] Add optional chest ownership token persisted separately from location for stronger anti-theft verification.
- [ ] Prevent claims when owner token mismatch detected even at matching coordinates.
- [ ] Add behavior for stale chest records (missing block / replaced block / dimension mismatch).
- [ ] Add explicit user messaging for each ownership failure reason.

### V8. Checklist/process completion requirements
- [ ] As each V task is implemented, update this checklist in the same commit.
- [ ] Keep V section fully granular until all items are `[x]`.
- [ ] Do not convert V tasks to “documented non-support”; implement all requested items.
---

## Completion policy
- This PR is **code complete** when every item in sections **A–T and V** is either:
  - [x] implemented, or
  - intentionally left out with explicit “documented non-support” and marked [x] accordingly.
- Section **U** tracks manual verification and is required before release sign-off but does not block code-complete status.
