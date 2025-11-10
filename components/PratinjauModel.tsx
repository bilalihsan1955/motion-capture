'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Grid } from '@react-three/drei';
import * as THREE from 'three';

function ModelAnimasi({ url }: { url: string }) {
  const { scene, animations } = useGLTF(url);
  const { actions, mixer } = useAnimations(animations, scene);
  const groupRef = useRef<THREE.Group>(null);

  // Play semua animasi yang tersedia
  useEffect(() => {
    if (animations.length > 0) {
      // Play semua animasi
      animations.forEach((clip) => {
        const action = actions[clip.name];
        if (action) {
          action.reset().fadeIn(0.5).play();
          action.setLoop(THREE.LoopRepeat);
        }
      });
    }
    return () => {
      // Cleanup saat unmount
      animations.forEach((clip) => {
        const action = actions[clip.name];
        if (action) {
          action.fadeOut(0.5);
        }
      });
    };
  }, [animations, actions]);

  // Update animasi mixer setiap frame
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
  });

  // Enable shadow pada semua mesh dalam scene
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <primitive object={scene} scale={1} />
    </group>
  );
}

interface PropsPratinjauModel {
  pathModel: string;
  namaModel?: string;
}

export default function PratinjauModel({
  pathModel,
  namaModel = 'Memanah',
}: PropsPratinjauModel) {
  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden" style={{ borderRadius: 'inherit' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        {/* Ambient light untuk pencahayaan dasar */}
        <ambientLight intensity={0.6} />
        
        {/* Directional light dengan shadow untuk pencahayaan utama */}
        <directionalLight
          position={[-5, 8, 5]}
          intensity={2.0}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* Directional light kedua untuk pencahayaan yang lebih seimbang */}
        <directionalLight
          position={[5, 6, -3]}
          intensity={0.8}
        />
        
        {/* Point light tambahan untuk pencahayaan yang lebih baik */}
        <pointLight position={[8, 6, -3]} intensity={0.8} />
        <pointLight position={[-3, 4, 8]} intensity={0.6} />
        <pointLight position={[0, 10, 0]} intensity={0.5} />
        
        {/* Ground Grid */}
        <Grid
          args={[20, 20]}
          cellColor="#ffffff"
          sectionColor="#ffffff"
          cellThickness={0.5}
          sectionThickness={1}
          position={[0, -2, 0]}
          receiveShadow
        />
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="gray" />
            </mesh>
          }
        >
          <ModelAnimasi url={pathModel} />
        </Suspense>
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}


