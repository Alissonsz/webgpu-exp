export enum Topic {
  LEVEL_START,
  COLLISION,
}

interface EventDataMap {
  [Topic.LEVEL_START]: { levelNumber: number };
  [Topic.COLLISION]: { entityA: number; entityB?: number };
}

export interface GameEvent<T extends Topic = Topic> {
  topic: T;
  data: EventDataMap[T];
}

type EventHandler<T extends Topic = Topic> = (data: EventDataMap[T]) => void;

export class EventBus {
  private static listeners: Map<Topic, Set<EventHandler>> = new Map();

  static initialize() {
    Object.values(Topic).forEach((topic) => {
      if (typeof topic === "number") {
        this.listeners.set(topic, new Set());
      }
    });
  }

  static subscribe<T extends Topic>(topic: T, listener: EventHandler<T>): () => void {
    this.listeners.get(topic).add(listener);

    return () => {
      this.listeners.get(topic)?.delete(listener);
    };
  }

  static publish(event: GameEvent) {
    this.listeners.get(event.topic).forEach((listener) => listener(event.data));
  }

  static printListeners() {
    this.listeners.forEach((listeners, topic) => {
      console.log(`Topic: ${Topic[topic]} (${topic}), Listeners: ${listeners.size}`);
    });
  }
}
