type RenderTextArgs = {
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  maxWidth?: number;
};

export class TextRenderer {
  private static ctx: CanvasRenderingContext2D | null = null;

  static init(canvas: HTMLCanvasElement, canvasWidth: number, canvasHeight: number) {
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) {
      throw new Error("Failed to get 2D context for text rendering.");
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  }

  static renderText({ text, position, fontSize, color, maxWidth }: RenderTextArgs) {
    if (!this.ctx) {
      throw new Error("TextRenderer not initialized with a valid context.");
    }

    this.ctx.font = `${fontSize}px sans-serif`;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, position.x, position.y, maxWidth);
  }

  static beginFrame() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  static getCanvas(): HTMLCanvasElement | null {
    return this.ctx ? this.ctx.canvas : null;
  }
}
