// src/core/GameLoop.ts

export class GameLoop {
    private lastTime: number = 0;
    private animationId: number = 0;
    
    // Decoupled callbacks so the loop doesn't need to know about game logic
    private updateFn: (dt: number) => void;
    private renderFn: () => void;

    constructor(updateFn: (dt: number) => void, renderFn: () => void) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
    }

    public start(): void {
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    public stop(): void {
        cancelAnimationFrame(this.animationId);
    }

    private loop = (currentTime: number): void => {
        // Calculate delta time in seconds
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // 1. Process math, physics, and state
        this.updateFn(dt);
        
        // 2. Draw the new state to the canvas
        this.renderFn();

        // 3. Request the next frame
        this.animationId = requestAnimationFrame(this.loop);
    }
}