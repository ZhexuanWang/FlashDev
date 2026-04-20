import { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useTranslation } from 'react-i18next'
import type { PermissionKey } from '../../types/permissions'
import { useHasPermission } from '../../hooks/usePermissions'

interface EditableTextProps {
    value:        string
    onSave:       (value: string) => Promise<void>
    className?:   string
    tag?:         'h1' | 'h2' | 'h3' | 'p' | 'span'
    placeholder?: string
    permission?:  PermissionKey
}

export function EditableText({
                                 value,
                                 onSave,
                                 className = '',
                                 tag: Tag   = 'span',
                                 placeholder,
                                 permission,
                             }: EditableTextProps) {
    const { t }         = useTranslation()
    const { isEditing } = useEditorStore()
    const hasPermission = useHasPermission(permission ?? 'manage_projects')
    const canEdit       = permission ? hasPermission : true
    const [editing, setEditing] = useState(false)
    const [text,    setText]    = useState(value)
    const [saving,  setSaving]  = useState(false)
    const [saved,   setSaved]   = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)

    const ph = placeholder ?? t('editor.clickToEdit')

    useEffect(() => { setText(value) }, [value])
    useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

    if (!isEditing || !canEdit) {
        return <Tag className={className}>{value || ph}</Tag>
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
            <span className="relative inline-block w-full">
        <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => {
                if (e.key === 'Enter')  handleSave()
                if (e.key === 'Escape') { setText(value); setEditing(false) }
            }}
            className={`${className} bg-transparent border-b border-sky-500 outline-none
                      w-full text-sky-200 caret-sky-400`}
        />
                {saving && (
                    <span className="absolute -top-5 right-0 text-[9px] font-mono text-sky-500 animate-pulse">
            {t('editor.saving')}
          </span>
                )}
      </span>
        )
    }

    return (
        <Tag
            className={`${className} cursor-text relative group`}
            onClick={() => setEditing(true)}
        >
            {value || ph}
            <span className="absolute -top-5 left-0 text-[9px] font-mono text-sky-600/60
                       opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {saved ? t('editor.saved') : t('editor.clickToEdit')}
      </span>
            <span className="absolute bottom-0 left-0 right-0 h-px bg-sky-800/40
                       opacity-0 group-hover:opacity-100 transition-opacity" />
        </Tag>
    )
}