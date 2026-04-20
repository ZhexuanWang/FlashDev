import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { PlanetConfig } from './planetConfig';

interface Props {
    config: PlanetConfig;
    lang: 'zh' | 'en';
    onClick: () => void;
}

export default function Planet({ config, lang, onClick }: Props) {
    const orbitRef = useRef<THREE.Group | null>(null);
    const planetRef = useRef<THREE.Mesh | null>(null);
    const [hovered, setHovered] = useState(false);
    const angleRef = useRef(config.initialAngle);

    useFrame((_, delta) => {
        angleRef.current += delta * config.speed;
        if (orbitRef.current) {
            orbitRef.current.rotation.y = angleRef.current;
        }
        if (planetRef.current) {
            planetRef.current.rotation.y += delta * 0.5;
        }
    });

    const label = lang === 'zh' ? config.menuItem.labelZh : config.menuItem.labelEn;
    const scale = hovered ? 1.25 : 1;

    return (
        <group ref={orbitRef} rotation={[config.tilt, 0, 0]}>
            {/* 轨道圆环 */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[config.distance - 0.02, config.distance + 0.02, 128]} />
                <meshBasicMaterial color="#334155" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>

            {/* 行星 */}
            <group position={[config.distance, 0, 0]}>
                <mesh
                    ref={planetRef}
                    scale={scale}
                    onClick={onClick}
                    onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
                    onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
                >
                    <sphereGeometry args={[config.radius, 32, 32]} />
                    <meshStandardMaterial
                        color={config.color}
                        emissive={config.emissive}
                        emissiveIntensity={hovered ? 0.6 : 0.2}
                        roughness={0.7}
                        metalness={0.1}
                    />
                </mesh>

                {/* 悬停光晕 */}
                {hovered && (
                    <mesh scale={1.4}>
                        <sphereGeometry args={[config.radius, 32, 32]} />
                        <meshBasicMaterial color={config.color} transparent opacity={0.15} />
                    </mesh>
                )}

                {/* 文字标签 */}
                <Billboard>
                    <Text
                        position={[0, config.radius + 0.4, 0]}
                        fontSize={0.28}
                        color={hovered ? '#ffffff' : '#94a3b8'}
                        anchorX="center"
                        anchorY="bottom"
                    >
                        {label}
                    </Text>
                </Billboard>
            </group>
        </group>
    );
}