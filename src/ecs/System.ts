import { Entity } from "./Entity";
import { ComponentManager, ComponentClass, Component } from "./Component";

export abstract class System {
  protected componentManager: ComponentManager;
  protected requiredComponents: ComponentClass<Component>[] = [];

  constructor(componentManager: ComponentManager) {
    this.componentManager = componentManager;
  }

  abstract update(deltaTime: number, entities: Entity[]): void;

  getEntitiesWithRequiredComponents(): Entity[] {
    if (this.requiredComponents.length === 0) {
      return [];
    }

    const firstComponent = this.requiredComponents[0];
    const candidateEntities = this.componentManager.getEntitiesWithComponent(firstComponent);

    return candidateEntities.filter(entity =>
      this.requiredComponents.every(component =>
        this.componentManager.hasComponent(entity, component)
      )
    );
  }
}
