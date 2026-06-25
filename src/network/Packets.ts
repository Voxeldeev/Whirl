// src/network/Packets.ts

export enum PacketType {
    CLIENT_INPUT = 'CLIENT_INPUT',
    GAME_STATE = 'GAME_STATE',
    MATCH_EVENT = 'MATCH_EVENT'
}

export interface ClientInputPacket {
    type: PacketType.CLIENT_INPUT;
    keys: {
        w: boolean;
        a: boolean;
        s: boolean;
        d: boolean;
        space: boolean;
        spacePressed: boolean;
    };
    mouse: {
        x: number;
        y: number;
        leftDown: boolean;
        rightDown: boolean;
        leftPressed: boolean;
    };
}

export interface GameStatePacket {
    type: PacketType.GAME_STATE;
    players: { id: string, x: number, y: number, hp: number, state: string, rotation: number, color: string }[];
    boomerangs: { id: string, ownerId: string, x: number, y: number, state: string, rotationAngle: number, radius: number, chargePercent: number }[];
    explosions: { id: string, x: number, y: number, radius: number, lifePercent: number }[];
    trails: { id: string, x: number, y: number, radius: number, lifePercent: number }[];
}