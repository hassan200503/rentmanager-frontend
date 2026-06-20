import { AppProps } from "@/app/app";
import { RootLayout } from "./layout";
import { PropertyFilters } from "./features/property/filters";
import { PropertyTable } from "./features/property/table";
import { PropertyPage } from "./features/property";

export default function App() {
    const [routerState, setRouterState] = useState<AppProps>({
        queryParams: {},
    });

    const { tenantId } = routerState.query;

    return (
        <RootLayout routerState={routerState}>
            <PropertyFilters onChange={PropertyFilters.onChange} />
            <PropertyTable />
            <PropertyPage filters={filters} />
        </RootLayout>
    );
}
