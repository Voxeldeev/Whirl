// src/systems/ExplosionRenderer.ts
import { Explosion } from '../entities/Explosion';
import { Theme } from '../core/Theme';

export class ExplosionRenderer {
    constructor(private ctx: CanvasRenderingContext2D) {}

    public render(explosions: Explosion[]): void {
        for (const exp of explosions) {
            const { x, y } = exp.transform;
            
            const alpha = Math.max(0, 1 - (exp.lifeTimer / exp.maxLife));

            this.ctx.beginPath();
            this.ctx.arc(x, y, exp.radius, 0, Math.PI * 2);
            
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = `rgba(255, 71, 87, ${alpha})`;
            this.ctx.stroke();
            
            this.ctx.closePath();
        }
    }
}