// src/systems/PlayerRenderer.ts
import { Player } from '../entities/Player';
import { PlayerState } from '../core/interfaces';
import { Theme } from '../core/Theme';

export class PlayerRenderer {
    constructor(private player: Player, private ctx: CanvasRenderingContext2D) {}

    public render(): void {
        if (this.player.state === PlayerState.DEAD) return;

        const { x, y } = this.player.transform;
        const radius = this.player.radius;

        this.ctx.save();
        
        // 1. Draw Player Body & Indicator (Requires Rotation)
        this.ctx.translate(x, y);
        this.ctx.rotate(this.player.rotation);

        // Player Body
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = Theme.playerFill;
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = this.player.color;
        this.ctx.stroke();
        this.ctx.closePath();

        // Direction Indicator
        this.ctx.beginPath();
        this.ctx.moveTo(radius + 2, 0);
        this.ctx.lineTo(radius - 6, -5);
        this.ctx.lineTo(radius - 6, 5);
        this.ctx.fillStyle = this.player.color;
        this.ctx.fill();
        this.ctx.closePath();

        // Restore context so the HP bar doesn't spin with the player
        this.ctx.restore();

        // 2. Draw Health Bar (No Rotation)
        this.ctx.save();
        this.ctx.translate(x, y);

        const barWidth = 36;
        const barHeight = 4;
        const yOffset = -radius - 16;
        
        // Scale the percentage properly depending on the entity
        const maxHp = this.player.id === 'dummy_1' ? 500 : 100;
        const hpPercent = Math.max(0, Math.min(1, this.player.hp / maxHp));

        // Container (Transparent center, faint white border)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; 
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-barWidth / 2, yOffset, barWidth, barHeight);

        // Fill (Solid White)
        if (hpPercent > 0) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(-barWidth / 2, yOffset, barWidth * hpPercent, barHeight);
        }

        this.ctx.restore();
    }
}