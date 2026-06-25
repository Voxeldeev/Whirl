// src/systems/PlayerController.ts

import { Player } from '../entities/Player';
import { InputManager } from '../core/InputManager';
import { PlayerState } from '../core/interfaces';
import { TimerSystem } from './TimerSystem';
import { Boomerang } from '../entities/Boomerang';
import { ModifierId } from '../core/Modifiers';
import { BoomerangState } from '../core/interfaces';
import { Explosion } from '../entities/Explosion';
import { Trail } from '../entities/Trail'; // NEW IMPORT

export class PlayerController {
    private readonly LERP_TIME = 0.075; 

    constructor(
        private player: Player, 
        private input: InputManager,
        private timerSystem: TimerSystem,
        private boomerangs: Boomerang[],
        private explosions: Explosion[],
        private allPlayers: Player[],
        private trails: Trail[] // NEW: Inject trails array
    ) {}

    public update(dt: number): void {
        this.player.updateTimers(dt);
        
        if (this.player.slowTimer !== undefined) {
            this.player.slowTimer -= dt;
        }
        
        if (this.player.state !== PlayerState.KNOCKED_BACK && this.player.state !== PlayerState.DEAD) {
            this.handleAiming();
        }

        if (this.player.state === PlayerState.DASHING || this.player.state === PlayerState.BLOCKING) {
            this.applyKinematics(dt);
            return; 
        }

        if (this.player.state === PlayerState.KNOCKED_BACK) {
            this.handleKnockbackFriction(dt);
            this.applyKinematics(dt);
            return;
        }

        if (this.player.state === PlayerState.DEAD) return;

        this.handleStandardMovement();
        this.handleActions();
        this.applyKinematics(dt);
    }

    private handleAiming(): void {
        const dx = this.input.mouseX - this.player.transform.x;
        const dy = this.input.mouseY - this.player.transform.y;
        this.player.rotation = Math.atan2(dy, dx);
    }

    private handleStandardMovement(): void {
        let vx = 0;
        let vy = 0;

        if (this.input.isKeyHeld('KeyW')) vy -= 1;
        if (this.input.isKeyHeld('KeyS')) vy += 1;
        if (this.input.isKeyHeld('KeyA')) vx -= 1;
        if (this.input.isKeyHeld('KeyD')) vx += 1;

        if (vx !== 0 && vy !== 0) {
            const length = Math.sqrt(vx * vx + vy * vy);
            vx /= length;
            vy /= length;
        }

        const effectiveSpeed = this.player.slowTimer > 0 ? this.player.speed * 0.4 : this.player.speed;

        this.player.targetVelocity.vx = vx * effectiveSpeed;
        this.player.targetVelocity.vy = vy * effectiveSpeed;

        if (vx !== 0 || vy !== 0) {
            this.player.state = PlayerState.MOVING;
        } else {
            this.player.state = PlayerState.IDLE;
        }
    }

    private handleActions(): void {
        if (this.input.isRightMouseDown && this.player.blockCooldown <= 0) {
            this.player.state = PlayerState.BLOCKING;
            this.player.stateTimer = 0.5; 
            this.player.blockCooldown = 1.0; 
            this.player.velocity = { vx: 0, vy: 0 };
            this.player.targetVelocity = { vx: 0, vy: 0 };
            
            this.triggerBlockModifiers();
            return;
        }

        if (this.input.wasKeyPressed('Space') && this.player.dashCooldown <= 0) {
            if (this.player.targetVelocity.vx !== 0 || this.player.targetVelocity.vy !== 0) {
                this.player.state = PlayerState.DASHING;
                this.player.stateTimer = 0.15; 
                this.player.dashCooldown = 0.5; 
                
                this.player.velocity.vx = this.player.targetVelocity.vx * 3;
                this.player.velocity.vy = this.player.targetVelocity.vy * 3;
            }
        }
    }

    private triggerBlockModifiers(): void {
        // B5 (DEMO)
        const eligibleBoomerangs = this.boomerangs.filter(b => 
            b.ownerId === this.player.id && 
            b.hasModifier(ModifierId.DEMO) &&
            (b.state === BoomerangState.LIVE || b.state === BoomerangState.GHOST || b.state === BoomerangState.DECELERATING)
        );

        eligibleBoomerangs.forEach((boomerang, index) => {
            const delay = index * 0.1; 
            
            this.timerSystem.setTimer(delay, () => {
                if (boomerang.state !== BoomerangState.HIDDEN) {
                    this.detonateBoomerang(boomerang);
                }
            });
        });

        // B6 (REVIVE - Ghost Homing Attack)
        const ghostBoomerangs = this.boomerangs.filter(b => 
            b.ownerId === this.player.id && 
            b.hasModifier(ModifierId.REVIVE) &&
            b.state === BoomerangState.GHOST &&
            !b.isReviveAttacking
        );

        if (ghostBoomerangs.length > 0) {
            const opponent = this.allPlayers.find(p => p.id !== this.player.id);
            if (opponent) {
                const targetX = opponent.transform.x;
                const targetY = opponent.transform.y;

                ghostBoomerangs.forEach((boomerang, index) => {
                    const delay = index * 0.1; 
                    
                    this.timerSystem.setTimer(delay, () => {
                        if (boomerang.state === BoomerangState.GHOST && !boomerang.isDead) {
                            boomerang.isReviveAttacking = true;
                            
                            // NEW: Clear memory so it can hit people again
                            boomerang.hitIds.clear(); 
                            
                            let dx = targetX - boomerang.transform.x;
                            let dy = targetY - boomerang.transform.y;
                            let dist = Math.sqrt(dx * dx + dy * dy);
                            
                            if (dist === 0) { dx = 1; dist = 1; }
                            
                            boomerang.reviveTargetX = dx / dist;
                            boomerang.reviveTargetY = dy / dist;
                            
                            boomerang.state = BoomerangState.LIVE; 
                        }
                    });
                });
            }
        }
    }

    private detonateBoomerang(boomerang: Boomerang): void {
        const blast = new Explosion(
            `exp_${Date.now()}_${Math.random()}`, 
            this.player.id,
            boomerang.transform.x,
            boomerang.transform.y
        );
        
        this.explosions.push(blast);

        // SYNERGY: Demo + Snail leaves a massive trail at the explosion site
        if (boomerang.hasModifier(ModifierId.SNAIL)) {
            this.trails.push(new Trail(
                `trail_blast_${Date.now()}_${Math.random()}`,
                this.player.id,
                boomerang.transform.x,
                boomerang.transform.y,
                150, // Massive radius
                5.0
            ));
        }

        if (boomerang.isTemporary) {
            boomerang.isDead = true;
        } else {
            boomerang.reset();
        }
    }

    private handleKnockbackFriction(dt: number): void {
        const friction = 2000; 
        const currentSpeed = Math.sqrt(this.player.velocity.vx ** 2 + this.player.velocity.vy ** 2);
        
        if (currentSpeed <= friction * dt) {
            this.player.velocity = { vx: 0, vy: 0 };
        } else {
            const dropRatio = (currentSpeed - friction * dt) / currentSpeed;
            this.player.velocity.vx *= dropRatio;
            this.player.velocity.vy *= dropRatio;
        }

        if (this.player.stateTimer <= 0) {
            this.player.state = PlayerState.IDLE;
            this.player.targetVelocity = { vx: 0, vy: 0 };
        }
    }

    private applyKinematics(dt: number): void {
        if (this.player.state === PlayerState.MOVING || this.player.state === PlayerState.IDLE) {
            const acceleration = this.player.speed / this.LERP_TIME;
            const maxDelta = acceleration * dt;

            this.player.velocity.vx = this.moveTowards(this.player.velocity.vx, this.player.targetVelocity.vx, maxDelta);
            this.player.velocity.vy = this.moveTowards(this.player.velocity.vy, this.player.targetVelocity.vy, maxDelta);
        }

        this.player.transform.x += this.player.velocity.vx * dt;
        this.player.transform.y += this.player.velocity.vy * dt;
    }

    private moveTowards(current: number, target: number, maxDelta: number): number {
        if (Math.abs(target - current) <= maxDelta) return target;
        return current + Math.sign(target - current) * maxDelta;
    }
}