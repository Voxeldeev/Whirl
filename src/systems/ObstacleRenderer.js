import { Theme } from '../core/Theme';
export class ObstacleRenderer {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    render(obstacles) {
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
