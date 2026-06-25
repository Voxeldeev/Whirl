// src/systems/PuppetController.ts
import { Player } from '../entities/Player';
import { PlayerState } from '../core/interfaces';

export class PuppetController {
    // Corrected to only expect the Player entity
    constructor(private player: Player) {}

    public update(dt: number): void {
        // Always update timers (like the knockback stun timer)
        this.player.updateTimers(dt);

        // Process sliding friction if they were hit
        if (this.player.state === PlayerState.KNOCKED_BACK) {
            this.handleKnockbackFriction(dt);
        }

        // Apply velocity to position (whether sliding or standing still)
        this.applyKinematics(dt);
    }

    private handleKnockbackFriction(dt: number): void {
        const friction = 2000; 
        const currentSpeed = Math.sqrt(this.player.velocity.vx ** 2 + this.player.velocity.vy ** 2);
        
        // If friction would push them backward, just stop them completely
        if (currentSpeed <= friction * dt) {
            this.player.velocity = { vx: 0, vy: 0 };
        } else {
            // Otherwise, reduce velocity proportionally
            const dropRatio = (currentSpeed - friction * dt) / currentSpeed;
            this.player.velocity.vx *= dropRatio;
            this.player.velocity.vy *= dropRatio;
        }

        // Recover from the stun state when the timer hits 0
        if (this.player.stateTimer <= 0) {
            this.player.state = PlayerState.IDLE;
            this.player.velocity = { vx: 0, vy: 0 };
        }
    }

    private applyKinematics(dt: number): void {
        this.player.transform.x += this.player.velocity.vx * dt;
        this.player.transform.y += this.player.velocity.vy * dt;
    }
}