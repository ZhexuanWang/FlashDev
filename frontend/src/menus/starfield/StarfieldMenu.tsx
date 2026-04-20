import { Canvas } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import type { MenuProps } from '../types';
import { buildPlanetConfigs } from './planetConfig';
import StarBackground from './StarBackground';
import Planet from './Planet';
import Sun from './Sun';

export default function StarfieldMenu({ items, lang = 'zh' }: MenuProps) {
    const navigate = useNavigate();
    const planets = buildPlanetConfigs(items);

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#020817' }}>
            <Canvas
                camera={{ position: [0, 4, 16], fov: 60 }}
                style={{ width: '100%', height: '100%' }}
            >
                {/* 环境光 */}
                <ambientLight intensity={0.15} />
                <directionalLight position={[10, 10, 5]} intensity={0.3} />

                {/* 星空背景 */}
                <StarBackground />

                {/* 太阳 */}
                <Sun />

                {/* 行星菜单项 */}
                {planets.map((config) => (
                    <Planet
                        key={config.menuItem.id}
                        config={config}
                        lang={lang ?? 'zh'}
                        onClick={() => navigate(config.menuItem.path)}
                    />
                ))}
            </Canvas>

            {/* UI 覆盖层 — 语言切换提示 */}
            <div style={{
                position: 'absolute',
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#475569',
                fontSize: '0.8rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                pointerEvents: 'none',
            }}>
                Click a planet to navigate
            </div>
        </div>
    );
}