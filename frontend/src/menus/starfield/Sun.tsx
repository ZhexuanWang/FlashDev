import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export default function Sun() {
    const glowRef = useRef<THREE.Mesh | null>(null);

    useFrame((state) => {
        if (glowRef.current) {
            glowRef.current.scale.setScalar(
                1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05
            );
        }
    });

    return (
        <group>
            {/* 核心 */}
            <mesh>
                <sphereGeometry args={[0.9, 64, 64]} />
                <meshStandardMaterial
                    color="#0ea5e9"
                    emissive="#0284c7"
                    emissiveIntensity={1.2}
                    roughness={0.2}
                    metalness={0.5}
                />
            </mesh>

            {/* 光晕 */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[1.3, 32, 32]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.08} />
            </mesh>

            {/* Logo 文字 */}
            <Text
                position={[0, 0, 1.4]}
                fontSize={0.35}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
            >
                FlashDev
            </Text>

            {/* 点光源 */}
            <pointLight color="#38bdf8" intensity={3} distance={15} decay={2} />
        </group>
    );
}