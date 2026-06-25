// src/systems/BoomerangRenderer.ts

import { Boomerang } from '../entities/Boomerang';
import { BoomerangState } from '../core/interfaces';
import { Theme } from '../core/Theme';

export class BoomerangRenderer {
    constructor(private ctx: CanvasRenderingContext2D) {}

    public render(boomerangs: Boomerang[]): void {
        for (const boomerang of boomerangs) {
            if (boomerang.state === BoomerangState.HIDDEN) continue;

            const { x, y } = boomerang.transform;
            const radius = boomerang.radius;

            this.ctx.save();
            
            // 1. Move to the boomerang's coordinate and apply the spin
            this.ctx.translate(x, y);
            this.ctx.rotate(boomerang.rotationAngle);

            // 2. Offset the drawing context slightly to the left.
            // This ensures the crescent spins symmetrically around its 
            // center of gravity, preventing an eccentric "wobble".
            this.ctx.translate(-radius * 0.4, 0);

            this.ctx.beginPath();
            
            // 3. Draw the outer curve (A perfect half-circle on the right side)
            // Starts at the top (1.5 PI), swings right, ends at the bottom (0.5 PI)
            this.ctx.arc(0, 0, radius, Math.PI * 1.5, Math.PI * 0.5, false); 
            
            // 4. Draw the inner curve to scoop out the crescent
            // Curves from the bottom back to the top, pulled inward by the control point
            this.ctx.quadraticCurveTo(radius * 0.5, 0, 0, -radius);
            
            this.ctx.closePath();

            this.ctx.fillStyle = Theme.boomFill;
            this.ctx.lineWidth = 2;

            // Ghosted weapons get a gray outline, live weapons get white
            if (boomerang.state === BoomerangState.GHOST) {
                this.ctx.strokeStyle = Theme.boomGhostOutline;
            } else {
                this.ctx.strokeStyle = Theme.boomOutline;
            }

            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
}