import { Entity, EntityManager } from "./Entity";
import { Component, ComponentClass, ComponentManager } from "./Component";
import { System } from "./System";

export class World {
  private entityManager: EntityManager;
  private componentManager: ComponentManager;
  private systems: System[] = [];

  constructor() {
    this.entityManager = new EntityManager();
    this.componentManager = new ComponentManager();
  }

  createEntity(): Entity {
    return this.entityManager.createEntity();
  }

  destroyEntity(entity: Entity): void {
    this.componentManager.removeAllComponents(entity);
    this.entityManager.destroyEntity(entity);
  }

  addComponent<T extends Component>(
    entity: Entity,
    componentClass: ComponentClass<T>,
    component: T
  ): void {
    this.componentManager.addComponent(entity, componentClass, component);
  }

  removeComponent<T extends Component>(
    entity: Entity,
    componentClass: ComponentClass<T>
  ): void {
    this.componentManager.removeComponent(entity, componentClass);
  }

  getComponent<T extends Component>(
    entity: Entity,
    componentClass: ComponentClass<T>
  ): T | undefined {
    return this.componentManager.getComponent(entity, componentClass);
  }

  hasComponent<T extends Component>(
    entity: Entity,
    componentClass: ComponentClass<T>
  ): boolean {
    return this.componentManager.hasComponent(entity, componentClass);
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  update(deltaTime: number): void {
    const entities = this.entityManager.getActiveEntities();
    for (const system of this.systems) {
      system.update(deltaTime, entities);
    }
  }

  getComponentManager(): ComponentManager {
    return this.componentManager;
  }

  getEntityManager(): EntityManager {
    return this.entityManager;
  }

  clear(): void {
    this.systems = [];
    this.componentManager.clear();
    this.entityManager.clear();
  }
}
