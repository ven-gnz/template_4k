#version 330
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

struct Volcano {
    vec3 dim;
    vec3 pos;
    float seed;
    int numOfLumps;
};

const Volcano Volcano1 =
Volcano (
    vec3(1.25, 1.75, 1.0),
    vec3(-1.0, 0.875, -0.1),
    4.45,
    17 );

const Volcano Volcano2 =
Volcano (
    vec3(3.1, 2.2, 1.2),
    vec3(1.75, 1.1, 1.0),
    3.33,
    14 );






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


bool isInSmokeVolume(vec3 p)
{
    vec3 center1 = vec3(-1.1, 2.0, 0.0); // volcano2 aligned
    vec3 localizedP = p - center1;
    float hMax = 0.9;
    float hMin = 0.5;
    float h = 0.9;
    float d1 = sdFlippedCone(localizedP, vec2(0.5, 0.7), h+ abs(sin(iTime*0.25)));
    return d1 < 0.0;
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



float parametricVolcanoFunc(vec3 p,
    Volcano volcano)
{

    float h = volcano.dim.x;
    float r1 = volcano.dim.y;
    float r2 = volcano.dim.z;
    float v = sdCappedCone(p-volcano.pos, h, r1, r2);
    float seed = volcano.seed;
    vec3 volcanoCenter = volcano.pos;
    int numOfLumps = volcano.numOfLumps;

    for (int i = 0; i < numOfLumps; i++) {

        float angle = float(i) / numOfLumps * 6.2831;
        float heightRatio = noiseFunc(vec3(angle, 1.0, 1.0));
        float craterHeight = mix(0.1, h, heightRatio);
        float localRadius = mix(r1, r2, craterHeight / h);

        float radius = mix(0.05, 0.6, noiseFunc(vec3(angle * 10.0, 0.0, seed)));

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

    float volcano1 = parametricVolcanoFunc(p, Volcano1);
    float volcano2 = parametricVolcanoFunc(p, Volcano2);

    vec2 v1 = vec2(volcano1, 1.0); // 1 volcano matID
    vec2 v2 = vec2(volcano2, 1.0);

    vec2 scene = (v1.x < v2.x) ? v1 : v2;

    return scene;
}

float marchRay(vec3 ro, vec3 rd, out vec3 hitPos, out float matID)
{
    float t = 0.0;
    for (int i = 0; i < 64; i++) //120ish release conf
    {
        vec3 p = ro + rd * t;
        vec2 scene = mapScene(p);
        float d = scene.x;
        if (d < 0.001)
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
    float eps = 0.005;
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
    for (int i = 0; i < 32 && t < maxt; i++) // might go for higher count on release
    {
        float h = mapScene(ro + rd * t).x;
        if (h < 0.001)
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
    float y = h + sin(t);
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




vec3 computeVolumetricEffects(vec3 ro, vec3 rd)
{
    vec3 col = vec3(0.0);
    float t = 0.0;

    for (int i = 0; i < 64; i++) { // for release conf 128 iters, stepsize 0.001, debug must find a suitable iter and step size, laptop not complying
        vec3 pos = ro + rd * t;

        bool inSmoke = isInSmokeVolume(pos);
        if (!inSmoke) {
            t += 0.15;
            continue;
        }

         float stepSize = 0.005;

         if (isInSmokeVolume(pos)) {
            float smokeDens = smokeDensity(pos - vec3(0.0, iTime * 2.0, 0.0));
            smokeDens = clamp(smokeDens, 0.0, 1.0);
            vec3 smokeCol = vec3(0.5, 0.5, 0.5) * smokeDens;
            col += smokeCol * smokeDens * 0.05 * (1.0 - col);
        }

        if (length(col) > 0.95) break;
        t += stepSize;
    }

    return col;
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
    vec3 ambient = vec3(0.05);
    vec3 col = ambient;

    float t = marchRay(ro, rd, hitPos, matID);
        // first we try to get a better geometry
        if (matID == 1.0) {
        vec3 n = estimateNormal(hitPos);
        col = visualizeNormals(n, vec3(0.7,0.7,0.7));

        }

        /*
        if (matID > 0.0)
        {
        vec3 n = estimateNormal(hitPos);
        if (matID == 1.0)
        {
            vec3 lit = computeLight(hitPos, n, obsidian, magma, ro,rd);
            col += obsidian.ambient +  (lit - obsidian.ambient);
            //col = vec3(0.3, 0.1, 0.05);
        }
    }
    */


    vec3 volCol = computeVolumetricEffects(ro,rd);
    vec3 finalCol = mix(col, volCol, 0.5);
    //vec3 finalCol = col;
    finalCol = pow(finalCol, vec3(1.0 / 2.2)); // linear gamma to get closer to shadertoy looks, seems to work OK
    fragColor = vec4(vec3(finalCol), 1.0);
}