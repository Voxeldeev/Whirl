// src/main.ts

import './style.css'; 

// Core
import { GameLoop } from './core/GameLoop';
import { InputManager } from './core/InputManager';
import { ModifierId } from './core/Modifiers';

// Entities
import { Player } from './entities/Player';
import { Boomerang } from './entities/Boomerang';
import { Obstacle } from './entities/Obstacle';
import { Explosion } from './entities/Explosion';

// Systems / Controllers
import { PlayerController } from './systems/PlayerController';
import { PuppetController } from './systems/PuppetController';
import { BoomerangController } from './systems/BoomerangController';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { CombatSystem } from './systems/CombatSystem';
import { TimerSystem } from './systems/TimerSystem';
import { ExplosionSystem } from './systems/ExplosionSystem';

// Renderers
import { PlayerRenderer } from './systems/PlayerRenderer';
import { BoomerangRenderer } from './systems/BoomerangRenderer';
import { ObstacleRenderer } from './systems/ObstacleRenderer';
import { ExplosionRenderer } from './systems/ExplosionRenderer';

// ----------------------------------------------------------------------------
// 1. ENGINE SETUP
// ----------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const input = new InputManager(canvas);

// ----------------------------------------------------------------------------
// 2. DATA INSTANTIATION
// ----------------------------------------------------------------------------

// Test Loadout (Feel free to change these modifiers to test)
const myLoadout = [
    ModifierId.DEMOMANIAC,
    ModifierId.BULLET,
    ModifierId.TELEKINESIS
];

const localPlayer = new Player('player_1', canvas.width / 4, canvas.height / 2);
const targetDummy = new Player('dummy_1', canvas.width / 2, canvas.height / 2);
targetDummy.hp = 500; 

const allPlayers = [localPlayer, targetDummy];
const allExplosions: Explosion[] = []; 

// Dynamic Weapon Arrays
const allBoomerangs: Boomerang[] = [];
const boomerangControllers: BoomerangController[] = [];

// Spawner Callback
function spawnBoomerang(b: Boomerang) {
    allBoomerangs.push(b);
    boomerangControllers.push(new BoomerangController(b, localPlayer, input, spawnBoomerang));
}

// Spawn the base weapon
const baseBoomerang = new Boomerang('boom_1', localPlayer.id, myLoadout);
spawnBoomerang(baseBoomerang);

const testWall = new Obstacle('wall_test', 900, 260, 200, 200);
const levelObstacles = [testWall];

// ----------------------------------------------------------------------------
// 3. SYSTEM INSTANTIATION
// ----------------------------------------------------------------------------

const timerSystem = new TimerSystem();
const explosionSystem = new ExplosionSystem();

const playerController = new PlayerController(localPlayer, input, timerSystem, allBoomerangs, allExplosions);
const dummyController = new PuppetController(targetDummy);

const physicsSystem = new PhysicsSystem();
physicsSystem.setObstacles(levelObstacles);

const combatSystem = new CombatSystem();
combatSystem.setEntities(allPlayers, allBoomerangs, allExplosions, timerSystem); 

// Renderers
const playerRenderer = new PlayerRenderer(localPlayer, ctx);
const dummyRenderer = new PlayerRenderer(targetDummy, ctx);
const boomerangRenderer = new BoomerangRenderer(ctx); 
const obstacleRenderer = new ObstacleRenderer(ctx);
const explosionRenderer = new ExplosionRenderer(ctx); 

// ----------------------------------------------------------------------------
// 4. GAME LOOP
// ----------------------------------------------------------------------------

function update(dt: number) {
    // A. Lifecycles & Timers
    timerSystem.update(dt);
    explosionSystem.update(dt, allExplosions);

    // B. Player Logic
    playerController.update(dt);
    dummyController.update(dt);
    
    // Lock the player's movement if they are actively charging their base weapon
    if (baseBoomerang.state === 'CHARGING') {
        localPlayer.targetVelocity = { vx: 0, vy: 0 };
    }

    // C. Dynamic Boomerang Loop
    // Iterate backwards so we can safely splice `isDead` clones out of the array
    for (let i = boomerangControllers.length - 1; i >= 0; i--) {
        const controller = boomerangControllers[i];
        const boomerang = allBoomerangs[i];
        
        controller.update(dt);

        // Garbage collection for clones
        if (boomerang.isDead) {
            boomerangControllers.splice(i, 1);
            allBoomerangs.splice(i, 1);
            continue;
        }

        // Apply physics boundaries per active boomerang
        physicsSystem.update(localPlayer, boomerang);
        physicsSystem.update(targetDummy, boomerang);
    }

    // D. Combat Referees (Processes hits for all players, boomerangs, and explosions)
    combatSystem.update();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Environment (Bottom)
    obstacleRenderer.render(levelObstacles);

    // Entities (Middle)
    playerRenderer.render();
    dummyRenderer.render();
    boomerangRenderer.render(allBoomerangs); 
    
    // VFX (Top)
    explosionRenderer.render(allExplosions); 

    // Crosshair (Overlay)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(input.mouseX, input.mouseY, 5, 0, Math.PI * 2);
    ctx.fill();
}

function loopWrapper(dt: number) {
    update(dt);
    input.resetFrame(); 
}

const engine = new GameLoop(loopWrapper, render);
engine.start();

console.log("Whirl - Phase 4 Engine Initialized");