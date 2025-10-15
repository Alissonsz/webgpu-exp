enum Keys {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  KeyW,
  KeyA,
  KeyS,
  KeyD,
  Space,
}

export class InputState {
  private static keyboardState: Record<Keys, boolean> = {
    [Keys.ArrowUp]: false,
    [Keys.ArrowDown]: false,
    [Keys.ArrowLeft]: false,
    [Keys.ArrowRight]: false,
    [Keys.KeyW]: false,
    [Keys.KeyA]: false,
    [Keys.KeyS]: false,
    [Keys.KeyD]: false,
    [Keys.Space]: false,
  };

  static initialize() {
    window.addEventListener("keydown", (event) => {
      const key = event.code as keyof typeof Keys;
      if (key in Keys) {
        InputState.keyboardState[Keys[key]] = true;
      }
    });

    window.addEventListener("keyup", (event) => {
      const key = event.code as keyof typeof Keys;
      if (key in Keys) {
        InputState.keyboardState[Keys[key]] = false;
      }
    });
  }

  static isKeyPressed(key: Keys): boolean {
    return InputState.keyboardState[key];
  }
}
