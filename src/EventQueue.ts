enum Topic {
  LEVEL_START,
}

type TopicListener = (arg: any) => void;
type GameEvent = {
  topic: Topic;
  data: any;
};

export class EventQueue {
  private static queue: Record<Topic, Array<GameEvent>>;
  private static listeners: Record<Topic, Array<TopicListener>>;

  static initialize() {
    this.listeners[Topic.LEVEL_START] = [];
  }

  static registerListener(topic: Topic, listener: TopicListener) {
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
