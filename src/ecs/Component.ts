import { OpaqueEntity } from "./EntityManager.ts";

export interface Component {}

export type ComponentClass<T extends Component> = new (...args: any[]) => T;

export class ComponentManager {
  components: Map<string, Map<OpaqueEntity, Component>> = new Map();

  addComponent<T extends Component>(entity: OpaqueEntity, component: T): void {
    const componentName = component.constructor.name;
    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
    }
    this.components.get(componentName)!.set(entity, component);
  }

  removeComponent<T extends Component>(entity: OpaqueEntity, componentClass: ComponentClass<T>): void {
    const componentName = componentClass.name;
    const componentMap = this.components.get(componentName);
    if (componentMap) {
      componentMap.delete(entity);
    }
  }

  getComponent<T extends Component>(entity: OpaqueEntity, componentClass: ComponentClass<T>): T | undefined {
    const componentName = componentClass.name;
    const componentMap = this.components.get(componentName);
    return componentMap?.get(entity) as T | undefined;
  }

  getComponentsOfType<T extends Component>(componentClass: ComponentClass<T>): Map<OpaqueEntity, T> {
    const componentName = componentClass.name;
    const componentMap = this.components.get(componentName);
    return (componentMap as Map<OpaqueEntity, T>) || new Map();
  }

  hasComponent<T extends Component>(entity: OpaqueEntity, componentClass: ComponentClass<T>): boolean {
    const componentName = componentClass.name;
    return this.components.get(componentName)?.has(entity) ?? false;
  }

  getAllComponentsForEntity(entity: OpaqueEntity): Component[] {
    const result: Component[] = [];
    for (const componentMap of this.components.values()) {
      const component = componentMap.get(entity);
      if (component) {
        result.push(component);
      }
    }
    return result;
  }

  getEntitiesWithComponent<T extends Component>(componentClass: ComponentClass<T>): OpaqueEntity[] {
    const componentName = componentClass.name;
    const componentMap = this.components.get(componentName);
    return componentMap ? Array.from(componentMap.keys()) : [];
  }

  removeAllComponents(entity: OpaqueEntity): void {
    for (const componentMap of this.components.values()) {
      componentMap.delete(entity);
    }
  }

  clear(): void {
    this.components.clear();
  }
}
