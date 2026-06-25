// src/entities/Trail.ts
export class Trail {
    id;
    ownerId;
    x;
    y;
    radius;
    maxLife;
    lifeTimer = 0;
    constructor(id, ownerId, x, y, radius, maxLife = 5.0) {
        this.id = id;
        this.ownerId = ownerId;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.maxLife = maxLife;
    }
}
