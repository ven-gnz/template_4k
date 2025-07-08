#version 130
uniform float iTime;
uniform vec2 iResolution;
out vec4 fragColor;
// world origin (0,0,0)

float sdSphere(vec3 p, float s)
{
	return length(p)-s;
}

float map(vec3 p) {
vec3 spherePos = vec3(sin(iTime)*3,0,0);
float sphere = sdSphere(p- spherePos, 1.);

	return sphere;
}




void main() {

	//the texture coordinates
	vec2 uv = (gl_FragCoord.xy * 2- iResolution.xy) /iResolution.y;

	vec3 rayOrigin = vec3(0,0,-3);
	vec3 rayDir = normalize(vec3(uv,1));
	vec3 color = vec3(0);


	//raymarching
	float t = 0.;

	for(int i = 0; i < 80; i++) 
	{
		vec3 point = rayOrigin + rayDir * t;

		float d = map(point);

		t += d;

		if(d < 0.001) break;
		if(t > 100.) break;

	}

	color = vec3(t * .2);
	

    fragColor = vec4(color, 1.0);
}
