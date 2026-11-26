import * as THREE from 'three';

const cube = new THREE.BoxGeometry();
const tube = new THREE.CylinderGeometry(1, 1, 1, 12);
const materials = new Map<number, THREE.MeshStandardMaterial>();
export function marketPaint(color: number) {
  let material = materials.get(color);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, roughness: .8 });
    materials.set(color, material);
  }
  return material;
}

export function block(parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, paint: number | THREE.Material) {
  const mesh = new THREE.Mesh(cube, typeof paint === 'number' ? marketPaint(paint) : paint);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

export function round(parent: THREE.Object3D, radius: number, height: number, x: number, y: number, z: number, color: number) {
  const mesh = new THREE.Mesh(tube, marketPaint(color));
  mesh.scale.set(radius, height, radius);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

export function marketSign(parent: THREE.Object3D, title: string, subtitle: string, x: number, y: number, z: number, w: number, h: number, background: string, ink = '#fff') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.font = 'italic 900 64px system-ui';
  ctx.fillText(title, 256, subtitle ? 70 : 87, 485);
  if (subtitle) {
    ctx.font = 'bold 24px system-ui';
    ctx.fillText(subtitle, 256, 108, 485);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map }));
  sign.position.set(x, y, z);
  parent.add(sign);
  return sign;
}

export function marketPoint(x: number, z: number) {
  return new THREE.Vector3(x, 0, z);
}

export function walkMarketActor(actor: THREE.Group, target: THREE.Vector3, dt: number, speed = 1.55, actors: readonly THREE.Group[] = []) {
  const dx = target.x - actor.position.x, dz = target.z - actor.position.z;
  const distance = Math.hypot(dx, dz);
  if (distance < .03) return true;
  const step = Math.min(distance, dt * speed);
  const x = actor.position.x + dx * step / distance, z = actor.position.z + dz * step / distance;
  // Allow an actor already close to another to step away.
  if (actors.some(other => other !== actor && other.visible &&
    Math.hypot(other.position.x - x, other.position.z - z) < .56 &&
    Math.hypot(other.position.x - actor.position.x, other.position.z - actor.position.z) > Math.hypot(other.position.x - x, other.position.z - z))) return false;
  actor.position.set(x, 0, z);
  actor.rotation.y = Math.atan2(dx, dz);
  return step === distance;
}

// Batch opaque static cuboids. Leave animated groups and individual transparent glass alone.
export function batchMarketBlocks(parent: THREE.Group) {
  const byMaterial = new Map<THREE.Material, THREE.Mesh[]>();
  for (const child of parent.children) {
    if (!(child instanceof THREE.Mesh) || child.geometry !== cube || Array.isArray(child.material) || child.material.transparent) continue;
    const list = byMaterial.get(child.material) ?? [];
    list.push(child);
    byMaterial.set(child.material, list);
  }
  for (const [material, meshes] of byMaterial) {
    if (meshes.length < 3) continue;
    const batch = new THREE.InstancedMesh(cube, material, meshes.length);
    meshes.forEach((mesh, i) => {
      mesh.updateMatrix();
      batch.setMatrixAt(i, mesh.matrix);
    });
    parent.remove(...meshes);
    batch.computeBoundingSphere();
    parent.add(batch);
  }
}
