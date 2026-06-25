export class Obstacle {
    id;
    bounds;
    constructor(id, x, y, width, height) {
        this.id = id;
        this.bounds = { x, y, width, height };
    }
}
