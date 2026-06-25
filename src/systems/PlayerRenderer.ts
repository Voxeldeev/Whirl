// src/systems/PlayerRenderer.ts
import { Player } from '../entities/Player';
import { PlayerState } from '../core/interfaces';

export class PlayerRenderer {
    constructor(private player: Player, private ctx: CanvasRenderingContext2D) {}

    public render(): void {
        const { x, y } = this.player.transform;
        const radius = this.player.radius;

        this.ctx.save();
        
        // Move canvas origin to player position and rotate it
        this.ctx.translate(x, y);
        this.ctx.rotate(this.player.rotation);

        // 1. Draw Player Body
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);

        switch (this.player.state) {
            case PlayerState.DASHING:
                this.ctx.fillStyle = '#00d2d3'; // Keep cyan for i-frame visibility
                break;
            case PlayerState.BLOCKING:
                this.ctx.fillStyle = '#feca57'; 
                this.ctx.lineWidth = 4;
                this.ctx.strokeStyle = '#ff9f43';
                this.ctx.stroke(); 
                break;
            default:
                this.ctx.fillStyle = '#00A2FF'; // New Theme: Player Body
                break;
        }
        this.ctx.fill();
        this.ctx.closePath();

        // 2. Draw Aiming Indicator (">" symbol)
        // Since we are rotated, "forward" is always positive X
        this.ctx.beginPath();
        this.ctx.moveTo(radius - 12, -8);  // Top point
        this.ctx.lineTo(radius - 2, 0);    // Right point (tip)
        this.ctx.lineTo(radius - 12, 8);   // Bottom point
        
        this.ctx.strokeStyle = '#80D1FF';  // New Theme: Player Indicator
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
        this.ctx.closePath();

        // Restore canvas origin and rotation for the next draw call
        this.ctx.restore();
        
        // Save again for UI translation without rotation
        this.ctx.save();
        this.ctx.translate(x, y);

        // Draw HP Bar if not dead
        if (this.player.state !== PlayerState.DEAD) {
            const barWidth = 40;
            const barHeight = 6;
            const hpPercent = Math.max(this.player.hp / 100, 0);

            // Background (Red)
            this.ctx.fillStyle = '#ff4757';
            this.ctx.fillRect(-barWidth / 2, -radius - 15, barWidth, barHeight);
            
            // Foreground (Green)
            this.ctx.fillStyle = '#2ed573';
            this.ctx.fillRect(-barWidth / 2, -radius - 15, barWidth * hpPercent, barHeight);
            
            // Border
            this.ctx.strokeStyle = '#272727';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(-barWidth / 2, -radius - 15, barWidth, barHeight);
        }

        this.ctx.restore();
    }
}