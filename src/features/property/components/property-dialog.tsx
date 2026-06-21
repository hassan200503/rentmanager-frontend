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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 animate-fade-in">
        {children}
      </div>
    </div>
  );
};
