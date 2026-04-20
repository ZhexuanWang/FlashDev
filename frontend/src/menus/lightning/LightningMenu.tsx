import { useNavigate } from 'react-router-dom';
import type { MenuProps } from '../types';

export default function LightningMenu({ items, lang = 'zh' }: MenuProps) {
    const navigate = useNavigate();

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#0a0a0f',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {/* 闪电背景占位 — Phase 11 替换为 3D 充电装置 */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at 50% 60%, #1a0a2e 0%, #0a0a0f 65%)',
            }} />

            <div style={{ position: 'relative', textAlign: 'center' }}>
                {/* 能量核心占位 */}
                <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #a855f7 0%, #6d28d9 50%, transparent 70%)',
                    margin: '0 auto 2rem',
                    boxShadow: '0 0 40px rgba(168, 85, 247, 0.5), 0 0 80px rgba(168, 85, 247, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                }}>
                    ⚡
                </div>

                <div style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#fff',
                    marginBottom: '0.5rem',
                }}>
                    <span style={{ color: '#a855f7' }}>Flash</span>Dev
                </div>

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    justifyContent: 'center',
                    marginTop: '2rem',
                    maxWidth: '400px',
                }}>
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            style={{
                                background: 'rgba(168, 85, 247, 0.1)',
                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                borderRadius: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                color: '#e2e8f0',
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                            }}
                            onMouseEnter={e => {
                                (e.target as HTMLElement).style.background = 'rgba(168, 85, 247, 0.25)';
                                (e.target as HTMLElement).style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.4)';
                            }}
                            onMouseLeave={e => {
                                (e.target as HTMLElement).style.background = 'rgba(168, 85, 247, 0.1)';
                                (e.target as HTMLElement).style.boxShadow = 'none';
                            }}
                        >
                            {lang === 'zh' ? item.labelZh : item.labelEn}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}