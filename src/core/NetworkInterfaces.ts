// src/core/NetworkInterfaces.ts

// What the Client sends to the Host (60x a second)
export interface ClientInputPayload {
    keysHeld: string[];
    keysPressed: string[];
    mouseX: number;
    mouseY: number;
    isLeftMouseDown: boolean;
    wasLeftMousePressed: boolean;
    isRightMouseDown: boolean;
}

// What the Host sends back to the Client (60x a second)
export interface GameStatePayload {
    players: SerializedPlayer[];
    boomerangs: SerializedBoomerang[];
    explosions: SerializedExplosion[];
    trails: SerializedTrail[];
}

export interface SerializedPlayer {
    id: string;
    x: number;
    y: number;
    rotation: number;
    hp: number;
    color: string;
    state: string;
}

export interface SerializedBoomerang {
    id: string;
    x: number;
    y: number;
    rotation: number;
    radius: number;
    state: string;
    chargePercent: number;
    isGhost: boolean;
}

export interface SerializedExplosion {
    x: number;
    y: number;
    radius: number;
    alpha: number;
}

export interface SerializedTrail {
    x: number;
    y: number;
    radius: number;
    alpha: number;
}