import type { MenuItem } from '../types';

export interface PlanetConfig {
    menuItem: MenuItem;
    radius: number;       // 行星大小
    distance: number;     // 离中心距离
    speed: number;        // 公转速度
    color: string;        // 行星颜色
    emissive: string;     // 自发光色
    initialAngle: number; // 初始角度
    tilt: number;         // 轨道倾斜
}

export function buildPlanetConfigs(items: MenuItem[]): PlanetConfig[] {
    const presets = [
        { radius: 0.45, distance: 3.2, speed: 0.18, color: '#4fc3f7', emissive: '#0288d1', tilt: 0.15 },
        { radius: 0.55, distance: 4.8, speed: 0.12, color: '#81c784', emissive: '#388e3c', tilt: -0.2 },
        { radius: 0.38, distance: 6.2, speed: 0.08, color: '#ffb74d', emissive: '#f57c00', tilt: 0.25 },
        { radius: 0.62, distance: 7.8, speed: 0.05, color: '#ce93d8', emissive: '#7b1fa2', tilt: -0.1 },
        { radius: 0.42, distance: 9.0, speed: 0.035, color: '#ef9a9a', emissive: '#c62828', tilt: 0.18 },
    ];

    return items.map((item, i) => ({
        menuItem: item,
        initialAngle: (i / items.length) * Math.PI * 2,
        ...presets[i % presets.length],
    }));
}