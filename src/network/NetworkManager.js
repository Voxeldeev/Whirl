// src/network/NetworkManager.ts
import Peer from 'peerjs';
export class NetworkManager {
    peer = null;
    connection = null;
    role = 'OFFLINE';
    onReady;
    onConnected;
    onDataReceived;
    onDisconnected;
    onError;
    // --------------------------------------------------------
    // HOST LOGIC
    // --------------------------------------------------------
    hostGame() {
        this.role = 'HOST';
        const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
        this.peer = new Peer(roomId);
        // ADDED : string
        this.peer.on('open', (id) => {
            console.log(`[Network] Hosting Room: ${id}`);
            if (this.onReady)
                this.onReady(id);
        });
        // ADDED : DataConnection
        this.peer.on('connection', (conn) => {
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
        this.peer.on('error', (err) => {
            if (this.onError)
                this.onError(err);
        });
    }
    // --------------------------------------------------------
    // CLIENT LOGIC
    // --------------------------------------------------------
    joinGame(roomId) {
        this.role = 'CLIENT';
        this.peer = new Peer();
        this.peer.on('open', () => {
            console.log(`[Network] Attempting to join Room: ${roomId}`);
            this.connection = this.peer.connect(roomId, { reliable: false });
            this.setupConnectionListeners(this.connection);
        });
        // ADDED : any
        this.peer.on('error', (err) => {
            if (this.onError)
                this.onError(err);
        });
    }
    // --------------------------------------------------------
    // SHARED LOGIC
    // --------------------------------------------------------
    setupConnectionListeners(conn) {
        conn.on('open', () => {
            console.log(`[Network] Connection established!`);
            if (this.onConnected)
                this.onConnected();
        });
        // ADDED : any
        conn.on('data', (data) => {
            if (this.onDataReceived)
                this.onDataReceived(data);
        });
        conn.on('close', () => {
            console.log(`[Network] Connection lost.`);
            this.connection = null;
            this.role = 'OFFLINE';
            if (this.onDisconnected)
                this.onDisconnected();
        });
        // ADDED : any
        conn.on('error', (err) => {
            if (this.onError)
                this.onError(err);
        });
    }
    sendData(data) {
        if (this.connection && this.connection.open) {
            this.connection.send(data);
        }
    }
    disconnect() {
        if (this.connection)
            this.connection.close();
        if (this.peer)
            this.peer.destroy();
        this.role = 'OFFLINE';
    }
}
