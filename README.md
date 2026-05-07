# Survival Aid (Beta)
Bedrock Edition add-on by SimplexiDev. **Bedrock-only** (not Java mods).

## Status
Beta, feature-complete scaffold with placeholder art assets.

## Features
- Survival Chest (`simplexidev:survival_aid_chest`) reward terminal.
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

## Assets in this repository
- The resource pack already includes item/block texture source files:
  - `resource/textures/items/book_of_survival.png`
  - `resource/textures/blocks/survival_aid_chest_top.png`
  - `resource/textures/blocks/survival_aid_chest_side.png`
  - `resource/textures/blocks/survival_aid_chest_front.png`
- PBR companion maps (`*_mers.tga`) and `.texture_set.json` files are included for these textures.
- No additional "compiled texture" outputs are required in-repo for Bedrock development pack loading.

## Known limitations
- Some quest metrics and structure-locator precision are best-effort due to API/event limits.
- Full gameplay balancing for rewards is intentionally placeholder.
- Vanilla-like chest lid/open animations require a custom block geometry setup (with chest bones/states); this pack currently uses `geometry.full_block`.

## Troubleshooting
- Check malformed JSON in manifests/textures.
- Check Content Log for script exceptions.
- Verify BP dependency UUID points to RP header UUID.


## Implementation checklist
See `.codex/current-task-status.md` for a full, tracked feature checklist.


## Packaging (optional)
1. Zip Behavior Pack and Resource Pack separately (or create `.mcpack` files).
2. (Optional) Add custom geometry/animation assets if you move beyond `geometry.full_block`.
3. Ensure BP manifest dependency UUID matches RP header UUID.
4. Import both packs into Bedrock and enable in a test world.
