import { world, system, type Player } from "@minecraft/server";
import type { CombatMetricKey } from "../types/domain.js";
import { addQuestProgress } from "./questService.js";

const previousDurability = new Map<string, Record<string, number>>();

function addCombatProgress(player: Player, key: CombatMetricKey, amount: number): void {
  addQuestProgress(player, "combat", key, amount);
}

export function registerCombatQuestTracking(): void {
  world.afterEvents.entityDie.subscribe((event) => {
    const source = event.damageSource?.damagingEntity;
    if (!source || source.typeId !== "minecraft:player") return;
    const killed = event.deadEntity;
    const key = isLikelyHostile(killed.typeId) ? "hostile_mobs_killed" : "non_hostile_mobs_killed";
    if (source.typeId === "minecraft:player") addCombatProgress(source as Player, key, 1);
  });

  world.afterEvents.entityHurt.subscribe((event) => {
    const hurt = event.hurtEntity;
    const source = event.damageSource?.damagingEntity;
    const damage = event.damage ?? 0;
    if (hurt?.typeId === "minecraft:player") addCombatProgress(hurt as Player, "damage_taken", damage);
    if (source?.typeId === "minecraft:player") addCombatProgress(source as Player, "damage_dealt", damage);
  });

  // Best-effort crafting/smelting events, availability depends on Bedrock API/runtime.
  (world.afterEvents as any).playerCraftedItem?.subscribe((event) => {
    if (isGear(event.itemStack?.typeId)) addCombatProgress(event.player, "gear_crafted", 1);
  });

  (world.afterEvents as any).itemSmelted?.subscribe((event) => {
    if (isGear(event.itemStack?.typeId)) addCombatProgress(event.player, "gear_smelted", 1);
  });

  system.runInterval(() => {
    for (const player of world.getPlayers()) trackBrokenGearApprox(player);
  }, 20);
}

function trackBrokenGearApprox(player: Player): void {
  const inv = player.getComponent("minecraft:inventory")?.container;
  if (!inv) return;
  const prev = previousDurability.get(player.id) ?? {};
  const next: Record<string, number> = {};

  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (!item || !isGear(item.typeId)) continue;
    const key = `${i}:${item.typeId}`;
    const dur = item.getComponent("minecraft:durability")?.damage ?? 0;
    next[key] = dur;
  }

  // If tracked gear disappears from same slot key, count as break approximation.
  for (const key of Object.keys(prev)) {
    if (!(key in next)) addCombatProgress(player, "gear_broken", 1);
  }

  previousDurability.set(player.id, next);
}

function isGear(typeId: string | undefined): boolean {
  if (!typeId) return false;
  return typeId.includes("sword") || typeId.includes("axe") || typeId.includes("pickaxe") || typeId.includes("helmet") || typeId.includes("chestplate") || typeId.includes("leggings") || typeId.includes("boots") || typeId.includes("shield");
}

function isLikelyHostile(typeId: string): boolean {
  return ["minecraft:zombie","minecraft:skeleton","minecraft:creeper","minecraft:spider","minecraft:enderman","minecraft:witch","minecraft:pillager","minecraft:vindicator","minecraft:evocation_illager","minecraft:slime","minecraft:magma_cube","minecraft:blaze","minecraft:ghast","minecraft:guardian","minecraft:elder_guardian","minecraft:drowned","minecraft:husk","minecraft:stray","minecraft:warden"].includes(typeId);
}
