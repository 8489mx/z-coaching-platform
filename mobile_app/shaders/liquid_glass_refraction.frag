#version 460 core
#include <flutter/runtime_effect.glsl>

// Parameters passed from Flutter
uniform vec2 uSize;            // Size of the filter region / canvas (width, height)
uniform vec2 uLensCenter;      // Center of the lens (x, y)
uniform vec2 uLensRadius;      // Half-dimensions of the lens (rx, ry)
uniform float uRefraction;     // Refraction strength (default ~0.06)
uniform float uMagnification;  // Optical magnification factor (default ~1.28)
uniform float uStretchAngle;   // Direction of motion stretch in radians
uniform float uActivity;       // 0.0 = resting pill, 1.0 = active moving liquid droplet
uniform float uDirection;      // Direction sign: -1.0 = leftwards, 1.0 = rightwards

// Sampler 0 is automatically bound to the backdrop texture by ImageFilter.shader
uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
    vec2 fragCoord = FlutterFragCoord().xy;
    vec2 uv = fragCoord / uSize;

    // Relative displacement vector from the lens optical center
    vec2 offset = fragCoord - uLensCenter;

    // Normalized coordinates inside the elliptical lens bounds
    vec2 norm = offset / max(uLensRadius, vec2(1.0, 1.0));
    float distSq = dot(norm, norm);

    // When outside the lens boundary, or when settled in resting state, sample backdrop directly
    if (distSq >= 1.0 || uActivity < 0.005) {
        fragColor = texture(uTexture, uv);
        return;
    }

    float dist = sqrt(distSq);

    // Convex droplet dome profile: height z = sqrt(1 - distSq)
    float z = sqrt(max(0.0, 1.0 - distSq));

    // Surface normal of the convex dome: N = normalize(-norm.x, -norm.y, z * 1.5)
    vec3 normal = normalize(vec3(-norm.x, -norm.y, z * 1.5));

    // Directional elongation along motion vector
    vec2 motionDir = vec2(cos(uStretchAngle), sin(uStretchAngle));
    float velocityBias = dot(norm, motionDir) * 0.12;

    // 1. Refraction displacement (Snell's Law approximation at glass-air boundary)
    // Displaces texture coordinates based on the surface slope of the droplet
    vec2 refractVec = (normal.xy + motionDir * velocityBias) * (uRefraction * (1.0 - z * 0.4) * uActivity);

    // 2. Optical Magnification (convex lens effect pulling coordinates towards optical center)
    vec2 centerUV = uLensCenter / uSize;
    vec2 magnifyVec = (uv - centerUV) * (1.0 - (1.0 / max(uMagnification, 1.0))) * z * uActivity;

    vec2 targetUV = uv - refractVec - magnifyVec;
    targetUV = clamp(targetUV, vec2(0.001), vec2(0.999));

    // 3. Chromatic dispersion (subtle optical aberration near meniscus rim)
    float rimFactor = smoothstep(0.70, 0.98, dist) * uActivity;
    vec2 caOffset = norm * 0.0035 * rimFactor;

    float r = texture(uTexture, clamp(targetUV - caOffset, vec2(0.0), vec2(1.0))).r;
    float g = texture(uTexture, targetUV).g;
    float b = texture(uTexture, clamp(targetUV + caOffset, vec2(0.0), vec2(1.0))).b;
    float a = texture(uTexture, targetUV).a;

    vec4 color = vec4(r, g, b, a);

    // 4. Specular Fresnel highlight on top-leading edge of the moving glass droplet
    vec3 lightDir = normalize(vec3(-0.35, -0.75, 0.85));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 22.0);
    color.rgb += vec3(spec * 0.55 * uActivity);

    // 5. Bright glass perimeter rim (total internal reflection at the meniscus edge)
    float rimGlint = smoothstep(0.88, 0.97, dist) * (1.0 - smoothstep(0.97, 1.0, dist));
    color.rgb += vec3(rimGlint * 0.42 * uActivity);

    // 6. Subtle glass body luminescence (frosted crystalline tint)
    vec3 glassLuminescence = vec3(0.96, 0.98, 1.0);
    color.rgb = mix(color.rgb, glassLuminescence, 0.05 * (1.0 - z) * uActivity);

    fragColor = color;
}
