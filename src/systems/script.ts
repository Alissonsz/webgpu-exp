import { ScriptComponent } from "../components";
import { System } from "../ecs";

export class ScriptSystem extends System {
  constructor() {
    super();
  }

  update(deltaTime: number) {
    const components = this.world.getComponentManager().getComponentsOfType(ScriptComponent);

    for (const [e, s] of components) {
      (s as any).script.onUpdate(deltaTime);
    }
  }
}
