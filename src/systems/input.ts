import { System } from "../ecs";
import { InputState, Keys } from "../InputState";

export class InputSystem extends System {
  constructor() {
    super();
  }

  update(deltaTime: number): void {
    const keyboardState = InputState.getKeyboardState();
    for (const k in keyboardState) {
      const key = k as unknown as Keys;
      const isPressed = keyboardState[key];
      const lastState = InputState.getKeyState(key);

      if (isPressed && !lastState.pressed) {
        // Key was just pressed
        InputState.setKeyState(key, {
          pressed: true,
          lastPressedTime: performance.now(),
          isHeld: false,
        });
      } else if (!isPressed && lastState.pressed) {
        // Key was just released
        InputState.setKeyState(key, {
          pressed: false,
          lastPressedTime: InputState.getKeyState(key).lastPressedTime,
          isHeld: false,
        });
      } else if (isPressed && lastState.pressed) {
        // Key is being held down
        InputState.setKeyState(key, {
          ...lastState,
          isHeld: true,
        });
      }
    }
  }
}
