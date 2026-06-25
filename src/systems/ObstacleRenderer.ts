// src/systems/ObstacleRenderer.ts
import { Obstacle } from '../entities/Obstacle';

export class ObstacleRenderer {
    constructor(private ctx: CanvasRenderingContext2D) {}

    public render(obstacles: Obstacle[]): void {
        this.ctx.fillStyle = '#163649'; // Darker shade of the arena background (#1E465D)
        this.ctx.strokeStyle = '#0A84C9'; // Match arena outline
        this.ctx.lineWidth = 3;

        for (const obs of obstacles) {
            const { x, y, width, height } = obs.bounds;
            
            this.ctx.fillRect(x, y, width, height);
            this.ctx.strokeRect(x, y, width, height);

            // Optional: Draw an inner shadow/highlight for depth
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + height);
            this.ctx.lineTo(x, y);
            this.ctx.lineTo(x + width, y);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }
}