// src/systems/BoomerangController.ts

import { Boomerang } from '../entities/Boomerang';
import { Player } from '../entities/Player';
import { InputManager } from '../core/InputManager';
import { BoomerangState, PlayerState } from '../core/interfaces';
import { ModifierId } from '../core/Modifiers';

export class BoomerangController {
    private readonly MAX_CHARGE_TIME = 3.0; 
    private readonly MAX_DAMAGE_MULTIPLIER = 3.0;

    constructor(
        private boomerang: Boomerang,
        private player: Player,
        private input: InputManager,
        private spawnCallback?: (b: Boomerang) => void // Dynamic Spawner for DIVIDE
    ) {}

    public update(dt: number): void {
        // 1. UNIVERSAL CATCH LOGIC
        const catchableStates = [
            BoomerangState.GHOST, 
            BoomerangState.RECALL, 
            BoomerangState.DECELERATING
        ];
        
        if (catchableStates.includes(this.boomerang.state)) {
            const dx = this.player.transform.x - this.boomerang.transform.x;
            const dy = this.player.transform.y - this.boomerang.transform.y;
            const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

            // If overlap occurs with owner
            if (distanceToPlayer < this.player.radius + this.boomerang.radius) {
                // Temporary clones die when caught. Main weapon resets to hand.
                if (this.boomerang.isTemporary) {
                    this.boomerang.isDead = true;
                } else {
                    this.boomerang.reset();
                }
                return; 
            }
        }

        // 2. DYNAMIC SPIN CALCULATION
        if (this.boomerang.state !== BoomerangState.HIDDEN && this.boomerang.state !== BoomerangState.CHARGING) {
            const currentSpeed = Math.sqrt(this.boomerang.velocity.vx ** 2 + this.boomerang.velocity.vy ** 2);
            const spinRate = 15 * (currentSpeed / this.boomerang.speed); 
            
            if (currentSpeed > 10) {
                this.boomerang.rotationAngle += spinRate * dt;
            }
        }

        // 3. STATE MACHINE
        switch (this.boomerang.state) {
            case BoomerangState.HIDDEN: this.handleHidden(); break;
            case BoomerangState.CHARGING: this.handleCharging(dt); break;
            case BoomerangState.LIVE: this.handleLive(dt); break;
            case BoomerangState.GHOST: this.handleGhost(dt); break;
            case BoomerangState.RECALL: this.handleRecall(dt); break;
            case BoomerangState.DECELERATING: this.handleDecelerating(dt); break;
        }
    }

    private enterCharging(): void {
        this.boomerang.state = BoomerangState.CHARGING;
        
        // Lock player movement
        this.player.velocity = { vx: 0, vy: 0 };
        this.player.targetVelocity = { vx: 0, vy: 0 };
        
        this.boomerang.transform.x = this.player.transform.x;
        this.boomerang.transform.y = this.player.transform.y;
        this.boomerang.chargeTimer = 0;
    }

    private handleHidden(): void {
        const isReady = this.input.wasLeftMousePressed && 
                       this.player.state !== PlayerState.DASHING && 
                       this.player.state !== PlayerState.BLOCKING;

        if (isReady) {
            // B2 (BULLET): Instant fire, no charging
            if (this.boomerang.hasModifier(ModifierId.BULLET)) {
                this.fireBullet();
            } else {
                this.enterCharging();
            }
        }
    }

    private fireBullet(): void {
        if (!this.spawnCallback) return;

        // Spawn a clone instantly, leaving the base boomerang in HIDDEN
        const bullet = this.boomerang.clone();
        bullet.state = BoomerangState.LIVE;
        bullet.currentDamage = bullet.baseDamage; 
        
        bullet.transform.x = this.player.transform.x;
        bullet.transform.y = this.player.transform.y;

        const throwSpeed = bullet.speed * 2.5;

        let dx = this.input.mouseX - bullet.transform.x;
        let dy = this.input.mouseY - bullet.transform.y;
        let length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) { dx = 1; dy = 0; length = 1; }

        const dirX = dx / length;
        const dirY = dy / length;

        bullet.velocity.vx = dirX * throwSpeed;
        bullet.velocity.vy = dirY * throwSpeed;

        const safeDistance = this.player.radius + bullet.radius + 1;
        bullet.transform.x += dirX * safeDistance;
        bullet.transform.y += dirY * safeDistance;

        // If the bullet ALSO has divide, the clone spawns its own clones!
        if (bullet.hasModifier(ModifierId.DIVIDE) && !bullet.hasDivided) {
            bullet.hasDivided = true; 
            this.spawnAngledClone(bullet, bullet.velocity.vx, bullet.velocity.vy, 20);
            this.spawnAngledClone(bullet, bullet.velocity.vx, bullet.velocity.vy, -20);
        }

        // Send the bullet to the engine
        this.spawnCallback(bullet);
    }

    private handleCharging(dt: number): void {
        this.boomerang.transform.x = this.player.transform.x;
        this.boomerang.transform.y = this.player.transform.y;

        this.boomerang.chargeTimer += dt;
        const chargePercent = Math.min(this.boomerang.chargeTimer / this.MAX_CHARGE_TIME, 1.0);
        
        const dmgMultiplier = 1.0 + (chargePercent * (this.MAX_DAMAGE_MULTIPLIER - 1.0));
        this.boomerang.currentDamage = this.boomerang.baseDamage * dmgMultiplier;

        // Release to throw
        if (!this.input.isLeftMouseDown) {
            this.boomerang.state = BoomerangState.LIVE;
            
            const speedMultiplier = 1.0 + chargePercent; 
            const throwSpeed = this.boomerang.speed * speedMultiplier;

            let dx = this.input.mouseX - this.boomerang.transform.x;
            let dy = this.input.mouseY - this.boomerang.transform.y;
            let length = Math.sqrt(dx * dx + dy * dy);
            
            if (length === 0) { dx = 1; dy = 0; length = 1; }

            const dirX = dx / length;
            const dirY = dy / length;

            this.boomerang.velocity.vx = dirX * throwSpeed;
            this.boomerang.velocity.vy = dirY * throwSpeed;

            // Spawn Offset to prevent instant self-catch
            const safeDistance = this.player.radius + this.boomerang.radius + 1;
            this.boomerang.transform.x += dirX * safeDistance;
            this.boomerang.transform.y += dirY * safeDistance;

            // B3 (DIVIDE): Spawn clones upon initial throw
            if (this.boomerang.hasModifier(ModifierId.DIVIDE) && !this.boomerang.hasDivided && this.spawnCallback) {
                this.boomerang.hasDivided = true; 

                // Pass `this.boomerang` as the parent
                this.spawnAngledClone(this.boomerang, this.boomerang.velocity.vx, this.boomerang.velocity.vy, 20);
                this.spawnAngledClone(this.boomerang, this.boomerang.velocity.vx, this.boomerang.velocity.vy, -20);
            }
        }
    }

    private spawnAngledClone(parent: Boomerang, vx: number, vy: number, angleDegrees: number): void {
        if (!this.spawnCallback) return;

        const radians = angleDegrees * (Math.PI / 180);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const clone = parent.clone();
        
        clone.transform = { x: parent.transform.x, y: parent.transform.y };
        clone.state = BoomerangState.LIVE;
        
        clone.velocity = {
            vx: vx * cos - vy * sin,
            vy: vx * sin + vy * cos
        };

        this.spawnCallback(clone);
    }

    private handleLive(dt: number): void {
        this.applyVelocity(dt);
        
        const currentSpeed = Math.sqrt(this.boomerang.velocity.vx ** 2 + this.boomerang.velocity.vy ** 2);
        this.boomerang.distanceTraveled += currentSpeed * dt;

        // Canvas Boundary Check
        const { x, y } = this.boomerang.transform;
        const r = this.boomerang.radius;
        if (x + r < 0 || x - r > 1280 || y + r < 0 || y - r > 720) {
            if (this.boomerang.isTemporary) {
                this.boomerang.isDead = true;
            } else {
                this.boomerang.reset();
            }
            return;
        }

        if (this.boomerang.distanceTraveled >= this.boomerang.maxRange) {
            this.boomerang.state = BoomerangState.GHOST;
        }
    }

    private handleGhost(dt: number): void {
        this.applyFriction(1500, dt);
        this.applyVelocity(dt);
        this.checkRecallInput();
    }

    private handleRecall(dt: number): void {
        // B2 (BULLET): Cannot be recalled
        if (this.boomerang.hasModifier(ModifierId.BULLET)) {
            this.boomerang.state = BoomerangState.GHOST;
            return;
        }

        if (!this.input.isLeftMouseDown) {
            this.boomerang.state = BoomerangState.DECELERATING;
            return;
        }

        this.boomerang.recallTimer += dt;

        // B1 (TELEKINESIS): Target the mouse instead of the player
        let targetX = this.player.transform.x;
        let targetY = this.player.transform.y;

        if (this.boomerang.hasModifier(ModifierId.TELEKINESIS)) {
            targetX = this.input.mouseX;
            targetY = this.input.mouseY;
        }

        const dx = targetX - this.boomerang.transform.x;
        const dy = targetY - this.boomerang.transform.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        if (distanceToTarget === 0) return;

        const dirX = dx / distanceToTarget;
        const dirY = dy / distanceToTarget;

        const baseSpeed = 400;
        const logMultiplier = 800;
        const timeScale = 4; 
        
        const currentSpeed = baseSpeed + logMultiplier * Math.log(1 + this.boomerang.recallTimer * timeScale);

        const targetVx = dirX * currentSpeed;
        const targetVy = dirY * currentSpeed;

        // Steering behavior to allow bounce momentum to arc
        const turnSpeed = 15; 
        this.boomerang.velocity.vx += (targetVx - this.boomerang.velocity.vx) * turnSpeed * dt;
        this.boomerang.velocity.vy += (targetVy - this.boomerang.velocity.vy) * turnSpeed * dt;

        this.applyVelocity(dt);
    }

    private handleDecelerating(dt: number): void {
        if (this.input.isLeftMouseDown && !this.boomerang.hasModifier(ModifierId.BULLET)) {
            this.boomerang.state = BoomerangState.RECALL;
            this.boomerang.recallTimer = 0; 
            return;
        }

        this.applyFriction(2000, dt);
        
        const currentSpeed = Math.sqrt(this.boomerang.velocity.vx ** 2 + this.boomerang.velocity.vy ** 2);
        if (currentSpeed === 0) {
            this.boomerang.state = BoomerangState.GHOST;
        } else {
            this.applyVelocity(dt);
        }
    }

    private checkRecallInput(): void {
        if (this.boomerang.hasModifier(ModifierId.BULLET)) return;

        if (this.input.isLeftMouseDown) {
            this.boomerang.state = BoomerangState.RECALL;
            this.boomerang.recallTimer = 0; 
        }
    }

    private applyFriction(frictionForce: number, dt: number): void {
        const currentSpeed = Math.sqrt(this.boomerang.velocity.vx ** 2 + this.boomerang.velocity.vy ** 2);
        
        if (currentSpeed <= frictionForce * dt) {
            this.boomerang.velocity = { vx: 0, vy: 0 };
        } else if (currentSpeed > 0) {
            const dropRatio = (currentSpeed - frictionForce * dt) / currentSpeed;
            this.boomerang.velocity.vx *= dropRatio;
            this.boomerang.velocity.vy *= dropRatio;
        }
    }

    private applyVelocity(dt: number): void {
        this.boomerang.transform.x += this.boomerang.velocity.vx * dt;
        this.boomerang.transform.y += this.boomerang.velocity.vy * dt;
    }
}