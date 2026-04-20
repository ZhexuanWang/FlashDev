import { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useTranslation } from 'react-i18next'
import type { PermissionKey } from '../../types/permissions'
import { useHasPermission } from '../../hooks/usePermissions'

interface EditableTextareaProps {
    value:      string
    onSave:     (value: string) => Promise<void>
    className?: string
    rows?:      number
    permission?: PermissionKey
}

export function EditableTextarea({
                                     value,
                                     onSave,
                                     className = '',
                                     rows = 4,
                                     permission,
                                 }: EditableTextareaProps) {
    const { t }         = useTranslation()
    const { isEditing } = useEditorStore()
    const hasPermission = useHasPermission(permission ?? 'manage_projects')
    const canEdit       = permission ? hasPermission : true
    const [editing, setEditing] = useState(false)
    const [text,    setText]    = useState(value)
    const [saving,  setSaving]  = useState(false)
    const [saved,   setSaved]   = useState(false)
    const ref = useRef<HTMLTextAreaElement | null>(null)

    useEffect(() => { setText(value) }, [value])
    useEffect(() => { if (editing) ref.current?.focus() }, [editing])

    if (!isEditing || !canEdit) {
        return <p className={className}>{value}</p>
    }

    const handleSave = async () => {
        if (text === value) { setEditing(false); return }
        setSaving(true)
        try {
            await onSave(text)
            setSaved(true)
            setTimeout(() => setSaved(false), 1500)
        } finally {
            setSaving(false)
            setEditing(false)
        }
    }

    if (editing) {
        return (
            <div className="relative">
        <textarea
            ref={ref}
            value={text}
            onChange={e => setText(e.target.value)}
            rows={rows}
            onBlur={handleSave}
            onKeyDown={e => {
                if (e.key === 'Escape') { setText(value); setEditing(false) }
            }}
            className={`${className} w-full bg-slate-900/80 border border-sky-700 rounded
                      outline-none text-sky-200 caret-sky-400 resize-none p-2`}
        />
                <div className="flex justify-between mt-1">
          <span className="text-[9px] font-mono text-slate-600">
            {t('editor.cancel')}
          </span>
                    {saving && (
                        <span className="text-[9px] font-mono text-sky-500 animate-pulse">
              {t('editor.saving')}
            </span>
                    )}
                    {saved && (
                        <span className="text-[9px] font-mono text-emerald-500">
              {t('editor.saved')}
            </span>
                    )}
                </div>
            </div>
        )
    }

    return (
        <p
            className={`${className} cursor-text relative group`}
            onClick={() => setEditing(true)}
        >
            {value}
            <span className="absolute -top-5 left-0 text-[9px] font-mono text-sky-600/60
                       opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {t('editor.clickToEdit')}
      </span>
        </p>
    )
}