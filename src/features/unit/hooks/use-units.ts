// ─── useUnits ─────────────────────────────────────────────────────────────────
import { useUnitsQuery } from "../queries/use-units-query";
import { UnitListParams } from "../types/unit-request";

export const useUnits = (params: UnitListParams) => {
    return useUnitsQuery(params);
};
