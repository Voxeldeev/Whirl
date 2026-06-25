// src/entities/Player.ts
import { Transform, Velocity, PlayerState } from '../core/interfaces';

export class Player {
    public id: string;
    public transform: Transform;
    public velocity: Velocity;
    public targetVelocity: Velocity; // New: For interpolation
    public rotation: number = 0;     // New: Facing angle in radians
    public state: PlayerState = PlayerState.IDLE;
    
    // Core Stats
    public hp: number = 100;
    public speed: number = 300;
    public radius: number = 20;

    // Timers
    public stateTimer: number = 0;
    public dashCooldown: number = 0;
    public blockCooldown: number = 0;

    constructor(id: string, startX: number, startY: number) {
        this.id = id;
        this.transform = { x: startX, y: startY };
        this.velocity = { vx: 0, vy: 0 };
        this.targetVelocity = { vx: 0, vy: 0 };
    }

    public updateTimers(dt: number): void {
        if (this.stateTimer > 0) this.stateTimer -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.blockCooldown > 0) this.blockCooldown -= dt;

        if (this.stateTimer <= 0 && (this.state === PlayerState.DASHING || this.state === PlayerState.BLOCKING)) {
            this.state = PlayerState.IDLE;
            // When dash ends, reset velocity to target immediately to prevent sliding
            this.velocity.vx = this.targetVelocity.vx; 
            this.velocity.vy = this.targetVelocity.vy;
        }
    }
}