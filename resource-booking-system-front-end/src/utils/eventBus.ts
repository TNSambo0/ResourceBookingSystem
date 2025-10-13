type EventHandler = (data?: any) => void;

const eventBus = {
    events: new Map<string, EventHandler[]>(),

    on(event: string, handler: EventHandler) {
        if (!this.events.has(event)) this.events.set(event, []);
        this.events.get(event)!.push(handler);
    },

    emit(event: string, data?: any) {
        this.events.get(event)?.forEach(handler => handler(data));
    },

    off(event: string, handler: EventHandler) {
        const handlers = this.events.get(event);
        if (!handlers) return;
        this.events.set(event, handlers.filter(h => h !== handler));
    },
};

export default eventBus;
