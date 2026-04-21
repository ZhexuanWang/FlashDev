const ROCKS = [
    { x: '45%', y: '45%', s: '28px',  delay: '0s',   dur: '80s',  bright: '#9898b8', id: 0 },
    { x: '55%', y: '50%', s: '38px',  delay: '-10s', dur: '90s',  bright: '#606078', id: 1 },
    { x: '40%', y: '55%', s: '20px',  delay: '-20s', dur: '70s',  bright: '#505068', id: 2 },
    { x: '50%', y: '40%', s: '42px',  delay: '-30s', dur: '100s', bright: '#707088', id: 3 },
    { x: '52%', y: '52%', s: '24px',  delay: '-40s', dur: '85s',  bright: '#808098', id: 4 },
    { x: '48%', y: '48%', s: '18px',  delay: '-50s', dur: '75s',  bright: '#404058', id: 5 },
    { x: '42%', y: '42%', s: '22px',  delay: '-60s', dur: '95s',  bright: '#585870', id: 6 },
    { x: '58%', y: '58%', s: '44px',  delay: '-70s', dur: '110s', bright: '#686885', id: 7 },
]

export function Asteroids() {
    return (
        <>
            <style>{`
                .asteroid {
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                    animation-fill-mode: both;
                }
                @keyframes r0 { 0%{transform:translate(-75vw,-75vh)}  50%{transform:translate(75vw,75vh)}  100%{transform:translate(-75vw,-75vh)} }
                @keyframes r1 { 0%{transform:translate(75vw,-75vh)}  50%{transform:translate(-75vw,75vh)}  100%{transform:translate(75vw,-75vh)} }
                @keyframes r2 { 0%{transform:translate(-75vw,75vh)}  50%{transform:translate(75vw,-75vh)}  100%{transform:translate(-75vw,75vh)} }
                @keyframes r3 { 0%{transform:translate(75vw,75vh)}   50%{transform:translate(-75vw,-75vh)} 100%{transform:translate(75vw,75vh)} }
                @keyframes r4 { 0%{transform:translate(-75vw,75vh)}   50%{transform:translate(75vw,-75vh)}  100%{transform:translate(-75vw,75vh)} }
                @keyframes r5 { 0%{transform:translate(75vw,-75vh)}   50%{transform:translate(-75vw,75vh)}  100%{transform:translate(75vw,-75vh)} }
                @keyframes r6 { 0%{transform:translate(-75vw,-75vh)}  50%{transform:translate(75vw,75vh)}   100%{transform:translate(-75vw,-75vh)} }
                @keyframes r7 { 0%{transform:translate(75vw,75vh)}   50%{transform:translate(-75vw,-75vh)} 100%{transform:translate(75vw,75vh)} }
            `}</style>
            {ROCKS.map((r) => (
                <div
                    key={r.id}
                    className="asteroid absolute pointer-events-none"
                    style={{
                        zIndex: 0,
                        left:     r.x,
                        top:      r.y,
                        width:    r.s,
                        height:   r.s,
                        background: `radial-gradient(circle at 40% 35%, ${r.bright} 0%, #404058 50%, #181828 100%)`,
                        borderRadius: '58% 42% 52% 68% / 48% 62% 38% 52%',
                        boxShadow: 'inset -3px -3px 8px rgba(0,0,20,0.6)',
                        animationName: `r${r.id}`,
                        animationDuration: r.dur,
                        animationDelay: r.delay,
                    }}
                />
            ))}
        </>
    )
}
