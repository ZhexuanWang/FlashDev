import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEditorStore } from '../../store/editorStore'
import { useAuthStore }   from '../../store/authStore'
import { useTranslation } from 'react-i18next'
import { ThemeEditor }     from '../ThemeEditor'

export function EditorToolbar() {
    const isEditing  = useEditorStore(s => s.isEditing)
    const exitEdit  = useEditorStore(s => s.exitEditMode)
    const enterEdit  = useEditorStore(s => s.enterEditMode)
    const logout  = useAuthStore(s => s.logout)
    const authToken = useAuthStore(s => s.token)
    const authRole  = useAuthStore(s => s.role)
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const lang     = i18n.language === 'zh' ? 'zh' : 'en'
    const [themeOpen, setThemeOpen] = useState(false)

    const themeLabel = lang === 'zh' ? '主题设置' : 'Theme'

    return (
        <>
            {/* Full edit mode toolbar — shown when editing */}
            {isEditing && (
                <>
                    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-sky-950/95 border-t border-sky-800 backdrop-blur-sm flex items-center justify-between px-6 py-2.5">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                            <span className="text-sky-300 font-mono text-xs tracking-widest">
                                {t('editor.toolbar.mode')}
                            </span>
                            <span className="text-sky-600 font-mono text-[10px]">
                                — {t('editor.toolbar.hint')}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {(authRole === 'COMPANY') && (
                                <div className="relative">
                                    <button
                                        onClick={() => setThemeOpen(v => !v)}
                                        className={`px-3 py-1 font-mono text-xs transition-all rounded border ${
                                            themeOpen
                                                ? 'border-sky-600 text-sky-300 bg-sky-900/40'
                                                : 'border-slate-700 text-slate-400 hover:border-sky-700 hover:text-sky-400'
                                        }`}
                                    >
                                        {themeLabel}
                                    </button>
                                    {themeOpen && (
                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 bg-sky-950/95 border border-sky-800 rounded-lg shadow-2xl z-[200] min-w-[320px]">
                                            <div className="flex items-center justify-between px-4 py-2 border-b border-sky-800">
                                                <span className="text-sky-500 font-mono text-[10px] tracking-widest">
                                                    {themeLabel.toUpperCase()}
                                                </span>
                                                <button
                                                    onClick={() => setThemeOpen(false)}
                                                    className="text-sky-600 hover:text-sky-400 font-mono text-xs px-2 py-0.5 border border-slate-700 rounded transition-colors"
                                                >
                                                    {lang === 'zh' ? '收起' : 'Close'}
                                                </button>
                                            </div>
                                            <ThemeEditor />
                                        </div>
                                    )}
                                </div>
                            )}

                            <span className="text-sky-600 font-mono text-[10px]">
                                {t('editor.toolbar.lang')}：{lang === 'zh'
                                    ? t('editor.toolbar.langZh')
                                    : t('editor.toolbar.langEn')}
                            </span>

                            {authRole === 'COMPANY' && (
                                <button
                                    onClick={() => navigate('/permissions')}
                                    className="px-3 py-1 border border-slate-700 text-slate-400 font-mono text-xs
                                        rounded hover:border-sky-700 hover:text-brand transition-all"
                                >
                                    {t('editor.toolbar.permissions')}
                                </button>
                            )}

                            <button
                                onClick={exitEdit}
                                className="px-3 py-1 border border-sky-700 text-brand font-mono text-xs
                                    rounded hover:border-sky-500 hover:text-sky-200 transition-all"
                            >
                                {t('editor.toolbar.exitEdit')}
                            </button>

                            <button
                                onClick={logout}
                                className="px-3 py-1 border border-slate-700 text-slate-500 font-mono text-xs
                                    rounded hover:border-slate-500 hover:text-slate-300 transition-all"
                            >
                                {t('editor.toolbar.logout')}
                            </button>
                        </div>
                    </div>

                    {themeOpen && (
                        <div className="fixed inset-0 z-[150]" onClick={() => setThemeOpen(false)} />
                    )}
                </>
            )}

            {/* Floating enter button — shown when COMPANY/ADMIN is logged in but NOT editing */}
            {!isEditing && !!authToken && (String(authRole) === 'COMPANY' || String(authRole) === 'ADMIN') && (
                <button
                    onClick={() => enterEdit(authToken, String(authRole))}
                    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100]
                               flex items-center justify-center w-8 h-8 rounded-full
                               bg-sky-500/20 border border-sky-400/40
                               hover:bg-sky-500/40 hover:border-sky-400/70
                               transition-all duration-300
                               shadow-lg shadow-sky-900/50"
                    title={lang === 'zh' ? '进入编辑模式' : 'Enter Edit Mode'}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400/70">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
            )}
        </>
    )
}
