// src/systems/TimerSystem.ts
export class TimerSystem {
    events = [];
    /**
     * Queues a function to run after a specific delay in seconds.
     */
    setTimer(delayInSeconds, callback) {
        this.events.push({ timeLeft: delayInSeconds, callback });
    }
    update(dt) {
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
