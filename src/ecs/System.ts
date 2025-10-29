import { OpaqueEntity } from "./EntityManager.ts";
import { ComponentClass, Component } from "./Component";
import { World } from "./World";

export abstract class System {
  protected world: World;
  protected requiredComponents: ComponentClass<Component>[] = [];

  protected constructor() { }

  setWorld(world: World) {
    this.world = world;
  }

  abstract update(deltaTime: number): void;

  getEntitiesWithRequiredComponents(): OpaqueEntity[] {
    if (this.requiredComponents.length === 0) {
      return [];
    }

    const componentManager = this.world.getComponentManager();
    const firstComponent = this.requiredComponents[0];
    const candidateEntities = componentManager.getEntitiesWithComponent(firstComponent);

    return candidateEntities.filter(entity =>
      this.requiredComponents.every(component =>
        componentManager.hasComponent(entity, component)
      )
    );
  }
}
