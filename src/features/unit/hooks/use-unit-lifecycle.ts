import {
    useActivateUnitMutation,
    useArchiveUnitMutation,
    useMarkUnitOccupiedMutation,
    useMarkUnitVacantMutation,
} from "../queries/use-unit-lifecycle-mutations";

export const useUnitLifecycle = () => {
    const activate = useActivateUnitMutation();
    const archive = useArchiveUnitMutation();
    const markOccupied = useMarkUnitOccupiedMutation();
    const markVacant = useMarkUnitVacantMutation();

    return {
        activateUnit: activate.mutateAsync,
        deactivateUnit: archive.mutateAsync,
        markUnitOccupied: markOccupied.mutateAsync,
        markUnitVacant: markVacant.mutateAsync,
        isActivating: activate.isPending,
        isDeactivating: archive.isPending,
        isUpdatingOccupancy: markOccupied.isPending || markVacant.isPending,
    };
};
