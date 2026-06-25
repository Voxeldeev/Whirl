// src/ui/LobbyUI.ts
import { ModifierId } from '../core/Modifiers';
const CARDS = [
    { id: ModifierId.SPEED, title: 'SPEED', desc: '3x Velocity\n0.5x Damage', type: 'A' },
    { id: ModifierId.RANGE, title: 'RANGE', desc: '1.5x Distance\n0.8x Damage', type: 'A' },
    { id: ModifierId.POWER, title: 'POWER', desc: '2.0x Damage\n0.5x Distance', type: 'A' },
    { id: ModifierId.TELEKINESIS, title: 'TELEKINESIS', desc: 'Tracks mouse during recall.', type: 'B' },
    { id: ModifierId.BULLET, title: 'BULLET', desc: 'Instant rapid fire. No recall.', type: 'B' },
    { id: ModifierId.DIVIDE, title: 'DIVIDE', desc: 'Splits into 3 clones on throw.', type: 'B' },
    { id: ModifierId.SNAIL, title: 'SNAIL', desc: 'Leaves a movement slowing trail.', type: 'B' },
    { id: ModifierId.DEMO, title: 'DEMO', desc: 'Block detonates boomerangs.', type: 'B' },
    { id: ModifierId.REVIVE, title: 'REVIVE', desc: 'Homing ghosts. Prevents death.', type: 'B' }
];
export class LobbyUI {
    network;
    onReadyToStart;
    selectedColor = '#00a8ff';
    slotA = null;
    slotB1 = null;
    slotB2 = null;
    constructor(network) {
        this.network = network;
        this.initializeUI();
        this.bindNetworkEvents();
    }
    initializeUI() {
        // 1. Color Picker
        const colorGrid = document.getElementById('color-options');
        const colors = [
            /* Row 1: Reds and Oranges */
            '#0022FF', '#0A01FF', '#3503FF', '#6004FF',
            '#8B05FF', '#B507FF', '#DF08FF', '#FF09F6',
            '#FF0BCD', '#FF0CA5', '#FF0D7D', '#FF0E55',
            '#FF102E', '#FF1B11', '#FF4312', '#FF6C14',
            '#FF9415', '#FFBB16', '#FFE218', '#F5FF19',
            '#CFFF1A', '#A9FF1C', '#84FF1D', '#5FFF1E',
            '#3BFF20', '#21FF2B', '#22FF51', '#23FF77',
            '#25FF9C', '#26FFC1', '#27FFE6', '#29F4FF',
            '#2AD1FF', '#2BAEFF', '#2D8BFF', '#2E69FF',
            '#202020', '#808080', '#BEBEBE', '#FFFFFF'
        ];
        colors.forEach((color, i) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.background = color;
            swatch.dataset.color = color;
            if (i === 0)
                swatch.classList.add('active');
            swatch.addEventListener('click', (e) => {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedColor = color;
                document.getElementById('player-sprite').style.borderColor = color;
                document.querySelector('.player-indicator').style.borderLeftColor = color;
            });
            colorGrid.appendChild(swatch);
        });
        // 2. Build Card Grid
        const grid = document.getElementById('card-grid');
        CARDS.forEach(card => {
            const el = document.createElement('div');
            el.className = `card ${card.type === 'A' ? 'red' : 'yellow'}`;
            el.innerHTML = `<h3>${card.title}</h3><p>${card.desc.replace('\n', '<br>')}</p>`;
            el.addEventListener('click', () => this.tryEquip(card, el));
            grid.appendChild(el);
        });
        // 3. Slot Listeners
        document.getElementById('slot-a').addEventListener('click', () => this.unequip('A'));
        document.getElementById('slot-b1').addEventListener('click', () => this.unequip('B1'));
        document.getElementById('slot-b2').addEventListener('click', () => this.unequip('B2'));
        // 4. Network/Start
        document.getElementById('btn-host').addEventListener('click', () => this.network.hostGame());
        document.getElementById('btn-join').addEventListener('click', () => {
            const code = document.getElementById('input-code').value.toUpperCase();
            if (code.length === 5)
                this.network.joinGame(code);
        });
        document.getElementById('btn-start').addEventListener('click', () => {
            if (this.onReadyToStart) {
                const loadout = [this.slotA, this.slotB1, this.slotB2].filter(c => c !== null).map(c => c.id);
                document.getElementById('lobby-ui').classList.add('hidden');
                this.onReadyToStart(loadout, this.selectedColor);
            }
        });
    }
    tryEquip(card, el) {
        // Logic: A-Slot (Orange) accepts A or B. B-Slots (Yellow) only accept B.
        if (!this.slotA && (card.type === 'A' || card.type === 'B')) {
            this.slotA = card;
            this.updateSlot('slot-a', card);
        }
        else if (!this.slotB1 && card.type === 'B') {
            this.slotB1 = card;
            this.updateSlot('slot-b1', card);
        }
        else if (!this.slotB2 && card.type === 'B') {
            this.slotB2 = card;
            this.updateSlot('slot-b2', card);
        }
        else {
            return; // Slots full or invalid type
        }
        el.classList.add('disabled');
    }
    unequip(slotId) {
        let card = null;
        if (slotId === 'A') {
            card = this.slotA;
            this.slotA = null;
            this.clearSlot('slot-a', 'CLASS A');
        }
        else if (slotId === 'B1') {
            card = this.slotB1;
            this.slotB1 = null;
            this.clearSlot('slot-b1', 'CLASS B');
        }
        else if (slotId === 'B2') {
            card = this.slotB2;
            this.slotB2 = null;
            this.clearSlot('slot-b2', 'CLASS B');
        }
        if (card)
            this.enableCardInGrid(card.id);
    }
    updateSlot(slotId, card) {
        const slot = document.getElementById(slotId);
        slot.innerHTML = `<h3>${card.title}</h3><p style="font-size: 0.7rem; color: #aaa; margin:0;">${card.desc.replace('\n', '<br>')}</p>`;
    }
    clearSlot(slotId, label) {
        document.getElementById(slotId).innerHTML = `<span class="slot-label">${label}</span>`;
    }
    enableCardInGrid(id) {
        const index = CARDS.findIndex(c => c.id === id);
        if (index !== -1)
            document.getElementById('card-grid').children[index].classList.remove('disabled');
    }
    bindNetworkEvents() {
        this.network.onReady = (roomId) => {
            document.getElementById('net-status').innerText = 'WAITING...';
            document.getElementById('room-code').innerText = roomId;
        };
        this.network.onConnected = () => {
            document.getElementById('net-status').innerText = 'CONNECTED';
            document.getElementById('btn-start').classList.remove('hidden');
        };
    }
}
