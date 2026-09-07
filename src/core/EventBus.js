/**
 * Lesa.io - Core EventBus Messaging System
 * Enables decoupled, type-safe publish/subscribe communication between subsystems
 */

class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event 
     * @param {Function} callback 
     * @returns {Function} Unsubscribe handle
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event once
     * @param {string} event 
     * @param {Function} callback 
     */
    once(event, callback) {
        const off = this.on(event, (...args) => {
            off();
            callback(...args);
        });
        return off;
    }

    /**
     * Unsubscribe from an event
     * @param {string} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        const set = this.listeners.get(event);
        if (set) {
            set.delete(callback);
            if (set.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Emit an event to all subscribers
     * @param {string} event 
     * @param {*} payload 
     */
    emit(event, payload) {
        const set = this.listeners.get(event);
        if (!set || set.size === 0) return;

        for (const cb of Array.from(set)) {
            try {
                cb(payload);
            } catch (err) {
                console.error(`[EventBus] Error in listener for event "${event}":`, err);
            }
        }
    }

    /**
     * Clear all registered listeners
     */
    clear() {
        this.listeners.clear();
    }
}

// Global Singleton Instance
const globalEventBus = new EventBus();

if (typeof window !== 'undefined') {
    window.EventBus = globalEventBus;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventBus, globalEventBus };
}
