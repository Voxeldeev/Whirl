import { AABB } from '../core/interfaces';

export class Obstacle {
    public id: string;
    public bounds: AABB;

    constructor(id: string, x: number, y: number, width: number, height: number) {
        this.id = id;
        this.bounds = { x, y, width, height };
    }
}