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
  scene.add(new THREE.HemisphereLight(0xcbeaff, 0x142141, 2));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(8, -6, 15);
  scene.add(light);
  let group = new THREE.Group();
  scene.add(group);
  let result = null,
    options = {},
    meshes = [],
    nodal = [],
    frameId = 0,
    playing = false,
    lost = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function sample(s) {
    const p = result.points;
    if (!p.length) return { displacement: 0, index: 0, axial: 0, hoop: 0 };
    let i = 0;
    while (i < p.length - 2 && p[i + 1].position < s) i++;
    const a = p[i],
      b = p[i + 1] ?? a,
      t = Math.max(
        0,
        Math.min(1, (s - a.position) / (b.position - a.position || 1)),
      );
    return Object.fromEntries(
      ["displacement", "index", "axial", "hoop"].map((k) => [
        k,
        a[k] + (b[k] - a[k]) * t,
      ]),
    );
  }
  function deform(x, y, z, s, active, amplitude) {
    if (!active || !result.points.length) return [x, y, z];
    const c = result.config,
      p = sample(s),
      u = p.displacement * amplitude;
    if (c.object === "aircraft")
      return c.load === "lift" ? [x, y, z + u] : [x, y + Math.sign(y) * u, z];
    if (c.object === "sphere") {
      const scale = 1 + (result.displacement / c.sphere.radius) * amplitude;
      return [x * scale, y * scale, z * scale];
    }
    const hoopStrain =
      c.load === "pressure"
        ? p.hoop / result.material.E2 -
          (result.material.nu * p.axial) / result.material.E
        : c.load === "thermal"
          ? result.material.alpha2 * c.deltaT
          : 0;
    return [
      x * (1 + hoopStrain * amplitude),
      y * (1 + hoopStrain * amplitude),
      z + u,
    ];
  }
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
          : new THREE.Color().setHSL(0.5 * (1 - t), 0.8, 0.53);
      colors.push(color.r, color.g, color.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.5,
      metalness: 0.25,
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
    meshes.push({ geo, base: vertices.slice(), positions, active, wire });
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
    group.traverse((o) => {
      if (o.isMesh || o.isLine || o.isPoints) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      }
    });
    scene.remove(group);
    group = new THREE.Group();
    scene.add(group);
    meshes = [];
    nodal = [];
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
    for (const item of [...meshes, ...nodal]) {
      const arr = item.geo.attributes.position;
      for (let i = 0; i < arr.count; i++)
        arr.setXYZ(
          i,
          ...deform(
            ...item.base.slice(3 * i, 3 * i + 3),
            item.positions[i],
            item.active !== false,
            amp,
          ),
        );
      arr.needsUpdate = true;
      if (item.wire) item.wire.visible = options.mesh;
      else item.points.visible = options.nodes;
    }
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
      .add(new THREE.Vector3(size * 1.05, -size * 1.1, size * 0.65));
    camera.near = Math.max(0.001, size / 1000);
    camera.far = Math.max(100, size * 100);
    camera.updateProjectionMatrix();
    controls.update();
    request();
  }
  const observer = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    if (width > 0 && height > 0) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      request();
    }
  });
  observer.observe(host);
  controls.addEventListener("change", request);
  document.addEventListener("aerolab:tabchange", request);
  document.addEventListener("visibilitychange", request);
  reduced.addEventListener("change", request);
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    host.dataset.rendered = "false";
    host.dispatchEvent(
      new CustomEvent("designer:error", {
        detail:
          "Contexto WebGL perdido; cálculos y tablas siguen disponibles. Recarga para recuperar el visor.",
      }),
    );
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
