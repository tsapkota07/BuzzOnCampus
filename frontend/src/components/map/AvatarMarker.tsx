import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useRef } from 'react'
import type { Group } from 'three'

function AvatarModel() {
  const { scene } = useGLTF('/red.glb')
  const modelRef = useRef<Group>(null)

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.01
    }
  })

  return <primitive object={scene} ref={modelRef} scale={1} />
}

export default function AvatarMarker() {
  return (
    <Canvas
      style={{ width: 80, height: 80 }}
      camera={{ position: [2, 2, 3], fov: 50 }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 2, 2]} intensity={1.5} />
      <AvatarModel />
    </Canvas>
  )
}
