import { clientEnv } from "@/lib/config/env";

/**
 * Facts the legal pages need in one place.
 *
 * Every statement on those pages is meant to be traceable to code or schema,
 * the same rule the rest of the public site follows. Keeping the effective
 * date and the contact address here means a policy change is a deliberate
 * edit with a date attached, rather than a `new Date()` that silently claims
 * the document was reviewed today.
 */

/** The date the current wording took effect. Bump it when the wording changes. */
export const LEGAL_EFFECTIVE_DATE = "21 September 2026";

/**
 * Where data-protection requests go, from NEXT_PUBLIC_LEGAL_CONTACT_EMAIL.
 *
 * Undefined until the operator sets it. The pages then say the address is
 * being set up and point people at the account they signed up with — an
 * honest gap is better than a printed address that bounces, which is worse
 * than no address at all for a policy that promises a response.
 */
export const LEGAL_CONTACT_EMAIL: string | undefined =
    clientEnv.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL || undefined;

/**
 * The third parties that actually process data for this deployment, and what
 * each one does. Named because the Data Protection Act 2019 requires
 * disclosure of processors and of transfers outside Kenya, and because a list
 * of real names is more useful to a reader than "trusted partners".
 */
export const PROCESSORS: Array<{ name: string; role: string; where: string }> = [
    { name: "Clerk", role: "Sign-in, passwords and session management", where: "United States" },
    { name: "Neon", role: "The database holding your records", where: "European Union (Frankfurt)" },
    { name: "Render", role: "Runs the RentManager application server", where: "European Union (Frankfurt)" },
    { name: "Netlify", role: "Serves this website", where: "Global content network" },
    {
        name: "Safaricom (M-PESA)",
        role: "Processes payments and sends us confirmation of them",
        where: "Kenya",
    },
];
