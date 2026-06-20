export default function Loading() {
    return (
        <div className="p-6 space-y-4">

            <div className="h-6 w-48 bg-gray-800 rounded animate-pulse" />

            <div className="grid grid-cols-3 gap-4">
                <div className="h-24 bg-gray-800 rounded animate-pulse" />
                <div className="h-24 bg-gray-800 rounded animate-pulse" />
                <div className="h-24 bg-gray-800 rounded animate-pulse" />
            </div>

            <div className="h-64 bg-gray-800 rounded animate-pulse" />

        </div>
    );
}