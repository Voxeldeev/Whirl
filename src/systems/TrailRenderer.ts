// src/systems/TrailRenderer.ts
import { Trail } from '../entities/Trail';
import { Theme } from '../core/Theme';

export class TrailRenderer {
    constructor(private ctx: CanvasRenderingContext2D) {}

    public render(trails: Trail[]): void {
        for (const trail of trails) {
            const alpha = Math.max(0, 1 - (trail.lifeTimer / trail.maxLife));
            
            this.ctx.beginPath();
            this.ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
            
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`; // Translating Theme.trailOutline to RGBA
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }
}