export type OpaqueEntity = number;

export class EntityManager {
  private nextId: number = 0;
  private freedIds: OpaqueEntity[] = [];
  private activeEntities: OpaqueEntity[] = [];

  constructor() {
  }

  createEntity(): OpaqueEntity {
    let id: OpaqueEntity;
    if (this.freedIds.length > 0) {
      id = this.freedIds.pop()!;
    } else {
      id = this.nextId++;
    }
    this.activeEntities.push(id);
    return id;
  }

  destroyEntity(entity: OpaqueEntity): void {
    const entityIndex = this.activeEntities.indexOf(entity);
    if (entityIndex == -1) {
      console.warn(`Attempting to destroy non-existent entity: ${entity}`);
      return;
    }
    this.activeEntities.splice(entityIndex, 1);
    this.freedIds.push(entity);
  }

  isActive(entity: OpaqueEntity): boolean {
    return this.activeEntities.indexOf(entity) != -1;
  }

  getEntities(): OpaqueEntity[] {
    return Array.from(this.activeEntities);
  }

  clear(): void {
    this.activeEntities = [];
    this.freedIds = [];
    this.nextId = 0;
  }
}
