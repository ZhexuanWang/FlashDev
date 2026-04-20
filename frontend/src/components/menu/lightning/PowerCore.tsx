import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, MeshDistortMaterial } from '@react-three/drei'
import type { Mesh } from 'three'
import { usePowerStore, MAX_ENERGY } from '../../../store/powerStore'

interface PowerCoreProps {
    energy: number
    onCharge: () => void
}

export function PowerCore({ energy, onCharge }: PowerCoreProps) {
    const outerRef  = useRef<Mesh | null>(null)
    const innerRef  = useRef<Mesh | null>(null)
    const ringRef   = useRef<Mesh | null>(null)
    const ring2Ref  = useRef<Mesh | null>(null)

    const { isCharging } = usePowerStore()
    const ratio = energy / MAX_ENERGY

    useFrame((_, delta) => {
        if (!outerRef.current || !innerRef.current || !ringRef.current || !ring2Ref.current) return

        const speed = 0.4 + ratio * 1.8
        outerRef.current.rotation.x += delta * speed * 0.6
        outerRef.current.rotation.y += delta * speed

        ring2Ref.current.rotation.x += delta * speed * 0.4
        ring2Ref.current.rotation.z += delta * speed * 0.3
        ringRef.current.rotation.z  += delta * speed * 0.5

        // Inner pulse
        const t    = Date.now() * 0.003 * (1 + ratio * 2)
        const pulse = 1 + Math.sin(t) * 0.06 * ratio
        innerRef.current.scale.setScalar(pulse)
    })

    const coreColor =
        ratio < 0.3 ? '#0369a1' :
            ratio < 0.6 ? '#0ea5e9' :
                ratio < 0.9 ? '#38bdf8' :
                    '#bae6fd'

    const emissive = ratio < 0.2 ? 0.2 : 0.6 + ratio * 2.5

    return (
        <group
            onClick={(e) => { e.stopPropagation(); onCharge() }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'default')}
        >
            {/* Outer wireframe icosahedron */}
            <mesh ref={outerRef} scale={1.7}>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial
                    color={coreColor}
                    emissive={coreColor}
                    emissiveIntensity={emissive * 0.25}
                    wireframe
                    transparent
                    opacity={0.2 + ratio * 0.5}
                />
            </mesh>

            {/* Inner energy sphere with distortion */}
            <mesh ref={innerRef}>
                <sphereGeometry args={[0.9, 32, 32]} />
                <MeshDistortMaterial
                    color={coreColor}
                    emissive={coreColor}
                    emissiveIntensity={emissive}
                    distort={0.15 + ratio * 0.45}
                    speed={0.8 + ratio * 4}
                    transparent
                    opacity={0.6 + ratio * 0.4}
                />
            </mesh>

            {/* Equatorial ring */}
            <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.25, 0.025, 8, 80]} />
                <meshStandardMaterial
                    color={coreColor}
                    emissive={coreColor}
                    emissiveIntensity={emissive * 0.8}
                />
            </mesh>

            {/* Tilted ring */}
            <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0.4, 0]}>
                <torusGeometry args={[1.4, 0.015, 8, 80]} />
                <meshStandardMaterial
                    color={coreColor}
                    emissive={coreColor}
                    emissiveIntensity={emissive * 0.5}
                    transparent
                    opacity={0.7}
                />
            </mesh>

            {/* Point light from core */}
            <pointLight
                color={coreColor}
                intensity={isCharging ? 8 : 0.5 + ratio * 4}
                distance={10}
                decay={2}
            />

            {/* Charging flash */}
            {isCharging && (
                <pointLight color="#ffffff" intensity={12} distance={6} decay={3} />
            )}

            {/* Sparkles scale with energy */}
            {ratio > 0.15 && (
                <Sparkles
                    count={Math.floor(ratio * 80)}
                    size={1.2 + ratio}
                    speed={0.4 + ratio * 1.5}
                    opacity={0.5 + ratio * 0.5}
                    color={coreColor}
                    scale={4}
                />
            )}
        </group>
    )
}
