export const initializeWebgpu = async (canvas: HTMLCanvasElement) => {
  if (!navigator.gpu) {
    console.error("WebGPU is not supported in this browser.");
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error("Failed to get GPU adapter.");
    return;
  }

  const device = await adapter.requestDevice();
  console.log("GPU device acquired:", device);

  const context = canvas.getContext("webgpu");
  if (!context) {
    console.error("Failed to get WebGPU context from canvas.");
    return;
  }

  context.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: "premultiplied",
  });

  return { device, context };
};
