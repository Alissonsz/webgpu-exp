struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) fragColor: vec4<f32>,
    @location(1) fragTexCoord: vec2<f32>,
}

@group(0) @binding(0) var<uniform> view: mat4x4<f32>;
@group(0) @binding(1) var<uniform> model: mat4x4<f32>;
@group(0) @binding(2) var tileTexture: texture_2d<f32>;
@group(0) @binding(3) var tileSampler: sampler;

@fragment
fn main(fragData: VertexOut) -> @location(0) vec4<f32> {
    return textureSample(tileTexture, tileSampler, fragData.fragTexCoord);
}
