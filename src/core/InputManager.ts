// src/core/InputManager.ts

export class InputManager {
    // Tracks if a key is currently physically held down
    private keys: Map<string, boolean> = new Map();
    
    // Tracks keys that were pressed THIS EXACT FRAME
    private keysPressedThisFrame: Map<string, boolean> = new Map();

    // Mouse tracking
    public mouseX: number = 0;
    public mouseY: number = 0;
    public isLeftMouseDown: boolean = false;
    public wasLeftMousePressed: boolean = false;
    public isRightMouseDown: boolean = false;
    

    constructor(private canvas: HTMLCanvasElement) {
        this.attachListeners();
    }

    private attachListeners(): void {
        // Keyboard Events
        window.addEventListener('keydown', (e) => {
            // Prevent default scrolling for spacebar and arrows
            if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
                e.preventDefault();
            }
            
            // Only trigger "pressed this frame" if it wasn't already down
            if (!this.keys.get(e.code)) {
                this.keysPressedThisFrame.set(e.code, true);
            }
            this.keys.set(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.set(e.code, false);
        });

        // Mouse Movement (relative to canvas)
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Scale mouse coordinates in case the canvas is resized via CSS
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
        });

        // Mouse Buttons
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                // Only trigger if it wasn't already down
                if (!this.isLeftMouseDown) this.wasLeftMousePressed = true;
                this.isLeftMouseDown = true;
            }
            if (e.button === 2) this.isRightMouseDown = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.isLeftMouseDown = false;
            if (e.button === 2) this.isRightMouseDown = false;
        });

        // Prevent right-click context menu popping up on block
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Checks if a key is currently held down.
     * Use this for continuous movement (WASD).
     */
    public isKeyHeld(code: string): boolean {
        return !!this.keys.get(code);
    }

    /**
     * Checks if a key was pressed exactly this frame.
     * Use this for one-off actions (Dash).
     */
    public wasKeyPressed(code: string): boolean {
        return !!this.keysPressedThisFrame.get(code);
    }

    /**
     * MUST be called at the very end of the game loop to clear single-frame inputs.
     */
    public resetFrame(): void {
        this.keysPressedThisFrame.clear();
        this.wasLeftMousePressed = false;
    }

    // NEW: Extract raw state for network transmission
    public exportInputState() {
        return {
            keys: {
                w: this.isKeyHeld('KeyW'),
                a: this.isKeyHeld('KeyA'),
                s: this.isKeyHeld('KeyS'),
                d: this.isKeyHeld('KeyD'),
                space: this.isKeyHeld('Space')
            },
            mouse: {
                x: Math.round(this.mouseX),
                y: Math.round(this.mouseY),
                leftDown: this.isLeftMouseDown,
                rightDown: this.isRightMouseDown
            }
        };
    }
}