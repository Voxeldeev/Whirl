// src/main.ts
import './style.css';
import { Theme } from './core/Theme';
import { GameLoop } from './core/GameLoop';
import { InputManager } from './core/InputManager';
import { Player } from './entities/Player';
import { Boomerang } from './entities/Boomerang';
import { Obstacle } from './entities/Obstacle';
import { Explosion } from './entities/Explosion';
import { Trail } from './entities/Trail';
import { PlayerController } from './systems/PlayerController'; // Added ControllerInput
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
import { PacketType } from './network/Packets';
import { LobbyUI } from './ui/LobbyUI';
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const input = new InputManager(canvas);
const network = new NetworkManager();
const lobby = new LobbyUI(network);
const localPlayer = new Player('player_1', canvas.width / 4, canvas.height / 2);
const remotePlayer = new Player('player_2', (canvas.width / 4) * 3, canvas.height / 2);
const allPlayers = [localPlayer, remotePlayer];
let allExplosions = [];
let allTrails = [];
let allBoomerangs = [];
const boomerangControllers = [];
let remoteInputState = {
    keys: { w: false, a: false, s: false, d: false, space: false, spacePressed: false },
    mouse: { x: 0, y: 0, leftDown: false, rightDown: false, leftPressed: false }
};
let isRemoteReady = false;
let remoteLoadout = [];
let localHostLoadout = null;
function spawnTrail(t) { allTrails.push(t); }
function spawnBoomerang(b) {
    allBoomerangs.push(b);
    const isLocal = b.ownerId === localPlayer.id;
    const owner = isLocal ? localPlayer : remotePlayer;
    const inputAdapter = isLocal ? {
        getMouseX: () => input.mouseX,
        getMouseY: () => input.mouseY,
        isLeftDown: () => input.isLeftMouseDown,
        isLeftPressed: () => input.wasLeftMousePressed
    } : {
        getMouseX: () => remoteInputState.mouse.x,
        getMouseY: () => remoteInputState.mouse.y,
        isLeftDown: () => remoteInputState.mouse.leftDown,
        isLeftPressed: () => remoteInputState.mouse.leftPressed
    };
    boomerangControllers.push(new BoomerangController(b, owner, inputAdapter, spawnBoomerang, spawnTrail));
}
const levelObstacles = [new Obstacle('wall_test', 900, 260, 200, 200)];
const timerSystem = new TimerSystem();
const explosionSystem = new ExplosionSystem();
const trailSystem = new TrailSystem();
// --- NEW: ADAPTERS FOR PLAYER CONTROLLER ---
const localInputAdapter = {
    getMouseX: () => input.mouseX,
    getMouseY: () => input.mouseY,
    isRightDown: () => input.isRightMouseDown,
    isKeyHeld: (code) => input.isKeyHeld(code),
    wasKeyPressed: (code) => input.wasKeyPressed(code)
};
const remoteInputAdapter = {
    getMouseX: () => remoteInputState.mouse.x,
    getMouseY: () => remoteInputState.mouse.y,
    isRightDown: () => remoteInputState.mouse.rightDown,
    isKeyHeld: (code) => {
        if (code === 'KeyW')
            return remoteInputState.keys.w;
        if (code === 'KeyA')
            return remoteInputState.keys.a;
        if (code === 'KeyS')
            return remoteInputState.keys.s;
        if (code === 'KeyD')
            return remoteInputState.keys.d;
        if (code === 'Space')
            return remoteInputState.keys.space;
        return false;
    },
    wasKeyPressed: (code) => {
        if (code === 'Space')
            return remoteInputState.keys.spacePressed;
        return false;
    }
};
// Controllers - BOTH now use PlayerController with their respective adapters!
const playerController = new PlayerController(localPlayer, localInputAdapter, timerSystem, allBoomerangs, allExplosions, allPlayers, allTrails);
const remoteActionController = new PlayerController(remotePlayer, remoteInputAdapter, timerSystem, allBoomerangs, allExplosions, allPlayers, allTrails);
// (PuppetController has been entirely deleted)
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
network.onDataReceived = (data) => {
    if (data.type === PacketType.MATCH_EVENT) {
        if (network.role === 'HOST' && data.action === 'CLIENT_READY') {
            remoteLoadout = data.payload.loadout;
            remotePlayer.color = data.payload.color;
            isRemoteReady = true;
            checkHostStart();
        }
        else if (network.role === 'CLIENT' && data.action === 'START_MATCH') {
            engine.start();
        }
        return;
    }
    if (network.role === 'HOST' && data.type === PacketType.CLIENT_INPUT)
        remoteInputState = data;
    if (network.role === 'CLIENT' && data.type === PacketType.GAME_STATE)
        applyGameState(data);
};
function checkHostStart() {
    if (network.role === 'HOST' && localHostLoadout !== null && isRemoteReady) {
        spawnBoomerang(new Boomerang('boom_1', localPlayer.id, localHostLoadout));
        spawnBoomerang(new Boomerang('boom_2', remotePlayer.id, remoteLoadout));
        network.sendData({ type: PacketType.MATCH_EVENT, action: 'START_MATCH' });
        engine.start();
    }
}
function authoritativeUpdate(dt) {
    timerSystem.update(dt);
    explosionSystem.update(dt, allExplosions);
    trailSystem.update(dt, allTrails);
    // Updates both players smoothly using their unique input sources
    playerController.update(dt);
    remoteActionController.update(dt);
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
        const statePacket = {
            type: PacketType.GAME_STATE,
            ...Serializer.packGameState(allPlayers, allBoomerangs, allExplosions, allTrails)
        };
        network.sendData(statePacket);
    }
    // Wipe remote single-frame triggers AFTER the controller has processed them
    remoteInputState.keys.spacePressed = false;
    remoteInputState.mouse.leftPressed = false;
}
function clientUpdate() {
    network.sendData({ type: PacketType.CLIENT_INPUT, ...input.exportInputState() });
}
function applyGameState(state) {
    if (!state || !state.players || !state.boomerangs || !state.explosions || !state.trails)
        return;
    state.players.forEach(pData => {
        const p = allPlayers.find(player => player.id === pData.id);
        if (p) {
            p.transform.x = pData.x;
            p.transform.y = pData.y;
            p.hp = pData.hp;
            p.state = pData.state;
            p.rotation = pData.rotation;
            p.color = pData.color;
        }
    });
    allBoomerangs = state.boomerangs.map(bData => {
        const b = new Boomerang(bData.id, bData.ownerId, []);
        b.transform.x = bData.x;
        b.transform.y = bData.y;
        b.state = bData.state;
        b.rotationAngle = bData.rotationAngle;
        b.radius = bData.radius;
        return b;
    });
    allExplosions = state.explosions.map(eData => {
        const e = new Explosion(eData.id, '', eData.x, eData.y);
        e.radius = eData.radius;
        e.lifeTimer = eData.lifePercent * 0.25;
        e.maxLife = 0.25;
        return e;
    });
    allTrails = state.trails.map(tData => {
        const t = new Trail(tData.id, '', tData.x, tData.y, tData.radius, 5.0);
        t.lifeTimer = tData.lifePercent * 5.0;
        return t;
    });
}
const engine = new GameLoop((dt) => {
    if (network.role === 'CLIENT')
        clientUpdate();
    else
        authoritativeUpdate(dt);
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
    if (network.role === 'CLIENT') {
        network.sendData({
            type: PacketType.MATCH_EVENT,
            action: 'CLIENT_READY',
            payload: { loadout, color }
        });
    }
    else {
        localHostLoadout = loadout;
        checkHostStart();
    }
};
window.addEventListener('beforeunload', () => {
    network.disconnect();
});
