// src/network/NetworkManager.ts
import Peer, { DataConnection } from 'peerjs';

export type NetworkRole = 'HOST' | 'CLIENT' | 'OFFLINE';

export class NetworkManager {
    private peer: Peer | null = null;
    private connection: DataConnection | null = null;
    public role: NetworkRole = 'OFFLINE';

    // Decoupled Logic Hooks
    public onReady?: (roomId: string) => void;
    public onConnected?: () => void;
    public onDataReceived?: (data: any) => void;
    public onDisconnected?: () => void;
    public onError?: (err: Error | string) => void;

    // --------------------------------------------------------
    // HOST LOGIC
    // --------------------------------------------------------
    public hostGame(): void {
        this.role = 'HOST';
        
        // Generate a random 5-character alphanumeric room code
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        this.peer = new Peer(roomId);

        this.peer.on('open', (id) => {
            console.log(`[Network] Hosting Room: ${id}`);
            if (this.onReady) this.onReady(id);
        });

        this.peer.on('connection', (conn) => {
            console.log(`[Network] Client connecting...`);
            
            // If someone tries to connect while we already have a player, reject them
            if (this.connection && this.connection.open) {
                console.warn(`[Network] Rejecting extra connection.`);
                conn.close();
                return;
            }

            this.connection = conn;
            this.setupConnectionListeners(this.connection);
        });

        this.peer.on('error', (err) => {
            if (this.onError) this.onError(err);
        });
    }

    // --------------------------------------------------------
    // CLIENT LOGIC
    // --------------------------------------------------------
    public joinGame(roomId: string): void {
        this.role = 'CLIENT';
        this.peer = new Peer(); // Client doesn't need a specific ID

        this.peer.on('open', () => {
            console.log(`[Network] Attempting to join Room: ${roomId}`);
            this.connection = this.peer!.connect(roomId, { reliable: false }); // UDP-style preference for fast game states
            this.setupConnectionListeners(this.connection);
        });

        this.peer.on('error', (err) => {
            if (this.onError) this.onError(err);
        });
    }

    // --------------------------------------------------------
    // SHARED LOGIC
    // --------------------------------------------------------
    private setupConnectionListeners(conn: DataConnection): void {
        conn.on('open', () => {
            console.log(`[Network] Connection established!`);
            if (this.onConnected) this.onConnected();
        });

        conn.on('data', (data) => {
            if (this.onDataReceived) this.onDataReceived(data);
        });

        conn.on('close', () => {
            console.log(`[Network] Connection lost.`);
            this.connection = null;
            this.role = 'OFFLINE';
            if (this.onDisconnected) this.onDisconnected();
        });
        
        conn.on('error', (err) => {
            if (this.onError) this.onError(err);
        });
    }

    public sendData(data: any): void {
        if (this.connection && this.connection.open) {
            this.connection.send(data);
        }
    }

    public disconnect(): void {
        if (this.connection) this.connection.close();
        if (this.peer) this.peer.destroy();
        this.role = 'OFFLINE';
    }
}