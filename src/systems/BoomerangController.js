// src/systems/BoomerangController.ts
import { BoomerangState, PlayerState } from '../core/interfaces';
import { ModifierId } from '../core/Modifiers';
import { Trail } from '../entities/Trail';
export class BoomerangController {
    boomerang;
    player;
    input;
    spawnCallback;
    spawnTrailCallback;
    MAX_CHARGE_TIME = 3.0;
    MAX_DAMAGE_MULTIPLIER = 3.0;
    constructor(boomerang, player, input, spawnCallback, spawnTrailCallback) {
        this.boomerang = boomerang;
        this.player = player;
        this.input = input;
        this.spawnCallback = spawnCallback;
        this.spawnTrailCallback = spawnTrailCallback;
    }
    update(dt) {
        const catchableStates = [
            BoomerangState.GHOST,
            BoomerangState.RECALL,
            BoomerangState.DECELERATING
        ];
        if (catchableStates.includes(this.boomerang.state)) {
            const dx = this.player.transform.x - this.boomerang.transform.x;
            const dy = this.player.transform.y - this.boomerang.transform.y;
            const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
            if (distanceToPlayer < this.player.radius + this.boomerang.radius) {
                if (this.boomerang.isTemporary) {
                    this.boomerang.isDead = true;
                }
                else {
                    this.boomerang.reset();
                }
                return;
            }
        }
        if (this.boomerang.state !== BoomerangState.HIDDEN && this.boomerang.state !== BoomerangState.CHARGING) {
            const currentSpeed = Math.sqrt(this.boomerang.velocity.vx ** 2 + this.boomerang.velocity.vy ** 2);
            const spinRate = 75 * (currentSpeed / this.boomerang.speed);
            if (currentSpeed > 10) {
                this.boomerang.rotationAngle += spinRate * dt;
            }
        }
        // --- THE FIX: Clone and Reset ---
        if (this.boomerang.isReviveAttacking) {
            // If this is the player's primary weapon, clone it so it can fly away,
            // and instantly return the original to the player to end their shot cooldown.
            if (!this.boomerang.isTemporary && this.spawnCallback) {
                const clone = this.boomerang.clone();
                clone.isTemporary = true;
                clone.state = BoomerangState.LIVE;
                clone.isReviveAttacking = true;
                clone.reviveTargetX = this.boomerang.reviveTargetX;
                clone.reviveTargetY = this.boomerang.reviveTargetY;
                clone.velocity = { vx: this.boomerang.velocity.vx, vy: this.boomerang.velocity.vy };
                clone.transform.x = this.boomerang.transform.x;
                clone.transform.y = this.boomerang.transform.y;
                this.spawnCallback(clone);
                // Reset the main boomerang back to the player's hand immediately
                this.boomerang.isReviveAttacking = false;
                this.boomerang.reset();
                return;
            }
            // If it is already a temporary clone, execute the attack normally
            this.handleReviveAttack(dt);
            this.dropSnailTrail(dt);
            return;
        }
        switch (this.boomerang.state) {
            case BoomerangState.HIDDEN:
                this.handleHidden();
                break;
            case BoomerangState.CHARGING:
                this.handleCharging(dt);
                break;
            case BoomerangState.LIVE:
                this.handleLive(dt);
                break;
            case BoomerangState.GHOST:
                this.handleGhost(dt);
                break;
            case BoomerangState.RECALL:
                this.handleRecall(dt);
                break;
            case BoomerangState.DECELERATING:
                this.handleDecelerating(dt);
                break;
        }
        this.dropSnailTrail(dt);
    }
    dropSnailTrail(dt) {
        if (this.boomerang.hasModifier(ModifierId.SNAIL) && this.spawnTrailCallback) {
            const speed = Math.sqrt(this.boomerang.velocity.vx ** 2 + this.boomerang.velocity.vy ** 2);
            if (speed > 50) {
                this.boomerang.trailTimer += dt;
                if (this.boomerang.trailTimer >= 0.05) {
                    this.boomerang.trailTimer = 0;
                    const dynamicRadius = Math.max(this.boomerang.radius, (speed * 0.02) / 2 + this.boomerang.radius);
                    this.spawnTrailCallback(new Trail(`trail_${Date.now()}_${Math.random()}`, this.boomerang.ownerId, this.boomerang.transform.x, this.boomerang.transform.y, dynamicRadius));
                }
            }
        }
    }
    handleReviveAttack(dt) {
        const accel = 2500;
        this.boomerang.velocity.vx += this.boomerang.reviveTargetX * accel * dt;
        this.boomerang.velocity.vy += this.boomerang.reviveTargetY * accel * dt;
        const maxSpeed = 1200;
        const currentSpeed = Math.sqrt(this.boomerang.velocity.vx ** 2 + this.boomerang.velocity.vy ** 2);
        if (currentSpeed > maxSpeed) {
            this.boomerang.velocity.vx = (this.boomerang.velocity.vx / currentSpeed) * maxSpeed;
            this.boomerang.velocity.vy = (this.boomerang.velocity.vy / currentSpeed) * maxSpeed;
        }
        this.applyVelocity(dt);
        const { x, y } = this.boomerang.transform;
        const r = this.boomerang.radius;
        if (x + r < 0 || x - r > 1280 || y + r < 0 || y - r > 720) {
            this.boomerang.isDead = true;
        }
    }
    enterCharging() {
        this.boomerang.state = BoomerangState.CHARGING;
        this.player.velocity = { vx: 0, vy: 0 };
        this.player.targetVelocity = { vx: 0, vy: 0 };
        this.boomerang.transform.x = this.player.transform.x;
        this.boomerang.transform.y = this.player.transform.y;
        this.boomerang.chargeTimer = 0;
    }
    handleHidden() {
        const isReady = this.input.isLeftPressed() &&
            this.player.state !== PlayerState.DASHING &&
            this.player.state !== PlayerState.BLOCKING;
        if (isReady) {
            if (this.boomerang.hasModifier(ModifierId.BULLET)) {
                this.fireBullet();
            }
            else {
                this.enterCharging();
            }
        }
    }
    fireBullet() {
        if (!this.spawnCallback)
            return;
        const bullet = this.boomerang.clone();
        bullet.state = BoomerangState.LIVE;
        bullet.currentDamage = bullet.baseDamage;
        bullet.transform.x = this.player.transform.x;
        bullet.transform.y = this.player.transform.y;
        const throwSpeed = bullet.speed * 2.5;
        let dx = this.input.getMouseX() - bullet.transform.x;
        let dy = this.input.getMouseY() - bullet.transform.y;
        let length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) {
            dx = 1;
            dy = 0;
            length = 1;
        }
        const dirX = dx / length;
        const dirY = dy / length;
        bullet.velocity.vx = dirX * throwSpeed;
        bullet.velocity.vy = dirY * throwSpeed;
        const safeDistance = this.player.radius + bullet.radius + 1;
        bullet.transform.x += dirX * safeDistance;
        bullet.transform.y += dirY * safeDistance;
        if (bullet.hasModifier(ModifierId.DIVIDE) && !bullet.hasDivided) {
            bullet.hasDivided = true;
            this.spawnAngledClone(bullet, bullet.velocity.vx, bullet.velocity.vy, 20);
            this.spawnAngledClone(bullet, bullet.velocity.vx, bullet.velocity.vy, -20);
        }
        this.spawnCallback(bullet);
    }
    handleCharging(dt) {
        this.boomerang.transform.x = this.player.transform.x;
        this.boomerang.transform.y = this.player.transform.y;
        this.boomerang.chargeTimer += dt;
        const chargePercent = Math.min(this.boomerang.chargeTimer / this.MAX_CHARGE_TIME, 1.0);
        const dmgMultiplier = 1.0 + (chargePercent * (this.MAX_DAMAGE_MULTIPLIER - 1.0));
        this.boomerang.currentDamage = this.boomerang.baseDamage * dmgMultiplier;
        if (!this.input.isLeftDown()) {
            this.boomerang.state = BoomerangState.LIVE;
            const speedMultiplier = 1.0 + chargePercent;
            const throwSpeed = this.boomerang.speed * speedMultiplier;
            let dx = this.input.getMouseX() - this.boomerang.transform.x;
            let dy = this.input.getMouseY() - this.boomerang.transform.y;
            let length = Math.sqrt(dx * dx + dy * dy);
            if (length === 0) {
                dx = 1;
                dy = 0;
                length = 1;
            }
            const dirX = dx / length;
            const dirY = dy / length;
            this.boomerang.velocity.vx = dirX * throwSpeed;
            this.boomerang.velocity.vy = dirY * throwSpeed;
            const safeDistance = this.player.radius + this.boomerang.radius + 1;
            this.boomerang.transform.x += dirX * safeDistance;
            this.boomerang.transform.y += dirY * safeDistance;
            if (this.boomerang.hasModifier(ModifierId.DIVIDE) && !this.boomerang.hasDivided && this.spawnCallback) {
                this.boomerang.hasDivided = true;
                this.spawnAngledClone(this.boomerang, this.boomerang.velocity.vx, this.boomerang.velocity.vy, 20);
                this.spawnAngledClone(this.boomerang, this.boomerang.velocity.vx, this.boomerang.velocity.vy, -20);
            }
        }
    }
    spawnAngledClone(parent, vx, vy, angleDegrees) {
        if (!this.spawnCallback)
            return;
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
    handleLive(dt) {
        this.applyVelocity(dt);
        const currentSpeed = Math.sqrt(this.boomerang.velocity.vx ** 2 + this.boomerang.velocity.vy ** 2);
        this.boomerang.distanceTraveled += currentSpeed * dt;
        const { x, y } = this.boomerang.transform;
        const r = this.boomerang.radius;
        if (x + r < 0 || x - r > 1280 || y + r < 0 || y - r > 720) {
            if (this.boomerang.isTemporary) {
                this.boomerang.isDead = true;
            }
            else {
                this.boomerang.reset();
            }
            return;
        }
        if (this.boomerang.distanceTraveled >= this.boomerang.maxRange) {
            this.boomerang.state = BoomerangState.GHOST;
        }
    }
    handleGhost(dt) {
        this.applyFriction(5000, dt);
        this.applyVelocity(dt);
        this.checkRecallInput();
    }
    handleRecall(dt) {
        if (this.boomerang.hasModifier(ModifierId.BULLET)) {
            this.boomerang.state = BoomerangState.GHOST;
            return;
        }
        if (!this.input.isLeftDown()) {
            this.boomerang.state = BoomerangState.DECELERATING;
            return;
        }
        this.boomerang.recallTimer += dt;
        let targetX = this.player.transform.x;
        let targetY = this.player.transform.y;
        if (this.boomerang.hasModifier(ModifierId.TELEKINESIS)) {
            targetX = this.input.getMouseX();
            targetY = this.input.getMouseY();
        }
        const dx = targetX - this.boomerang.transform.x;
        const dy = targetY - this.boomerang.transform.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
        if (distanceToTarget === 0)
            return;
        const dirX = dx / distanceToTarget;
        const dirY = dy / distanceToTarget;
        const baseSpeed = 400;
        const logMultiplier = 800;
        const timeScale = 4;
        const currentSpeed = baseSpeed + logMultiplier * Math.log(1 + this.boomerang.recallTimer * timeScale);
        const targetVx = dirX * currentSpeed;
        const targetVy = dirY * currentSpeed;
        const turnSpeed = 15;
        this.boomerang.velocity.vx += (targetVx - this.boomerang.velocity.vx) * turnSpeed * dt;
        this.boomerang.velocity.vy += (targetVy - this.boomerang.velocity.vy) * turnSpeed * dt;
        this.applyVelocity(dt);
    }
    handleDecelerating(dt) {
        if (this.input.isLeftDown() && !this.boomerang.hasModifier(ModifierId.BULLET)) {
            this.boomerang.state = BoomerangState.RECALL;
            this.boomerang.recallTimer = 0;
            return;
        }
        this.applyFriction(2000, dt);
        const currentSpeed = Math.sqrt(this.boomerang.velocity.vx ** 2 + this.boomerang.velocity.vy ** 2);
        if (currentSpeed === 0) {
            this.boomerang.state = BoomerangState.GHOST;
        }
        else {
            this.applyVelocity(dt);
        }
    }
    checkRecallInput() {
        if (this.boomerang.hasModifier(ModifierId.BULLET))
            return;
        if (this.input.isLeftDown()) {
            this.boomerang.state = BoomerangState.RECALL;
            this.boomerang.recallTimer = 0;
        }
    }
    applyFriction(frictionForce, dt) {
        const currentSpeed = Math.sqrt(this.boomerang.velocity.vx ** 2 + this.boomerang.velocity.vy ** 2);
        if (currentSpeed <= frictionForce * dt) {
            this.boomerang.velocity = { vx: 0, vy: 0 };
        }
        else if (currentSpeed > 0) {
            const dropRatio = (currentSpeed - frictionForce * dt) / currentSpeed;
            this.boomerang.velocity.vx *= dropRatio;
            this.boomerang.velocity.vy *= dropRatio;
        }
    }
    applyVelocity(dt) {
        this.boomerang.transform.x += this.boomerang.velocity.vx * dt;
        this.boomerang.transform.y += this.boomerang.velocity.vy * dt;
    }
}
