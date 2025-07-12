#version 130
uniform float iTime;
uniform vec2 iResolution;
out vec4 fragColor;
// world origin (0,0,0)



float spPlane(vec3 p, vec3 n, float h)
{
	return dot(p,n) + h;
}

float sdSphere(vec3 p, float s)
{
	return length(p)-s;
}

float sdBox(vec3 p, vec3 b) 
{
	vec3 q = abs(p)-b;
	return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);

}

float smin(float a, float b, float k)
{
	float h = max(k-abs(a-b), 0.0) / k;
	return min(a,b) - h*h*k*k*(1.0/6.0);

}


vec2 mapScene(vec3 p)
{
	vec3 spherePos = vec3(0,1,0);
	float sphere = sdSphere(p - spherePos, 1.0);
	float plane = spPlane(p, vec3(0,1,0), 0.0);
	if(sphere < plane) return vec2(sphere, 1.0);
	return vec2(plane,2.0);

}



float marchRay(vec3 ro, vec3 rd, out vec3 hitPos, out float materialID)
{
	float t = 0.0;

	for(int i = 0; i < 60; i++)
	{
		vec3 p = ro + rd * t;
		vec2 scene = mapScene(p);
		float dist = scene.x;
		if(dist < 0.001) {
			hitPos = p;
			materialID = scene.y;
			return t;
		}
		if (t > 100.0) break;
		t += dist;

	}
	materialID = -1.0; // classic c trope, I dunno man
	return t;

}

vec3 estimateNormal(vec3 p) 
{
	float h = 0.001;
	vec2 e = vec2(1.0, -1.0) * h;

	return normalize(
	e.xyy * mapScene(p + e.xyy).x +
	e.yyx * mapScene(p + e.yyx).x +
	e.yxy * mapScene(p + e.yxy).x +
	e.xxx * mapScene(p + e.xxx).x 
	);

}

vec3 computeLight(vec3 p, vec3 n, vec3 lightPos)
{
	vec3 lightColor = vec3(1.0, 0.0, 0.0);
	vec3 lightDir = normalize(lightPos - p);
	float diff = max(dot(n, lightDir), 0.0);
	return lightColor * diff;

}


bool isInShadow(vec3 p, vec3 n, vec3 lightPos)
{
	vec3 dir = normalize(lightPos - p);
	float maxd = length(lightPos - p);
	float t = 0.01;
	for(int i = 0; i < 40; i++)
	{

		vec3 pos = p + dir * t;
		float d = mapScene(pos).x;
		if(d < 0.001) return true;
		t += d * clamp(1.0 / t, 0.5, 1.0);
		if(t >= maxd) break;

	}

	return false;

}




void main() {

	//the texture coordinates
	vec2 uv = (gl_FragCoord.xy * 2- iResolution.xy) /iResolution.y;

	vec3 ro = vec3(0,1.0,-4.0);
	vec3 rd = normalize(vec3(uv,1));
	float materialID;
	vec3 hitPos;
	vec3 color = vec3(0);


	float t = marchRay(ro, rd, hitPos, materialID);
	vec3 normal = estimateNormal(hitPos);
	vec3 lightPos = vec3(sin(iTime), 3, 0);
	if(materialID == 1.0) //aka sphere
	{
		
		if(!isInShadow(hitPos, normal, lightPos))
		{
			color = computeLight(hitPos, normal, lightPos);
		}
	}
	else if(materialID == 2.0) //aka plane
	{
		if(!isInShadow(hitPos, normal, lightPos))
		{
			color = vec3(0.4);
		}
		else{
			color = vec3(0.2);
		}

	}



    fragColor = vec4(color, 1.0);
}