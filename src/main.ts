// src/main.ts

import './style.css';
import { Theme } from './core/Theme';
import { GameLoop } from './core/GameLoop';
import { InputManager } from './core/InputManager';
import { ModifierId } from './core/Modifiers';
import { Player } from './entities/Player';
import { Boomerang } from './entities/Boomerang';
import { Obstacle } from './entities/Obstacle';
import { Explosion } from './entities/Explosion';
import { Trail } from './entities/Trail';
import { PlayerController } from './systems/PlayerController';
import { PuppetController } from './systems/PuppetController';
import { BoomerangController } from './systems/BoomerangController';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { CombatSystem } from './systems/CombatSystem';
import { TimerSystem } from './systems/TimerSystem';
import { ExplosionSystem } from './systems/ExplosionSystem';
import { TrailSystem } from './systems/TrailSystem';
import { PlayerRenderer } from './systems/PlayerRenderer';
import { BoomerangRenderer } from './systems/BoomerangRenderer';
import { ObstacleRenderer } from './systems/ObstacleRenderer';
import { ExplosionRenderer } from './systems/ExplosionRenderer';
import { TrailRenderer } from './systems/TrailRenderer';
import { NetworkManager } from './network/NetworkManager';
import { Serializer } from './network/Serializer';
import { PacketType, GameStatePacket, ClientInputPacket } from './network/Packets';
import { PlayerState, BoomerangState } from './core/interfaces';
import { LobbyUI } from './ui/LobbyUI';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const input = new InputManager(canvas);
const network = new NetworkManager();
const lobby = new LobbyUI(network);

const localPlayer = new Player('player_1', canvas.width / 4, canvas.height / 2);
const remotePlayer = new Player('player_2', (canvas.width / 4) * 3, canvas.height / 2);
const allPlayers = [localPlayer, remotePlayer];
let allExplosions: Explosion[] = []; 
let allTrails: Trail[] = [];
let allBoomerangs: Boomerang[] = [];
const boomerangControllers: BoomerangController[] = [];

let remoteInputState = {
    keys: { w: false, a: false, s: false, d: false, space: false },
    mouse: { x: 0, y: 0, leftDown: false, rightDown: false }
};

function spawnTrail(t: Trail) { allTrails.push(t); }
function spawnBoomerang(b: Boomerang) {
    allBoomerangs.push(b);
    boomerangControllers.push(new BoomerangController(b, localPlayer, input, spawnBoomerang, spawnTrail));
}

const levelObstacles = [new Obstacle('wall_test', 900, 260, 200, 200)];

const timerSystem = new TimerSystem();
const explosionSystem = new ExplosionSystem();
const trailSystem = new TrailSystem();
const playerController = new PlayerController(localPlayer, input, timerSystem, allBoomerangs, allExplosions, allPlayers, allTrails);
const remotePuppetController = new PuppetController(remotePlayer);
const physicsSystem = new PhysicsSystem();
physicsSystem.setObstacles(levelObstacles);
const combatSystem = new CombatSystem();
combatSystem.setEntities(allPlayers, allBoomerangs, allExplosions, allTrails, timerSystem); 

const playerRenderer = new PlayerRenderer(localPlayer, ctx);
const remotePlayerRenderer = new PlayerRenderer(remotePlayer, ctx);
const boomerangRenderer = new BoomerangRenderer(ctx); 
const obstacleRenderer = new ObstacleRenderer(ctx);
const explosionRenderer = new ExplosionRenderer(ctx); 
const trailRenderer = new TrailRenderer(ctx);

network.onDataReceived = (data: any) => {
    if (network.role === 'HOST' && data.type === PacketType.CLIENT_INPUT) remoteInputState = data as ClientInputPacket;
    if (network.role === 'CLIENT' && data.type === PacketType.GAME_STATE) applyGameState(data as GameStatePacket);
};

function authoritativeUpdate(dt: number) {
    timerSystem.update(dt);
    explosionSystem.update(dt, allExplosions);
    trailSystem.update(dt, allTrails);
    playerController.update(dt);
    handleRemoteInput(dt);
    remotePuppetController.update(dt);
    for (let i = boomerangControllers.length - 1; i >= 0; i--) {
        const controller = boomerangControllers[i];
        const boomerang = allBoomerangs[i];
        controller.update(dt);
        if (boomerang.isDead) {
            boomerangControllers.splice(i, 1);
            allBoomerangs.splice(i, 1);
            continue;
        }
        physicsSystem.update(localPlayer, boomerang);
        physicsSystem.update(remotePlayer, boomerang);
    }
    combatSystem.update();
    if (network.role === 'HOST') {
        const statePacket: GameStatePacket = {
            type: PacketType.GAME_STATE,
            ...Serializer.packGameState(allPlayers, allBoomerangs, allExplosions, allTrails)
        };
        network.sendData(statePacket);
    }
}

function clientUpdate() {
    network.sendData({ type: PacketType.CLIENT_INPUT, ...input.exportInputState() });
}

function applyGameState(state: GameStatePacket) {
    if (!state || !state.players || !state.boomerangs || !state.explosions || !state.trails) {
        return;
    }

    state.players.forEach(pData => {
        const p = allPlayers.find(player => player.id === pData.id);
        if (p) {
            p.transform.x = pData.x; 
            p.transform.y = pData.y; 
            p.hp = pData.hp;
            p.state = pData.state as PlayerState; 
            p.rotation = pData.rotation; 
            p.color = pData.color;
        }
    });
    allBoomerangs = state.boomerangs.map(bData => {
        const b = new Boomerang(bData.id, bData.ownerId, []);
        b.transform.x = bData.x; b.transform.y = bData.y; b.state = bData.state as BoomerangState;
        b.rotationAngle = bData.rotationAngle; b.radius = bData.radius;
        return b;
    });
    allExplosions = state.explosions.map(eData => {
        const e = new Explosion(eData.id, '', eData.x, eData.y);
        e.radius = eData.radius; e.lifeTimer = eData.lifePercent * 0.25; e.maxLife = 0.25;
        return e;
    });
    allTrails = state.trails.map(tData => {
        const t = new Trail(tData.id, '', tData.x, tData.y, tData.radius, 5.0);
        t.lifeTimer = tData.lifePercent * 5.0;
        return t;
    });
}

function handleRemoteInput(dt: number) {
    if (remotePlayer.state === PlayerState.DEAD || remotePlayer.state === PlayerState.KNOCKED_BACK) return;
    const { keys, mouse } = remoteInputState;
    let vx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    let vy = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    if (vx !== 0 && vy !== 0) { const l = Math.sqrt(vx*vx + vy*vy); vx/=l; vy/=l; }
    remotePlayer.targetVelocity.vx = vx * remotePlayer.speed;
    remotePlayer.targetVelocity.vy = vy * remotePlayer.speed;
    remotePlayer.rotation = Math.atan2(mouse.y - remotePlayer.transform.y, mouse.x - remotePlayer.transform.x);
    const maxDelta = (remotePlayer.speed / 0.075) * dt;
    remotePlayer.velocity.vx += Math.sign(remotePlayer.targetVelocity.vx - remotePlayer.velocity.vx) * Math.min(Math.abs(remotePlayer.targetVelocity.vx - remotePlayer.velocity.vx), maxDelta);
    remotePlayer.velocity.vy += Math.sign(remotePlayer.targetVelocity.vy - remotePlayer.velocity.vy) * Math.min(Math.abs(remotePlayer.targetVelocity.vy - remotePlayer.velocity.vy), maxDelta);
    remotePlayer.transform.x += remotePlayer.velocity.vx * dt;
    remotePlayer.transform.y += remotePlayer.velocity.vy * dt;
}

const engine = new GameLoop((dt) => {
    if (network.role === 'CLIENT') clientUpdate();
    else authoritativeUpdate(dt);
    input.resetFrame();
}, render);

function render() {
    ctx.fillStyle = Theme.arenaBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = Theme.arenaBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    trailRenderer.render(allTrails);
    obstacleRenderer.render(levelObstacles);
    playerRenderer.render();
    remotePlayerRenderer.render();
    boomerangRenderer.render(allBoomerangs);
    explosionRenderer.render(allExplosions);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(input.mouseX, input.mouseY, 3, 0, Math.PI * 2);
    ctx.fill();
}

lobby.onReadyToStart = (loadout, color) => {
    localPlayer.color = color;
    spawnBoomerang(new Boomerang('boom_1', localPlayer.id, loadout));
    engine.start();
};

window.addEventListener('beforeunload', () => {
    network.disconnect();
});