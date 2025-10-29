import { Entity } from "./Entity";

export interface Component {}

export type ComponentClass<T extends Component> = new (...args: any[]) => T;

export class ComponentManager {
  private components: Map<string, Map<Entity, Component>> = new Map();

  addComponent<T extends Component>(
    entity: Entity,
    componentClass: ComponentClass<T>,
    component: T
  ): void {
    const componentName = componentClass.name;
    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
    }
    this.components.get(componentName)!.set(entity, component);
  }

  removeComponent<T extends Component>(
    entity: Entity,
    componentClass: ComponentClass<T>
  ): void {
    const componentName = componentClass.name;
    const componentMap = this.components.get(componentName);
    if (componentMap) {
      componentMap.delete(entity);
    }
  }

  getComponent<T extends Component>(
    entity: Entity,
    componentClass: ComponentClass<T>
  ): T | undefined {
    const componentName = componentClass.name;
    const componentMap = this.components.get(componentName);
    return componentMap?.get(entity) as T | undefined;
  }

  hasComponent<T extends Component>(
    entity: Entity,
    componentClass: ComponentClass<T>
  ): boolean {
    const componentName = componentClass.name;
    return this.components.get(componentName)?.has(entity) ?? false;
  }

  getAllComponentsForEntity(entity: Entity): Component[] {
    const result: Component[] = [];
    for (const componentMap of this.components.values()) {
      const component = componentMap.get(entity);
      if (component) {
        result.push(component);
      }
    }
    return result;
  }

  getEntitiesWithComponent<T extends Component>(
    componentClass: ComponentClass<T>
  ): Entity[] {
    const componentName = componentClass.name;
    const componentMap = this.components.get(componentName);
    return componentMap ? Array.from(componentMap.keys()) : [];
  }

  removeAllComponents(entity: Entity): void {
    for (const componentMap of this.components.values()) {
      componentMap.delete(entity);
    }
  }

  clear(): void {
    this.components.clear();
  }
}
