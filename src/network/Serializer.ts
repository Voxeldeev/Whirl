// src/network/Serializer.ts

import { Player } from '../entities/Player';
import { Boomerang } from '../entities/Boomerang';
import { Explosion } from '../entities/Explosion';
import { Trail } from '../entities/Trail';

export class Serializer {
    
    // --- PACKING (Host -> Client) ---

    public static packPlayer(player: Player) {
        return {
            id: player.id,
            x: Math.round(player.transform.x), // Strip floating point precision to save bytes
            y: Math.round(player.transform.y),
            hp: player.hp,
            state: player.state,
            rotation: Number(player.rotation.toFixed(2)),
            color: player.color
        };
    }

    public static packBoomerang(boomerang: Boomerang) {
        return {
            id: boomerang.id,
            ownerId: boomerang.ownerId,
            x: Math.round(boomerang.transform.x),
            y: Math.round(boomerang.transform.y),
            state: boomerang.state,
            rotationAngle: Number(boomerang.rotationAngle.toFixed(2)),
            radius: boomerang.radius,
            chargePercent: boomerang.chargeTimer / 3.0 // Client only needs 0.0 - 1.0 for the color gradient
        };
    }

    public static packExplosion(explosion: Explosion) {
        return {
            id: explosion.id,
            x: Math.round(explosion.transform.x),
            y: Math.round(explosion.transform.y),
            radius: Math.round(explosion.radius),
            lifePercent: explosion.lifeTimer / explosion.maxLife // For fading alpha
        };
    }

    public static packTrail(trail: Trail) {
        return {
            id: trail.id,
            x: Math.round(trail.x),
            y: Math.round(trail.y),
            radius: Math.round(trail.radius),
            lifePercent: trail.lifeTimer / trail.maxLife // For fading alpha
        };
    }

    public static packGameState(players: Player[], boomerangs: Boomerang[], explosions: Explosion[], trails: Trail[]) {
        return {
            players: players.map(p => this.packPlayer(p)),
            boomerangs: boomerangs.map(b => this.packBoomerang(b)),
            explosions: explosions.map(e => this.packExplosion(e)),
            trails: trails.map(t => this.packTrail(t))
        };
    }
}