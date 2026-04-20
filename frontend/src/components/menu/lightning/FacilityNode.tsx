import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard, Line } from '@react-three/drei'
import type { Group } from 'three'
import { MAX_ENERGY, usePowerStore } from '../../../store/powerStore'

interface FacilityNodeProps {
    position: [number, number, number]
    label: string
    threshold: number
    onActivate: () => void
}

export function FacilityNode({
    position,
    label,
    threshold,
    onActivate,
}: FacilityNodeProps) {
    const groupRef   = useRef<Group | null>(null)
    const [hovered, setHovered] = useState(false)

    const energy = usePowerStore(s => s.energy)
    const isActive   = energy >= threshold
    const progress   = Math.min(1, Math.max(0, (energy - threshold + 8) / 8))
    const ratio      = energy / MAX_ENERGY

    useFrame((_, delta) => {
        if (!groupRef.current) return
        if (energy >= threshold) {
            groupRef.current.rotation.y += delta * (hovered ? 1.5 : 0.6)
        }
    })

    const nodeColor   = isActive ? '#38bdf8' : '#0f2231'
    const emissive    = isActive ? '#0ea5e9' : '#000000'
    const emissiveInt = isActive ? 1.5 + progress : 0.05
    const scale       = (hovered && isActive) ? 1.15 : 1

    const toCenter: [number, number, number] = [-position[0], -position[1], -position[2]]

    return (
        <group
            ref={groupRef}
            position={position}
            scale={scale}
            onClick={(e) => { e.stopPropagation(); onActivate() }}
            onPointerEnter={() => { setHovered(true); if (isActive) document.body.style.cursor = 'pointer' }}
            onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default' }}
        >
            <mesh>
                <octahedronGeometry args={[0.32, 0]} />
                <meshStandardMaterial
                    color={nodeColor}
                    emissive={emissive}
                    emissiveIntensity={emissiveInt}
                    transparent
                    opacity={0.25 + progress * 0.75}
                    wireframe={!isActive}
                />
            </mesh>

            {isActive && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.52, 0.015, 8, 40]} />
                    <meshStandardMaterial
                        color="#38bdf8"
                        emissive="#0ea5e9"
                        emissiveIntensity={1.8}
                        transparent
                        opacity={0.6 * progress}
                    />
                </mesh>
            )}

            {isActive && (
                <Line
                    points={[[0, 0, 0], toCenter]}
                    color="#0ea5e9"
                    lineWidth={0.6}
                    transparent
                    opacity={0.25 * progress}
                    dashed={false}
                />
            )}

            <Billboard>
                <Text
                    position={[0, -0.65, 0]}
                    fontSize={0.2}
                    color={isActive ? '#7dd3fc' : '#1e3a4a'}
                    anchorX="center"
                    anchorY="middle"
                >
                    {label}
                </Text>

                {!isActive && (
                    <Text
                        position={[0, -0.9, 0]}
                        fontSize={0.14}
                        color="#0c2233"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {`[ ${threshold}% ]`}
                    </Text>
                )}
            </Billboard>

            {isActive && (
                <pointLight
                    color="#0ea5e9"
                    intensity={0.4 + progress * ratio * 1.5}
                    distance={2}
                    decay={2}
                />
            )}
        </group>
    )
}
