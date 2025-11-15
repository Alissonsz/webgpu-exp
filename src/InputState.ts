type KeyState = {
  pressed: boolean;
  lastPressedTime: number;
  isHeld: boolean;
};

type KeysState = { [key: string]: KeyState };

export enum Keys {
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

  private static keysState: KeysState = {};

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

    // Initialize keysState
    for (const key in Keys) {
      if (isNaN(Number(key))) {
        InputState.keysState[Keys[key as keyof typeof Keys]] = {
          pressed: false,
          lastPressedTime: 0,
          isHeld: false,
        };
      }
    }
  }

  static isKeyPressed(key: Keys): boolean {
    return InputState.keyboardState[key];
  }

  static getKeyboardState(): Record<Keys, boolean> {
    return InputState.keyboardState;
  }

  static getKeysState(): KeysState {
    return InputState.keysState;
  }

  static getKeyState(key: Keys): KeyState | undefined {
    {
      return InputState.keysState[key];
    }
  }

  static setKeyState(key: Keys, state: KeyState): void {
    InputState.keysState[key] = state;
  }
}
