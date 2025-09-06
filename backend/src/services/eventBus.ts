import type { EventConsumer, QueueEvent } from '../types/events.js';

export class EventBus {
  private consumers: Map<string, EventConsumer[]> = new Map();

  /**
   * Subscribe a consumer to a specific event type
   */
  subscribe(eventType: string, consumer: EventConsumer): void {
    if (!this.consumers.has(eventType)) {
      this.consumers.set(eventType, []);
    }
    this.consumers.get(eventType)!.push(consumer);
  }

  /**
   * Unsubscribe a consumer from a specific event type
   */
  unsubscribe(eventType: string, consumer: EventConsumer): void {
    const consumers = this.consumers.get(eventType);
    if (consumers) {
      const index = consumers.indexOf(consumer);
      if (index > -1) {
        consumers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all registered consumers
   */
  emit(eventType: string, data: QueueEvent): void {
    const consumers = this.consumers.get(eventType);
    if (consumers) {
      consumers.forEach(consumer => {
        try {
          consumer.handle(data);
        } catch (error) {
          console.error(`Error handling event ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Get the number of consumers for a specific event type
   */
  getConsumerCount(eventType: string): number {
    return this.consumers.get(eventType)?.length || 0;
  }

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.consumers.keys());
  }
}

// Create singleton instance
export const eventBus = new EventBus();
