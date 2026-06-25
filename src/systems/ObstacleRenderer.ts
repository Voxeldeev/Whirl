// src/systems/ObstacleRenderer.ts
import { Obstacle } from '../entities/Obstacle';
import { Theme } from '../core/Theme';

export class ObstacleRenderer {
    constructor(private ctx: CanvasRenderingContext2D) {}

    public render(obstacles: Obstacle[]): void {
        this.ctx.fillStyle = Theme.wallBg; 
        this.ctx.strokeStyle = Theme.wallBorder; 
        this.ctx.lineWidth = 2;

        for (const obs of obstacles) {
            const { x, y, width, height } = obs.bounds;
            
            this.ctx.fillRect(x, y, width, height);
            this.ctx.strokeRect(x, y, width, height);
        }
    }
}