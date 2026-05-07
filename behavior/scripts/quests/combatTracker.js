import { world } from "@minecraft/server";
import { addQuestProgress } from "./questService.js";

export function registerCombatQuestTracking() {
  world.afterEvents.entityDie.subscribe((event) => {
    const source = event.damageSource?.damagingEntity;

    if (!source || source.typeId !== "minecraft:player") {
      return;
    }

    const killed = event.deadEntity;
    const key = isLikelyHostile(killed.typeId) ? "hostile_mobs_killed" : "non_hostile_mobs_killed";

    addQuestProgress(source, "combat", key, 1);
  });

  world.afterEvents.entityHurt.subscribe((event) => {
    const hurt = event.hurtEntity;
    const source = event.damageSource?.damagingEntity;
    const damage = event.damage ?? 0;

    if (hurt?.typeId === "minecraft:player") {
      addQuestProgress(hurt, "combat", "damage_taken", damage);
    }

    if (source?.typeId === "minecraft:player") {
      addQuestProgress(source, "combat", "damage_dealt", damage);
    }
  });
}

function isLikelyHostile(typeId) {
  return [
    "minecraft:zombie",
    "minecraft:skeleton",
    "minecraft:creeper",
    "minecraft:spider",
    "minecraft:enderman",
    "minecraft:witch",
    "minecraft:pillager",
    "minecraft:vindicator",
    "minecraft:evocation_illager",
    "minecraft:slime",
    "minecraft:magma_cube",
    "minecraft:blaze",
    "minecraft:ghast",
    "minecraft:guardian",
    "minecraft:elder_guardian",
    "minecraft:drowned",
    "minecraft:husk",
    "minecraft:stray",
    "minecraft:warden"
  ].includes(typeId);
}