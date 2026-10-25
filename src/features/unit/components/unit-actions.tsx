"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

type UnitActionsProps = {
    propertyId: string;
};

export function UnitActions({ propertyId }: UnitActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <Link
                href={`/dashboard/properties/${propertyId}/units/create`}
                className="btn-primary inline-flex items-center gap-2"
            >
                <Plus className="h-4 w-4" />
                Add Unit
            </Link>
        </div>
    );
}