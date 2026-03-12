'use client'

import { useRef, useEffect, useCallback } from 'react'

interface D10DieProps {
  scores: {
    Sincerity: number
    Excitement: number
    Competence: number
    Sophistication: number
    Ruggedness: number
  }
  size?: number
  className?: string
  autoRotate?: boolean
  interactive?: boolean
}

// ── Matrix Utilities ──────────────────────────────────────────
function perspective(fov: number, asp: number, n: number, f: number): Float32Array {
  const t = 1 / Math.tan(fov / 2), nf = 1 / (n - f)
  return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0])
}

function mul4(a: Float32Array, b: Float32Array): Float32Array {
  const r = new Float32Array(16)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    r[j * 4 + i] = 0
    for (let k = 0; k < 4; k++) r[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]
  }
  return r
}

function rotXM(a: number): Float32Array {
  const c = Math.cos(a), s = Math.sin(a)
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1])
}

function rotYM(a: number): Float32Array {
  const c = Math.cos(a), s = Math.sin(a)
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1])
}

function normMat3(m: Float32Array): Float32Array {
  return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]])
}

// ── Quaternion ────────────────────────────────────────────────
type Quat = [number, number, number, number]

function qMul(a: Quat, b: Quat): Quat {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ]
}

function qAxis(ax: number, ay: number, az: number, ang: number): Quat {
  const ha = ang * 0.5, s = Math.sin(ha), c = Math.cos(ha)
  const l = Math.sqrt(ax * ax + ay * ay + az * az) || 1
  return [ax / l * s, ay / l * s, az / l * s, c]
}

function qNorm(q: Quat): Quat {
  const l = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3])
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]
}

function qToMat4(q: Quat): Float32Array {
  const [x, y, z, w] = q
  const x2 = x + x, y2 = y + y, z2 = z + z
  const xx = x * x2, xy = x * y2, xz = x * z2
  const yy = y * y2, yz = y * z2, zz = z * z2
  const wx = w * x2, wy = w * y2, wz = w * z2
  return new Float32Array([
    1 - yy - zz, xy + wz, xz - wy, 0,
    xy - wz, 1 - xx - zz, yz + wx, 0,
    xz + wy, yz - wx, 1 - xx - yy, 0,
    0, 0, 0, 1,
  ])
}

// ── D10 Geometry ──────────────────────────────────────────────
const NN = 5, R = 1.0
const RATIO = 9.4724
const DEFAULT_H = 0.155 * RATIO

type Vec3 = [number, number, number]

function buildRings(h: number) {
  const d = h / RATIO
  const upper: Vec3[] = [], lower: Vec3[] = []
  for (let i = 0; i < NN; i++) {
    const au = 2 * Math.PI * i / NN
    upper.push([R * Math.cos(au), d, R * Math.sin(au)])
    const al = 2 * Math.PI * (i + 0.5) / NN
    lower.push([R * Math.cos(al), -d, R * Math.sin(al)])
  }
  return { upper, lower, topApex: [0, h, 0] as Vec3, botApex: [0, -h, 0] as Vec3 }
}

function buildFlat(h: number) {
  const { upper, lower, topApex, botApex } = buildRings(h)
  const pos: number[] = [], nrm: number[] = []
  function addKite(a: Vec3, b: Vec3, c: Vec3, d: Vec3) {
    const diag1: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    const diag2: Vec3 = [d[0] - b[0], d[1] - b[1], d[2] - b[2]]
    let n: Vec3 = [
      diag1[1] * diag2[2] - diag1[2] * diag2[1],
      diag1[2] * diag2[0] - diag1[0] * diag2[2],
      diag1[0] * diag2[1] - diag1[1] * diag2[0],
    ]
    const l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2])
    if (l > 0) n = [n[0] / l, n[1] / l, n[2] / l]
    const cx = (a[0] + b[0] + c[0] + d[0]) * 0.25
    const cy = (a[1] + b[1] + c[1] + d[1]) * 0.25
    const cz = (a[2] + b[2] + c[2] + d[2]) * 0.25
    if (n[0] * cx + n[1] * cy + n[2] * cz < 0) { n = [-n[0], -n[1], -n[2]] }
    for (const v of [a, b, c, a, c, d]) { pos.push(...v); nrm.push(...n) }
  }
  for (let i = 0; i < NN; i++) {
    const ni = (i + 1) % NN
    addKite(topApex, upper[i], lower[i], upper[ni])
    addKite(botApex, lower[ni], upper[ni], lower[i])
  }
  return { positions: new Float32Array(pos), normals: new Float32Array(nrm), count: pos.length / 3 }
}

function buildSmooth(h: number) {
  const { upper, lower, topApex, botApex } = buildRings(h)
  const verts = [topApex, botApex, ...upper, ...lower]
  const vertNormals = verts.map(() => [0, 0, 0] as Vec3)
  function faceNorm(a: Vec3, b: Vec3, c: Vec3): Vec3 {
    const e1: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const e2: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    const n: Vec3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
    const l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2])
    return l > 0 ? [n[0] / l, n[1] / l, n[2] / l] : n
  }
  function ensureOutward(n: Vec3, vIdxArr: number[]): Vec3 {
    let cx = 0, cy = 0, cz = 0
    vIdxArr.forEach(vi => { cx += verts[vi][0]; cy += verts[vi][1]; cz += verts[vi][2] })
    cx /= vIdxArr.length; cy /= vIdxArr.length; cz /= vIdxArr.length
    if (n[0] * cx + n[1] * cy + n[2] * cz < 0) return [-n[0], -n[1], -n[2]]
    return n
  }
  const kites: { idx: number[]; norm: Vec3 }[] = []
  for (let i = 0; i < NN; i++) {
    const ni = (i + 1) % NN
    const uIdx = [0, 2 + i, 7 + i, 2 + ni]
    const uN = ensureOutward(faceNorm(topApex, upper[i], lower[i]), uIdx)
    kites.push({ idx: uIdx, norm: uN })
    uIdx.forEach(vi => { vertNormals[vi][0] += uN[0]; vertNormals[vi][1] += uN[1]; vertNormals[vi][2] += uN[2] })
    const lIdx = [1, 7 + ni, 2 + ni, 7 + i]
    const lN = ensureOutward(faceNorm(botApex, lower[ni], upper[ni]), lIdx)
    kites.push({ idx: lIdx, norm: lN })
    lIdx.forEach(vi => { vertNormals[vi][0] += lN[0]; vertNormals[vi][1] += lN[1]; vertNormals[vi][2] += lN[2] })
  }
  vertNormals.forEach(n => {
    const l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2])
    if (l > 0) { n[0] /= l; n[1] /= l; n[2] /= l }
  })
  const pos: number[] = [], nrm: number[] = []
  kites.forEach(kite => {
    const [a, b, c, dd] = kite.idx;
    [[a, b, c], [a, c, dd]].forEach(tri => {
      tri.forEach(vi => { pos.push(...verts[vi]); nrm.push(...vertNormals[vi]) })
    })
  })
  return { positions: new Float32Array(pos), normals: new Float32Array(nrm), count: pos.length / 3 }
}

function buildEdges(h: number) {
  const { upper, lower, topApex, botApex } = buildRings(h)
  const lines: number[] = []
  for (let i = 0; i < NN; i++) {
    const ni = (i + 1) % NN
    lines.push(...topApex, ...upper[i])
    lines.push(...upper[i], ...lower[i])
    lines.push(...lower[i], ...upper[ni])
    lines.push(...lower[i], ...botApex)
    lines.push(...upper[ni], ...lower[ni])
  }
  return { positions: new Float32Array(lines), count: lines.length / 3 }
}

function buildRadarGem(values: number[], maxR: number, radarPoleRatio: number, diePoleH: number, innerScale: number) {
  const pH = radarPoleRatio * diePoleH * innerScale
  const topApex: Vec3 = [0, pH, 0]
  const botApex: Vec3 = [0, -pH, 0]
  const ring: Vec3[] = []
  for (let i = 0; i < NN; i++) {
    const angle = 2 * Math.PI * i / NN
    const r = (values[i] / 5) * maxR * innerScale
    ring.push([r * Math.cos(angle), 0, r * Math.sin(angle)])
  }
  const pos: number[] = [], nrm: number[] = []
  function triNorm(a: Vec3, b: Vec3, c: Vec3): Vec3 {
    const e1: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const e2: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    let n: Vec3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
    const l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2])
    if (l > 0) n = [n[0] / l, n[1] / l, n[2] / l]
    return n
  }
  function addTri(a: Vec3, b: Vec3, c: Vec3) {
    let n = triNorm(a, b, c)
    const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3, cz = (a[2] + b[2] + c[2]) / 3
    if (n[0] * cx + n[1] * cy + n[2] * cz < 0) n = [-n[0], -n[1], -n[2]]
    for (const v of [a, b, c]) { pos.push(...v); nrm.push(...n) }
  }
  for (let i = 0; i < NN; i++) {
    const ni = (i + 1) % NN
    addTri(topApex, ring[i], ring[ni])
    addTri(botApex, ring[ni], ring[i])
  }
  return { positions: new Float32Array(pos), normals: new Float32Array(nrm), count: pos.length / 3 }
}

// ── GLSL Shaders ──────────────────────────────────────────────
const envGLSL = `
float hash(vec3 p){
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}
float noise3(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p);
  f = f*f*(3.0-2.0*f);
  float n = mix(
    mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
        mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
        mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  return n;
}
float fbm(vec3 p){
  float v=0.0, a=0.5;
  for(int i=0;i<4;i++){v+=a*noise3(p);p*=2.1;a*=0.5;}
  return v;
}
vec3 proceduralEnv(vec3 dir){
  vec3 d = normalize(dir);
  vec3 col = mix(vec3(0.06,0.03,0.08), vec3(0.02,0.04,0.12), d.y*0.5+0.5);
  float n1 = fbm(d * 3.0 + vec3(0.0, 0.0, 1.5));
  float n2 = fbm(d * 5.0 + vec3(3.7, 1.2, 0.0));
  float n3 = fbm(d * 4.0 + vec3(1.0, 4.0, 2.0));
  vec3 neb1 = vec3(0.4, 0.1, 0.5) * smoothstep(0.35, 0.65, n1) * 0.8;
  vec3 neb2 = vec3(0.1, 0.3, 0.6) * smoothstep(0.4, 0.7, n2) * 0.6;
  vec3 neb3 = vec3(0.5, 0.15, 0.1) * smoothstep(0.45, 0.7, n3) * 0.5;
  col += neb1 + neb2 + neb3;
  float equator = exp(-8.0 * d.y * d.y);
  float auroraWave = sin(d.x * 8.0 + d.z * 6.0 + n1 * 4.0) * 0.5 + 0.5;
  col += vec3(0.1, 0.4, 0.35) * equator * auroraWave * 0.5;
  float hot = max(dot(d, normalize(vec3(0.7, 0.4, 0.5))), 0.0);
  col += vec3(0.6, 0.25, 0.1) * pow(hot, 8.0) * 0.7;
  float cool = max(dot(d, normalize(vec3(-0.5, 0.3, -0.7))), 0.0);
  col += vec3(0.1, 0.2, 0.5) * pow(cool, 6.0) * 0.5;
  float star = noise3(d * 80.0);
  col += vec3(0.8, 0.85, 1.0) * smoothstep(0.92, 0.96, star) * 0.4;
  float bands = sin(d.y * 12.0 + d.x * 8.0 + n2 * 3.0);
  col += vec3(0.2, 0.05, 0.0) * max(bands, 0.0) * 0.15;
  col += vec3(0.0, 0.05, 0.2) * max(-bands, 0.0) * 0.15;
  return col;
}
`

const innerVS = `
attribute vec3 aPos, aNorm;
uniform mat4 uMVP, uModel;
uniform mat3 uNormMat;
uniform float uScale;
varying vec3 vN, vWorldPos;
void main(){
  vec3 scaled = aPos * uScale;
  vWorldPos = (uModel * vec4(scaled,1.0)).xyz;
  vN = normalize(uNormMat * aNorm);
  gl_Position = uMVP * vec4(scaled,1.0);
}`

const innerFS = `
precision highp float;
varying vec3 vN, vWorldPos;
uniform vec3 uEye, uBaseColor;
uniform float uMetallic, uRoughness, uSpecInt, uAmbient, uEnvRef;
uniform vec3 uPointPos, uPointCol;
uniform float uPointInt;
uniform vec3 uSheenCol;
uniform float uSheenInt, uSheenRough;
uniform vec3 uL1Dir, uL1Col; uniform float uL1Int;
uniform vec3 uL2Dir, uL2Col; uniform float uL2Int;
uniform vec3 uL3Dir, uL3Col; uniform float uL3Int;
uniform float uInnerAlpha, uDispersion, uPrismatic;
uniform float uIriStr, uIriShift, uIriFreq;
uniform vec3 uIriLightPos;
uniform float uIriViewMix, uShellFPow;
` + envGLSL + `

vec3 simpleEnv(vec3 dir){
  vec3 c = vec3(0.0);
  c += max(dir.y,0.0)*vec3(0.15,0.18,0.35);
  c += max(-dir.y,0.0)*vec3(0.05,0.04,0.06);
  c += max(dir.x,0.0)*vec3(0.25,0.12,0.15)*0.4;
  c += max(-dir.x,0.0)*vec3(0.1,0.15,0.25)*0.4;
  c += max(dir.z,0.0)*vec3(0.2,0.2,0.15)*0.3;
  c += max(-dir.z,0.0)*vec3(0.12,0.1,0.2)*0.3;
  return c;
}
vec3 sampleEnv(vec3 dir){
  return simpleEnv(dir);
}

vec3 iridescentColor(float t){
  return vec3(0.5+0.5*cos(t), 0.5+0.5*cos(t+2.094), 0.5+0.5*cos(t+4.189));
}

vec3 sampleShellIri(vec3 refDir, vec3 n, vec3 v){
  vec3 iriLDir = normalize(uIriLightPos - vWorldPos);
  float iriNdotL = max(dot(refDir, iriLDir), 0.0);
  float refNdotV = max(dot(refDir, v), 0.0);
  float thinFilm = mix(iriNdotL, refNdotV, uIriViewMix) * uIriFreq * 3.14159 + uIriShift;
  vec3 iriCol = iridescentColor(thinFilm);
  float shellFresnel = pow(1.0 - max(dot(refDir, v), 0.0), uShellFPow);
  return iriCol * uIriStr * (shellFresnel * 0.7 + 0.3);
}

vec3 calcLight(vec3 n, vec3 v, vec3 lDir, vec3 lCol, float lInt, float a2, float specMul, vec3 F0, float fres){
  vec3 L = normalize(lDir);
  float NdL = max(dot(n,L),0.0);
  vec3 H = normalize(L+v);
  float NdH = max(dot(n,H),0.0);
  float den = NdH*NdH*(a2-1.0)+1.0;
  float D = min(a2/(3.14159*den*den+0.0001), 8.0);
  vec3 specF = F0+(1.0-F0)*fres;
  return lCol * lInt * NdL * (vec3(1.0) + specF * D * specMul);
}

void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(uEye - vWorldPos);
  float NdotV = max(dot(n,v), 0.0);
  float fresnel = pow(1.0 - NdotV, 3.0);
  float a = uRoughness*uRoughness; float a2 = a*a;
  vec3 base = uBaseColor;
  vec3 F0 = mix(vec3(0.04), base, uMetallic);

  if(uPrismatic > 0.5){
    float iorBase = 1.45;
    vec3 refR = refract(-v, n, 1.0/(iorBase - uDispersion));
    vec3 refG = refract(-v, n, 1.0/iorBase);
    vec3 refB = refract(-v, n, 1.0/(iorBase + uDispersion));
    vec3 iriR = sampleShellIri(refR, n, v);
    vec3 iriG = sampleShellIri(refG, n, v);
    vec3 iriB = sampleShellIri(refB, n, v);
    float envStr = uEnvRef * 1.5;
    vec3 refracted = vec3(
      iriR.r + sampleEnv(refR).r * envStr * 0.3,
      iriG.g + sampleEnv(refG).g * envStr * 0.3,
      iriB.b + sampleEnv(refB).b * envStr * 0.3
    );
    vec3 refl = reflect(-v, n);
    vec3 reflected = sampleEnv(refl) * 1.2 + sampleShellIri(refl, n, v) * 0.5;
    float f0 = pow((iorBase - 1.0)/(iorBase + 1.0), 2.0);
    float schlick = f0 + (1.0 - f0) * pow(1.0 - NdotV, 5.0);
    vec3 spec = vec3(0.0);
    spec += calcLight(n,v,uL1Dir,uL1Col,uL1Int,a2,uSpecInt,vec3(f0),fresnel);
    spec += calcLight(n,v,uL2Dir,uL2Col,uL2Int,a2,uSpecInt,vec3(f0),fresnel);
    spec += calcLight(n,v,uL3Dir,uL3Col,uL3Int,a2,uSpecInt,vec3(f0),fresnel);
    vec3 pDir = uPointPos - vWorldPos;
    float pDist = length(pDir);
    float pAtten = uPointInt / (1.0+0.3*pDist+0.1*pDist*pDist);
    spec += calcLight(n,v,pDir/pDist,uPointCol,pAtten,a2,uSpecInt,vec3(f0),fresnel);
    vec3 col = mix(refracted, reflected, schlick) * mix(vec3(1.0), base * 2.0, 0.3) + spec * 0.4;
    col = col/(col+0.9);
    col = pow(col, vec3(1.0/2.2));
    float alpha = uInnerAlpha * (0.15 + schlick * 0.85);
    gl_FragColor = vec4(col, alpha);
  } else {
    vec3 lighting = vec3(uAmbient);
    lighting += calcLight(n,v,uL1Dir,uL1Col,uL1Int,a2,uSpecInt,F0,fresnel*0.5);
    lighting += calcLight(n,v,uL2Dir,uL2Col,uL2Int,a2,uSpecInt,F0,fresnel*0.5);
    lighting += calcLight(n,v,uL3Dir,uL3Col,uL3Int,a2,uSpecInt,F0,fresnel*0.5);
    vec3 pDir = uPointPos - vWorldPos;
    float pDist = length(pDir); vec3 pL = pDir/pDist;
    float pAtten = uPointInt / (1.0+0.3*pDist+0.1*pDist*pDist);
    lighting += calcLight(n,v,pL,uPointCol,pAtten,a2,uSpecInt,F0,fresnel*0.5);
    float sheenA = uSheenRough*uSheenRough;
    float sheenT = 0.0;
    vec3 h1s=normalize(normalize(uL1Dir)+v); float NdH1s=max(dot(n,h1s),0.0);
    sheenT += (1.0-NdH1s*NdH1s)/(1.0+sheenA)*max(dot(n,normalize(uL1Dir)),0.0)*uL1Int;
    vec3 hPs=normalize(pL+v); float NdHPs=max(dot(n,hPs),0.0);
    sheenT += (1.0-NdHPs*NdHPs)/(1.0+sheenA)*max(dot(n,pL),0.0)*pAtten;
    vec3 sheen = uSheenCol*sheenT*uSheenInt;
    vec3 diffuse = base * lighting;
    vec3 refl = reflect(-v,n);
    vec3 envC = sampleEnv(refl)*uEnvRef*mix(vec3(1.0),base,uMetallic)*(0.3+fresnel*0.35);
    vec3 col = diffuse*(1.0-uMetallic*0.7) + envC + sheen;
    col = col/(col+0.9);
    col = pow(col, vec3(1.0/2.2));
    gl_FragColor = vec4(col, uInnerAlpha);
  }
}`

const outerVS = `
attribute vec3 aPos, aNorm;
uniform mat4 uMVP, uModel;
uniform mat3 uNormMat;
varying vec3 vN, vWorldPos;
void main(){
  vWorldPos = (uModel * vec4(aPos,1.0)).xyz;
  vN = normalize(uNormMat * aNorm);
  gl_Position = uMVP * vec4(aPos,1.0);
}`

const outerFS = `
precision highp float;
varying vec3 vN, vWorldPos;
uniform vec3 uEye;
uniform float uIriStr, uIriShift, uIriFreq;
uniform vec3 uIriLightPos;
uniform float uIriViewMix;
uniform float uShellAlpha, uShellFPow;
uniform vec3 uPointPos, uPointCol;
uniform float uPointInt;

vec3 iridescentColor(float t){
  return vec3(0.5+0.5*cos(t), 0.5+0.5*cos(t+2.094), 0.5+0.5*cos(t+4.189));
}

void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(uEye - vWorldPos);
  float NdotV = max(dot(n,v), 0.0);
  float fresnel = pow(1.0 - NdotV, uShellFPow);
  vec3 iriLDir = normalize(uIriLightPos - vWorldPos);
  float iriNdotL = max(dot(n, iriLDir), 0.0);
  float thinFilm = mix(iriNdotL, NdotV, uIriViewMix) * uIriFreq * 3.14159 + uIriShift;
  vec3 iriCol = iridescentColor(thinFilm);
  vec3 pDir = normalize(uPointPos - vWorldPos);
  float pNdL = max(dot(n, pDir), 0.0);
  vec3 col = iriCol * uIriStr * (fresnel*0.7 + 0.3);
  col += iriCol * pNdL * 0.15 * uIriStr;
  float alpha = uShellAlpha * (0.4 + fresnel*0.6);
  col = col/(col+1.2);
  col = pow(col, vec3(1.0/2.2));
  gl_FragColor = vec4(col, alpha);
}`

const edgeVS = `
attribute vec3 aPos;
uniform mat4 uMVP;
void main(){ gl_Position = uMVP * vec4(aPos,1.0); }`

const edgeFS = `
precision mediump float;
uniform vec3 uEdgeColor;
uniform float uEdgeAlpha;
void main(){ gl_FragColor = vec4(uEdgeColor, uEdgeAlpha); }`

const radarVS = `
attribute vec3 aPos, aNorm;
uniform mat4 uMVP, uModel;
uniform mat3 uNormMat;
varying vec3 vN, vWorldPos;
void main(){
  vWorldPos = (uModel * vec4(aPos,1.0)).xyz;
  vN = normalize(uNormMat * aNorm);
  gl_Position = uMVP * vec4(aPos,1.0);
}`

const radarFS = `
precision highp float;
varying vec3 vN, vWorldPos;
uniform vec3 uEye, uRadarCol;
uniform float uRadarGlow, uRadarFresnel, uTime;
uniform vec3 uL1Dir; uniform float uL1Int;

void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(uEye - vWorldPos);
  float NdotV = max(dot(n,v), 0.0);
  vec3 L = normalize(uL1Dir);
  float NdL = max(dot(n,L), 0.0);
  vec3 col = uRadarCol * (0.25 + NdL * 0.45);
  float fresnel = pow(1.0 - NdotV, 2.5);
  col += uRadarCol * fresnel * uRadarFresnel;
  float pulse = 0.5 + 0.5 * sin(uTime * 1.2);
  float pulse2 = 0.5 + 0.5 * sin(uTime * 0.7 + 2.0);
  float breath = pulse * 0.6 + pulse2 * 0.4;
  col += uRadarCol * breath * uRadarGlow;
  float peakGlow = pow(NdotV, 3.0) * 0.2;
  col += uRadarCol * peakGlow;
  col = col/(col+0.8);
  col = pow(col, vec3(1.0/2.2));
  gl_FragColor = vec4(col, 1.0);
}`

// ── WebGL Helpers ─────────────────────────────────────────────
function mkShader(gl: WebGLRenderingContext, src: string, type: number): WebGLShader {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s))
  }
  return s
}

function mkProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!
  gl.attachShader(p, mkShader(gl, vs, gl.VERTEX_SHADER))
  gl.attachShader(p, mkShader(gl, fs, gl.FRAGMENT_SHADER))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(p))
  }
  return p
}

function getLocs(gl: WebGLRenderingContext, prog: WebGLProgram, attribs: string[], uniforms: string[]) {
  const L: Record<string, number | WebGLUniformLocation | null> = {}
  attribs.forEach(n => L[n] = gl.getAttribLocation(prog, n))
  uniforms.forEach(n => L[n] = gl.getUniformLocation(prog, n))
  return L
}

function mkBuf(gl: WebGLRenderingContext, data: Float32Array): WebGLBuffer {
  const b = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, b)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  return b
}

function updateBuf(gl: WebGLRenderingContext, buf: WebGLBuffer, data: Float32Array) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
}

function bindAttrib(gl: WebGLRenderingContext, loc: number, buf: WebGLBuffer, size: number) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
}

function hexToRGB(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255]
}

// ── Baked visual parameters (from d10-v0.3.html defaults) ─────
const PARAMS = {
  shellAlpha: 0.09,
  iriStr: 1.62,
  iriShift: 2.73,
  iriFreq: 3.4,
  shellFPow: 8.0,
  iriLightPos: [2.5, 3.0, 2.0] as Vec3,
  iriViewMix: 0.5,
  innerScale: 0.985,
  poleH: 0.65,
  innerAlpha: 1.0,
  dispersion: 0.04,
  prismatic: true,
  baseCol: '#eee5ff',
  metallic: 0.85,
  roughness: 0.25,
  specInt: 0.8,
  ambient: 0.15,
  envRef: 0.35,
  sheenCol: '#ccbbff',
  sheenInt: 0.6,
  sheenRough: 0.38,
  radarCol: '#4c00ff',
  radarRadius: 0.7,
  radarPoleH: 0.3,
  radarGlow: 0.21,
  radarFresnel: 0.0,
  l1: { col: '#ae00ff', int: 2.36, pos: [4.8, -0.2, 0.6] as Vec3 },
  l2: { col: '#ff7b00', int: 0.82, pos: [-4.1, 1.8, 1.6] as Vec3 },
  l3: { col: '#808099', int: 0.3, pos: [0.0, -2.0, 3.0] as Vec3 },
  point: { col: '#ffeedd', int: 3.5, pos: [3.0, 3.0, 4.0] as Vec3 },
  edgeCol: '#ffffff',
  edgeAlpha: 0.0,
  zoom: 8.5,
  autoSpeed: 1.68,
}

export default function D10Die({
  scores,
  size = 200,
  className,
  autoRotate = true,
  interactive = false,
}: D10DieProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    gl: WebGLRenderingContext
    programs: {
      inner: WebGLProgram
      outer: WebGLProgram
      edge: WebGLProgram
      radar: WebGLProgram
    }
    locs: {
      inner: Record<string, number | WebGLUniformLocation | null>
      outer: Record<string, number | WebGLUniformLocation | null>
      edge: Record<string, number | WebGLUniformLocation | null>
      radar: Record<string, number | WebGLUniformLocation | null>
    }
    buffers: {
      innerPos: WebGLBuffer
      innerNrm: WebGLBuffer
      outerPos: WebGLBuffer
      outerNrm: WebGLBuffer
      edge: WebGLBuffer
      radarPos: WebGLBuffer
      radarNrm: WebGLBuffer
    }
    vertCount: number
    edgeCount: number
    radarVertCount: number
    quat: Quat
    spinVX: number
    spinVY: number
    dragging: boolean
    lastMX: number
    lastMY: number
    animFrame: number
    startTime: number
  } | null>(null)
  const scoresRef = useRef(scores)
  scoresRef.current = scores

  const initGL = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false })
    if (!gl) return

    gl.enable(gl.DEPTH_TEST)
    gl.clearColor(0, 0, 0, 0)

    // Compile shader programs
    const innerProg = mkProgram(gl, innerVS, innerFS)
    const outerProg = mkProgram(gl, outerVS, outerFS)
    const edgeProg = mkProgram(gl, edgeVS, edgeFS)
    const radarProg = mkProgram(gl, radarVS, radarFS)

    const iLoc = getLocs(gl, innerProg, ['aPos', 'aNorm'], [
      'uMVP', 'uModel', 'uNormMat', 'uEye', 'uBaseColor', 'uScale',
      'uMetallic', 'uRoughness', 'uSpecInt', 'uAmbient', 'uEnvRef',
      'uPointPos', 'uPointCol', 'uPointInt',
      'uSheenCol', 'uSheenInt', 'uSheenRough',
      'uL1Dir', 'uL1Col', 'uL1Int', 'uL2Dir', 'uL2Col', 'uL2Int', 'uL3Dir', 'uL3Col', 'uL3Int',
      'uInnerAlpha', 'uDispersion', 'uPrismatic',
      'uIriStr', 'uIriShift', 'uIriFreq', 'uIriLightPos', 'uIriViewMix', 'uShellFPow',
    ])
    const oLoc = getLocs(gl, outerProg, ['aPos', 'aNorm'], [
      'uMVP', 'uModel', 'uNormMat', 'uEye',
      'uIriStr', 'uIriShift', 'uIriFreq', 'uIriLightPos', 'uIriViewMix',
      'uShellAlpha', 'uShellFPow',
      'uPointPos', 'uPointCol', 'uPointInt',
    ])
    const eLoc = getLocs(gl, edgeProg, ['aPos'], ['uMVP', 'uEdgeColor', 'uEdgeAlpha'])
    const rLoc = getLocs(gl, radarProg, ['aPos', 'aNorm'], [
      'uMVP', 'uModel', 'uNormMat', 'uEye', 'uRadarCol',
      'uRadarGlow', 'uRadarFresnel', 'uTime', 'uL1Dir', 'uL1Int',
    ])

    // Build geometry
    const innerMesh = buildFlat(DEFAULT_H)
    const outerMesh = buildSmooth(DEFAULT_H)
    const edgeMesh = buildEdges(DEFAULT_H)

    const innerPosBuf = mkBuf(gl, innerMesh.positions)
    const innerNrmBuf = mkBuf(gl, innerMesh.normals)
    const outerPosBuf = mkBuf(gl, outerMesh.positions)
    const outerNrmBuf = mkBuf(gl, outerMesh.normals)
    const edgeBuf = mkBuf(gl, edgeMesh.positions)
    const radarPosBuf = mkBuf(gl, new Float32Array(90 * 3))
    const radarNrmBuf = mkBuf(gl, new Float32Array(90 * 3))

    const initialQuat = qNorm(qMul(qAxis(1, 0, 0, 0.4), qAxis(0, 1, 0, 0.3)))

    stateRef.current = {
      gl,
      programs: { inner: innerProg, outer: outerProg, edge: edgeProg, radar: radarProg },
      locs: { inner: iLoc, outer: oLoc, edge: eLoc, radar: rLoc },
      buffers: {
        innerPos: innerPosBuf, innerNrm: innerNrmBuf,
        outerPos: outerPosBuf, outerNrm: outerNrmBuf,
        edge: edgeBuf, radarPos: radarPosBuf, radarNrm: radarNrmBuf,
      },
      vertCount: innerMesh.count,
      edgeCount: edgeMesh.count,
      radarVertCount: 0,
      quat: initialQuat,
      spinVX: 0,
      spinVY: 0,
      dragging: false,
      lastMX: 0,
      lastMY: 0,
      animFrame: 0,
      startTime: performance.now() / 1000,
    }

    function applyRot(dx: number, dy: number) {
      if (!stateRef.current) return
      stateRef.current.quat = qNorm(qMul(qMul(qAxis(1, 0, 0, dy), qAxis(0, 1, 0, dx)), stateRef.current.quat))
    }

    // Interactive mouse drag
    if (interactive) {
      const onDown = (e: PointerEvent) => {
        if (!stateRef.current) return
        stateRef.current.dragging = true
        stateRef.current.lastMX = e.clientX
        stateRef.current.lastMY = e.clientY
        stateRef.current.spinVX = 0
        stateRef.current.spinVY = 0
        canvas.setPointerCapture(e.pointerId)
      }
      const onMove = (e: PointerEvent) => {
        if (!stateRef.current || !stateRef.current.dragging) return
        const dx = (e.clientX - stateRef.current.lastMX) * 0.007
        const dy = (e.clientY - stateRef.current.lastMY) * 0.007
        stateRef.current.lastMX = e.clientX
        stateRef.current.lastMY = e.clientY
        stateRef.current.spinVX = dx
        stateRef.current.spinVY = dy
        applyRot(dx, dy)
      }
      const onUp = () => {
        if (stateRef.current) stateRef.current.dragging = false
      }
      canvas.addEventListener('pointerdown', onDown)
      canvas.addEventListener('pointermove', onMove)
      canvas.addEventListener('pointerup', onUp)
    }

    // Render loop
    function render() {
      const s = stateRef.current
      if (!s) return
      s.animFrame = requestAnimationFrame(render)

      const canvas = canvasRef.current
      if (!canvas) return
      const gl = s.gl

      const dpr = devicePixelRatio
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      gl.viewport(0, 0, canvas.width, canvas.height)

      const uTime = (performance.now() / 1000) - s.startTime

      // Build radar gem from current scores
      const sc = scoresRef.current
      const vals = [sc.Sincerity, sc.Excitement, sc.Competence, sc.Ruggedness, sc.Sophistication]
      const rGem = buildRadarGem(vals, PARAMS.radarRadius, PARAMS.radarPoleH, PARAMS.poleH, PARAMS.innerScale)
      updateBuf(gl, s.buffers.radarPos, rGem.positions)
      updateBuf(gl, s.buffers.radarNrm, rGem.normals)
      s.radarVertCount = rGem.count

      // Auto rotate
      if (!s.dragging && autoRotate) {
        const as = PARAMS.autoSpeed * 0.006
        s.spinVX *= 0.95
        s.spinVY *= 0.95
        s.quat = qNorm(qMul(qMul(qAxis(1, 0, 0, s.spinVY), qAxis(0, 1, 0, s.spinVX + as)), s.quat))
      } else if (!s.dragging) {
        s.spinVX *= 0.95
        s.spinVY *= 0.95
        if (Math.abs(s.spinVX) > 0.0001 || Math.abs(s.spinVY) > 0.0001) {
          s.quat = qNorm(qMul(qMul(qAxis(1, 0, 0, s.spinVY), qAxis(0, 1, 0, s.spinVX)), s.quat))
        }
      }

      const asp = canvas.width / canvas.height
      const eye: Vec3 = [0, 0, PARAMS.zoom]
      const proj = perspective(Math.PI / 5.5, asp, 0.1, 100)
      const model = qToMat4(s.quat)
      const view = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -eye[0], -eye[1], -eye[2], 1])
      const mvp = mul4(proj, mul4(view, model))
      const nm = normMat3(model)

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      const baseCol = hexToRGB(PARAMS.baseCol)
      const sheenCol = hexToRGB(PARAMS.sheenCol)
      const l1Col = hexToRGB(PARAMS.l1.col)
      const l2Col = hexToRGB(PARAMS.l2.col)
      const l3Col = hexToRGB(PARAMS.l3.col)
      const pointCol = hexToRGB(PARAMS.point.col)
      const radarCol = hexToRGB(PARAMS.radarCol)

      // ── 1) Inner die ──
      gl.enable(gl.CULL_FACE)
      gl.useProgram(s.programs.inner)
      const iL = s.locs.inner
      gl.uniformMatrix4fv(iL.uMVP as WebGLUniformLocation, false, mvp)
      gl.uniformMatrix4fv(iL.uModel as WebGLUniformLocation, false, model)
      gl.uniformMatrix3fv(iL.uNormMat as WebGLUniformLocation, false, nm)
      gl.uniform3fv(iL.uEye as WebGLUniformLocation, eye)
      gl.uniform3fv(iL.uBaseColor as WebGLUniformLocation, baseCol)
      gl.uniform1f(iL.uScale as WebGLUniformLocation, PARAMS.innerScale)
      gl.uniform1f(iL.uMetallic as WebGLUniformLocation, PARAMS.metallic)
      gl.uniform1f(iL.uRoughness as WebGLUniformLocation, PARAMS.roughness)
      gl.uniform1f(iL.uSpecInt as WebGLUniformLocation, PARAMS.specInt)
      gl.uniform1f(iL.uAmbient as WebGLUniformLocation, PARAMS.ambient)
      gl.uniform1f(iL.uEnvRef as WebGLUniformLocation, PARAMS.envRef)
      gl.uniform3fv(iL.uPointPos as WebGLUniformLocation, PARAMS.point.pos)
      gl.uniform3fv(iL.uPointCol as WebGLUniformLocation, pointCol)
      gl.uniform1f(iL.uPointInt as WebGLUniformLocation, PARAMS.point.int)
      gl.uniform3fv(iL.uSheenCol as WebGLUniformLocation, sheenCol)
      gl.uniform1f(iL.uSheenInt as WebGLUniformLocation, PARAMS.sheenInt)
      gl.uniform1f(iL.uSheenRough as WebGLUniformLocation, PARAMS.sheenRough)
      gl.uniform3fv(iL.uL1Dir as WebGLUniformLocation, PARAMS.l1.pos)
      gl.uniform3fv(iL.uL1Col as WebGLUniformLocation, l1Col)
      gl.uniform1f(iL.uL1Int as WebGLUniformLocation, PARAMS.l1.int)
      gl.uniform3fv(iL.uL2Dir as WebGLUniformLocation, PARAMS.l2.pos)
      gl.uniform3fv(iL.uL2Col as WebGLUniformLocation, l2Col)
      gl.uniform1f(iL.uL2Int as WebGLUniformLocation, PARAMS.l2.int)
      gl.uniform3fv(iL.uL3Dir as WebGLUniformLocation, PARAMS.l3.pos)
      gl.uniform3fv(iL.uL3Col as WebGLUniformLocation, l3Col)
      gl.uniform1f(iL.uL3Int as WebGLUniformLocation, PARAMS.l3.int)
      gl.uniform1f(iL.uInnerAlpha as WebGLUniformLocation, PARAMS.innerAlpha)
      gl.uniform1f(iL.uDispersion as WebGLUniformLocation, PARAMS.dispersion)
      gl.uniform1f(iL.uPrismatic as WebGLUniformLocation, PARAMS.prismatic ? 1.0 : 0.0)
      gl.uniform1f(iL.uIriStr as WebGLUniformLocation, PARAMS.iriStr)
      gl.uniform1f(iL.uIriShift as WebGLUniformLocation, PARAMS.iriShift)
      gl.uniform1f(iL.uIriFreq as WebGLUniformLocation, PARAMS.iriFreq)
      gl.uniform3fv(iL.uIriLightPos as WebGLUniformLocation, PARAMS.iriLightPos)
      gl.uniform1f(iL.uIriViewMix as WebGLUniformLocation, PARAMS.iriViewMix)
      gl.uniform1f(iL.uShellFPow as WebGLUniformLocation, PARAMS.shellFPow)
      bindAttrib(gl, iL.aPos as number, s.buffers.innerPos, 3)
      bindAttrib(gl, iL.aNorm as number, s.buffers.innerNrm, 3)

      // Prismatic: transparent rendering
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.depthMask(false)
      gl.cullFace(gl.FRONT); gl.drawArrays(gl.TRIANGLES, 0, s.vertCount)
      gl.cullFace(gl.BACK); gl.drawArrays(gl.TRIANGLES, 0, s.vertCount)
      gl.depthMask(true)
      gl.disable(gl.BLEND)

      // ── 1.5) Radar Gem ──
      if (s.radarVertCount > 0) {
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.disable(gl.BLEND)
        gl.depthMask(true)
        gl.useProgram(s.programs.radar)
        const rL = s.locs.radar
        gl.uniformMatrix4fv(rL.uMVP as WebGLUniformLocation, false, mvp)
        gl.uniformMatrix4fv(rL.uModel as WebGLUniformLocation, false, model)
        gl.uniformMatrix3fv(rL.uNormMat as WebGLUniformLocation, false, nm)
        gl.uniform3fv(rL.uEye as WebGLUniformLocation, eye)
        gl.uniform3fv(rL.uRadarCol as WebGLUniformLocation, radarCol)
        gl.uniform1f(rL.uRadarGlow as WebGLUniformLocation, PARAMS.radarGlow)
        gl.uniform1f(rL.uRadarFresnel as WebGLUniformLocation, PARAMS.radarFresnel)
        gl.uniform1f(rL.uTime as WebGLUniformLocation, uTime)
        gl.uniform3fv(rL.uL1Dir as WebGLUniformLocation, PARAMS.l1.pos)
        gl.uniform1f(rL.uL1Int as WebGLUniformLocation, PARAMS.l1.int)
        bindAttrib(gl, rL.aPos as number, s.buffers.radarPos, 3)
        bindAttrib(gl, rL.aNorm as number, s.buffers.radarNrm, 3)
        gl.drawArrays(gl.TRIANGLES, 0, s.radarVertCount)
      }

      // ── 2) Edges ──
      const ea = PARAMS.edgeAlpha
      if (ea > 0.001) {
        const sc = PARAMS.innerScale
        const scaleMat = new Float32Array([sc, 0, 0, 0, 0, sc, 0, 0, 0, 0, sc, 0, 0, 0, 0, 1])
        const scaledModel = mul4(model, scaleMat)
        const edgeMvp = mul4(proj, mul4(view, scaledModel))
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.depthFunc(gl.LEQUAL)
        gl.useProgram(s.programs.edge)
        const eL = s.locs.edge
        gl.uniformMatrix4fv(eL.uMVP as WebGLUniformLocation, false, edgeMvp)
        gl.uniform3fv(eL.uEdgeColor as WebGLUniformLocation, hexToRGB(PARAMS.edgeCol))
        gl.uniform1f(eL.uEdgeAlpha as WebGLUniformLocation, ea)
        bindAttrib(gl, eL.aPos as number, s.buffers.edge, 3)
        gl.drawArrays(gl.LINES, 0, s.edgeCount)
        gl.depthFunc(gl.LESS)
        gl.disable(gl.BLEND)
      }

      // ── 3) Outer shell ──
      const sa = PARAMS.shellAlpha
      if (sa > 0.001) {
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        gl.depthMask(false)
        gl.enable(gl.CULL_FACE)
        gl.useProgram(s.programs.outer)
        const oL = s.locs.outer
        gl.uniformMatrix4fv(oL.uMVP as WebGLUniformLocation, false, mvp)
        gl.uniformMatrix4fv(oL.uModel as WebGLUniformLocation, false, model)
        gl.uniformMatrix3fv(oL.uNormMat as WebGLUniformLocation, false, nm)
        gl.uniform3fv(oL.uEye as WebGLUniformLocation, eye)
        gl.uniform1f(oL.uIriStr as WebGLUniformLocation, PARAMS.iriStr)
        gl.uniform1f(oL.uIriShift as WebGLUniformLocation, PARAMS.iriShift)
        gl.uniform1f(oL.uIriFreq as WebGLUniformLocation, PARAMS.iriFreq)
        gl.uniform3fv(oL.uIriLightPos as WebGLUniformLocation, PARAMS.iriLightPos)
        gl.uniform1f(oL.uIriViewMix as WebGLUniformLocation, PARAMS.iriViewMix)
        gl.uniform1f(oL.uShellAlpha as WebGLUniformLocation, sa)
        gl.uniform1f(oL.uShellFPow as WebGLUniformLocation, PARAMS.shellFPow)
        gl.uniform3fv(oL.uPointPos as WebGLUniformLocation, PARAMS.point.pos)
        gl.uniform3fv(oL.uPointCol as WebGLUniformLocation, pointCol)
        gl.uniform1f(oL.uPointInt as WebGLUniformLocation, PARAMS.point.int)
        bindAttrib(gl, oL.aPos as number, s.buffers.outerPos, 3)
        bindAttrib(gl, oL.aNorm as number, s.buffers.outerNrm, 3)
        gl.cullFace(gl.FRONT); gl.drawArrays(gl.TRIANGLES, 0, s.vertCount)
        gl.cullFace(gl.BACK); gl.drawArrays(gl.TRIANGLES, 0, s.vertCount)
        gl.depthMask(true)
        gl.disable(gl.BLEND)
      }
    }

    stateRef.current.animFrame = requestAnimationFrame(render)
  }, [autoRotate, interactive])

  useEffect(() => {
    initGL()
    return () => {
      if (stateRef.current) {
        cancelAnimationFrame(stateRef.current.animFrame)
        const gl = stateRef.current.gl
        const s = stateRef.current
        // Clean up GL resources
        gl.deleteProgram(s.programs.inner)
        gl.deleteProgram(s.programs.outer)
        gl.deleteProgram(s.programs.edge)
        gl.deleteProgram(s.programs.radar)
        gl.deleteBuffer(s.buffers.innerPos)
        gl.deleteBuffer(s.buffers.innerNrm)
        gl.deleteBuffer(s.buffers.outerPos)
        gl.deleteBuffer(s.buffers.outerNrm)
        gl.deleteBuffer(s.buffers.edge)
        gl.deleteBuffer(s.buffers.radarPos)
        gl.deleteBuffer(s.buffers.radarNrm)
        stateRef.current = null
      }
    }
  }, [initGL])

  return (
    <canvas
      ref={canvasRef}
      width={size * (typeof window !== 'undefined' ? devicePixelRatio : 1)}
      height={size * (typeof window !== 'undefined' ? devicePixelRatio : 1)}
      style={{ width: size, height: size, cursor: interactive ? 'grab' : 'default' }}
      className={className}
    />
  )
}
