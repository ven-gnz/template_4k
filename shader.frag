#version 130
uniform float iTime;
uniform vec2 iResolution;
out vec4 fragColor;
precision highp float;
// world origin (0,0,0)


float dot2(vec2 v) { return dot(v, v); }

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


float noiseFunc(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}


float sdCone(vec3 p, vec2 c, float h )
{
  float q = length(p.xz);
  return max(dot(c.xy,vec2(q,p.y)),-h-p.y);
}

float sdFlippedCone(vec3 p, vec2 c, float h)
{
  float q = length(p.xz);
  return max(dot(c.xy, vec2(q, -p.y)), -h + p.y);
}

float spPlane(vec3 p, vec3 n, float h)
{
    return dot(p, n) + h;
}

float sphere(vec3 p, vec3 center, float r) {
    return length(p - center) - r;
}


float smokeDensity(vec3 p) {
    float d = 0.0;
    float scale = 1.0;
    for (int i = 0; i < 32; i++) {
        d += noiseFunc(p * scale);
        scale *= 2.0;
    }
    return d;
}


bool isInSmokeField(vec3 p)
{
    vec3 center = vec3(-1.1, 2.0, 0.0);
    vec3 localP = p - center;
    float hMax = 0.9;
    float hMin = 0.5;
    float h = 0.9;
    float d = sdFlippedCone(localP, vec2(0.5, 0.7), h+ abs(sin(iTime*0.25)));
    return d < 0.0;
}

float lavaDensity(vec3 p)
{
    float d = 0.0;
    float scale = 4.0;
    for(int i = 0; i < 32; i++)
    {
        d += noiseFunc(p * scale);
        scale *= 2.0;
    }
    return d;
}


bool isInLava(vec3 p)
{
    vec3 center = vec3(-1.1, 2.0, 0.0);
    vec3 localP = p-center;
    float d = sphere(p, center, 1.5);
    return d < 0.0;
}


vec3 lavaColorFunc(vec3 p, float density)
{
    float n = noiseFunc(p * 4.0 + iTime * vec3(0.4, 0.2, 0.1));

    float glow = smoothstep(0.2, 0.8, density + 0.2 * n);

    vec3 cool = vec3(0.1, 0.0, 0.0);
    vec3 hotter  = vec3(1.0, 0.5, 0.0);
    vec3 hottest = vec3(1.0, 1.0, 0.5);

    vec3 col = mix(cool, hotter, glow); 
    return col * glow;

}

vec3 lavaFunc(vec3 ro, vec3 rd)
{
    vec3 col = vec3(0.0);
    float t = 0.0;
    for(int i = 0; i < 64; i++)
    {
        vec3 pos = ro +rd*t;
        if(!isInLava(pos)) {
        t += 0.1;
        continue;
        }
        float density = lavaDensity(pos - vec3(0.0, iTime* 4.0, 0.0));
        density = clamp(density, 0.0, 1.0);
        return (lavaColorFunc(pos, density));

    }



}


vec3 smokeFunc(vec3 ro, vec3 rd)
{
    vec3 col = vec3(0.0);
    float t = 0.0;
    for(int i = 0; i < 128; i++)
    {
        vec3 pos = ro + rd*t;
        if (!isInSmokeField(pos)) {
        t += 0.1;
        continue;
        }
      
        float density = smokeDensity(pos - vec3(0.0, iTime*4.0, 0.0));
        density = clamp(density, 0.0, 1.0);
        vec3 smokeCol = vec3(0.5, 0.5, 0.5) * density;
        col += smokeCol * 0.05 * (1.0 - col); // alpha blending
        t += 0.1;
        if (col.r > 0.95) break;
    
    }
    return col;

}


float opSmoothSubtraction( float d1, float d2, float k )
{
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
    return mix( d2, -d1, h ) + k*h*(1.0-h);
}






float craterNoise(vec3 p) {
    float n = noiseFunc(p * 100.0);   
    return smoothstep(0.3, 0.5, n);
}

float sdCappedCone(vec3 p, float h, float r1, float r2)
{
 
    vec2 q = vec2(length(p.xz), p.y);
    vec2 k1 = vec2(r2, h);
    vec2 k2 = vec2(r2 - r1, 2.0 * h);
    vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
    vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
    float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
    return s * sqrt(min(dot2(ca), dot2(cb)));
}



float parametricVolcanoFunc(vec3 p, vec3 volcanoCenter, vec3 volcanoDimensions, float seed)
{
    // not fully parametric yet, I might want to look into parameterizing the amount of lumps in the volcano as welll...
    float h = volcanoDimensions.x;
    float r1 = volcanoDimensions.y;
    float r2 = volcanoDimensions.z;
    float v = sdCappedCone(p-volcanoCenter, h, r1, r2);
    
    for (int i = 0; i < 19; i++) {
        float angle = float(i) / 19.0 * 6.2831;
        float heightRatio = noiseFunc(vec3(angle, 1.0, 1.0));
        float craterHeight = mix(0.1, h, heightRatio);
        float localRadius = mix(r1, r2, craterHeight / h);
    
        float radius = mix(0.05, 0.3, noiseFunc(vec3(angle * 10.0, 0.0, seed)));

        vec3 craterPos = volcanoCenter 
                       + vec3(cos(angle), 0.0, sin(angle)) * localRadius 
                       + vec3(0.0, craterHeight - h * 0.5, 0.0);
    
        float c = sphere(p, craterPos, radius);
        v = opSmoothSubtraction(c,v,0.3);
    
    }
    return v;

}



vec2 mapScene(vec3 p)
{

    vec3 volcano1Dim = vec3(1.25, 1.75, 1.0); 
    vec3 volcano1Loc = vec3(-1.0, volcano1Dim.y*0.5, -0.1); // the center of the cone SDF derived from place and dimensions

    vec3 volcano2Dim = vec3(3.1, 2.2, 1.2);
    vec3 volcano2Loc = vec3(1.75, volcano2Dim.y*0.5, 1.0);
    
    float volcano1 = parametricVolcanoFunc(p,volcano1Loc, volcano1Dim, 4.45);
    float volcano2 = parametricVolcanoFunc(p,volcano2Loc, volcano2Dim, 3.33);
    float plane = spPlane(p, vec3(0, 0.1, 0), 0.0);
   
    vec2 v1 = vec2(volcano1, 1.0);
    vec2 v2 = vec2(volcano2, 1.0);
    vec2 pl = vec2(plane, 3.0);
 
    vec2 scene = (v1.x < v2.x) ? v1 : v2;
    scene = (pl.x < scene.x) ? pl : scene;

    return scene;
}

float marchRay(vec3 ro, vec3 rd, out vec3 hitPos, out float matID)
{
    float t = 0.0;
    for (int i = 0; i < 120; i++)
    {
        vec3 p = ro + rd * t;
        vec2 scene = mapScene(p);
        float d = scene.x;
        if (d < 0.00005)
        {
            hitPos = p;
            matID = scene.y;
            return t;
        }
        if (t > 100.0) break;
        t += d;
    }
    matID = -1.0;
    return t;
}

vec3 estimateNormal(vec3 p)
{
    float eps = 0.0001;
    vec2 e = vec2(1.0, -1.0) * eps;
    return normalize(
        e.xyy * mapScene(p + e.xyy).x +
        e.yyx * mapScene(p + e.yyx).x +
        e.yxy * mapScene(p + e.yxy).x +
        e.xxx * mapScene(p + e.xxx).x
    );
}

float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k)
{
    float res = 1.0;
    float t = mint;
    for (int i = 0; i < 64 && t < maxt; i++)
    {
        float h = mapScene(ro + rd * t).x;
        if (h < 0.0001)
            return 0.0;
        res = min(res, k * h / t);
        t += clamp(h, 0.01, 0.2);
    }
    return clamp(res, 0.0, 1.0);

}

vec3 computeLight(vec3 p, vec3 n, Material mat, Light light, vec3 ro, vec3 rd) 
{
    //blinn phong as a try for less jaggies
    
    vec3 lightDir = normalize(light.pos - p);
    float lightDist = length(light.pos - p);
    vec3 viewDir = normalize(ro-p);
    
    vec3 halfV = normalize(vec3(lightDir + viewDir));
    vec3 reflectDir = reflect(-lightDir, n);

    float diff = max(dot(n, lightDir), 0.0);
    float spec = pow(max(dot(halfV, reflectDir), 0.0), mat.shininess);
    float shadow = softShadow(p + 0.01*n, lightDir, 0.01, lightDist, 64.0);

    vec3 ambient  = light.ambient  * mat.ambient;
    vec3 diffuse  = light.diffuse  * mat.diffuse * diff * shadow;
    vec3 specular = light.specular * mat.specular * spec * shadow;
    return ambient + diffuse + specular;
    
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

void main()
{

         vec3 baseRO = vec3(0.0, 1.0, 5.0);

        Material obsidian = Material(
        vec3(0.05375,0.05,0.06625),
        vec3(0.18275,0.17,0.22525),
        vec3(0.332741,0.328634,0.346435),
        22.4);
        
        Light magma = Light(
        vec3(6.0+cos(iTime), 5.0, 2.0+sin(iTime)),        
        vec3(1.0, 0.1, 0.1),                   
        vec3(1.0, 0.1, 0.1),                     
        vec3(1.0, 1.0, 1.0));

        Light vanilla = Light(
        vec3(0.0, 6.0, 2.0),
        vec3(1.0, 1.0, 1.0),
        vec3(1.0, 1.0, 1.0),
        vec3(1.0, 1.0, 1.0));


        
    vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
    vec3 ro = calculateRO(iTime, 7.0 ,1.0);
    vec3 target = vec3(0.0, 1.0, 0.0);
    mat3 cam = lookAt(ro, target, vec3(0.0,1.0,0.0));
    vec3 rd = cam * normalize(vec3(uv,1.0));
    

    vec3 hitPos;
    float matID;
    vec3 ambient = vec3(0.01);
    vec3 col = ambient;

    float t = marchRay(ro, rd, hitPos, matID);
    /*
        if (matID == 1.0) {
        
        vec3 n = estimateNormal(hitPos);
        col = visualizeNormals(n, vec3(0.7,0.7,0.7));
                
        } else {
                col = vec3(0.1,0.1,0.1);            
                }
        */
        // first we try to get a better geometry

        if (matID > 0.0)
        {
        vec3 n = estimateNormal(hitPos);
        
        vec3 ambient = vec3(0.1);

        if (matID == 1.0)
        {
           
            vec3 lit = computeLight(hitPos, n, obsidian, vanilla, ro,rd);
            col = obsidian.ambient +  (lit - obsidian.ambient);
        }
        else if (matID == 2.0)
        {
            vec3 groundColor = vec3(0.15);
           
        }
    }
    
    
    vec3 smokeCol = smokeFunc(ro, rd);
    vec3 finalCol = mix(col, smokeCol, 0.5);
    finalCol = pow(finalCol, vec3(1.0 / 2.2)); // linear gamma to get closer to shadertoy looks, seems to work OK
    fragColor = vec4(vec3(finalCol), 1.0);
}