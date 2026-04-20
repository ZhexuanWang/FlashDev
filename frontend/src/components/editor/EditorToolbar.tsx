import { useNavigate } from 'react-router-dom'
import { useEditorStore } from '../../store/editorStore'
import { useAuthStore }   from '../../store/authStore'
import { useTranslation } from 'react-i18next'
import { ThemeEditor }     from '../ThemeEditor'

export function EditorToolbar() {
    const { isEditing, exitEditMode } = useEditorStore()
    const { logout }                  = useAuthStore()
    const { t, i18n }                 = useTranslation()
    const navigate                    = useNavigate()
    const lang                        = i18n.language === 'zh' ? 'zh' : 'en'
    const role = useAuthStore(state => state.role)

    if (!isEditing) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex flex-col">
            <div className="bg-sky-950/95 border-b border-sky-800
                    backdrop-blur-sm flex items-center justify-between px-6 py-2.5">
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
                    <span className="text-sky-600 font-mono text-[10px]">
              {t('editor.toolbar.lang')}：{lang === 'zh'
                        ? t('editor.toolbar.langZh')
                        : t('editor.toolbar.langEn')}
                    </span>

                    {role === 'COMPANY' && (
                        <button
                            onClick={() => navigate('/permissions')}
                            className="px-3 py-1 border border-slate-700 text-slate-400 font-mono text-xs
                   rounded hover:border-sky-700 hover:text-brand transition-all"
                        >
                            {t('editor.toolbar.permissions')}
                        </button>
                    )}

                    <button
                        onClick={exitEditMode}
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

            <ThemeEditor />
        </div>
    )
}