import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SplashScreen from '../components/splash/SplashScreen';

export default function SplashPage() {
    const navigate = useNavigate();
    const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 从后端读取 intro_video_url 配置
        fetch('http://localhost:3000/site-config/intro_video_url')
            .then(res => res.json())
            .then((url: string) => {
                setVideoUrl(url || undefined);
            })
            .catch(() => {
                setVideoUrl(undefined);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleEnded = () => {
        navigate('/home', { replace: true });
    };

    if (loading) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: '#000',
            }} />
        );
    }

    return <SplashScreen videoUrl={videoUrl} onEnded={handleEnded} />;
}