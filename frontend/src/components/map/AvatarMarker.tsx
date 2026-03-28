import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useRef } from 'react'
import type { Group } from 'three'
import * as THREE from 'three'

const TYPE_COLORS: Record<string, string> = {
  event:     '#3B82F6',
  volunteer: '#22C55E',
  help:      '#F59E0B',
}

const TYPE_LABELS: Record<string, string> = {
  event:     'EVENT',
  volunteer: 'VOLUNTEER',
  help:      'HELP',
}

interface AvatarModelProps {
  userColor: string
}

function AvatarModel({ userColor }: AvatarModelProps) {
  const { scene } = useGLTF('/red.glb')
  const modelRef = useRef<Group>(null)

  // Apply userColor override to all mesh materials
  scene.traverse(child => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => {
          if ((mat as THREE.MeshStandardMaterial).color) {
            (mat as THREE.MeshStandardMaterial).color.set(userColor)
          }
        })
      } else if ((mesh.material as THREE.MeshStandardMaterial).color) {
        ;(mesh.material as THREE.MeshStandardMaterial).color.set(userColor)
      }
    }
  })

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.01
    }
  })

  return <primitive object={scene} ref={modelRef} scale={1} />
}

interface AvatarMarkerProps {
  userColor?: string
  type?: string
  onClick?: () => void
}

export default function AvatarMarker({
  userColor = '#fd8b00',
  type,
  onClick,
}: AvatarMarkerProps) {
  const badgeColor = type ? TYPE_COLORS[type] : undefined
  const badgeLabel = type ? TYPE_LABELS[type] : undefined

  return (
    <div
      className="flex flex-col items-center cursor-pointer"
      onClick={onClick}
    >
      <Canvas
        style={{ width: 70, height: 70 }}
        camera={{ position: [2, 2, 3], fov: 50 }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[2, 2, 2]} intensity={1.5} />
        <AvatarModel userColor={userColor} />
      </Canvas>

      {badgeColor && badgeLabel && (
        <div
          className="px-2 py-0.5 rounded-full text-white font-bold uppercase"
          style={{ fontSize: 9, backgroundColor: badgeColor, marginTop: -4 }}
        >
          {badgeLabel}
        </div>
      )}
    </div>
  )
}
