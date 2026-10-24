import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  PARTICLES,
  SimulationParams,
  SimulationState,
} from '../physics/cyclotronEngine';
import {
  Box,
  Camera,
  ChevronDown,
  ChevronUp,
  Eye,
  Layers,
  Magnet,
  Maximize2,
} from 'lucide-react';

interface Cyclotron3DSceneProps {
  simState: SimulationState;
  params: SimulationParams;
  showForceVectors: boolean;
  showBFieldGrid: boolean;
  showEFieldLines: boolean;
  onPulsePolarity?: () => void;
  isGameMode?: boolean;
}

type CameraPreset = 'orbit' | 'top' | 'gap' | 'chase';

export const Cyclotron3DScene: React.FC<Cyclotron3DSceneProps> = ({
  simState,
  params,
  showForceVectors,
  showBFieldGrid,
  showEFieldLines,
  onPulsePolarity,
  isGameMode = false,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [explodedFactor, setExplodedFactor] = useState<number>(0.6);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('orbit');
  const [cutawayGlass, setCutawayGlass] = useState<boolean>(true);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  // Store latest mutable props in a ref so the WebGL loop reads live state without re-mounting
  const livePropsRef = useRef({
    simState,
    params,
    showForceVectors,
    showBFieldGrid,
    showEFieldLines,
    explodedFactor,
    cameraPreset,
    cutawayGlass,
  });

  livePropsRef.current = {
    simState,
    params,
    showForceVectors,
    showBFieldGrid,
    showEFieldLines,
    explodedFactor,
    cameraPreset,
    cutawayGlass,
  };

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software WebGL detection guard (SwiftShader / llvmpipe / Basic Render)
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070d19);
    scene.fog = new THREE.FogExp2(0x070d19, 0.025);

    // 2. Mandatory Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 7.6, 9.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.minDistance = 3.2;
    controls.maxDistance = 22;

    // Cancel camera preset lock when user manually drags OrbitControls
    const handleControlsStart = () => {
      livePropsRef.current.cameraPreset = 'orbit';
      setCameraPreset('orbit');
    };
    controls.addEventListener('start', handleControlsStart);

    // 3. Balanced 3-Point Studio Lighting + Warm/Cool Contrast
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    const d = 7;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(-8, 6, -7);
    scene.add(rimLight);

    // 4. Procedural Lab Pedestal & Contact Shadow Grounding
    const floorGeo = new THREE.CylinderGeometry(9.5, 10, 0.3, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.75,
      metalness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -2.65;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const gridHelper = new THREE.PolarGridHelper(8.5, 16, 8, 64, 0x1e293b, 0x334155);
    gridHelper.position.y = -2.48;
    scene.add(gridHelper);

    // 5. Composite 10-Part 3D Synchro-Cyclotron Assembly (THREE.Group)
    const cyclotronGroup = new THREE.Group();
    scene.add(cyclotronGroup);

    // Map physical deeRadiusM to 3.6 world units
    const WORLD_RADIUS = 3.6;
    const GAP_HALF_WORLD = 0.24;

    // Helper to build a hollow 3D D-shaped copper electrode ("Dee")
    const createHollowDeeGroup = (side: 'left' | 'right') => {
      const deeGroup = new THREE.Group();

      const outerR = WORLD_RADIUS;
      const deeHeight = 0.56;
      const plateThickness = 0.04;

      const shape = new THREE.Shape();
      const startAngle = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
      const endAngle = side === 'left' ? (3 * Math.PI) / 2 : Math.PI / 2;

      shape.absarc(0, 0, outerR, startAngle, endAngle, false);
      shape.closePath();

      // Top & Bottom semi-circular D-plates
      const plateGeo = new THREE.ExtrudeGeometry(shape, {
        depth: plateThickness,
        bevelEnabled: false,
        curveSegments: 48,
      });
      plateGeo.rotateX(Math.PI / 2);

      const copperMat = new THREE.MeshPhysicalMaterial({
        color: 0xd97706,
        metalness: 0.82,
        roughness: 0.24,
        clearcoat: 0.35,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const bottomPlate = new THREE.Mesh(plateGeo, copperMat);
      bottomPlate.position.y = -deeHeight / 2 + plateThickness;
      bottomPlate.receiveShadow = true;
      deeGroup.add(bottomPlate);

      const topPlate = new THREE.Mesh(plateGeo, copperMat);
      topPlate.position.y = deeHeight / 2;
      deeGroup.add(topPlate);

      // Crisp metallic wireframe edges on top and bottom D-plates for unmistakable D-shape silhouette
      const edgeGeo = new THREE.EdgesGeometry(plateGeo, 15);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.75,
      });
      const topEdges = new THREE.LineSegments(edgeGeo, edgeMat);
      topEdges.position.copy(topPlate.position);
      deeGroup.add(topEdges);

      const bottomEdges = new THREE.LineSegments(edgeGeo, edgeMat);
      bottomEdges.position.copy(bottomPlate.position);
      deeGroup.add(bottomEdges);

      // Curved outer rim wall of the hollow Dee
      // In Three.js CylinderGeometry, theta=0 is +Z, theta=PI/2 is +X, theta=PI is -Z, theta=3PI/2 is -X.
      // So 'right' (+X semicircle) is thetaStart = 0, length = PI.
      // And 'left' (-X semicircle) is thetaStart = PI, length = PI.
      const rimArcGeo = new THREE.CylinderGeometry(
        outerR,
        outerR,
        deeHeight,
        48,
        1,
        true,
        side === 'left' ? Math.PI : 0,
        Math.PI
      );
      const rimWallMat = new THREE.MeshStandardMaterial({
        color: 0xb45309,
        metalness: 0.85,
        roughness: 0.28,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });
      const rimMesh = new THREE.Mesh(rimArcGeo, rimWallMat);
      deeGroup.add(rimMesh);

      // Compact high-voltage ceramic/copper RF feedthrough terminal on outer edge of Dee
      const stemDir = side === 'left' ? -1 : 1;
      const stemLen = 0.65;
      const stemGeo = new THREE.CylinderGeometry(0.1, 0.1, stemLen, 20);
      stemGeo.rotateZ(Math.PI / 2);
      const stemMesh = new THREE.Mesh(stemGeo, rimWallMat);
      stemMesh.position.set(stemDir * (outerR + stemLen / 2), 0, 0);
      deeGroup.add(stemMesh);

      // Insulator collar ring at vacuum wall
      const collarGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.14, 24);
      collarGeo.rotateZ(Math.PI / 2);
      const collarMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.3,
        metalness: 0.2,
      });
      const collarMesh = new THREE.Mesh(collarGeo, collarMat);
      collarMesh.position.set(stemDir * (outerR + 0.18), 0, 0);
      deeGroup.add(collarMesh);

      deeGroup.position.x = side === 'left' ? -GAP_HALF_WORLD : GAP_HALF_WORLD;
      return { deeGroup, copperMat, rimWallMat, edgeMat, topPlate };
    };

    const leftDeeObj = createHollowDeeGroup('left');
    const rightDeeObj = createHollowDeeGroup('right');
    cyclotronGroup.add(leftDeeObj.deeGroup);
    cyclotronGroup.add(rightDeeObj.deeGroup);

    // Part 3 & 4: North & South Electromagnet Iron Poles + Copper Excitation Coils
    const createMagnetPoleAssembly = (isTopNorth: boolean) => {
      const poleGroup = new THREE.Group();

      // Heavy iron pole cylinder (supports X-ray translucency on top pole so it never blocks the Dees)
      const ironGeo = new THREE.CylinderGeometry(
        WORLD_RADIUS * 0.88,
        WORLD_RADIUS * 0.92,
        0.54,
        64
      );
      const ironMat = new THREE.MeshStandardMaterial({
        color: isTopNorth ? 0xef4444 : 0x3b82f6, // Red North Pole, Blue South Pole
        metalness: 0.6,
        roughness: 0.35,
        transparent: true,
        opacity: isTopNorth ? 0.55 : 0.95,
      });
      const ironMesh = new THREE.Mesh(ironGeo, ironMat);
      ironMesh.castShadow = !isTopNorth;
      ironMesh.receiveShadow = true;
      poleGroup.add(ironMesh);

      // Wound copper electromagnet coil collar around the pole
      const coilGeo = new THREE.TorusGeometry(WORLD_RADIUS * 0.91, 0.18, 20, 64);
      coilGeo.rotateX(Math.PI / 2);
      const coilMat = new THREE.MeshStandardMaterial({
        color: 0xb45309,
        metalness: 0.85,
        roughness: 0.25,
        transparent: true,
        opacity: isTopNorth ? 0.65 : 0.95,
      });
      const coilMesh = new THREE.Mesh(coilGeo, coilMat);
      poleGroup.add(coilMesh);

      // Steel return yoke flange
      const yokeGeo = new THREE.CylinderGeometry(
        WORLD_RADIUS * 1.0,
        WORLD_RADIUS * 1.0,
        0.14,
        64
      );
      const yokeMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.8,
        roughness: 0.45,
        transparent: true,
        opacity: isTopNorth ? 0.6 : 0.95,
      });
      const yokeMesh = new THREE.Mesh(yokeGeo, yokeMat);
      yokeMesh.position.y = isTopNorth ? 0.32 : -0.32;
      poleGroup.add(yokeMesh);

      return { poleGroup, ironMat, coilMat, yokeMat };
    };

    const topMagnetObj = createMagnetPoleAssembly(true);
    const bottomMagnetObj = createMagnetPoleAssembly(false);
    topMagnetObj.poleGroup.position.y = 2.1;
    bottomMagnetObj.poleGroup.position.y = -2.1;
    cyclotronGroup.add(topMagnetObj.poleGroup);
    cyclotronGroup.add(bottomMagnetObj.poleGroup);

    // Part 5: Outer Vacuum Chamber Glass & Brass Ring
    const chamberRadius = WORLD_RADIUS + GAP_HALF_WORLD + 0.16;
    const chamberGeo = new THREE.CylinderGeometry(
      chamberRadius,
      chamberRadius,
      0.72,
      64,
      1,
      true
    );
    const chamberMat = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      metalness: 0.1,
      roughness: 0.15,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const chamberWall = new THREE.Mesh(chamberGeo, chamberMat);
    chamberWall.renderOrder = 5;
    cyclotronGroup.add(chamberWall);

    // Brass top & bottom vacuum flange rings
    const flangeRingGeo = new THREE.RingGeometry(chamberRadius - 0.08, chamberRadius + 0.06, 64);
    flangeRingGeo.rotateX(Math.PI / 2);
    const flangeRingMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.8,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });
    const topFlangeRing = new THREE.Mesh(flangeRingGeo, flangeRingMat);
    topFlangeRing.position.y = 0.36;
    cyclotronGroup.add(topFlangeRing);

    const bottomFlangeRing = new THREE.Mesh(flangeRingGeo, flangeRingMat);
    bottomFlangeRing.position.y = -0.36;
    cyclotronGroup.add(bottomFlangeRing);

    // Part 6: Central Ion Source Cathode & Target Extraction Port
    const ionSourceGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.52, 24);
    const ionSourceMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.1,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ionSourceMesh = new THREE.Mesh(ionSourceGeo, ionSourceMat);
    cyclotronGroup.add(ionSourceMesh);

    // Target Detector Box & Electrostatic Deflector Channel at extraction port
    const targetGroup = new THREE.Group();
    const targetBoxGeo = new THREE.BoxGeometry(0.55, 0.55, 0.72);
    const targetBoxMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.6,
      metalness: 0.5,
      roughness: 0.25,
    });
    const targetBoxMesh = new THREE.Mesh(targetBoxGeo, targetBoxMat);
    targetGroup.add(targetBoxMesh);

    // Electrostatic Deflector Channel Guide Rail leading from x=0 to the Target Box
    const channelLen = WORLD_RADIUS * 1.12;
    const channelGeo = new THREE.BoxGeometry(channelLen, 0.08, 0.26);
    const channelMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.45,
    });
    const channelMesh = new THREE.Mesh(channelGeo, channelMat);
    channelMesh.position.set(-channelLen / 2, -0.06, 0);
    targetGroup.add(channelMesh);

    // 3D Target Impact Shockwave Ring (pulses when particle hits target)
    const impactRingGeo = new THREE.RingGeometry(0.32, 0.52, 32);
    impactRingGeo.rotateY(Math.PI / 2);
    const impactRingMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const impactRingMesh = new THREE.Mesh(impactRingGeo, impactRingMat);
    impactRingMesh.position.set(-0.28, 0, 0);
    targetGroup.add(impactRingMesh);

    targetGroup.position.set(WORLD_RADIUS * 1.12, 0, WORLD_RADIUS * 0.94);
    cyclotronGroup.add(targetGroup);

    // Part 7: Instanced 3D Magnetic Flux Pillar Lines (B-Field)
    const bPillarsCount = 29;
    const bPillarGeo = new THREE.CylinderGeometry(0.018, 0.018, 2.8, 8);
    const bPillarMat = new THREE.MeshBasicMaterial({
      color: 0x2dd4bf,
      transparent: true,
      opacity: 0.28,
    });
    const bPillarsInstanced = new THREE.InstancedMesh(bPillarGeo, bPillarMat, bPillarsCount);
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let gx = -2.4; gx <= 2.4; gx += 1.2) {
      for (let gz = -2.4; gz <= 2.4; gz += 1.2) {
        if (gx * gx + gz * gz <= 7.5 && idx < bPillarsCount) {
          dummy.position.set(gx, 0, gz);
          dummy.updateMatrix();
          bPillarsInstanced.setMatrixAt(idx++, dummy.matrix);
        }
      }
    }
    bPillarsInstanced.computeBoundingSphere();
    cyclotronGroup.add(bPillarsInstanced);

    // Part 8: Oscillating Gap Electric Field Arrows (E-Field across gap)
    const eArrowsGroup = new THREE.Group();
    const eArrowDirs: THREE.ArrowHelper[] = [];
    for (let z = -2.8; z <= 2.8; z += 0.8) {
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-GAP_HALF_WORLD * 0.9, 0, z),
        GAP_HALF_WORLD * 1.8,
        0xfbbf24,
        0.14,
        0.09
      );
      eArrowsGroup.add(arrow);
      eArrowDirs.push(arrow);
    }
    cyclotronGroup.add(eArrowsGroup);

    // Part 9: Glowing 3D Charged Particle Orb + Dynamic 3D Spiral Trail Line
    const particleGeo = new THREE.SphereGeometry(0.14, 24, 24);
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.4,
      roughness: 0.1,
    });
    const particleMesh = new THREE.Mesh(particleGeo, particleMat);
    particleMesh.renderOrder = 10;
    cyclotronGroup.add(particleMesh);

    // 3D Force & Velocity Arrows attached to the particle
    const velocityArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      0.9,
      0x34d399,
      0.22,
      0.14
    );
    const lorentzArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      0.75,
      0xfb923c,
      0.22,
      0.14
    );
    cyclotronGroup.add(velocityArrow);
    cyclotronGroup.add(lorentzArrow);

    // Dynamic 3D Trajectory Line
    const MAX_TRAIL_PTS = 1600;
    const trailPositions = new Float32Array(MAX_TRAIL_PTS * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeo.setDrawRange(0, 0);
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    trailLine.renderOrder = 8;
    cyclotronGroup.add(trailLine);

    // Pre-warm shaders on hardware WebGL
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pre-allocate reusable vectors outside loop (Zero GC inside render loop)
    const _targetCamPos = new THREE.Vector3();
    const _targetLookAt = new THREE.Vector3();
    const _vDir = new THREE.Vector3();
    const _fDir = new THREE.Vector3();
    const _colorPos = new THREE.Color(0xf43f5e); // Rose/Red (+)
    const _colorNeg = new THREE.Color(0x0284c7); // Sky/Cyan (-)
    const _colorNeutral = new THREE.Color(0xd97706); // Copper

    const clock = new THREE.Clock();
    let frameId = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const dt = Math.min(clock.getDelta(), 0.1);
      const {
        simState: st,
        params: prm,
        showForceVectors: showVec,
        showBFieldGrid: showB,
        showEFieldLines: showE,
        explodedFactor: exp,
        cameraPreset: camPreset,
        cutawayGlass: isCutaway,
      } = livePropsRef.current;

      const scaleToWorld = WORLD_RADIUS / prm.deeRadiusM;
      const px = st.x * scaleToWorld;
      const pz = st.y * scaleToWorld;

      // Update particle position & color
      const pSpec = PARTICLES[prm.particleId];
      particleMesh.position.set(px, 0, pz);
      particleMat.emissive.set(pSpec.color);
      trailMat.color.set(pSpec.color);

      // Update 3D spiral trail geometry
      const count = Math.min(st.trail.length, MAX_TRAIL_PTS);
      const posAttr = trailGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        const pt = st.trail[i];
        posAttr.setXYZ(i, pt.x * scaleToWorld, 0.02, pt.y * scaleToWorld);
      }
      posAttr.needsUpdate = true;
      trailGeo.setDrawRange(0, count);

      // Update Velocity & Lorentz force 3D vectors
      const speed = Math.hypot(st.vx, st.vy);
      if (showVec && speed > 1000) {
        velocityArrow.visible = true;
        lorentzArrow.visible = true;
        _vDir.set(st.vx / speed, 0, st.vy / speed).normalize();
        velocityArrow.position.set(px, 0.08, pz);
        velocityArrow.setDirection(_vDir);
        velocityArrow.setLength(0.85, 0.22, 0.14);

        const bSign = prm.bfieldDirection === 'out' ? 1 : -1;
        _fDir.set((st.vy / speed) * bSign, 0, (-st.vx / speed) * bSign).normalize();
        lorentzArrow.position.set(px, 0.08, pz);
        lorentzArrow.setDirection(_fDir);
        lorentzArrow.setLength(0.68, 0.2, 0.12);
      } else {
        velocityArrow.visible = false;
        lorentzArrow.visible = false;
      }

      // Update Dees live AC polarity tint & cutaway transparency
      const vNorm = Math.max(-1, Math.min(1, st.instantVoltageV / Math.max(1, prm.voltageV)));
      const intensity = Math.abs(vNorm) * 0.55;
      if (vNorm >= 0) {
        leftDeeObj.copperMat.color.copy(_colorNeutral).lerp(_colorPos, intensity);
        rightDeeObj.copperMat.color.copy(_colorNeutral).lerp(_colorNeg, intensity);
        leftDeeObj.edgeMat.color.copy(_colorNeutral).lerp(_colorPos, 0.7);
        rightDeeObj.edgeMat.color.copy(_colorNeutral).lerp(_colorNeg, 0.7);
      } else {
        leftDeeObj.copperMat.color.copy(_colorNeutral).lerp(_colorNeg, intensity);
        rightDeeObj.copperMat.color.copy(_colorNeutral).lerp(_colorPos, intensity);
        leftDeeObj.edgeMat.color.copy(_colorNeutral).lerp(_colorNeg, 0.7);
        rightDeeObj.edgeMat.color.copy(_colorNeutral).lerp(_colorPos, 0.7);
      }

      const targetDeeOpacity = isCutaway ? 0.28 : 0.88;
      leftDeeObj.copperMat.opacity = THREE.MathUtils.damp(
        leftDeeObj.copperMat.opacity,
        targetDeeOpacity,
        8,
        dt
      );
      rightDeeObj.copperMat.opacity = leftDeeObj.copperMat.opacity;
      leftDeeObj.copperMat.depthWrite = !isCutaway;
      rightDeeObj.copperMat.depthWrite = !isCutaway;

      const targetRimOpacity = isCutaway ? 0.5 : 0.95;
      leftDeeObj.rimWallMat.opacity = THREE.MathUtils.damp(
        leftDeeObj.rimWallMat.opacity,
        targetRimOpacity,
        8,
        dt
      );
      rightDeeObj.rimWallMat.opacity = leftDeeObj.rimWallMat.opacity;

      // Top electromagnet pole becomes translucent in X-Ray mode or Top view so it never obscures the Dees
      const targetTopPoleOpacity = camPreset === 'top' ? 0.08 : isCutaway ? 0.32 : 0.92;
      topMagnetObj.ironMat.opacity = THREE.MathUtils.damp(
        topMagnetObj.ironMat.opacity,
        targetTopPoleOpacity,
        8,
        dt
      );
      topMagnetObj.coilMat.opacity = topMagnetObj.ironMat.opacity;
      topMagnetObj.yokeMat.opacity = topMagnetObj.ironMat.opacity;

      // Smoothly damp electromagnet pole exploded separation
      const targetPoleY = 1.25 + exp * 2.15;
      topMagnetObj.poleGroup.position.y = THREE.MathUtils.damp(
        topMagnetObj.poleGroup.position.y,
        targetPoleY,
        7,
        dt
      );
      bottomMagnetObj.poleGroup.position.y = THREE.MathUtils.damp(
        bottomMagnetObj.poleGroup.position.y,
        -targetPoleY,
        7,
        dt
      );

      // Update B-Field pillars visibility & opacity
      bPillarsInstanced.visible = showB;
      bPillarMat.opacity = 0.14 + (prm.magneticFieldT / 2.5) * 0.35;

      // Update Gap Electric Field Arrows
      eArrowsGroup.visible = showE && Math.abs(vNorm) > 0.05;
      if (eArrowsGroup.visible) {
        const dirSign = vNorm >= 0 ? 1 : -1;
        _vDir.set(dirSign, 0, 0);
        const arrowLen = Math.max(0.15, GAP_HALF_WORLD * 1.75 * Math.abs(vNorm));
        for (let i = 0; i < eArrowDirs.length; i++) {
          const arr = eArrowDirs[i];
          arr.position.x = -dirSign * (GAP_HALF_WORLD * 0.85);
          arr.setDirection(_vDir);
          arr.setLength(arrowLen, 0.12, 0.08);
        }
      }

      // Target box position based on B-field direction (matches exact exitY of extracted particle)
      targetGroup.position.x = WORLD_RADIUS * 1.12;
      targetGroup.position.z =
        prm.bfieldDirection === 'out' ? WORLD_RADIUS * 0.94 : -WORLD_RADIUS * 0.94;

      // Animate Target Box glow & impact shockwave ring when particle hits Target
      if (st.targetHit) {
        const pulse = (clock.getElapsedTime() * 3.2) % 1;
        targetBoxMat.emissive.setHex(0xfbbf24);
        targetBoxMat.emissiveIntensity = 1.6 + Math.sin(clock.getElapsedTime() * 12) * 0.6;
        impactRingMat.opacity = (1 - pulse) * 0.95;
        const ringScale = 1 + pulse * 2.2;
        impactRingMesh.scale.set(ringScale, ringScale, ringScale);
      } else {
        targetBoxMat.emissive.setHex(0x059669);
        targetBoxMat.emissiveIntensity = 0.55;
        impactRingMat.opacity = 0;
      }

      // Smooth Camera Preset Transitions
      if (camPreset !== 'orbit') {
        if (camPreset === 'top') {
          _targetCamPos.set(0, 10.5, 0.01);
          _targetLookAt.set(0, 0, 0);
        } else if (camPreset === 'gap') {
          _targetCamPos.set(0, 2.2, 5.4);
          _targetLookAt.set(0, 0, 0);
        } else if (camPreset === 'chase') {
          _targetCamPos.set(px * 0.7, 2.6, pz * 0.7 + 2.5);
          _targetLookAt.set(px, 0, pz);
        }
        camera.position.lerp(_targetCamPos, 1 - Math.exp(-5 * dt));
        controls.target.lerp(_targetLookAt, 1 - Math.exp(-6 * dt));
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(container);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      controls.removeEventListener('start', handleControlsStart);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[540px] bg-[#070D19] rounded-xl overflow-hidden border border-slate-800 select-none">
      {/* Dedicated WebGL Mount Container */}
      <div ref={canvasMountRef} className="w-full h-full block" />

      {/* Top-Left Minimal Spec & Mode Badge */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none flex flex-col gap-1 bg-slate-950/90 border border-slate-800 px-3 py-2 rounded-lg">
        <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-sky-400" />
          <span>3D Synchro-Cyclotron Chamber</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Drag to Orbit · Scroll to Zoom · f_RF = {(simState.appliedRfFreqHz / 1e6).toFixed(2)} MHz
        </div>
      </div>

      {/* Target Hit Celebration Banner */}
      {simState.targetHit && (
        <div className="absolute top-3 right-3 z-10 pointer-events-none bg-emerald-950/95 border border-emerald-400/80 px-3.5 py-2 rounded-xl shadow-lg">
          <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <span>🎯 TARGET HIT! BEAM IMPACT CONFIRMED</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-200">
            E_kin ={' '}
            {simState.kineticEnergyKeV < 1000
              ? `${simState.kineticEnergyKeV.toFixed(1)} keV`
              : `${simState.kineticEnergyMeV.toFixed(2)} MeV`}{' '}
            · v = {(simState.speedMs / 1e6).toFixed(2)} × 10⁶ m/s
          </div>
        </div>
      )}

      {/* Game Mode Interactive Pulse Button Overlay (if in game mode) */}
      {isGameMode && onPulsePolarity && (
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={onPulsePolarity}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
          >
            ⚡ Flip Gap Polarity (Spacebar)
          </button>
        </div>
      )}

      {/* Unified Collapsible Bottom Control Dock (Centered via inset-x-3 without conflicting CSS translate) */}
      <div
        className="absolute inset-x-3 bottom-3 z-10 flex flex-col items-center pointer-events-none transition-transform duration-200"
        style={{
          transform: dockCollapsed ? 'translateY(calc(100% - 28px))' : 'translateY(0)',
        }}
      >
        {/* Collapse / Expand Toggle Handle */}
        <div className="flex justify-center pointer-events-auto">
          <button
            type="button"
            onClick={() => setDockCollapsed((c) => !c)}
            className="px-3 py-1 rounded-t-lg bg-slate-900 border border-b-0 border-slate-700 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Show 3D Controls
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Hide 3D Controls
              </>
            )}
          </button>
        </div>

        {/* Dock Body */}
        <div className="w-full max-w-[760px] pointer-events-auto bg-slate-950/95 border border-slate-800 rounded-xl p-2 sm:px-3.5 flex flex-wrap items-center justify-between gap-2 shadow-xl">
          {/* Camera Viewpoint Presets */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] font-medium text-slate-400 mr-0.5 hidden xl:inline">
              <Camera className="w-3.5 h-3.5 inline mr-1 text-sky-400" />
              View:
            </span>
            {(
              [
                { id: 'orbit', label: '3D Orbit' },
                { id: 'top', label: 'Top Plan' },
                { id: 'gap', label: 'Gap Close-Up' },
                { id: 'chase', label: 'Ion Chase' },
              ] as { id: CameraPreset; label: string }[]
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setCameraPreset(preset.id)}
                className={`px-2.5 py-1.5 min-h-[32px] rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  cameraPreset === preset.id
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Exploded Magnet Pole Slider */}
          <div className="flex items-center gap-2 flex-1 min-w-[140px] max-w-[210px]">
            <Magnet className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <label
              htmlFor="exploded-slider"
              className="text-[11px] font-medium text-slate-300 whitespace-nowrap"
            >
              Poles:
            </label>
            <input
              id="exploded-slider"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={explodedFactor}
              onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Cutaway X-Ray Dees Toggle */}
          <button
            type="button"
            onClick={() => setCutawayGlass((c) => !c)}
            className={`px-2.5 py-1.5 min-h-[32px] rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              cutawayGlass
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {cutawayGlass ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                X-Ray Dees On
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5" />
                Solid Copper Dees
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
