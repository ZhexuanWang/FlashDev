import type { ComponentType } from 'react';

export interface MenuItem {
    id: string;
    labelZh: string;
    labelEn: string;
    path: string;
    icon?: string;
}

export interface MenuProps {
    items: MenuItem[];
    lang?: 'zh' | 'en';
}

export interface MenuRegistryEntry {
    key: string;
    component: ComponentType<MenuProps>;
}