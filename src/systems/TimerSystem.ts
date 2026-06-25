// src/systems/TimerSystem.ts

interface QueuedEvent {
    timeLeft: number;
    callback: () => void;
}

export class TimerSystem {
    private events: QueuedEvent[] = [];

    /**
     * Queues a function to run after a specific delay in seconds.
     */
    public setTimer(delayInSeconds: number, callback: () => void): void {
        this.events.push({ timeLeft: delayInSeconds, callback });
    }

    public update(dt: number): void {
        // Loop backwards so splicing doesn't skip elements
        for (let i = this.events.length - 1; i >= 0; i--) {
            this.events[i].timeLeft -= dt;
            
            if (this.events[i].timeLeft <= 0) {
                // Execute the callback
                this.events[i].callback();
                // Remove from the queue
                this.events.splice(i, 1);
            }
        }
    }
}