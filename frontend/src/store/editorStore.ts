import { create } from 'zustand'

interface EditorState {
    isEditing: boolean
    token:     string | null
    role:      string | null
    enterEditMode: (token: string, role: string) => void
    exitEditMode:  () => void
}

export const useEditorStore = create<EditorState>((set) => ({
    isEditing: false,
    token:     null,
    role:      null,

    enterEditMode: (token, role) => set({ isEditing: true, token, role }),
    exitEditMode:  ()            => set({ isEditing: false }),
}))