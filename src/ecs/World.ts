import { OpaqueEntity, EntityManager } from "./EntityManager.ts";
import { Component, ComponentClass, ComponentManager } from "./Component";
import { System } from "./System";
import { ActivationStatusComponent, TagComponent, TransformComponent } from "./ComponentTypes.ts";
import { Vec2 } from "@gustavo4passos/wgpu-matrix";

class Entity {
  private entity: OpaqueEntity;
  private world: World;

  constructor(entity: OpaqueEntity, world: World) {
    this.entity = entity;
    this.world = world;
  }

  addComponent<T extends Component>(
    component: T
  ): void {
    this.world.addComponent(this.entity, component);
  }

  removeComponent<T extends Component>(
    componentClass: ComponentClass<T>
  ): void {
    this.world.removeComponent(this.entity, componentClass);
  }

  getComponent<T extends Component>(
    componentClass: ComponentClass<T>
  ): T | undefined {
    return this.world.getComponent(this.entity, componentClass);
  }

  hasComponent<T extends Component>(
    componentClass: ComponentClass<T>
  ): boolean {
    return this.world.hasComponent(this.entity, componentClass);
  }
}

export class World {
  private entityManager: EntityManager;
  private componentManager: ComponentManager;
  private systems: System[] = [];

  constructor() {
    this.entityManager = new EntityManager();
    this.componentManager = new ComponentManager();
  }

  createEntity(tag?: string, isActive?: boolean, pos?: Vec2, size?: Vec2): Entity {
    const e = this.entityManager.createEntity();
    this.componentManager.addComponent(e, new TagComponent(tag));
    this.componentManager.addComponent(e, new ActivationStatusComponent(isActive));
    this.componentManager.addComponent(e, new TransformComponent(pos, size));

    return new Entity(e, this);
  }

  destroyEntity(entity: OpaqueEntity): void {
    this.componentManager.removeAllComponents(entity);
    this.entityManager.destroyEntity(entity);
  }

  addComponent<T extends Component>(
    entity: OpaqueEntity,
    component: T
  ): void {
    this.componentManager.addComponent(entity, component);
  }

  removeComponent<T extends Component>(
    entity: OpaqueEntity,
    componentClass: ComponentClass<T>
  ): void {
    this.componentManager.removeComponent(entity, componentClass);
  }

  getComponent<T extends Component>(
    entity: OpaqueEntity,
    componentClass: ComponentClass<T>
  ): T | undefined {
    return this.componentManager.getComponent(entity, componentClass);
  }

  hasComponent<T extends Component>(
    entity: OpaqueEntity,
    componentClass: ComponentClass<T>
  ): boolean {
    return this.componentManager.hasComponent(entity, componentClass);
  }

  *queryComponents<T extends Component[], C extends { [K in keyof T]: ComponentClass<T[K]> }
    > (...componentClasses: C): Generator<[Entity, ...T]> {
    if (componentClasses.length === 0) return;

    const firstClass = componentClasses[0];
    const firstMap = this.componentManager.components.get(firstClass.name);
    if (!firstMap) return; // No instance of this kind of component exist

    for (const [entity, firstComponent] of firstMap.entries()) {
      let includesAll = true;
      const components: Component[] = [firstComponent];

      for (let i = 1; i < componentClasses.length; i++) {
        const cls = componentClasses[i];
        const componentMap = this.componentManager.components.get(cls.name);

        if (!componentMap) return;

        const component = componentMap.get(entity);
        if (!component) {
          includesAll = false;
          break;
        }
        components.push(component);
      }

      if (includesAll) {
        const e = new Entity(entity, this);
        yield [e, ...(components as T)];
      }
    }
  }

  addSystem(system: System): void {
    system.setWorld(this);
    this.systems.push(system);
  }

  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  update(deltaTime: number): void {
    const entities = this.entityManager.getEntities();
    for (const system of this.systems) {
      system.update(deltaTime);
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
