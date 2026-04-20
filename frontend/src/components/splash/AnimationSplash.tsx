import { useEffect, useState } from 'react';

interface Props {
    onEnded: () => void;
}

export default function AnimationSplash({ onEnded }: Props) {
    const [phase, setPhase] = useState<'flash' | 'logo' | 'out'>('flash');

    useEffect(() => {
        // 闪光 → logo 出现 → 淡出 → 进入主页
        const t1 = setTimeout(() => setPhase('logo'), 400);
        const t2 = setTimeout(() => setPhase('out'), 2200);
        const t3 = setTimeout(onEnded, 2800);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [onEnded]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.6s ease',
            opacity: phase === 'out' ? 0 : 1,
        }}>
            {/* 闪光层 */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)',
                opacity: phase === 'flash' ? 0.8 : 0,
                transition: 'opacity 0.4s ease',
            }} />

            {/* Logo 文字 */}
            <div style={{
                position: 'relative',
                textAlign: 'center',
                opacity: phase === 'logo' ? 1 : 0,
                transform: phase === 'logo' ? 'scale(1)' : 'scale(0.8)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}>
                <div style={{
                    fontSize: '3rem',
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '0.1em',
                    fontFamily: 'system-ui, sans-serif',
                }}>
                    <span style={{ color: '#38bdf8' }}>Flash</span>Dev
                </div>
                <div style={{
                    fontSize: '0.9rem',
                    color: '#94a3b8',
                    marginTop: '0.5rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                }}>
                    Programming Services
                </div>
            </div>
        </div>
    );
}