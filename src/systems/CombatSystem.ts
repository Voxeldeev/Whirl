// src/systems/CombatSystem.ts
import { Player } from '../entities/Player';
import { Boomerang } from '../entities/Boomerang';
import { BoomerangState, PlayerState } from '../core/interfaces';
import { Explosion } from '../entities/Explosion';
import { ModifierId } from '../core/Modifiers';
import { TimerSystem } from './TimerSystem';

export class CombatSystem {
    private players: Player[] = [];
    private boomerangs: Boomerang[] = [];
    private explosions: Explosion[] = [];
    private timerSystem!: TimerSystem; 

    public setEntities(
        players: Player[], 
        boomerangs: Boomerang[], 
        explosions: Explosion[], 
        timerSystem: TimerSystem
    ): void {
        this.players = players;
        this.boomerangs = boomerangs;
        this.explosions = explosions;
        this.timerSystem = timerSystem;
    }

    public update(): void {
        for (const boomerang of this.boomerangs) {
            // Only process hits if the boomerang is dangerous
            if (boomerang.state !== BoomerangState.LIVE && 
                boomerang.state !== BoomerangState.RECALL && 
                boomerang.state !== BoomerangState.DECELERATING) {
                continue;
            }

            for (const player of this.players) {
                // You cannot hit yourself
                if (boomerang.ownerId === player.id) continue;
                
                // Dead players can't be hit
                if (player.state === PlayerState.DEAD) continue;

                this.checkHit(boomerang, player);
            }
            
            for (const explosion of this.explosions) {
                for (const player of this.players) {
                    // Cannot hit yourself
                    if (explosion.ownerId === player.id) continue;
                    
                    // Ignore dead players or players already hit by this specific blast
                    if (player.state === PlayerState.DEAD || explosion.hitIds.has(player.id)) continue;

                    this.checkExplosionHit(explosion, player);
                }
            }
        }
    }

    private checkHit(boomerang: Boomerang, player: Player): void {
        const dx = player.transform.x - boomerang.transform.x;
        const dy = player.transform.y - boomerang.transform.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Circle collision
        if (distance < player.radius + boomerang.radius) {
            
            // 1. I-Frames (Dash ignores damage and knockback entirely)
            if (player.state === PlayerState.DASHING) {
                return; 
            }

            // 2. Apply Damage
            player.hp -= boomerang.currentDamage;

            // 3. Apply Knockback to Player (Unless Blocking)
            if (player.state !== PlayerState.BLOCKING) {
                const speed = Math.sqrt(boomerang.velocity.vx ** 2 + boomerang.velocity.vy ** 2);
                
                if (speed > 0) {
                    const dirX = boomerang.velocity.vx / speed;
                    const dirY = boomerang.velocity.vy / speed;
                    
                    const knockbackForce = 400 + (boomerang.currentDamage * 20);
                    
                    player.velocity.vx = dirX * knockbackForce;
                    player.velocity.vy = dirY * knockbackForce;
                    
                    player.state = PlayerState.KNOCKED_BACK;
                    player.stateTimer = 0.4; 
                }
            }

            // 4. Death Check
            if (player.hp <= 0) {
                player.hp = 0;
                player.state = PlayerState.DEAD;
            }

            // 5. Weapon Resolution (The Bounce)
            // Calculate the collision normal pointing FROM the player TO the boomerang
            const nx = -dx / distance; 
            const ny = -dy / distance;

            // Calculate the dot product of the velocity and the normal
            const dotProduct = (boomerang.velocity.vx * nx) + (boomerang.velocity.vy * ny);

            // Only reflect if the boomerang is actually moving *into* the player
            if (dotProduct < 0) {
                const restitution = 1.0; // 1.0 = perfectly elastic, zero energy lost in the bounce
                boomerang.velocity.vx -= (1 + restitution) * dotProduct * nx;
                boomerang.velocity.vy -= (1 + restitution) * dotProduct * ny;
            }

            this.processDeathAndRevive(player);

            // 5. Weapon Resolution
            if (boomerang.state === BoomerangState.LIVE) {
                boomerang.state = BoomerangState.GHOST;
            }
        }
    }

    private checkExplosionHit(explosion: Explosion, player: Player): void {
        const dx = player.transform.x - explosion.transform.x;
        const dy = player.transform.y - explosion.transform.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + explosion.radius) {
            // Mark as hit so they don't take damage again next frame
            explosion.hitIds.add(player.id);

            if (player.state === PlayerState.DASHING) return; // I-Frames dodge the blast

            player.hp -= explosion.damage;

            if (player.state !== PlayerState.BLOCKING) {
                // Explosions push strictly outward from their center
                const dirX = dx / distance;
                const dirY = dy / distance;
                
                // Massive knockback force to reward the setup
                const knockbackForce = 1500; 
                
                player.velocity.vx = dirX * knockbackForce;
                player.velocity.vy = dirY * knockbackForce;
                
                player.state = PlayerState.KNOCKED_BACK;
                player.stateTimer = 0.5; // Longer stun
            }

            if (player.hp <= 0) {
                player.hp = 0;
                player.state = PlayerState.DEAD;
            }
        }
        this.processDeathAndRevive(player);
    }
    
    private processDeathAndRevive(player: Player): void {
        if (player.hp > 0) return;

        // Find all active boomerangs owned by this player that have REVIVE
        const availableRevives = this.boomerangs.filter(b => 
            b.ownerId === player.id && 
            b.hasModifier(ModifierId.REVIVE) &&
            !b.isDead && // Ensure it hasn't already been consumed
            b.state !== BoomerangState.HIDDEN &&
            b.state !== BoomerangState.CHARGING
        );

        if (availableRevives.length > 0) {
            // Keep the player alive with 1 HP initially to prevent the DEAD state
            player.hp = 1;
            
            availableRevives.forEach((boomerang, index) => {
                // Prevent this boomerang from hitting anything else while it waits to be sacrificed
                boomerang.isDead = true; 

                const delay = index * 0.1; // Staggered 0.1s apart
                
                this.timerSystem.setTimer(delay, () => {
                    // Heal the player (e.g., 25 HP per boomerang) and cap at 100
                    player.hp = Math.min(100, player.hp + 25);
                    console.log(`Player ${player.id} healed by Revive boomerang!`);
                    
                    // The boomerang is already marked isDead for garbage collection, 
                    // but we can spawn a small visual explosion here later if desired.
                });
            });
        } else {
            // True Death
            player.hp = 0;
            player.state = PlayerState.DEAD;
        }
    }
}