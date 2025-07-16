#version 130
uniform float iTime;
uniform vec2 iResolution;
out vec4 fragColor;
// world origin (0,0,0)


struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shininess;
};


struct Light {
vec3 pos;
vec3 ambient;
vec3 diffuse;
vec3 specular;
};



float dot2(vec2 v) { return dot(v, v); }

float sdCappedCone( vec3 p, float h, float r1, float r2 )
{
  vec2 q = vec2( length(p.xz), p.y );
  vec2 k1 = vec2(r2,h);
  vec2 k2 = vec2(r2-r1,2.0*h);
  vec2 ca = vec2(q.x-min(q.x,(q.y<0.0)?r1:r2), abs(q.y)-h);
  vec2 cb = q - k1 + k2*clamp( dot(k1-q,k2)/dot(k2,k2), 0.0, 1.0 );
  float s = (cb.x<0.0 && ca.y<0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot2(ca), dot2(cb)));
}

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

	float plane = spPlane(p, normalize(vec3(0,1,0)), 0.0);
	float h = 1.5;
	float r1 = 1.2;
	float r2 = 0.2;
	vec3 c = vec3(0.0, h*0.5, 0.0);
	float volcano = sdCappedCone(p-c, h, r1, r2);

	if(volcano < plane) return vec2(volcano, 1.0);
	return vec2(plane, 2.0);

}



float marchRay(vec3 ro, vec3 rd, out vec3 hitPos, out float matID)
{
	float t = 0.0;

	for(int i = 0; i < 100; i++)
	{
		vec3 p = ro + rd * t;
		vec2 scene = mapScene(p);
		float dist = scene.x;
		if(dist < 0.0001) {
			hitPos = p;
			matID = scene.y;
			return t;
		}
		if (t > 100.0) break;
		t += dist;

	}
	matID = -1.0; // classic c trope, I dunno man
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

vec3 computeLight(vec3 p, vec3 n, vec3 lightPos, Material mat, Light light)
{
   
    vec3 lightDir = normalize(lightPos - p);
    vec3 viewDir = normalize(-p);
    vec3 reflectDir = reflect(-lightDir, n);

    float diff = max(dot(n, lightDir), 0.0);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), mat.shininess);

    vec3 ambient  = light.ambient  * mat.ambient;
    vec3 diffuse  = light.diffuse  * mat.diffuse * diff;
    vec3 specular = light.specular * mat.specular * spec;

    return ambient + diffuse + specular;
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
		if(d < 0.0001) return true;
		t += d * clamp(1.0 / t, 0.5, 1.0);
		if(t >= maxd) break;

	}
	return false;

}




void main() {

	//the texture coordinates
	vec2 uv = (gl_FragCoord.xy * 2- iResolution.xy) /iResolution.y;

	Material obsidian = Material(
    vec3(0.05375,0.05,0.06625),
    vec3(0.18275,0.17,0.22525),
    vec3(0.332741,0.328634,0.346435),
    38.4);
        
        Light magma = Light(
    vec3(sin(iTime), 3.0, 0.0),        
    vec3(0.1, 0.02, 0.01),                   
    vec3(1.0, 0.3, 0.1),                     
    vec3(1.0, 0.6, 0.3));



	vec3 ro = vec3(0,1.0,-4.0);
	vec3 rd = normalize(vec3(uv,1));
	float matID;
	vec3 hitPos;
	vec3 color = vec3(0);


	float t = marchRay(ro, rd, hitPos, matID);
	vec3 n = estimateNormal(hitPos);
	vec3 lightPos = vec3(sin(iTime), 3, 0);
	if(matID == 1.0) // obsidian cone
	{
		vec3 lit = computeLight(hitPos, n, lightPos, obsidian, magma);
        float shadow = isInShadow(hitPos, n, lightPos) ? 0.0 : 1.0;
        color = obsidian.ambient + shadow * (lit - obsidian.ambient);
	}


	else if(matID == 2.0) //aka plane
	{
		if(!isInShadow(hitPos, n, lightPos))
		{
			color = vec3(0.4);
		}
		else{
			color = vec3(0.2);
		}

	}



    fragColor = vec4(color, 1.0);
}