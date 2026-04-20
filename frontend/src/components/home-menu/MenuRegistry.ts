import React from 'react';

export interface MenuProps {
    onNavigate: (route: string) => void;
    lang: 'zh' | 'en';
}

type MenuComponent = React.FC<MenuProps>;

const registry = new Map<string, MenuComponent>();

export const registerMenu = (name: string, component: MenuComponent) => {
    registry.set(name, component);
};

export const getMenu = (name: string): MenuComponent | undefined => {
    return registry.get(name);
};

export const getMenuNames = (): string[] => {
    return Array.from(registry.keys());
};

export default registry;