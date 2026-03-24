import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 4500;

function ParticleCloud() {
    const pointsRef = useRef<THREE.Points>(null);
    const color = useMemo(() => new THREE.Color(), []);

    const { positions, colors, basePositions, phases } = useMemo(() => {
        const positionsArray = new Float32Array(PARTICLE_COUNT * 3);
        const colorArray = new Float32Array(PARTICLE_COUNT * 3);
        const baseArray = new Float32Array(PARTICLE_COUNT * 3);
        const phaseArray = new Float32Array(PARTICLE_COUNT);
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const t = i / PARTICLE_COUNT;
            const radiusJitter = 24 + Math.random() * 34;
            const y = 1 - t * 2;
            const radial = Math.sqrt(1 - y * y);
            const theta = goldenAngle * i;

            const x = Math.cos(theta) * radial * radiusJitter;
            const z = Math.sin(theta) * radial * radiusJitter;
            const yy = y * radiusJitter * 1.35;
            const index = i * 3;

            baseArray[index] = x;
            baseArray[index + 1] = yy;
            baseArray[index + 2] = z;

            positionsArray[index] = x;
            positionsArray[index + 1] = yy;
            positionsArray[index + 2] = z;

            const hue = (0.55 + t * 0.35 + Math.random() * 0.08) % 1;
            const lightness = 0.5 + Math.random() * 0.22;
            color.setHSL(hue, 0.78, lightness);
            colorArray[index] = color.r;
            colorArray[index + 1] = color.g;
            colorArray[index + 2] = color.b;

            phaseArray[i] = Math.random() * Math.PI * 2;
        }

        return {
            positions: positionsArray,
            colors: colorArray,
            basePositions: baseArray,
            phases: phaseArray
        };
    }, [color]);

    useFrame(({ clock }) => {
        const points = pointsRef.current;
        if (!points) return;

        const time = clock.getElapsedTime() * 0.32;
        const positionAttr = points.geometry.attributes.position as THREE.BufferAttribute;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const index = i * 3;
            const baseX = basePositions[index];
            const baseY = basePositions[index + 1];
            const baseZ = basePositions[index + 2];
            const phase = phases[i];

            const drift = Math.sin(time + phase) * 2.4;
            const swirl = Math.cos(time * 1.2 + phase) * 1.6;

            positions[index] = baseX + Math.cos(time + baseY * 0.03 + phase) * 1.8 + swirl;
            positions[index + 1] = baseY + Math.sin(time * 1.4 + baseZ * 0.025 + phase) * 2.2;
            positions[index + 2] = baseZ + Math.sin(time + baseX * 0.03 + phase) * 1.8 + drift;
        }

        positionAttr.needsUpdate = true;
        points.rotation.y = time * 0.16;
        points.rotation.x = Math.sin(time * 0.55) * 0.08;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
                size={0.22}
                sizeAttenuation
                vertexColors
                transparent
                opacity={0.85}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

export default function ParticleFieldBackground() {
    return (
        <div
            aria-hidden="true"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                overflow: 'hidden',
                background:
                    'radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.16), transparent 28%), radial-gradient(circle at 80% 18%, rgba(45, 212, 191, 0.14), transparent 26%), linear-gradient(135deg, #020617 0%, #081225 45%, #111827 100%)'
            }}
        >
            <Canvas camera={{ position: [0, 0, 78], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: false, alpha: true }}>
                <color attach="background" args={['#020617']} />
                <fog attach="fog" args={['#020617', 45, 120]} />
                <ambientLight intensity={0.45} />
                <ParticleCloud />
            </Canvas>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'linear-gradient(180deg, rgba(2, 6, 23, 0.15) 0%, rgba(2, 6, 23, 0.38) 100%)'
                }}
            />
        </div>
    );
}
