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

// Pre-load models so they're ready before pins render
useGLTF.preload('/red.glb')
useGLTF.preload('/Alien.glb')
useGLTF.preload('/Caveman.glb')

// Scale per model — adjust if a model renders too small or large
const MODEL_SCALE: Record<string, number> = {
  '/Caveman.glb': 1.6,
  '/Alien.glb':   1.6,
}

interface AvatarModelProps {
  userColor: string
  modelPath: string
}

function AvatarModel({ userColor, modelPath }: AvatarModelProps) {
  const { scene } = useGLTF(modelPath)
  const modelRef = useRef<Group>(null)

  scene.traverse(child => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach(mat => {
        if ((mat as THREE.MeshStandardMaterial).color) {
          ;(mat as THREE.MeshStandardMaterial).color.set(userColor)
        }
      })
    }
  })

  useFrame(() => {
    if (modelRef.current) modelRef.current.rotation.y += 0.002
  })

  const scale = MODEL_SCALE[modelPath] ?? 1

  return <primitive object={scene} ref={modelRef} scale={scale} />
}

interface AvatarMarkerProps {
  userColor?: string
  type?: string
  modelPath?: string
  onClick?: () => void
}

export default function AvatarMarker({
  userColor = '#fd8b00',
  type,
  modelPath = '/red.glb',
  onClick,
}: AvatarMarkerProps) {
  const badgeColor = type ? TYPE_COLORS[type] : undefined
  const badgeLabel = type ? TYPE_LABELS[type] : undefined

  return (
    <div className="flex flex-col items-center cursor-pointer" onClick={onClick}>
      <Canvas
        style={{ width: 80, height: 80 }}
        camera={{ position: [2, 2, 3], fov: 50 }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[2, 4, 3]} intensity={2.5} />
        <directionalLight position={[-2, 1, -1]} intensity={0.8} />
        <AvatarModel userColor={userColor} modelPath={modelPath} />
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
