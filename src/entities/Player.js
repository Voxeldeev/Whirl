// src/entities/Player.ts
import { PlayerState } from '../core/interfaces';
import { Theme } from '../core/Theme';
export class Player {
    id;
    transform;
    velocity;
    targetVelocity; // New: For interpolation
    rotation = 0; // New: Facing angle in radians
    state = PlayerState.IDLE;
    color = Theme.playerDefaultColor;
    // Core Stats
    hp = 100;
    speed = 300;
    radius = 20;
    // Timers
    stateTimer = 0;
    dashCooldown = 0;
    blockCooldown = 0;
    slowTimer = 0;
    constructor(id, startX, startY) {
        this.id = id;
        this.transform = { x: startX, y: startY };
        this.velocity = { vx: 0, vy: 0 };
        this.targetVelocity = { vx: 0, vy: 0 };
    }
    updateTimers(dt) {
        if (this.stateTimer > 0)
            this.stateTimer -= dt;
        if (this.dashCooldown > 0)
            this.dashCooldown -= dt;
        if (this.blockCooldown > 0)
            this.blockCooldown -= dt;
        if (this.stateTimer <= 0 && (this.state === PlayerState.DASHING || this.state === PlayerState.BLOCKING)) {
            this.state = PlayerState.IDLE;
            // When dash ends, reset velocity to target immediately to prevent sliding
            this.velocity.vx = this.targetVelocity.vx;
            this.velocity.vy = this.targetVelocity.vy;
        }
    }
}
