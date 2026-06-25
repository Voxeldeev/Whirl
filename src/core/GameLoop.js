// src/core/GameLoop.ts
export class GameLoop {
    lastTime = 0;
    animationId = 0;
    // Decoupled callbacks so the loop doesn't need to know about game logic
    updateFn;
    renderFn;
    constructor(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
    }
    start() {
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }
    stop() {
        cancelAnimationFrame(this.animationId);
    }
    loop = (currentTime) => {
        // Calculate delta time in seconds
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        // 1. Process math, physics, and state
        this.updateFn(dt);
        // 2. Draw the new state to the canvas
        this.renderFn();
        // 3. Request the next frame
        this.animationId = requestAnimationFrame(this.loop);
    };
}
