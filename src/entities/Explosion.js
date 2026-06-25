export class Explosion {
    id;
    ownerId;
    transform;
    // Size and Lifecycle
    radius = 0;
    maxRadius = 120; // Massive AoE blast
    lifeTimer = 0;
    maxLife = 0.25; // Lingers for 0.25 seconds
    isDead = false;
    // Combat Stats
    damage = 25;
    hitIds = new Set(); // Tracks who has already taken damage
    constructor(id, ownerId, x, y) {
        this.id = id;
        this.ownerId = ownerId;
        this.transform = { x, y };
    }
    update(dt) {
        this.lifeTimer += dt;
        if (this.lifeTimer >= this.maxLife) {
            this.isDead = true;
        }
        else {
            // Easing function: Rapid expansion that slows down near the end (Sine Ease-Out)
            const progress = this.lifeTimer / this.maxLife;
            this.radius = this.maxRadius * Math.sin(progress * (Math.PI / 2));
        }
    }
}
