import { useState } from 'react';
import VideoSplash from './VideoSplash';
import AnimationSplash from './AnimationSplash';

interface Props {
    videoUrl?: string;
    onEnded: () => void;
}

export default function SplashScreen({ videoUrl, onEnded }: Props) {
    const [useAnimation, setUseAnimation] = useState(!videoUrl);

    if (useAnimation || !videoUrl) {
        return <AnimationSplash onEnded={onEnded} />;
    }

    return (
        <VideoSplash
            videoUrl={videoUrl}
            onEnded={onEnded}
            onError={() => setUseAnimation(true)}
        />
    );
}