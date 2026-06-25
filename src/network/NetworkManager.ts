// src/network/NetworkManager.ts
import Peer, { DataConnection } from 'peerjs';

export type NetworkRole = 'HOST' | 'CLIENT' | 'OFFLINE';

export class NetworkManager {
    private peer: Peer | null = null;
    private connection: DataConnection | null = null;
    public role: NetworkRole = 'OFFLINE';

    public onReady?: (roomId: string) => void;
    public onConnected?: () => void;
    public onDataReceived?: (data: any) => void;
    public onDisconnected?: () => void;
    public onError?: (err: Error | any) => void;

    // --------------------------------------------------------
    // HOST LOGIC
    // --------------------------------------------------------
    public hostGame(): void {
        this.role = 'HOST';
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        this.peer = new Peer(roomId);

        // ADDED : string
        this.peer.on('open', (id: string) => {
            console.log(`[Network] Hosting Room: ${id}`);
            if (this.onReady) this.onReady(id);
        });

        // ADDED : DataConnection
        this.peer.on('connection', (conn: DataConnection) => {
            console.log(`[Network] Client connecting...`);
            if (this.connection && this.connection.open) {
                console.warn(`[Network] Rejecting extra connection.`);
                conn.close();
                return;
            }
            this.connection = conn;
            this.setupConnectionListeners(this.connection);
        });

        // ADDED : any
        this.peer.on('error', (err: any) => {
            if (this.onError) this.onError(err);
        });
    }

    // --------------------------------------------------------
    // CLIENT LOGIC
    // --------------------------------------------------------
    public joinGame(roomId: string): void {
        this.role = 'CLIENT';
        this.peer = new Peer(); 

        this.peer.on('open', () => {
            console.log(`[Network] Attempting to join Room: ${roomId}`);
            this.connection = this.peer!.connect(roomId, { reliable: false }); 
            this.setupConnectionListeners(this.connection);
        });

        // ADDED : any
        this.peer.on('error', (err: any) => {
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

        // ADDED : any
        conn.on('data', (data: any) => {
            if (this.onDataReceived) this.onDataReceived(data);
        });

        conn.on('close', () => {
            console.log(`[Network] Connection lost.`);
            this.connection = null;
            this.role = 'OFFLINE';
            if (this.onDisconnected) this.onDisconnected();
        });
        
        // ADDED : any
        conn.on('error', (err: any) => {
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