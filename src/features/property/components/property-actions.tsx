export const PropertyActions = ({
                                    onEdit,
                                    onActivate,
                                    onArchive,
                                }: {
    onEdit: () => void;
    onActivate: () => void;
    onArchive: () => void;
}) => {
    return (
        <div className="flex gap-2">
            <button onClick={onEdit}>Edit</button>
            <button onClick={onActivate}>Activate</button>
            <button onClick={onArchive}>Archive</button>
        </div>
    );
};
