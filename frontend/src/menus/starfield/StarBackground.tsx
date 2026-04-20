import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function StarBackground() {
    const meshRef = useRef<THREE.Points | null>(null);

    const geometry = useMemo(() => {
        const count = 2000;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            positions[i * 3]     = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            sizes[i] = Math.random() * 0.8 + 0.2;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        return geo;
    }, []);

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.01;
            meshRef.current.rotation.x += delta * 0.003;
        }
    });

    return (
        <points ref={meshRef} geometry={geometry}>
            <pointsMaterial
                size={0.15}
                color="#ffffff"
                sizeAttenuation
                transparent
                opacity={0.8}
            />
        </points>
    );
}