// 3D robot component rendered with React Three Fiber.
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';

// Placeholder robot using basic geometry. Replace with GLTF model for a real robot.
function Robot() {
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#b3e0ff" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.7, 32]} />
        <meshStandardMaterial color="#4f8cff" />
      </mesh>
      {/* Left Arm */}
      <mesh position={[-0.5, 0.7, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.07, 0.07, 0.6, 32]} />
        <meshStandardMaterial color="#b3e0ff" />
      </mesh>
      {/* Right Arm */}
      <mesh position={[0.5, 0.7, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.07, 0.07, 0.6, 32]} />
        <meshStandardMaterial color="#b3e0ff" />
      </mesh>
      {/* Left Leg */}
      <mesh position={[-0.18, -0.1, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.5, 32]} />
        <meshStandardMaterial color="#4f8cff" />
      </mesh>
      {/* Right Leg */}
      <mesh position={[0.18, -0.1, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.5, 32]} />
        <meshStandardMaterial color="#4f8cff" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.15, 1.3, 0.35]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.15, 1.3, 0.35]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

const Robot3D = () => (
  <div style={{ width: '100%', height: '350px' }}>
    <Canvas camera={{ position: [0, 1, 3], fov: 50 }} shadows>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <Suspense fallback={null}>
        <Stage environment={null} intensity={0.6} contactShadow={false}>
          <Robot />
        </Stage>
      </Suspense>
      <OrbitControls enablePan={false} enableZoom={false} />
    </Canvas>
  </div>
);

export default Robot3D;
