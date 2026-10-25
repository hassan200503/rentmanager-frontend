import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE } from "@/lib/legal/legal-meta";
import { LegalTitle, LegalLead, LegalSection, LegalList } from "../legal-prose";

export const metadata: Metadata = {
    title: "Terms of service",
    description:
        "The terms on which landlords and renters use RentManager, including how rent payments work and what the platform is and is not responsible for.",
};

/**
 * Terms of service.
 *
 * The section that matters most is "How money moves": rent and deposits settle
 * into the landlord's own M-PESA account using that landlord's own Daraja
 * credentials (CollectionMode.DIRECT, ADR-0026), and the platform never takes
 * custody. Saying so plainly is not a disclaimer — it is the single most
 * important thing a renter or a landlord needs to understand about this
 * product, and getting it wrong in copy has been a recurring bug here.
 *
 * A factual description of how the service works, not legal advice; it should
 * be reviewed by a Kenyan practitioner before any large launch. Tracked as
 * TD-151.
 */
export default function TermsOfServicePage() {
    return (
        <article>
            <LegalTitle updated={LEGAL_EFFECTIVE_DATE}>Terms of service</LegalTitle>

            <LegalLead>
                These terms apply to everyone who uses RentManager: landlords and agencies who manage
                properties with it, and renters who browse listings, reserve a unit or pay rent
                through it. Using the service means accepting them.
            </LegalLead>

            <LegalSection heading="What RentManager is">
                <p>
                    RentManager is software. It lets a landlord list vacant units, keep leases and
                    record rent paid by M-PESA, and it lets a renter find a unit, reserve it and see
                    their own payment history.
                </p>
                <p>What it is not, stated plainly so there is no doubt:</p>
                <LegalList
                    items={[
                        "Not an estate agent. We do not inspect properties, value them or represent either side in a tenancy.",
                        "Not a party to your lease. The agreement is between the renter and the landlord; we record it.",
                        "Not a payment service provider, a bank or an escrow. We never hold your money — see the next section.",
                        "Not a source of legal, tax or financial advice. The tax features help a landlord organise their own records; they do not replace an accountant.",
                    ]}
                />
            </LegalSection>

            <LegalSection heading="How money moves">
                <p>
                    This is the most important section on this page.
                </p>
                <LegalList
                    items={[
                        <>
                            <strong className="text-white/90">
                                Rent and reservation deposits are paid into the landlord&apos;s own
                                M-PESA account.
                            </strong>{" "}
                            The payment request is signed with that landlord&apos;s own Safaricom
                            credentials, and the money goes directly to them. RentManager never receives
                            it, holds it or passes it on.
                        </>,
                        <>
                            <strong className="text-white/90">We record the payment.</strong> What the
                            platform adds is the record: what was paid, when, against which unit and
                            lease, with the M-PESA reference. That record is append-only, so neither side
                            can quietly change it later.
                        </>,
                        <>
                            <strong className="text-white/90">Refunds come from the landlord.</strong>{" "}
                            Because we never held the money, we cannot return it. A deposit refund is a
                            payment the landlord makes from their own account; the platform can initiate
                            and record it, but the funds and the decision are theirs.
                        </>,
                        <>
                            <strong className="text-white/90">RentManager charges renters nothing.</strong>{" "}
                            Every amount you are asked to pay through the platform — rent, deposit — is
                            set by your landlord. Landlords pay for their own subscription, at the prices
                            shown in the app.
                        </>,
                    ]}
                />
                <p>
                    If a payment does not appear against your lease, tell your landlord: we can help
                    them trace it against Safaricom&apos;s confirmation and match it to the right
                    account. A payment that never reached the landlord&apos;s account is a matter
                    between the payer and Safaricom.
                </p>
            </LegalSection>

            <LegalSection heading="Accounts">
                <LegalList
                    items={[
                        "You are responsible for keeping your sign-in details private and for what is done through your account. Tell us promptly if you think someone else has access.",
                        "A landlord account is an organisation: the owner can invite managers and staff, and each role can do less than the one above it. Whoever invites someone is responsible for that decision.",
                        "You must be entitled to act for the properties you list, and the details you enter must be true.",
                    ]}
                />
            </LegalSection>

            <LegalSection heading="Listings and their accuracy">
                <p>
                    Listings are written by landlords, and they are responsible for them. What the
                    platform enforces is narrow but real: a unit appears publicly only while it is
                    marked active and has no active lease, and it stops appearing once a lease starts.
                    That is a check on availability, not a verification of the property, the price or
                    the person.
                </p>
                <p>
                    Nothing here permits a false listing, advertising a unit you cannot let, or using
                    the platform to collect money you are not entitled to. Accounts doing so are
                    suspended.
                </p>
            </LegalSection>

            <LegalSection heading="Acceptable use">
                <LegalList
                    items={[
                        "Do not attempt to access data belonging to another landlord organisation or another renter.",
                        "Do not probe, scan or overload the service, or scrape it in bulk.",
                        "Do not upload malware, or content you have no right to upload.",
                        "Do not use RentManager to harass anyone, or for anything unlawful under Kenyan law.",
                    ]}
                />
            </LegalSection>

            <LegalSection heading="Availability">
                <p>
                    We do not promise uninterrupted service. The platform runs on infrastructure that
                    may be restarted, updated or briefly unavailable, and features may change as the
                    product develops. Where a change removes something you rely on, we will say so in
                    the app rather than letting you discover it.
                </p>
                <p>
                    Your records are backed up, and payment history is append-only, so an outage
                    delays access rather than losing it.
                </p>
            </LegalSection>

            <LegalSection heading="Ending it">
                <p>
                    You can stop using RentManager at any time; a landlord can close their
                    organisation. We may suspend an account that breaks these terms, that is being used
                    fraudulently, or where we are required to. Records we are obliged to keep — payment
                    history and the audit trail — survive closure, as explained in the{" "}
                    <Link
                        className="text-jade-300 underline decoration-jade-300/40 hover:decoration-jade-300"
                        href="/legal/privacy"
                    >
                        privacy policy
                    </Link>
                    .
                </p>
            </LegalSection>

            <LegalSection heading="Responsibility and limits">
                <p>
                    RentManager is provided as it is. To the extent Kenyan law allows, we are not
                    liable for losses arising from a tenancy itself — the condition of a property, a
                    dispute over a deposit, or a landlord&apos;s or renter&apos;s conduct — nor for
                    indirect or consequential loss. For a paying landlord, our total liability in any
                    twelve-month period is limited to the subscription fees paid in that period.
                </p>
                <p>
                    Nothing in these terms limits a liability that cannot lawfully be limited,
                    including for fraud.
                </p>
            </LegalSection>

            <LegalSection heading="Governing law">
                <p>
                    These terms are governed by the laws of Kenya, and the courts of Kenya have
                    jurisdiction. Where a dispute can sensibly be settled by talking first, we would
                    rather do that.
                </p>
            </LegalSection>

            <LegalSection heading="Changes and contact">
                <p>
                    When these terms change, the effective date at the top changes with them, and
                    material changes are announced in the app.
                </p>
                <p>
                    {LEGAL_CONTACT_EMAIL ? (
                        <>
                            Questions about these terms:{" "}
                            <a
                                className="text-jade-300 underline decoration-jade-300/40 hover:decoration-jade-300"
                                href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                            >
                                {LEGAL_CONTACT_EMAIL}
                            </a>
                            .
                        </>
                    ) : (
                        <>
                            A contact address for legal questions is being set up. Until it appears
                            here, reach us through the landlord or agency you deal with, or through
                            whoever invited you to RentManager.
                        </>
                    )}
                </p>
            </LegalSection>
        </article>
    );
}
