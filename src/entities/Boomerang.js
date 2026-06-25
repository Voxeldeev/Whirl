// src/entities/Boomerang.ts
import { BoomerangState } from '../core/interfaces';
import { ModifierId } from '../core/Modifiers';
export class Boomerang {
    id;
    ownerId;
    transform;
    velocity;
    state = BoomerangState.HIDDEN;
    hitIds = new Set();
    // Core Stats
    baseDamage = 10;
    currentDamage = 10;
    speed = 500;
    maxRange = 500;
    radius = 15;
    chargeTimer = 0;
    distanceTraveled = 0;
    rotationAngle = 0;
    recallTimer = 0;
    // Modifiers
    modifiers;
    isTemporary = false;
    isDead = false;
    hasDivided = false;
    trailTimer = 0;
    isReviveAttacking = false;
    reviveTargetX = 0;
    reviveTargetY = 0;
    constructor(id, ownerId, loadout = []) {
        this.id = id;
        this.ownerId = ownerId;
        this.transform = { x: 0, y: 0 };
        this.velocity = { vx: 0, vy: 0 };
        this.modifiers = new Set(loadout);
        this.applyClassAStats();
    }
    hasModifier(id) {
        return this.modifiers.has(id);
    }
    applyClassAStats() {
        if (this.hasModifier(ModifierId.SPEED)) {
            this.speed *= 3.0;
            this.baseDamage *= 0.5;
        }
        else if (this.hasModifier(ModifierId.RANGE)) {
            this.maxRange *= 1.5;
            this.speed *= 1.25;
            this.baseDamage *= 0.8;
        }
        else if (this.hasModifier(ModifierId.POWER)) {
            this.baseDamage *= 2.0;
            this.maxRange *= 0.5;
        }
        this.currentDamage = this.baseDamage;
    }
    clone() {
        // Create a new boomerang with the same modifiers
        const copy = new Boomerang(this.id + '_clone_' + Math.random(), this.ownerId, Array.from(this.modifiers));
        copy.isTemporary = true;
        // Inherit current physical state
        copy.baseDamage = this.baseDamage;
        copy.currentDamage = this.currentDamage;
        copy.speed = this.speed;
        copy.maxRange = this.maxRange;
        copy.radius = this.radius;
        copy.chargeTimer = this.chargeTimer;
        return copy;
    }
    reset() {
        this.state = BoomerangState.HIDDEN;
        this.chargeTimer = 0;
        this.distanceTraveled = 0;
        this.recallTimer = 0;
        this.currentDamage = this.baseDamage;
        this.velocity = { vx: 0, vy: 0 };
        this.hasDivided = false;
        this.isReviveAttacking = false;
        this.hitIds.clear();
    }
}
