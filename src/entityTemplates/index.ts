import { createPlayer } from "./templates/player";

const templateRegistry = {
  player: createPlayer,
} as const;

type TemplateRegistry = typeof templateRegistry;

export const createEntityFromTemplate = <T extends keyof TemplateRegistry>(
  templateName: T,
  options: Parameters<TemplateRegistry[T]>[0],
) => {
  return templateRegistry[templateName](options);
};
