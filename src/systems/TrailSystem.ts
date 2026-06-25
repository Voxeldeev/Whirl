// src/systems/TrailSystem.ts
import { Trail } from '../entities/Trail';

export class TrailSystem {
    public update(dt: number, trails: Trail[]): void {
        for (let i = trails.length - 1; i >= 0; i--) {
            trails[i].lifeTimer += dt;
            if (trails[i].lifeTimer >= trails[i].maxLife) {
                trails.splice(i, 1);
            }
        }
    }
}