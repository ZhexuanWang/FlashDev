import { useEffect, useRef } from 'react';

interface Props {
    videoUrl: string;
    onEnded: () => void;
    onError: () => void;
}

export default function VideoSplash({ videoUrl, onEnded, onError }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        video.play().catch(onError);
    }, [onError]);

    return (
        <video
            ref={videoRef}
            src={videoUrl}
            onEnded={onEnded}
            onError={onError}
            muted
            playsInline
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                background: '#000',
            }}
        />
    );
}