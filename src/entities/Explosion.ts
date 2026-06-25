// src/entities/Explosion.ts
import { Transform } from '../core/interfaces';

export class Explosion {
    public id: string;
    public ownerId: string;
    public transform: Transform;
    
    // Size and Lifecycle
    public radius: number = 0;
    public maxRadius: number = 120; // Massive AoE blast
    public lifeTimer: number = 0;
    public maxLife: number = 0.25; // Lingers for 0.25 seconds
    public isDead: boolean = false;
    
    // Combat Stats
    public damage: number = 25;
    public hitIds: Set<string> = new Set(); // Tracks who has already taken damage

    constructor(id: string, ownerId: string, x: number, y: number) {
        this.id = id;
        this.ownerId = ownerId;
        this.transform = { x, y };
    }

    public update(dt: number): void {
        this.lifeTimer += dt;
        
        if (this.lifeTimer >= this.maxLife) {
            this.isDead = true;
        } else {
            // Easing function: Rapid expansion that slows down near the end (Sine Ease-Out)
            const progress = this.lifeTimer / this.maxLife;
            this.radius = this.maxRadius * Math.sin(progress * (Math.PI / 2));
        }
    }
}