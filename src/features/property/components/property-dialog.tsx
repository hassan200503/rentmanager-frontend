import { ReactNode } from "react";

export const PropertyDialog = ({
                                   open,
                                   children,
                               }: {
    open: boolean;
    children: ReactNode;
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-4 rounded w-[500px]">{children}</div>
        </div>
    );
};
