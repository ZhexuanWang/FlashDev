export interface MenuMeta {
    key: string;
    labelZh: string;
    labelEn: string;
}

const menuRegistry: MenuMeta[] = [
    { key: 'starfield', labelZh: '星空菜单', labelEn: 'Starfield' },
    { key: 'lightning', labelZh: '闪电菜单', labelEn: 'Lightning' },
];

export function getAvailableMenus(): MenuMeta[] {
    return menuRegistry;
}

export function registerMenu(meta: MenuMeta) {
    if (!menuRegistry.find(m => m.key === meta.key)) {
        menuRegistry.push(meta);
    }
}