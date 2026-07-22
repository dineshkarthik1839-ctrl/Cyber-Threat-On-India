import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Threat } from '../../types';

interface ThreatGlobeProps {
  threats: Threat[];
  onThreatClick?: (threat: Threat) => void;
  autoRotate?: boolean;
  height?: string | number;
}

// Simple IP to Lat/Lon mock since we don't have a real GeoIP database in browser
const ipToCoordinates = (ip: string): [number, number] => {
  // A simple hash function to generate consistent coordinates for an IP
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ip.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = (hash % 180) - 90;
  const lon = ((hash >> 8) % 360) - 180;
  return [lat, lon];
};

const latLonToVector3 = (lat: number, lon: number, radius: number = 1): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
};

const getSeverityColor = (severity: string): number => {
  switch (severity.toLowerCase()) {
    case 'critical': return 0xff0000;
    case 'high': return 0xff6600;
    case 'medium': return 0xffff00;
    case 'low': return 0x00ff00;
    default: return 0x0088ff;
  }
};

export const ThreatGlobe: React.FC<ThreatGlobeProps> = ({
  threats,
  onThreatClick,
  autoRotate = true,
  height = '600px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [labelRenderer, setLabelRenderer] = useState<CSS2DRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [globe, setGlobe] = useState<THREE.Mesh | null>(null);
  const [attackPaths, setAttackPaths] = useState<THREE.Line[]>([]);
  const [attackParticles, setAttackParticles] = useState<THREE.Points[]>([]);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0x0a0e27);

    // Camera
    const newCamera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / 600, 0.1, 1000);
    newCamera.position.set(0, 0, 2.5);

    // WebGL Renderer
    const newRenderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    newRenderer.setSize(containerRef.current.clientWidth, 600);
    newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    newRenderer.shadowMap.enabled = true;
    containerRef.current.appendChild(newRenderer.domElement);

    // CSS2 Renderer for labels
    const newLabelRenderer = new CSS2DRenderer();
    newLabelRenderer.setSize(containerRef.current.clientWidth, 600);
    newLabelRenderer.domElement.style.position = 'absolute';
    newLabelRenderer.domElement.style.top = '0';
    newLabelRenderer.domElement.style.left = '0';
    newLabelRenderer.domElement.style.pointerEvents = 'none';
    containerRef.current.appendChild(newLabelRenderer.domElement);

    // Controls
    const newControls = new OrbitControls(newCamera, newRenderer.domElement);
    newControls.enableDamping = true;
    newControls.dampingFactor = 0.05;
    newControls.autoRotate = autoRotate;
    newControls.autoRotateSpeed = 0.5;
    newControls.minDistance = 1.5;
    newControls.maxDistance = 5;
    newControls.enablePan = false;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    newScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    newScene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0x4488ff, 0.5);
    backLight.position.set(-5, -5, -5);
    newScene.add(backLight);

    // Starfield
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 3000;
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 200;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.8
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    newScene.add(stars);

    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);
    setLabelRenderer(newLabelRenderer);
    setControls(newControls);

    // Create globe
    createGlobe(newScene);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      newControls.update();
      
      // Rotate stars
      stars.rotation.y += 0.0001;
      
      newRenderer.render(newScene, newCamera);
      newLabelRenderer.render(newScene, newCamera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const ch = 600;
      
      newCamera.aspect = width / ch;
      newCamera.updateProjectionMatrix();
      
      newRenderer.setSize(width, ch);
      newLabelRenderer.setSize(width, ch);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (newRenderer) {
        newRenderer.dispose();
        containerRef.current?.removeChild(newRenderer.domElement);
      }
      if (newLabelRenderer) {
        containerRef.current?.removeChild(newLabelRenderer.domElement);
      }
    };
  }, [autoRotate]);

  // Create globe
  const createGlobe = (scene: THREE.Scene) => {
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');

    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 25,
      emissive: new THREE.Color(0x112244),
      emissiveIntensity: 0.1
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    sphere.rotation.x = 0.1;
    scene.add(sphere);

    // Atmosphere glow
    const glowGeometry = new THREE.SphereGeometry(1.02, 64, 64);
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    setGlobe(sphere);

    // Create attack paths when threats change
    if (threats.length > 0) {
      updateAttackPaths(scene, threats);
    }
  };

  // Update attack paths
  const updateAttackPaths = (scene: THREE.Scene, currentThreats: Threat[]) => {
    attackPaths.forEach(path => scene.remove(path));
    attackParticles.forEach(particles => scene.remove(particles));
    setAttackPaths([]);
    setAttackParticles([]);

    const newPaths: THREE.Line[] = [];
    const newParticles: THREE.Points[] = [];

    currentThreats.slice(0, 50).forEach((threat) => {
      if (threat.source_ip && threat.destination_ip) {
        const origin = ipToCoordinates(threat.source_ip);
        const destination = ipToCoordinates(threat.destination_ip);
        
        if (origin && destination) {
          const path = createAttackPath(origin, destination, threat.severity || 'low');
          scene.add(path);
          newPaths.push(path);

          const particles = createAttackParticles(origin, destination);
          scene.add(particles);
          newParticles.push(particles);
        }
      }
    });

    setAttackPaths(newPaths);
    setAttackParticles(newParticles);
  };

  // Re-run path generation when threats change
  useEffect(() => {
    if (scene && threats.length > 0) {
      updateAttackPaths(scene, threats);
    }
  }, [threats, scene]);

  // Create attack path line
  const createAttackPath = (
    origin: [number, number],
    destination: [number, number],
    severity: string
  ): THREE.Line => {
    const color = getSeverityColor(severity);
    const start = latLonToVector3(origin[0], origin[1]);
    const end = latLonToVector3(destination[0], destination[1]);
    
    const points: THREE.Vector3[] = [];
    const segments = 30;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const height = Math.sin(t * Math.PI) * 0.5;
      const point = new THREE.Vector3().lerpVectors(start, end, t);
      point.normalize().multiplyScalar(1 + height * 0.3);
      points.push(point);
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      linewidth: 1
    });
    
    return new THREE.Line(geometry, material);
  };

  // Create attack particles (completing the user's function)
  const createAttackParticles = (
    origin: [number, number],
    destination: [number, number]
  ): THREE.Points => {
    const particleCount = 20;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const start = latLonToVector3(origin[0], origin[1]);
    const end = latLonToVector3(destination[0], destination[1]);
    
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const height = Math.sin(t * Math.PI) * 0.5;
      
      const point = new THREE.Vector3().lerpVectors(start, end, t);
      point.normalize().multiplyScalar(1 + height * 0.3);
      
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      
      // Add red glow color
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.2;
      colors[i * 3 + 2] = 0.2;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    return new THREE.Points(geometry, material);
  };

  return (
    <div style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }}>
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%', position: 'relative' }} 
      />
    </div>
  );
};
