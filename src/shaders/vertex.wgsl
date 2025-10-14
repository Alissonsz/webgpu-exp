struct VertexOut {
    @builtin(position) position: vec4<f32>,
    @location(0) fragColor: vec4<f32>,
    @location(1) fragTexCoord: vec2<f32>,
}

@group(0) @binding(0) var<uniform> view: mat4x4<f32>;
@group(0) @binding(1) var<uniform> model: mat4x4<f32>;
@group(0) @binding(2) var tileTexture: texture_2d<f32>;

@vertex
fn main(@location(0) position: vec3<f32>, @location(1) texCoord: vec2<f32>) -> VertexOut {
    var out: VertexOut;
    let texSize = vec2f(textureDimensions(tileTexture));

    out.position = view * model * vec4<f32>(position, 1.0);
    out.fragColor = vec4<f32>(0.0, 1.0, 0.0, 1.0);
    out.fragTexCoord = texCoord / texSize;
    return out;
}
