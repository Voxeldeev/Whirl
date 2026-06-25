// src/systems/BoomerangRenderer.ts
import { Boomerang } from '../entities/Boomerang';
import { BoomerangState } from '../core/interfaces';

export class BoomerangRenderer {
    constructor(private ctx: CanvasRenderingContext2D) {}

    public render(boomerangs: Boomerang[]): void {
        for (const boomerang of boomerangs) {
            if (boomerang.state === BoomerangState.HIDDEN) continue;

            const { x, y } = boomerang.transform;
            const radius = boomerang.radius;

            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(boomerang.rotationAngle);

            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, 0, Math.PI * 1.5, false); 
            this.ctx.lineTo(0, 0); 

            switch (boomerang.state) {
                case BoomerangState.CHARGING:
                    const chargePercent = boomerang.chargeTimer / 3.0;
                    this.ctx.fillStyle = `rgba(255, ${200 - (chargePercent * 100)}, 0, 1)`;
                    break;
                case BoomerangState.LIVE:
                    this.ctx.fillStyle = '#FFA502'; 
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowColor = '#FFA502';
                    break;
                case BoomerangState.RECALL:
                    this.ctx.fillStyle = '#FF4757'; 
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = '#FF4757';
                    break;
                case BoomerangState.DECELERATING:
                    this.ctx.fillStyle = '#ff7f8a'; 
                    this.ctx.shadowBlur = 5;
                    this.ctx.shadowColor = '#ff7f8a';
                    break;
                case BoomerangState.GHOST:
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; 
                    this.ctx.shadowBlur = 0;
                    break;
            }

            this.ctx.fill();
            this.ctx.closePath();
            this.ctx.restore();
        }
    }
}