#pragma once

const char* fragmentShaderSrc = R"GLSL(
#version 130
uniform float iTime;
uniform vec2 iResolution;
out vec4 fragColor;
// world origin (0,0,0)


void main() {

	vec2 uv = (gl_FragCoord.xy * 2- iResolution.xy) /iResolution.y;

	vec3 ro = vec3(0,0,-3);
	vec3 rayDir = normalize(vec3(uv,1));

	

	float a = step(uv.y, uv.x);
	float b = step(uv.y, 1.0-uv.x);
	float c = step(0.2, uv.y);

	float t = 0;

	//raymarching



	float inside = a*b*c;
	vec3 color = mix(vec3(0.0), vec3(1.0,0.4,0.2), inside);

   fragColor = vec4(color, 1.0);
}

)GLSL";
