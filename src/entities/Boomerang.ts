// src/entities/Boomerang.ts

import { Transform, Velocity, BoomerangState } from '../core/interfaces';
import { ModifierId } from '../core/Modifiers';

export class Boomerang {
    public id: string;
    public ownerId: string;
    public transform: Transform;
    public velocity: Velocity;
    public state: BoomerangState = BoomerangState.HIDDEN;
    
    // Core Stats
    public baseDamage: number = 10;
    public currentDamage: number = 10;
    public speed: number = 500; 
    public maxRange: number = 500; 
    public radius: number = 15;

    public chargeTimer: number = 0;
    public distanceTraveled: number = 0;
    public rotationAngle: number = 0;
    public recallTimer: number = 0;

    // Modifiers
    public modifiers: Set<ModifierId>;
    
    public isTemporary: boolean = false;
    public isDead: boolean = false;
    public hasDivided: boolean = false;

    constructor(id: string, ownerId: string, loadout: ModifierId[] = []) {
        this.id = id;
        this.ownerId = ownerId;
        this.transform = { x: 0, y: 0 };
        this.velocity = { vx: 0, vy: 0 };
        
        this.modifiers = new Set(loadout);
        this.applyClassAStats();
    }

    public hasModifier(id: ModifierId): boolean {
        return this.modifiers.has(id);
    }

    private applyClassAStats(): void {
        if (this.hasModifier(ModifierId.SPEED)) {
            this.speed *= 3.0;
            this.baseDamage *= 0.5;
        } else if (this.hasModifier(ModifierId.RANGE)) {
            this.maxRange *= 1.5;
            this.speed *= 1.25;
            this.baseDamage *= 0.8;
        } else if (this.hasModifier(ModifierId.POWER)) {
            this.baseDamage *= 2.0;
            this.maxRange *= 0.5;
        }
        
        this.currentDamage = this.baseDamage;
    }

    public clone(): Boomerang {
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

    public reset(): void {
        this.state = BoomerangState.HIDDEN;
        this.chargeTimer = 0;
        this.distanceTraveled = 0;
        this.recallTimer = 0;
        this.currentDamage = this.baseDamage; 
        this.velocity = { vx: 0, vy: 0 };
        this.hasDivided = false; // Reset so it can divide again next throw
    }
}