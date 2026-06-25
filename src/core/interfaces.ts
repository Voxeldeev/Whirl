// src/core/interfaces.ts

export interface Transform {
    x: number;
    y: number;
}

export interface Velocity {
    vx: number;
    vy: number;
}

export enum PlayerState {
    IDLE = 'IDLE',
    MOVING = 'MOVING',
    DASHING = 'DASHING',
    BLOCKING = 'BLOCKING',
    KNOCKED_BACK = 'KNOCKED_BACK',
    DEAD = 'DEAD'
}

export enum BoomerangState {
    HIDDEN = 'HIDDEN',
    CHARGING = 'CHARGING',
    LIVE = 'LIVE',
    GHOST = 'GHOST',
    RECALL = 'RECALL',
    DECELERATING = 'DECELERATING'
}

export interface AABB {
    x: number;
    y: number;
    width: number;
    height: number;
}