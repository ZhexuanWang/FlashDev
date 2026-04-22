export const PERMISSION_KEYS = [
    'manage_projects',
    'manage_blogs',
    'manage_team',
    'manage_categories',
    'view_users',
    'send_announcements',
    'edit_posters',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

export const DEFAULT_PERMISSIONS: Record<PermissionKey, boolean> = {
    manage_projects:    false,
    manage_blogs:       false,
    manage_team:        false,
    manage_categories:  false,
    view_users:         false,
    send_announcements: false,
    edit_posters:       false,
}

export const PERMISSION_LABELS: Record<PermissionKey, { zh: string; en: string }> = {
    manage_projects:    { zh: '管理项目',    en: 'Manage Projects'    },
    manage_blogs:       { zh: '管理博客',    en: 'Manage Blogs'       },
    manage_team:        { zh: '管理团队',    en: 'Manage Team'        },
    manage_categories:  { zh: '管理分类',    en: 'Manage Categories'  },
    view_users:         { zh: '查看用户列表', en: 'View Users'        },
    send_announcements: { zh: '发送公告',    en: 'Send Announcements' },
    edit_posters:       { zh: '编辑海报',    en: 'Edit Posters'       },
}