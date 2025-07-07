#pragma once

const char* embeddedFragmentShader = R"(

#version 130
uniform float iTime;
uniform vec2 iResolution;
out vec4 fragColor;



void main() {
	vec2 uv = gl_FragCoord.xy /iResolution;

	float a = step(uv.y, uv.x);
	float b = step(uv.y, 1.0-uv.x);
	float c = step(0.2, uv.y);

	float inside = a*b*c;
	vec3 color = mix(vec3(0.0), vec3(1.0,0.4,0.2), inside);

   fragColor = vec4(color, 1.0);
}
)";