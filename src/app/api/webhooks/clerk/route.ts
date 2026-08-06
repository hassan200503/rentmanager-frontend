// app/api/webhooks/clerk/route.ts
//
// Clerk webhook endpoint (Standard Webhooks, verified via @clerk/backend).
//
// Responsibility — METADATA SEEDING ONLY. The backend (Java) is the
// authoritative writer of publicMetadata.userType (it owns every state
// transition). This endpoint:
//
//   user.created:
//     Seeds userType from sign-up intent (renter | landlord_pending) ONLY
//     when userType is absent — it never overwrites a backend promotion.
//   organizationMembership.created:
//     Advisory seed: an unclassified user who joined an org is seeded
//     landlord_pending (routes them toward onboarding). The backend still
//     owns the definitive landlord promotion.
//   session.created:
//     No writes. Logged for integrity observability only.
//
// Configure in the Clerk Dashboard → Webhooks → Endpoints:
//   URL:  https://<app>/api/webhooks/clerk
//   Events: user.created, organizationMembership.created, session.created
//   Signing secret: CLERK_WEBHOOK_SIGNING_SECRET (see .env.example)
//
// Idempotent by design: replayed events are no-ops because seeding only
// happens on absent userType.

import { verifyWebhook } from "@clerk/backend/webhooks";
import { createClerkClient } from "@clerk/backend";
import { NextResponse } from "next/server";
import {
    shouldSeedUserType,
    resolveInitialUserType,
} from "@/lib/auth/webhooks/user-type-seed";
import { USER_TYPE_METADATA_KEY } from "@/lib/auth/clerk-metadata";
import type { UserTypeSeedResult } from "@/lib/auth/webhooks/user-type-seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEBHOOK_SECRET =
    process.env.CLERK_WEBHOOK_SIGNING_SECRET ?? process.env.CLERK_WEBHOOK_SECRET;

export async function POST(request: Request) {
    if (!WEBHOOK_SECRET) {
        console.error(
            JSON.stringify({
                event: "webhook.misconfigured",
                detail: "CLERK_WEBHOOK_SIGNING_SECRET is not set — refusing to process webhooks.",
            })
        );
        return NextResponse.json(
            { success: false, error: "Webhook signing secret not configured" },
            { status: 500 }
        );
    }

    let payload: unknown;
    try {
        payload = await verifyWebhook(request, { signingSecret: WEBHOOK_SECRET });
    } catch {
        // Signature/timestamp invalid — never process an unverified event.
        return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }

    const eventType = (payload as { type?: string })?.type;
    const data = (payload as { data?: Record<string, unknown> })?.data ?? {};
    const userId = data.id as string | undefined;

    if (!userId) {
        return NextResponse.json({ success: false, error: "Missing user id" }, { status: 400 });
    }

    const results: UserTypeSeedResult[] = [];

    try {
        if (eventType === "user.created") {
            const userType = resolveInitialUserType(data.unsafeMetadata);
            if (userType !== null) {
                results.push(
                    await seedUserType({ userId, userType, eventType: "user.created" })
                );
            }
        } else if (eventType === "organizationMembership.created") {
            const memberUserId = (data.public_user_data as { user_id?: string } | undefined)
                ?.user_id;
            if (memberUserId) {
                results.push(
                    await seedUserType({
                        userId: memberUserId,
                        userType: "landlord_pending",
                        eventType: "organizationMembership.created",
                    })
                );
            }
        } else if (eventType === "session.created") {
            const sessionUser = data.user as
                | { public_metadata?: Record<string, unknown> }
                | undefined;
            console.info(
                JSON.stringify({
                    event: "webhook.session.created",
                    userId,
                    hasUserTypeClaim:
                        typeof sessionUser?.public_metadata?.[USER_TYPE_METADATA_KEY] ===
                        "string",
                })
            );
        }
    } catch (error) {
        console.error(
            JSON.stringify({
                event: "webhook.processing_failed",
                type: eventType,
                userId,
            }),
            error
        );
        return NextResponse.json({ success: false, error: "Processing failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, results });
}

/**
 * Seeds userType only when absent (idempotent, never stomps backend writes).
 * Returns the seed result summary.
 */
async function seedUserType(input: {
    userId: string;
    userType: "renter" | "landlord_pending";
    eventType: "user.created" | "organizationMembership.created";
}): Promise<UserTypeSeedResult> {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    const user = await clerk.users.getUser(input.userId);
    if (!shouldSeedUserType(user.publicMetadata, input.userType)) {
        return {
            userId: input.userId,
            seeded: false,
            userType: input.userType,
            reason: input.eventType,
        };
    }

    await clerk.users.updateUserMetadata(input.userId, {
        publicMetadata: {
            ...user.publicMetadata,
            [USER_TYPE_METADATA_KEY]: input.userType,
        },
    });

    console.info(
        JSON.stringify({
            event: "webhook.user_type_seeded",
            userId: input.userId,
            userType: input.userType,
            source: input.eventType,
        })
    );

    return {
        userId: input.userId,
        seeded: true,
        userType: input.userType,
        reason: input.eventType,
    };
}
