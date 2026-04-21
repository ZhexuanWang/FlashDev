import { PosterSlot } from './PosterSlot'

export function PosterAreas() {
    return (
        <>
            <style>{`
                .poster-wrap {
                    background: rgba(20,20,40,0.55);
                    border: 1px solid rgba(80,90,140,0.25);
                }
            `}</style>

            {/* Row 1 — single large horizontal poster */}
            <div
                className="absolute poster-wrap rounded-lg overflow-hidden"
                style={{ top: '12.5%', left: '8%', width: '56%', height: '35%' }}
            >
                <PosterSlot area="TOP" />
            </div>

            {/* Row 2 — vertical on left, horizontal on right, same total width as row 1 */}
            <div
                className="absolute poster-wrap rounded-lg overflow-hidden"
                style={{ bottom: '12.5%', left: '8%', width: 'calc(56% / 3)', height: '35%' }}
            >
                <PosterSlot area="BOTTOM_LEFT" />
            </div>
            <div
                className="absolute poster-wrap rounded-lg overflow-hidden"
                style={{ bottom: '12.5%', left: 'calc(8% + 56% / 3)', width: 'calc(56% * 2 / 3)', height: '35%' }}
            >
                <PosterSlot area="BOTTOM_RIGHT" />
            </div>
        </>
    )
}
