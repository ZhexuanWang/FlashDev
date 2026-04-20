import type { MenuItem } from './types';

export const defaultMenuItems: MenuItem[] = [
    { id: 'projects',  labelZh: '项目展示', labelEn: 'Projects',  path: '/projects' },
    { id: 'team',      labelZh: '团队介绍', labelEn: 'Team',      path: '/team'     },
    { id: 'services',  labelZh: '服务内容', labelEn: 'Services',  path: '/services' },
    { id: 'contact',   labelZh: '联系我们', labelEn: 'Contact',   path: '/contact'  },
];