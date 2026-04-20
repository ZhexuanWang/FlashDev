import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import type { Group } from 'three'

export function StarBackground() {
    const groupRef = useRef<Group | null>(null)

    useFrame((_, delta) => {
        if (!groupRef.current) return
        groupRef.current.rotation.y += delta * 0.004
        groupRef.current.rotation.x += delta * 0.001
    })

    return (
        <group ref={groupRef}>
            <Stars
                radius={80}
                depth={40}
                count={1500}
                factor={4}
                saturation={0}
                fade={false}
                speed={0}
            />
        </group>
    )
}
