// src/systems/PlayerController.ts

import { Player } from '../entities/Player';
import { InputManager } from '../core/InputManager';
import { PlayerState } from '../core/interfaces';
import { TimerSystem } from './TimerSystem';
import { Boomerang } from '../entities/Boomerang';
import { ModifierId } from '../core/Modifiers';
import { BoomerangState } from '../core/interfaces';
import { Explosion } from '../entities/Explosion';

export class PlayerController {
    private readonly LERP_TIME = 0.075; 

    constructor(
        private player: Player, 
        private input: InputManager,
        private timerSystem: TimerSystem,
        private boomerangs: Boomerang[],
        private explosions: Explosion[]
    ) {}

    public update(dt: number): void {
        this.player.updateTimers(dt);
        
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

        this.player.targetVelocity.vx = vx * this.player.speed;
        this.player.targetVelocity.vy = vy * this.player.speed;

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
            
            this.triggerDemomaniac();
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

    private triggerDemomaniac(): void {
        const eligibleBoomerangs = this.boomerangs.filter(b => 
            b.ownerId === this.player.id && 
            b.hasModifier(ModifierId.DEMOMANIAC) &&
            (b.state === BoomerangState.LIVE || b.state === BoomerangState.GHOST || b.state === BoomerangState.DECELERATING)
        );

        eligibleBoomerangs.forEach((boomerang, index) => {
            const delay = index * 0.1; // 0.1s stagger
            
            this.timerSystem.setTimer(delay, () => {
                if (boomerang.state !== BoomerangState.HIDDEN) {
                    this.detonateBoomerang(boomerang);
                }
            });
        });
    }

    private detonateBoomerang(boomerang: Boomerang): void {
        const blast = new Explosion(
            `exp_${Date.now()}_${Math.random()}`, 
            this.player.id,
            boomerang.transform.x,
            boomerang.transform.y
        );
        
        this.explosions.push(blast);

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