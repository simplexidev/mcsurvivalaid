"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCombatQuestTracking = registerCombatQuestTracking;
const server_1 = require("@minecraft/server");
const questService_js_1 = require("./questService.js");
const previousDurability = new Map();
function registerCombatQuestTracking() {
    server_1.world.afterEvents.entityDie.subscribe((event) => {
        const source = event.damageSource?.damagingEntity;
        if (!source || source.typeId !== "minecraft:player")
            return;
        const killed = event.deadEntity;
        const key = isLikelyHostile(killed.typeId) ? "hostile_mobs_killed" : "non_hostile_mobs_killed";
        (0, questService_js_1.addQuestProgress)(source, "combat", key, 1);
    });
    server_1.world.afterEvents.entityHurt.subscribe((event) => {
        const hurt = event.hurtEntity;
        const source = event.damageSource?.damagingEntity;
        const damage = event.damage ?? 0;
        if (hurt?.typeId === "minecraft:player")
            (0, questService_js_1.addQuestProgress)(hurt, "combat", "damage_taken", damage);
        if (source?.typeId === "minecraft:player")
            (0, questService_js_1.addQuestProgress)(source, "combat", "damage_dealt", damage);
    });
    // Best-effort crafting/smelting events, availability depends on Bedrock API/runtime.
    server_1.world.afterEvents.playerCraftedItem?.subscribe((event) => {
        if (isGear(event.itemStack?.typeId))
            (0, questService_js_1.addQuestProgress)(event.player, "combat", "gear_crafted", 1);
    });
    server_1.world.afterEvents.itemSmelted?.subscribe((event) => {
        if (isGear(event.itemStack?.typeId))
            (0, questService_js_1.addQuestProgress)(event.player, "combat", "gear_smelted", 1);
    });
    server_1.system.runInterval(() => {
        for (const player of server_1.world.getPlayers())
            trackBrokenGearApprox(player);
    }, 20);
}
function trackBrokenGearApprox(player) {
    const inv = player.getComponent("minecraft:inventory")?.container;
    if (!inv)
        return;
    const prev = previousDurability.get(player.id) ?? {};
    const next = {};
    for (let i = 0; i < inv.size; i++) {
        const item = inv.getItem(i);
        if (!item || !isGear(item.typeId))
            continue;
        const key = `${i}:${item.typeId}`;
        const dur = item.getComponent("minecraft:durability")?.damage ?? 0;
        next[key] = dur;
    }
    // If tracked gear disappears from same slot key, count as break approximation.
    for (const key of Object.keys(prev)) {
        if (!(key in next))
            (0, questService_js_1.addQuestProgress)(player, "combat", "gear_broken", 1);
    }
    previousDurability.set(player.id, next);
}
function isGear(typeId) {
    if (!typeId)
        return false;
    return typeId.includes("sword") || typeId.includes("axe") || typeId.includes("pickaxe") || typeId.includes("helmet") || typeId.includes("chestplate") || typeId.includes("leggings") || typeId.includes("boots") || typeId.includes("shield");
}
function isLikelyHostile(typeId) {
    return ["minecraft:zombie", "minecraft:skeleton", "minecraft:creeper", "minecraft:spider", "minecraft:enderman", "minecraft:witch", "minecraft:pillager", "minecraft:vindicator", "minecraft:evocation_illager", "minecraft:slime", "minecraft:magma_cube", "minecraft:blaze", "minecraft:ghast", "minecraft:guardian", "minecraft:elder_guardian", "minecraft:drowned", "minecraft:husk", "minecraft:stray", "minecraft:warden"].includes(typeId);
}
