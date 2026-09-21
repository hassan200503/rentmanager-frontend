import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE, PROCESSORS } from "@/lib/legal/legal-meta";
import { LegalTitle, LegalLead, LegalSection, LegalList } from "../legal-prose";

export const metadata: Metadata = {
    title: "Privacy policy | RentManager",
    description:
        "What personal data RentManager holds, why, who processes it, and the rights you have over it under Kenya's Data Protection Act 2019.",
};

/**
 * Privacy policy.
 *
 * Written from the schema and the code rather than from a template: every
 * category below corresponds to columns that exist (`tenant_profile`,
 * `audit_logs`, `rent_transactions`, the tax tables), and the retention
 * section says the awkward true thing — that financial and audit rows are
 * append-only at the database level (V81, V86) and therefore cannot be deleted
 * on request. A policy promising erasure of those would be a promise the
 * triggers refuse to keep.
 *
 * This is a factual description of the system, not legal advice; it should be
 * reviewed by a Kenyan data-protection practitioner before any large launch.
 * Tracked as TD-151.
 */
export default function PrivacyPolicyPage() {
    return (
        <article>
            <LegalTitle updated={LEGAL_EFFECTIVE_DATE}>Privacy policy</LegalTitle>

            <LegalLead>
                RentManager is rental-management software used by landlords in Kenya to list vacant
                units, keep leases, and record rent paid by M-PESA. This page describes the personal
                data the system holds, why it holds it, and what you can ask us to do about it. It is
                written to match what the software actually does.
            </LegalLead>

            <LegalSection heading="Who is responsible for your data">
                <p>
                    There are two different answers, and the difference matters if you want something
                    changed or deleted.
                </p>
                <LegalList
                    items={[
                        <>
                            <strong className="text-white/90">Records a landlord keeps about you.</strong>{" "}
                            Your renter profile, your lease and your payment history belong to the
                            landlord or agency you rent from. They decide what to record and how long to
                            keep it; RentManager processes it on their instructions. Requests about those
                            records are best made to them, and we will help them act on one.
                        </>,
                        <>
                            <strong className="text-white/90">Your RentManager account itself.</strong>{" "}
                            Your sign-in identity, the audit trail of actions taken on the platform and
                            anything needed to keep the service running are our responsibility.
                        </>,
                    ]}
                />
            </LegalSection>

            <LegalSection heading="What the system holds">
                <LegalList
                    items={[
                        <>
                            <strong className="text-white/90">Sign-in identity</strong> — your name and
                            email address, and a phone number if you add one. Passwords and sign-in
                            sessions are handled entirely by Clerk; RentManager never receives or stores
                            your password.
                        </>,
                        <>
                            <strong className="text-white/90">Renter profile</strong> — full name, phone
                            number, email address, and a national ID number where the landlord records
                            one. A landlord may create this before you ever sign in, from details you
                            gave them; it is linked to your account when you sign in with the same
                            verified email address.
                        </>,
                        <>
                            <strong className="text-white/90">Property, unit and lease records</strong> —
                            which unit you rent, the rent and deposit agreed, and the dates.
                        </>,
                        <>
                            <strong className="text-white/90">Payment records</strong> — the amount, the
                            date, the M-PESA transaction reference, and the phone number that paid. Rent
                            and reservation deposits are paid into the landlord&apos;s own M-PESA
                            account: we receive Safaricom&apos;s confirmation of a payment, not the money
                            itself.
                        </>,
                        <>
                            <strong className="text-white/90">Maintenance requests</strong> — what you
                            reported and any photographs you attached.
                        </>,
                        <>
                            <strong className="text-white/90">An audit trail</strong> — which account did
                            what, when, with the IP address and browser the action came from. This exists
                            so that a dispute about money has an answer: who authorised a payment or a
                            change, and from where.
                        </>,
                        <>
                            <strong className="text-white/90">Tax details</strong> — a KRA PIN, where a
                            landlord enters one to use the tax features.
                        </>,
                    ]}
                />
            </LegalSection>

            <LegalSection heading="What the system does not hold">
                <LegalList
                    items={[
                        "No card or bank account numbers. Payments in RentManager are made by M-PESA, and no part of the product asks for card details.",
                        "No passwords. Clerk handles sign-in; we only ever learn that a sign-in succeeded.",
                        "No advertising or analytics trackers. This website loads no third-party tracking scripts, and we do not sell or share personal data for advertising.",
                    ]}
                />
            </LegalSection>

            <LegalSection heading="Who else processes it">
                <p>
                    RentManager runs on services operated by other companies. Each is listed here with
                    what it does and where it holds data, because some are outside Kenya and the Data
                    Protection Act 2019 requires that to be disclosed.
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-white/50">
                                <th scope="col" className="py-2 pr-4 font-medium">
                                    Service
                                </th>
                                <th scope="col" className="py-2 pr-4 font-medium">
                                    What it does
                                </th>
                                <th scope="col" className="py-2 font-medium">
                                    Where
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {PROCESSORS.map((processor) => (
                                <tr key={processor.name} className="border-b border-white/5 align-top">
                                    <th scope="row" className="py-3 pr-4 font-medium text-white/85">
                                        {processor.name}
                                    </th>
                                    <td className="py-3 pr-4 text-white/65">{processor.role}</td>
                                    <td className="py-3 text-white/55">{processor.where}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p>
                    A landlord can also switch on optional integrations of their own — an SMS or
                    WhatsApp sender, or an image host, for example. Where they do, the details sent
                    through it are handled by that provider too.
                </p>
            </LegalSection>

            <LegalSection heading="How long records are kept, and what cannot be deleted">
                <p>
                    Most data is kept while your tenancy is active and for as long as the landlord needs
                    it afterwards. Two categories are deliberately permanent, and we would rather say so
                    here than refuse a request later without explaining why.
                </p>
                <LegalList
                    items={[
                        <>
                            <strong className="text-white/90">
                                Payment records cannot be edited or deleted.
                            </strong>{" "}
                            The database itself refuses it. A correction is made by recording a reversing
                            entry, so both the original and the correction stay visible. This protects
                            you as much as the landlord: it is what makes &ldquo;I paid that&rdquo;
                            provable.
                        </>,
                        <>
                            <strong className="text-white/90">The audit trail is append-only.</strong> A
                            record of who authorised a payout is worth nothing if the person who
                            authorised it can delete it afterwards.
                        </>,
                    ]}
                />
                <p>
                    Everything else — your profile details, maintenance history, contact information —
                    can be corrected or removed on request.
                </p>
            </LegalSection>

            <LegalSection heading="Your rights">
                <p>
                    Under the Data Protection Act 2019 you can ask to see the personal data held about
                    you, have it corrected, have it deleted where we are not required to keep it, object
                    to how it is used, and receive a copy in a portable form. You can also complain to
                    the Office of the Data Protection Commissioner.
                </p>
                <p>
                    {LEGAL_CONTACT_EMAIL ? (
                        <>
                            To make a request, write to{" "}
                            <a
                                className="text-jade-300 underline decoration-jade-300/40 hover:decoration-jade-300"
                                href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                            >
                                {LEGAL_CONTACT_EMAIL}
                            </a>
                            . We will confirm receipt and respond within the statutory period.
                        </>
                    ) : (
                        <>
                            A dedicated contact address for these requests is being set up. Until it
                            appears here, raise a request with the landlord or agency you rent from, or
                            with whoever invited you to RentManager — they can reach us directly, and we
                            act on their request the same way.
                        </>
                    )}
                </p>
            </LegalSection>

            <LegalSection heading="Changes to this policy">
                <p>
                    When the wording changes, the effective date at the top changes with it. Material
                    changes will be announced in the app rather than only here.
                </p>
                <p>
                    See also our{" "}
                    <Link
                        className="text-jade-300 underline decoration-jade-300/40 hover:decoration-jade-300"
                        href="/legal/terms"
                    >
                        terms of service
                    </Link>
                    .
                </p>
            </LegalSection>
        </article>
    );
}
