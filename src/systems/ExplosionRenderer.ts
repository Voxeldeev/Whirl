// src/systems/ExplosionRenderer.ts
import { Explosion } from '../entities/Explosion';

export class ExplosionRenderer {
    constructor(private ctx: CanvasRenderingContext2D) {}

    public render(explosions: Explosion[]): void {
        for (const exp of explosions) {
            const { x, y } = exp.transform;
            
            // Calculate opacity (1.0 at spawn, fading to 0.0 at death)
            const alpha = Math.max(0, 1 - (exp.lifeTimer / exp.maxLife));

            this.ctx.beginPath();
            this.ctx.arc(x, y, exp.radius, 0, Math.PI * 2);
            
            // Inner Core
            this.ctx.fillStyle = `rgba(255, 71, 87, ${alpha * 0.5})`; 
            this.ctx.fill();
            
            // Shockwave Ring
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = `rgba(255, 159, 67, ${alpha})`; 
            this.ctx.stroke();
            
            this.ctx.closePath();
        }
    }
}