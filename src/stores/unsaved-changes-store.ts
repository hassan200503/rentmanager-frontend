import { create } from "zustand";

interface UnsavedChangesState {
    isDirty: boolean;
    message: string;
    setDirty: (dirty: boolean, message?: string) => void;
}

export const useUnsavedChanges = create<UnsavedChangesState>((set) => ({
    isDirty: false,
    message: "You have unsaved changes. Leave without saving?",
    setDirty: (dirty, message) =>
        set({
            isDirty: dirty,
            message: message ?? "You have unsaved changes. Leave without saving?",
        }),
}));
