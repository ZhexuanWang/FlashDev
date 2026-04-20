import { useEffect, useState } from 'react';
import { defaultMenuItems } from './menuItems';
import type { MenuProps } from './types';
import StarfieldMenu from './starfield/StarfieldMenu';
import LightningMenu from './lightning/LightningMenu';

export default function HomeMenu() {
    const [menuKey, setMenuKey] = useState<string>('starfield');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/site-config/default_menu`)
            .then(res => res.json())
            .then((key: string) => setMenuKey(key || 'starfield'))
            .catch(() => setMenuKey('starfield'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div style={{ position: 'fixed', inset: 0, background: '#020817' }} />;
    }

    const props: MenuProps = { items: defaultMenuItems, lang: 'zh' };

    switch (menuKey) {
        case 'lightning': return <LightningMenu {...props} />;
        default:          return <StarfieldMenu {...props} />;
    }
}