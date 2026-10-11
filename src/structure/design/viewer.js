import { setupPresentation, fieldColor, framingBoxDistance } from '../../rendering/presentation.js';
import { sampleField, deformVertex } from "./deformation.js";
import * as THREE from "three";
import { OrbitControls } from "../../../vendor/three/OrbitControls.js";
import { profile } from "./geometry.js";
const radians = (d) => (d * Math.PI) / 180;
export function createDesigner(host) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute(
    "aria-label",
    "Diseño estructural 3D. Arrastrar para rotar, rueda para zoom, botón derecho para desplazar. Flechas rotan, Mayús y flechas desplazan; + y − acercan/alejan.",
  );
  host.append(renderer.domElement);
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(42, 1, 0.01, 1000);
  camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  setupPresentation(THREE, renderer, scene);
  let group = new THREE.Group();
  scene.add(group);
  let result = null,
    options = {},
    meshes = [],
    nodal = [],
    frameId = 0,
    playing = false,
    lost = false,
    lastAmplitude = null,
    normalUpdates = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function sample(s) { return sampleField(result.points,s); }
  function deform(...args) { return deformVertex(result,...args); }
  function make(vertices, indices, positions, active = true, neutral = false) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const colors = [];
    for (const s of positions) {
      const p = sample(s),
        t = Math.min(1, p.index),
        color = neutral
          ? new THREE.Color(0x475978)
          : new THREE.Color().setRGB(...fieldColor(t), THREE.SRGBColorSpace);
      colors.push(color.r, color.g, color.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true, side: THREE.DoubleSide, toneMapped: false,
    });
    const geometryMaterial = new THREE.MeshStandardMaterial({
      color: neutral ? 0x475978 : 0x83b6c6, side: THREE.DoubleSide,
      roughness: 0.38, metalness: 0.35,
    });
    const mesh = new THREE.Mesh(geo, mat),
      wire = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          color: 0xa5a6ef,
          wireframe: true,
          transparent: true,
          opacity: 0.14,
        }),
      );
    wire.visible = options.mesh;
    group.add(mesh, wire);
    meshes.push({ geo, base: vertices.slice(), positions, active, wire, mesh, fieldMaterial: mat, geometryMaterial });
  }
  function tube(radius, length, offset, active = true, nose = false) {
    const vertices = [],
      indices = [],
      positions = [],
      rows = nose ? 32 : Math.max(2, result.config.elements),
      count = 48;
    for (let i = 0; i <= rows; i++) {
      const t = i / rows,
        z = offset + t * length,
        r = nose
          ? result.config.rocket.noseType === "cone"
            ? radius * (1 - t)
            : radius * Math.sqrt(1 - t * t)
          : radius;
      for (let j = 0; j <= count; j++) {
        const a = (j / count) * Math.PI * 2;
        vertices.push(r * Math.cos(a), r * Math.sin(a), z);
        positions.push(z);
        if (i < rows && j < count) {
          const k = i * (count + 1) + j;
          indices.push(
            k,
            k + 1,
            k + count + 1,
            k + 1,
            k + count + 2,
            k + count + 1,
          );
        }
      }
    }
    make(vertices, indices, positions, active, !active);
  }
  function clear() {
    const geometries = new Set(), materials = new Set();
    group.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); });
    meshes.forEach(item => { materials.add(item.fieldMaterial); materials.add(item.geometryMaterial); });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
    scene.remove(group);
    group = new THREE.Group(); scene.add(group);
    meshes = []; nodal = []; lastAmplitude = null;
  }
  function build() {
    clear();
    const c = result.config;
    if (c.object === "aircraft") {
      for (const side of [-1, 1]) {
        const vertices = [],
          indices = [],
          positions = [],
          n = c.elements,
          L = c.wing.span / 2;
        let ringSize = 0;
        for (let i = 0; i <= n; i++) {
          const s = (L * i) / n,
            chord = c.wing.root + ((c.wing.tip - c.wing.root) * i) / n,
            ring = profile(c.wing, chord);
          ringSize = ring.length;
          ring.forEach(([x, z]) => {
            vertices.push(
              -x + s * Math.tan(radians(c.wing.sweep)),
              side * s,
              z + s * Math.tan(radians(c.wing.dihedral)),
            );
            positions.push(s);
          });
          if (i < n)
            for (let j = 0; j < ringSize; j++) {
              const k = i * ringSize + j,
                next = i * ringSize + ((j + 1) % ringSize);
              indices.push(
                k,
                next,
                k + ringSize,
                next,
                next + ringSize,
                k + ringSize,
              );
            }
        }
        make(vertices, indices, positions);
      }
      const geo = new THREE.SphereGeometry(1, 48, 24);
      geo.scale(
        c.fuselage.length / 2,
        c.fuselage.diameter / 2,
        c.fuselage.diameter / 2,
      );
      make(
        [...geo.attributes.position.array],
        [...geo.index.array],
        Array(geo.attributes.position.count).fill(0),
        false,
        true,
      );
      geo.dispose();
    } else if (c.object === "rocket") {
      let z = 0;
      c.rocket.sections.forEach((s) => {
        tube(s.diameter / 2, s.length, z);
        z += s.length;
      });
      tube(
        c.rocket.sections.at(-1).diameter / 2,
        c.rocket.nose,
        z,
        false,
        true,
      );
      const r = c.rocket,
        base = r.sections[0].diameter / 2;
      for (let i = 0; i < r.finCount; i++) {
        const a = (i / r.finCount) * 2 * Math.PI,
          points = [
            [base, 0, 0],
            [base + r.finHeight, 0, 0],
            [base, 0, r.finChord],
          ],
          verts = [];
        for (const sign of [-1, 1])
          for (const [x, , z] of points) {
            const y = (sign * r.finThickness) / 2;
            verts.push(
              x * Math.cos(a) - y * Math.sin(a),
              x * Math.sin(a) + y * Math.cos(a),
              z,
            );
          }
        make(
          verts,
          [
            0, 1, 2, 3, 5, 4, 0, 3, 1, 1, 3, 4, 1, 4, 2, 2, 4, 5, 2, 5, 0, 0, 5,
            3,
          ],
          Array(6).fill(0),
          false,
          true,
        );
      }
    } else {
      const geo = new THREE.SphereGeometry(c.sphere.radius, 48, 32);
      make(
        [...geo.attributes.position.array],
        [...geo.index.array],
        Array(geo.attributes.position.count).fill(0),
        true,
        !result.points.length,
      );
      geo.dispose();
    }
    if (c.object !== "sphere") {
      const coords = [],
        sValues = [];
      for (const side of c.object === "aircraft" ? [-1, 1] : [1])
        for (const p of result.points) {
          const s = p.position;
          coords.push(
            ...(c.object === "aircraft"
              ? [
                  -(
                    c.wing.root +
                    ((c.wing.tip - c.wing.root) * s) / (c.wing.span / 2)
                  ) *
                    0.25 +
                    s * Math.tan(radians(c.wing.sweep)),
                  side * s,
                  s * Math.tan(radians(c.wing.dihedral)),
                ]
              : [0, 0, s]),
          );
          sValues.push(s);
        }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(coords, 3));
      const points = new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: 0xffdd83,
          size: 7,
          sizeAttenuation: false,
          depthTest: false,
        }),
      );
      points.renderOrder = 3;
      points.visible = options.nodes;
      group.add(points);
      nodal.push({ geo, base: coords, positions: sValues, points });
    }
    host.dataset.meshes = String(meshes.length);
    host.dataset.nodes = String(
      nodal.reduce((sum, n) => sum + n.positions.length, 0),
    );
  }
  function visible() {
    return !document.hidden && !host.closest("[hidden]") && !lost;
  }
  function draw(now = 0) {
    frameId = 0;
    if (!result || !visible()) return;
    host.dataset.camera = JSON.stringify(camera.position.toArray());
    const fraction =
      playing && !reduced.matches
        ? (Math.sin(now / 1400 - Math.PI / 2) + 1) / 2
        : options.fraction / 100;
    const amp = options.magnification * fraction;
    const changed = amp !== lastAmplitude;
    for (const item of [...meshes, ...nodal]) {
      if (changed) {
        const arr = item.geo.attributes.position;
        for (let i = 0; i < arr.count; i++)
          arr.setXYZ(i, ...deform(...item.base.slice(3 * i, 3 * i + 3), item.positions[i], item.active !== false, amp));
        arr.needsUpdate = true;
        if (item.mesh) { item.geo.computeVertexNormals(); normalUpdates++; }
        item.geo.computeBoundingBox(); item.geo.computeBoundingSphere();
      }
      if (item.wire) {
        item.wire.visible = options.mesh;
        item.mesh.material = options.display === 'geometry' ? item.geometryMaterial : item.fieldMaterial;
      } else item.points.visible = options.nodes;
    }
    lastAmplitude = amp;
    host.dataset.normalUpdates = String(normalUpdates);
    host.dataset.display = options.display ?? 'field';
    host.dataset.renderCount = String(Number(host.dataset.renderCount ?? 0) + 1);
    renderer.render(scene, camera);
    host.dataset.rendered = "true";
    host.dataset.fraction = fraction.toFixed(3);
    if (playing && !reduced.matches) frameId = requestAnimationFrame(draw);
  }
  function request() {
    if (!frameId && result && visible()) frameId = requestAnimationFrame(draw);
  }
  function reset() {
    if (!result) return;
    const box = new THREE.Box3().setFromObject(group),
      size = box.getSize(new THREE.Vector3()).length(),
      center = box.getCenter(new THREE.Vector3());
    controls.target.copy(center);
    camera.position
      .copy(center)
      .add(new THREE.Vector3(1, -1.1, .65).normalize().multiplyScalar(framingBoxDistance(box.getSize(new THREE.Vector3()).toArray(), camera.aspect, [1, -1.1, .65], [0, 0, 1], camera.fov)));
    camera.near = Math.max(0.001, size / 1000);
    camera.far = Math.max(100, size * 100);
    camera.updateProjectionMatrix();
    controls.update();
    request();
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (width > 0 && height > 0) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      request();
    }
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  controls.addEventListener("change", request);
  document.addEventListener("aerolab:tabchange", request);
  document.addEventListener("visibilitychange", request);
  reduced.addEventListener("change", request);
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    playing = false;
    cancelAnimationFrame(frameId); frameId = 0;
    host.dataset.rendered = "false";
    host.dispatchEvent(
      new CustomEvent("designer:error", {
        detail:
          "Contexto WebGL perdido; cálculos y tablas siguen disponibles. Esperando recuperación del navegador; recarga si no se restaura.",
      }),
    );
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    lost = false;
    host.dispatchEvent(new CustomEvent("designer:ready"));
    request();
  });
  renderer.domElement.addEventListener("keydown", (e) => {
    const offset = camera.position.clone().sub(controls.target);
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      if (e.shiftKey) {
        const delta = new THREE.Vector3(
          e.key === "ArrowLeft" ? -0.2 : e.key === "ArrowRight" ? 0.2 : 0,
          0,
          e.key === "ArrowUp" ? 0.2 : e.key === "ArrowDown" ? -0.2 : 0,
        );
        camera.position.add(delta);
        controls.target.add(delta);
      } else {
        const rotation = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(
            e.key === "ArrowUp" || e.key === "ArrowDown" ? 1 : 0,
            0,
            e.key === "ArrowLeft" || e.key === "ArrowRight" ? 1 : 0,
          ),
          (e.key === "ArrowLeft" || e.key === "ArrowDown" ? 1 : -1) * 0.1,
        );
        camera.position
          .copy(controls.target)
          .add(offset.applyQuaternion(rotation));
      }
    } else if (["+", "=", "-"].includes(e.key)) {
      e.preventDefault();
      camera.position
        .copy(controls.target)
        .add(offset.multiplyScalar(e.key === "-" ? 1.12 : 0.88));
    }
    controls.update();
    request();
  });
  return {
    update(next, settings) {
      const changed =
        JSON.stringify(next?.config) !== JSON.stringify(result?.config);
      result = next;
      options = settings;
      playing = settings.playing;
      if (!next) {
        host.dataset.meshes = "0";
        host.dataset.nodes = "0";
        cancelAnimationFrame(frameId);
        frameId = 0;
        clear();
        renderer.clear();
        host.dataset.rendered = "false";
        return;
      }
      if (changed) {
        build();
        reset();
      }
      request();
    },
    reset,
    inspect: () => ({
      camera: camera.position.toArray(),
      meshes: meshes.length,
      nodes: nodal.reduce((a, n) => a + n.positions.length, 0),
    }),
  };
}
