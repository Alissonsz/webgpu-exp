enum Topic {
  LEVEL_START,
}

interface EventDataMap {
  [Topic.LEVEL_START]: { levelNumber: number };
}

export interface GameEvent<T extends Topic = Topic> {
  topic: T;
  data: EventDataMap[T];
}

type EventHandler<T extends Topic = Topic> = (data: EventDataMap[T]) => void;

export class EventQueue {
  private static queue: Record<Topic, Array<GameEvent>>;
  private static listeners: Record<Topic, Array<EventHandler>>;

  static initialize() {
    this.listeners[Topic.LEVEL_START] = [];
  }

  static registerListener(topic: Topic, listener: EventHandler) {
    this.listeners[topic].push(listener);
  }

  static publish(event: GameEvent) {
    this.queue[event.topic].push(event);
    this.listeners[event.topic].forEach((listener) => listener(event.data));
  }

  static consume(topic: Topic): GameEvent | undefined {
    return this.queue[topic].shift();
  }
}
