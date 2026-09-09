import { redirect } from "next/navigation";

export default function CommissionRedirect() {
    redirect("/admin/subscription-plans");
}
