export type Entity = number;

export class EntityManager {
  private nextId: number = 0;
  private freedIds: Entity[] = [];
  private activeEntities: Set<Entity> = new Set();

  createEntity(): Entity {
    let id: Entity;
    if (this.freedIds.length > 0) {
      id = this.freedIds.pop()!;
    } else {
      id = this.nextId++;
    }
    this.activeEntities.add(id);
    return id;
  }

  destroyEntity(entity: Entity): void {
    if (!this.activeEntities.has(entity)) {
      console.warn(`Attempting to destroy non-existent entity: ${entity}`);
      return;
    }
    this.activeEntities.delete(entity);
    this.freedIds.push(entity);
  }

  isActive(entity: Entity): boolean {
    return this.activeEntities.has(entity);
  }

  getActiveEntities(): Entity[] {
    return Array.from(this.activeEntities);
  }

  clear(): void {
    this.activeEntities.clear();
    this.freedIds = [];
    this.nextId = 0;
  }
}
