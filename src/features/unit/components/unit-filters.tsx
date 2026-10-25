import { UnitStatus } from "../types/unit";
import { UnitFilterState } from "../hooks/use-unit-filters";

type UnitFiltersProps = {
  filters: UnitFilterState;
  onChange: (patch: Partial<UnitFilterState>) => void;
  onReset: () => void;
};

export const UnitFilters = ({ filters, onChange, onReset }: UnitFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Search */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Search</label>
        <input
          className="input-field w-48"
          placeholder="Unit number..."
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      {/* Status */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Status</label>
        <select
          className="input-field w-40"
          value={filters.status}
          onChange={(e) =>
            onChange({ status: e.target.value as UnitStatus | "" })
          }
        >
          <option value="">All statuses</option>
          {Object.values(UnitStatus).map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Min Rent */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Min rent</label>
        <input
          className="input-field w-32"
          type="number"
          placeholder="0"
          value={filters.minRent}
          onChange={(e) =>
            onChange({
              minRent: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
        />
      </div>

      {/* Max Rent */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Max rent</label>
        <input
          className="input-field w-32"
          type="number"
          placeholder="Any"
          value={filters.maxRent}
          onChange={(e) =>
            onChange({
              maxRent: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
        />
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={onReset}
        className="btn-secondary text-sm"
      >
        Reset
      </button>
    </div>
  );
};
