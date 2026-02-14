import { createPlayer } from "./templates/player";
import { createBullet } from "./templates/projectiles";

const templateRegistry = {
  player: createPlayer,
  bullet: createBullet,
} as const;

type TemplateRegistry = typeof templateRegistry;

export const createEntityFromTemplate = <T extends keyof TemplateRegistry>(
  templateName: T,
  options: Parameters<TemplateRegistry[T]>[0],
) => {
  return templateRegistry[templateName](options);
};
