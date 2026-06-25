// src/systems/CombatSystem.ts
import { Player } from '../entities/Player';
import { Boomerang } from '../entities/Boomerang';
import { BoomerangState, PlayerState } from '../core/interfaces';
import { Explosion } from '../entities/Explosion';
import { TimerSystem } from './TimerSystem';
import { Trail } from '../entities/Trail';

export class CombatSystem {
    private players: Player[] = [];
    private boomerangs: Boomerang[] = [];
    private explosions: Explosion[] = [];
    private trails: Trail[] = [];
    private timerSystem!: TimerSystem; 

    public setEntities(
        players: Player[], 
        boomerangs: Boomerang[], 
        explosions: Explosion[], 
        trails: Trail[],
        timerSystem: TimerSystem
    ): void {
        this.players = players;
        this.boomerangs = boomerangs;
        this.explosions = explosions;
        this.trails = trails;
        this.timerSystem = timerSystem;
    }

    public update(): void {
        // 1. Process Snail Trails (B4)
        for (const trail of this.trails) {
            for (const player of this.players) {
                if (trail.ownerId === player.id) continue; 
                
                const dx = player.transform.x - trail.x;
                const dy = player.transform.y - trail.y;
                if (Math.sqrt(dx * dx + dy * dy) < player.radius + trail.radius) {
                    player.slowTimer = 0.1; 
                }
            }
        }

        // 2. Process Boomerangs
        for (const boomerang of this.boomerangs) {
            if (boomerang.state !== BoomerangState.LIVE && 
                boomerang.state !== BoomerangState.RECALL && 
                boomerang.state !== BoomerangState.DECELERATING) {
                continue;
            }

            for (const player of this.players) {
                if (boomerang.ownerId === player.id) continue;
                if (player.state === PlayerState.DEAD) continue;

                this.checkHit(boomerang, player);
            }
        }

        // 3. Process Explosions
        for (const explosion of this.explosions) {
            for (const player of this.players) {
                if (explosion.ownerId === player.id) continue;
                if (player.state === PlayerState.DEAD || explosion.hitIds.has(player.id)) continue;

                this.checkExplosionHit(explosion, player);
            }
        }
    }

    private checkHit(boomerang: Boomerang, player: Player): void {
        const dx = player.transform.x - boomerang.transform.x;
        const dy = player.transform.y - boomerang.transform.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Circle collision
        if (distance < player.radius + boomerang.radius) {
            
            // I-Frames
            if (player.state === PlayerState.DASHING) return; 

            // NEW: If it's a piercing attack and we already hit this player, ignore them completely
            if (boomerang.isReviveAttacking && boomerang.hitIds.has(player.id)) {
                return;
            }

            // Deal Damage
            player.hp -= boomerang.currentDamage;

            // NEW: Remember that we hit this player so they don't take damage next frame
            if (boomerang.isReviveAttacking) {
                boomerang.hitIds.add(player.id);
            }

            // B6 (REVIVE) ignores knockback completely
            if (player.state !== PlayerState.BLOCKING && !boomerang.isReviveAttacking) {
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

            if (player.hp <= 0) {
                player.hp = 0;
                player.state = PlayerState.DEAD;
            }

            // B6 (REVIVE) bypasses the bounce logic and state change to fly through the player
            if (!boomerang.isReviveAttacking) {
                const nx = -dx / distance; 
                const ny = -dy / distance;
                const dotProduct = (boomerang.velocity.vx * nx) + (boomerang.velocity.vy * ny);

                if (dotProduct < 0) {
                    const restitution = 1.0; 
                    boomerang.velocity.vx -= (1 + restitution) * dotProduct * nx;
                    boomerang.velocity.vy -= (1 + restitution) * dotProduct * ny;
                }

                if (boomerang.state === BoomerangState.LIVE) {
                    boomerang.state = BoomerangState.GHOST;
                }
            }
        }
    }

    private checkExplosionHit(explosion: Explosion, player: Player): void {
        const dx = player.transform.x - explosion.transform.x;
        const dy = player.transform.y - explosion.transform.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + explosion.radius) {
            explosion.hitIds.add(player.id);

            if (player.state === PlayerState.DASHING) return; 

            player.hp -= explosion.damage;

            if (player.state !== PlayerState.BLOCKING) {
                const dirX = dx / distance;
                const dirY = dy / distance;
                const knockbackForce = 1500; 
                
                player.velocity.vx = dirX * knockbackForce;
                player.velocity.vy = dirY * knockbackForce;
                
                player.state = PlayerState.KNOCKED_BACK;
                player.stateTimer = 0.5; 
            }

            if (player.hp <= 0) {
                player.hp = 0;
                player.state = PlayerState.DEAD;
            }
        }
    }
}