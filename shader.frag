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

float opSmoothSubtraction( float d1, float d2, float k )
{
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
    return mix( d2, -d1, h ) + k*h*(1.0-h);
}



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

float crater(vec3 p, vec3 center, float r) {
    return length(p - center) - r;
}



float noiseFunc(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}

float craterNoise(vec3 p) {
    float n = noiseFunc(p * 100.0);   
    return smoothstep(0.3, 0.5, n);
}

float volcanofunc(vec3 p)
{

    float h = 1.0;       // Cone height
    float r1 = 2.0;      // Bottom radius
    float r2 = 1.0;      // Top radius

    vec3 coneCenter = vec3(0.0, h * 0.5, 0.0);
    float v = sdCappedCone(p - coneCenter, h, r1, r2);
    
    for (int i = 0; i < 19; i++) {
     float angle = float(i) / 19.0 * 6.2831;
    float heightRatio = noiseFunc(vec3(angle, 1.0, 1.0));
    float craterHeight = mix(0.1, h, heightRatio);
    float localRadius = mix(r1, r2, craterHeight / h);
    
    float radius = mix(0.05, 0.3, noiseFunc(vec3(angle * 10.0, 0.0, 3.11)));

    vec3 craterPos = coneCenter 
                   + vec3(cos(angle), 0.0, sin(angle)) * localRadius 
                   + vec3(0.0, craterHeight - h * 0.5, 0.0);
    
    float c = crater(p, craterPos, radius);
    v = opSmoothSubtraction(c,v,0.3);
    
    }
    
    return v;
}


vec2 mapScene(vec3 p)
{
    float volcano = volcanofunc(p);
    float plane = spPlane(p, vec3(0, 1, 0), 0.0);
    if (volcano < plane) return vec2(volcano, 1.0);
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

vec3 computeLight(vec3 p, vec3 n, Material mat, Light light, vec3 ro) 
{
    //blinn phong as a try for less jaggies
    vec3 lightDir = normalize(light.pos - p);
    
    vec3 viewDir = normalize(ro-p);
    
    vec3 halfV = normalize(vec3(lightDir + viewDir));
    vec3 reflectDir = reflect(-lightDir, n);

    float diff = max(dot(n, lightDir), 0.0);
    float spec = pow(max(dot(halfV, reflectDir), 0.0), mat.shininess);

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

vec3 calculateRO(float t, float r, float h)
{
    
    float angle = 0.2*t;
    float x = cos(angle)*r;
    float y = h;
    float z = sin(angle)*r;
    return vec3(x,y,z);
    
}

mat3 lookAt(vec3 ro, vec3 target, vec3 uV)
{
    vec3 front = normalize(target-ro);
    vec3 right = normalize(cross(front,uV));
    vec3 up = cross(right, front);
    return mat3(right,up,front);


}

vec3 visualizeNormals(vec3 n, vec3 baseColor) {

    vec3 light1 = normalize(vec3(0.6, 0.7, 0.5));  
    vec3 light2 = normalize(vec3(-0.6, 0.5, -0.7));
    
    float diff1 = clamp(dot(n, light1), 0.0, 1.0);
    float diff2 = clamp(dot(n, light2), 0.0, 1.0);

    float lighting = max(diff1, diff2);
    return baseColor * (0.4 + 0.6 * lighting);
  
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


    vec3 ro = calculateRO(iTime, 3.0 ,1.0);
    vec3 target = vec3(0.0, 1.0, 0.0);
    mat3 cam = lookAt(ro, target, vec3(0.0,1.0,0.0));
    vec3 rd = cam * normalize(vec3(uv,1.0));
    

    vec3 hitPos;
    float matID;
    vec3 col = vec3(0.0);

    float t = marchRay(ro, rd, hitPos, matID);
    
    
    
    
        if (matID == 1.0) {
        
        vec3 n = estimateNormal(hitPos);
        col = visualizeNormals(n, vec3(0.7,0.7,0.7));
                
        } else {
                col = vec3(0.1,0.1,0.1);            
                }
        
        /* first we try to get a better geometry
        if (matID > 0.0)
        {
        vec3 n = estimateNormal(hitPos);
        
        vec3 ambient = vec3(0.1);

        if (matID == 1.0)
        {
           
            vec3 lit = computeLight(hitPos, n, obsidian, magma, ro);
            float shadow = isInShadow(hitPos, n, magma.pos) ? 0.0 : 1.0;
            col = obsidian.ambient + shadow * (lit - obsidian.ambient);
        }
        else if (matID == 2.0)
        {
            vec3 groundColor = vec3(0.15);
            col = isInShadow(hitPos, n, magma.pos) ? groundColor * 0.5 : groundColor + ambient;
        }
    }
    */
    
     fragColor = vec4(col, 1.0);
}