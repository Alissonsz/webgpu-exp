diagnostic(off, derivative_uniformity);

@group(0) @binding(0) var<uniform> view: mat4x4<f32>;
@group(0) @binding(1) var texSampler: sampler;
@group(0) @binding(2)  var tex0:  texture_2d<f32>;
@group(0) @binding(3)  var tex1:  texture_2d<f32>;
@group(0) @binding(4)  var tex2:  texture_2d<f32>;
@group(0) @binding(5)  var tex3:  texture_2d<f32>;
@group(0) @binding(6)  var tex4:  texture_2d<f32>;
@group(0) @binding(7)  var tex5:  texture_2d<f32>;
@group(0) @binding(8)  var tex6:  texture_2d<f32>;
@group(0) @binding(9)  var tex7:  texture_2d<f32>;
@group(0) @binding(10) var tex8:  texture_2d<f32>;
@group(0) @binding(11) var tex9:  texture_2d<f32>;
@group(0) @binding(12) var tex10: texture_2d<f32>;
@group(0) @binding(13) var tex11: texture_2d<f32>;
@group(0) @binding(14) var tex12: texture_2d<f32>;
@group(0) @binding(15) var tex13: texture_2d<f32>;
@group(0) @binding(16) var tex14: texture_2d<f32>;
@group(0) @binding(17) var tex15: texture_2d<f32>;

struct VertexInput {
  @location(0) pos: vec2f,
  @location(1) texCoords: vec2f,
  @location(2) texId: f32,
  @location(3) color: vec4f,
};

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) texCoords: vec2f,
  @location(1) texId: f32,
  @location(2) color: vec4f,
};

@vertex
fn vertexMain(vertexInput: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.pos = view * vec4f(vertexInput.pos, -1, 1);
  output.texCoords = vertexInput.texCoords;
  output.texId = vertexInput.texId;
  output.color = vertexInput.color;

  return output;
}

@fragment
fn fragmentMain(vertexOutput: VertexOutput) -> @location(0) vec4<f32> {
  switch u32(vertexOutput.texId) {
    case 0:  { return textureSample(tex0,  texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 1:  { return textureSample(tex1,  texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 2:  { return textureSample(tex2,  texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 3:  { return textureSample(tex3,  texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 4:  { return textureSample(tex4,  texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 5:  { return textureSample(tex5,  texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 6:  { return textureSample(tex6,  texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 7:  { return textureSample(tex7,  texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 8:  { return textureSample(tex8,  texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 9:  { return textureSample(tex9,  texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 10: { return textureSample(tex10, texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 11: { return textureSample(tex11, texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 12: { return textureSample(tex12, texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 13: { return textureSample(tex13, texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 14: { return textureSample(tex14, texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    case 15: { return textureSample(tex15, texSampler, vertexOutput.texCoords) * vertexOutput.color; }
    default: { return vec4f(0.5, 0.5, 0.6, 1.0); }
  }
}
