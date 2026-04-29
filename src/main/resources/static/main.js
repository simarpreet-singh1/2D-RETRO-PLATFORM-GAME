import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import gsap from 'gsap';

// ============================================================================
// --- CONFIG & GLOBAL STATE ---
// ============================================================================
const API_URL = '';
const TILE_SIZE = 6; 
const PLAYER_SPEED = 12;
const ENEMY_SPEED = 9;
const GHOST_SPEED_BASE = 14; 
const GHOST_SPEED_MAX  = 38; 
const GHOST_ACCEL      = 5; 
const GRAVITY = -30;
const JUMP_FORCE = 12;

let currentPlayer = { username: 'Guest' };
let scene, camera, renderer, composer, clock, deltaTime;
let grid = [];
let rows = 21, cols = 21; 
let level = 1;
let score = 0;
let coinsCollected = 0;
let totalCoinsInLevel = 0;
let health = 3;
let invincibilityTime = 0;
let timeElapsed = 0;
let isGameOver = false;
let isPaused = false;
let isGameActive = false;

// Optimization state
let lastTimerValue = -1, lastHealthValue = -1, lastScoreValue = -1, lastCoinsValue = -1;
let offscreenMinimap = document.createElement('canvas');
let offscreenMinimapCtx = offscreenMinimap.getContext('2d');
let needsMinimapRedraw = true;

const uiLevel = document.getElementById('level');
const uiScore = document.getElementById('score');
const uiTimer = document.getElementById('timer');
const uiHeartsContainer = document.getElementById('hearts-container');
const uiCoinsCount = document.getElementById('coins-count');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;

// Entities
let player, enemies = [], coins = [], fruits = [], walls = [], exitZone, ghost = null;
let keys = { w: false, a: false, s: false, d: false, space: false };

// ============================================================================
// --- CORE CONCEPTS: LOGIC, AI & PHYSICS ---
// This section handles how the game "thinks", the AI, and the rules.
// ============================================================================

// --- LEVEL DATA ---
const LEVEL_CONFIGS = [
    { enemies: 3, coins: 5, fruits: 1 },
    { enemies: 5, coins: 8, fruits: 2 },
    { enemies: 6, coins: 12, fruits: 2 },
    { enemies: 5, coins: 15, fruits: 3 },
    { enemies: 6, coins: 20, fruits: 4 }
];

const LEVEL_GRIDS = [
    [ // Level 1
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
        [1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,1],
        [1,0,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1],
        [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
        [1,1,1,0,1,0,1,1,1,1,0,1,1,1,1,0,1,0,1,1,1],
        [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
        [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
        [1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
        [1,1,1,0,1,0,1,1,1,1,0,1,1,1,1,0,1,0,1,1,1],
        [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
        [1,0,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,1],
        [1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
];

// --- PATHFINDING & AI ---
function aStar(sx, sy, tx, ty) {
    const startNode = { x: sx, y: sy, g: 0, h: Math.abs(sx - tx) + Math.abs(sy - ty), parent: null };
    const openSet = [startNode], closedSet = new Set();
    while (openSet.length > 0) {
        openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
        const current = openSet.shift();
        if (current.x === tx && current.y === ty) {
            const path = []; let t = current;
            while (t.parent) { path.push({ x: t.x, y: t.y }); t = t.parent; }
            return path.reverse();
        }
        closedSet.add(`${current.x},${current.y}`);
        const neighbors = [{x:current.x+1, y:current.y}, {x:current.x-1, y:current.y}, {x:current.x, y:current.y+1}, {x:current.x, y:current.y-1}];
        for (const n of neighbors) {
            if (n.x < 0 || n.x >= cols || n.y < 0 || n.y >= rows || grid[n.y][n.x] === 1 || closedSet.has(`${n.x},${n.y}`)) continue;
            const g = current.g + 1;
            let ex = openSet.find(o => o.x === n.x && o.y === n.y);
            if (!ex) openSet.push({ ...n, g, h: Math.abs(n.x - tx) + Math.abs(n.y - ty), parent: current });
            else if (g < ex.g) { ex.g = g; ex.parent = current; }
        }
    }
    return [];
}

function updateEnemies() {
    enemies.forEach(e => {
        const d = player.mesh.position.distanceTo(e.mesh.position);
        if (d < 35) e.state = 'CHASE'; else if (d > 50) e.state = 'PATROL';
        e.lastRecompute += deltaTime;
        if (e.lastRecompute > 0.4 || e.path.length === 0) {
            const t = e.state === 'CHASE' ? {x:player.gx, y:player.gy} : {x:1, y:1};
            e.path = aStar(e.gx, e.gy, t.x, t.y); e.lastRecompute = 0;
        }
        moveEntityOnPath(e, ENEMY_SPEED);
    });
}

function moveEntityOnPath(entity, speed) {
    if (entity.path.length > 0) {
        const target = entity.path[0];
        const tx = target.x * TILE_SIZE, tz = target.y * TILE_SIZE;
        const dir = new THREE.Vector3(tx, 0, tz).sub(entity.mesh.position);
        if (dir.length() < 0.2) { entity.gx = target.x; entity.gy = target.y; entity.path.shift(); }
        else {
            entity.mesh.position.add(dir.normalize().multiplyScalar(speed * deltaTime));
            entity.mesh.rotation.y = Math.atan2(dir.x, dir.z);
            updateWalkingAnim(entity);
        }
    } else resetAnim(entity);
}

// --- PLAYER & PHYSICS ---
function updatePlayer() {
    if (player.isMoving) {
        const d = player.targetPos.distanceTo(player.mesh.position);
        if (d < 0.2) { player.mesh.position.copy(player.targetPos); player.isMoving = false; }
        else {
            player.mesh.position.add(player.targetPos.clone().sub(player.mesh.position).normalize().multiplyScalar(PLAYER_SPEED * deltaTime));
            updateWalkingAnim(player);
        }
    } else {
        let nx = player.gx, ny = player.gy;
        if (keys.w) ny--; else if (keys.s) ny++; else if (keys.a) nx--; else if (keys.d) nx++;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx] === 0) {
            player.gx = nx; player.gy = ny; player.targetPos.set(nx * TILE_SIZE, 0, ny * TILE_SIZE); player.isMoving = true;
        } else resetAnim(player);
    }
}

function winLevel() {
    isGameActive = false;
    document.getElementById('win-screen').classList.remove('hidden');
    fetch(`${API_URL}/saveScore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: currentPlayer.username, score, level, time: Math.floor(timeElapsed) })
    });
}

// ============================================================================
// --- ✨ VISUAL EFFECTS CONCEPTS: GRAPHICS & RENDERING ---
// ============================================================================

function createEnvironment() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

    const wallHeight = TILE_SIZE * 1.5;
    const wallGeo = new THREE.BoxGeometry(TILE_SIZE, wallHeight, TILE_SIZE);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1 });
    let count = 0; grid.forEach(r => r.forEach(c => { if (c === 1) count++; }));
    const wallMesh = new THREE.InstancedMesh(wallGeo, wallMat, count);
    wallMesh.castShadow = true; wallMesh.receiveShadow = true; scene.add(wallMesh);

    const dummy = new THREE.Object3D(); let idx = 0;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (grid[y][x] === 1) {
        dummy.position.set(x * TILE_SIZE, wallHeight / 2, y * TILE_SIZE); dummy.updateMatrix(); wallMesh.setMatrixAt(idx++, dummy.matrix);
    }
}

function createCharacterMesh(color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 0.8), mat);
    body.position.y = 1.2; body.castShadow = true; group.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
    head.position.y = 2.8; head.castShadow = true; group.add(head);
    const limbGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const lLeg = new THREE.Mesh(limbGeo, mat); lLeg.position.set(-0.3, 0.6, 0); group.add(lLeg);
    const rLeg = new THREE.Mesh(limbGeo, mat); rLeg.position.set(0.3, 0.6, 0); group.add(rLeg);
    const lArm = new THREE.Mesh(limbGeo, mat); lArm.position.set(-0.8, 1.4, 0); group.add(lArm);
    const rArm = new THREE.Mesh(limbGeo, mat); rArm.position.set(0.8, 1.4, 0); group.add(rArm);
    group.parts = { lLeg, rLeg, lArm, rArm };
    return group;
}

function updateWalkingAnim(entity) {
    entity.animTime = (entity.animTime || 0) + deltaTime * 10;
    const legRot = Math.sin(entity.animTime) * 0.5;
    entity.mesh.parts.lLeg.rotation.x = legRot;
    entity.mesh.parts.rLeg.rotation.x = -legRot;
}

function resetAnim(entity) {
    if (entity.mesh.parts) {
        entity.mesh.parts.lLeg.rotation.x *= 0.9;
        entity.mesh.parts.rLeg.rotation.x *= 0.9;
    }
}

function drawMinimap() {
    if (!minimapCtx) return;
    if (needsMinimapRedraw) {
        offscreenMinimap.width = cols * 4; offscreenMinimap.height = rows * 4;
        offscreenMinimapCtx.fillStyle = '#000'; offscreenMinimapCtx.fillRect(0, 0, cols * 4, rows * 4);
        offscreenMinimapCtx.fillStyle = '#fff';
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (grid[y][x] === 1) offscreenMinimapCtx.fillRect(x * 4, y * 4, 4, 4);
        needsMinimapRedraw = false;
    }
    minimapCanvas.width = cols * 4; minimapCanvas.height = rows * 4;
    minimapCtx.drawImage(offscreenMinimap, 0, 0);
    minimapCtx.fillStyle = 'red'; minimapCtx.fillRect((player.mesh.position.x / TILE_SIZE) * 4, (player.mesh.position.z / TILE_SIZE) * 4, 4, 4);
}

function updateUI() {
    if (lastScoreValue !== score && uiScore) { uiLevel.innerText = level; uiScore.innerText = score; lastScoreValue = score; }
    const currentTimer = Math.floor(timeElapsed);
    if (lastTimerValue !== currentTimer && uiTimer) { uiTimer.innerText = currentTimer + 's'; lastTimerValue = currentTimer; }
    const coinsStr = `${coinsCollected}/${totalCoinsInLevel}`;
    if (lastCoinsValue !== coinsStr && uiCoinsCount) { uiCoinsCount.innerText = coinsStr; lastCoinsValue = coinsStr; }
    if (lastHealthValue !== health && uiHeartsContainer) {
        uiHeartsContainer.innerHTML = '';
        for (let i = 0; i < Math.max(3, health); i++) {
            const h = document.createElement('div'); h.className = 'heart-icon';
            if (i >= health) h.style.opacity = '0.2';
            uiHeartsContainer.appendChild(h);
        }
        lastHealthValue = health;
    }
}

// --- UI LISTENERS ---
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

async function apiLogin(username, password) {
    const res = await fetch(`${API_URL}/login`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ username, password }) 
    });
    return res.ok;
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');
    
    if (await apiLogin(u, p)) {
        currentPlayer.username = u;
        document.getElementById('login-screen').classList.add('hidden');
        isGameActive = true;
    } else {
        errorMsg?.classList.remove('hidden');
    }
});

document.getElementById('guest-login-btn')?.addEventListener('click', () => {
    currentPlayer.username = 'Guest';
    document.getElementById('login-screen').classList.add('hidden');
    isGameActive = true;
});

// ============================================================================
// --- 🏁 ENGINE START ---
// ============================================================================

function init() {
    const container = document.getElementById('game-container');
    if (!container) return;
    scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.1, 0.85);
    composer.addPass(bloom);
    composer.addPass(new SMAAPass(window.innerWidth, window.innerHeight));
    composer.addPass(new OutputPass());

    clock = new THREE.Clock(); grid = LEVEL_GRIDS[0];
    createEnvironment();
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(100, 200, 100); sun.castShadow = true; scene.add(sun);

    player = { mesh: createCharacterMesh(0xff3333), gx: 1, gy: 1, targetPos: new THREE.Vector3(TILE_SIZE, 0, TILE_SIZE), isMoving: false };
    scene.add(player.mesh); camera.position.set(TILE_SIZE, 30, TILE_SIZE + 30); camera.lookAt(player.mesh.position);

    document.getElementById('loading-screen')?.classList.add('hidden');

    const animateLoop = () => {
        requestAnimationFrame(animateLoop);
        deltaTime = clock.getDelta();
        if (!isGameActive || isPaused) return;
        timeElapsed += deltaTime;
        updatePlayer(); updateEnemies(); drawMinimap(); updateUI();
        composer.render();
    };
    animateLoop();
}

init();
