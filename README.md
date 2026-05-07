# Survival Aid (Beta)
Bedrock Edition add-on by SimplexiDev. **Bedrock-only** (not Java mods).

## Status
Beta, feature-complete scaffold with placeholder art assets.

## Features
- Survival Chest (`simplexidev:survival_chest`) reward terminal.
- Book of Survival (`simplexidev:book_of_survival`) UI hub.
- First-spawn enable + class select flow.
- Per-player dynamic-property state, class tracking, HUD, quests/rewards scaffolding.
- Teleport to respawn and last death helpers.
- Structure locator with command-first approach and fallback messaging.

## Requirements
- Minecraft Bedrock 1.26.20+ target.
- Script API modules in BP manifest: `@minecraft/server` `2.6.0`, `@minecraft/server-ui` `2.0.0`.
- Enable script/add-on related experiments if your build still gates APIs.

## Install (development packs)
1. Copy `behavior/` to `development_behavior_packs/SurvivalAid_BP`.
2. Copy `resource/` to `development_resource_packs/SurvivalAid_RP`.
3. Activate both packs on a test world.
4. Ensure Content Log is visible for debugging.

## Placeholder assets
- Binary PNG assets are intentionally omitted in this branch/PR workflow.
- Text placeholder markers are included:
  - `resource/textures/blocks/survival_chest.placeholder.txt`
  - `resource/textures/blocks/survival_chest_ready.placeholder.txt`
  - `resource/textures/items/book_of_survival.placeholder.txt`
- Replace these with real PNG files before in-game packaging.

## Known limitations
- Some quest metrics and structure-locator precision are best-effort due to API/event limits.
- Full gameplay balancing for rewards is intentionally placeholder.

## Troubleshooting
- Check malformed JSON in manifests/textures.
- Check Content Log for script exceptions.
- Verify BP dependency UUID points to RP header UUID.


## Implementation checklist
See `docs/IMPLEMENTATION_CHECKLIST.md` for a full, tracked feature checklist.
