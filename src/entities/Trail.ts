// src/entities/Trail.ts
export class Trail {
    public lifeTimer: number = 0;

    constructor(
        public id: string,
        public ownerId: string,
        public x: number,
        public y: number,
        public radius: number,
        public maxLife: number = 5.0
    ) {}
}