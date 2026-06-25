// src/systems/PhysicsSystem.ts
import { Player } from '../entities/Player';
import { Boomerang } from '../entities/Boomerang';
import { Obstacle } from '../entities/Obstacle';
import { BoomerangState } from '../core/interfaces';

export class PhysicsSystem {
    private obstacles: Obstacle[] = [];

    public setObstacles(obstacles: Obstacle[]): void {
        this.obstacles = obstacles;
    }

    public update(player: Player, boomerang: Boomerang): void {
        for (const obs of this.obstacles) {
            this.resolvePlayerCollision(player, obs);
            this.checkBoomerangCollision(boomerang, obs);
        }
    }

    private resolvePlayerCollision(player: Player, obstacle: Obstacle): void {
        const { x: cx, y: cy } = player.transform;
        const r = player.radius;
        const aabb = obstacle.bounds;

        const closestX = Math.max(aabb.x, Math.min(cx, aabb.x + aabb.width));
        const closestY = Math.max(aabb.y, Math.min(cy, aabb.y + aabb.height));

        const dx = cx - closestX;
        const dy = cy - closestY;
        const distanceSquared = (dx * dx) + (dy * dy);

        if (distanceSquared < (r * r)) {
            const distance = Math.sqrt(distanceSquared);
            
            if (distance > 0) {
                const overlap = r - distance;
                player.transform.x += (dx / distance) * overlap;
                player.transform.y += (dy / distance) * overlap;
            } else {
                player.transform.y -= r; 
            }
        }
    }

    private checkBoomerangCollision(boomerang: Boomerang, obstacle: Obstacle): void {
        // We now only ignore HIDDEN and CHARGING.
        // LIVE, GHOST, RECALL, and DECELERATING will all bounce.
        if (
            boomerang.state === BoomerangState.HIDDEN || 
            boomerang.state === BoomerangState.CHARGING
        ) {
            return;
        }

        const { x: cx, y: cy } = boomerang.transform;
        const r = boomerang.radius;
        const aabb = obstacle.bounds;

        const closestX = Math.max(aabb.x, Math.min(cx, aabb.x + aabb.width));
        const closestY = Math.max(aabb.y, Math.min(cy, aabb.y + aabb.height));

        const dx = cx - closestX;
        const dy = cy - closestY;
        const distanceSquared = (dx * dx) + (dy * dy);

        if (distanceSquared < (r * r)) {
            const distance = Math.sqrt(distanceSquared);
            
            if (distance > 0) {
                // Penetration Resolution
                const overlap = r - distance;
                const nx = dx / distance;
                const ny = dy / distance;
                
                boomerang.transform.x += nx * overlap;
                boomerang.transform.y += ny * overlap;

                // State Transition (Only LIVE transitions to GHOST on bounce)
                if (boomerang.state === BoomerangState.LIVE) {
                    boomerang.state = BoomerangState.GHOST;
                }

                // Velocity Reflection (Bounce)
                const dotProduct = (boomerang.velocity.vx * nx) + (boomerang.velocity.vy * ny);
                
                if (dotProduct < 0) {
                    const restitution = 1.0; 
                    boomerang.velocity.vx -= (1 + restitution) * dotProduct * nx;
                    boomerang.velocity.vy -= (1 + restitution) * dotProduct * ny;
                }
            } else {
                boomerang.velocity.vy *= -1; 
                boomerang.velocity.vx *= -1;
            }
        }
    }
}