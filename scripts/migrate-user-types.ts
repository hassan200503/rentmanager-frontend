// scripts/migrate-user-types.ts
//
// ONE-TIME metadata backfill: assigns publicMetadata.userType to every
// existing Clerk user, based on backend database truth.
//
// ⚠️  This script is NOT the ongoing sync mechanism — the backend writes
// userType at every state transition from then on (see BACKEND_HARDENING_PLAN).
//
// TRUTH SOURCES (choose one, by priority):
//   1. --source <file.json>   Backend identity snapshot:
//                             [{ "clerkUserId": "user_…", "userType": "renter" }]
//   2. --backend <url>        Fetches GET {url}/api/v1/admin/identity/users
//      --token <jwt>          (backend admin endpoint, see hardening plan)
//   3. (none)                 CLERK-ONLY HEURISTIC — flags WARNING:
//                             user has org memberships → landlord, else
//                             renter. Approximate ONLY; prefer 1 or 2.
//
// SAFETY:
//   - Defaults to DRY-RUN. Pass --apply to write.
//   - Never overwrites a userType that is already set (idempotent).
//   - Refuses to run without CLERK_SECRET_KEY.
//
// USAGE:
//   npx tsx scripts/migrate-user-types.ts --source identity-snapshot.json --apply
//   node --experimental-strip-types scripts/migrate-user-types.ts --apply

const CLERK_API = "https://api.clerk.com/v1";
const PAGE_SIZE = 500;

// ── helpers ────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
    const idx = process.argv.indexOf(name);
    return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const hasFlag = (name: string) => process.argv.includes(name);
const APPLY = hasFlag("--apply");

function log(msg: string) {
    console.log(`[${APPLY ? "APPLY" : "DRY-RUN"}] ${msg}`);
}

async function clerkRequest<T>(path: string, secretKey: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${CLERK_API}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Clerk API ${init?.method ?? "GET"} ${path} -> ${res.status}: ${body.slice(0, 300)}`);
    }
    return res.json() as Promise<T>;
}

interface ClerkUser {
    id: string;
    public_metadata?: Record<string, unknown>;
}

interface ClerkOrgMembership {
    organization?: { id: string };
}

const USER_TYPES = new Set(["renter", "landlord_pending", "landlord", "admin"]);

async function listAllUsers(secretKey: string): Promise<ClerkUser[]> {
    const users: ClerkUser[] = [];
    let offset = 0;
    for (;;) {
        const page = await clerkRequest<ClerkUser[]>(
            `/users?limit=${PAGE_SIZE}&offset=${offset}`,
            secretKey
        );
        users.push(...page);
        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
    }
    return users;
}

async function userHasOrg(secretKey: string, userId: string): Promise<boolean> {
    const memberships = await clerkRequest<ClerkOrgMembership[]>(
        `/users/${userId}/organization_memberships?limit=1`,
        secretKey
    );
    return memberships.length > 0;
}

/** Clerks-only heuristic; approximate. Prefer a backend-derived truth map. */
async function heuristicTruth(secretKey: string, users: ClerkUser[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    for (const user of users) {
        map.set(user.id, (await userHasOrg(secretKey, user.id)) ? "landlord" : "renter");
    }
    return map;
}

async function loadSourceTruth(file: string): Promise<Map<string, string>> {
    const fs = await import("node:fs");
    const raw = fs.readFileSync(file, "utf8");
    const rows = JSON.parse(raw) as { clerkUserId: string; userType: string }[];
    const map = new Map<string, string>();
    for (const row of rows) {
        if (!row.clerkUserId || !USER_TYPES.has(row.userType)) {
            throw new Error(`Invalid snapshot row: ${JSON.stringify(row)}`);
        }
        map.set(row.clerkUserId, row.userType);
    }
    return map;
}

async function fetchBackendTruth(url: string, token: string): Promise<Map<string, string>> {
    const res = await fetch(`${url.replace(/\/$/, "")}/api/v1/admin/identity/users`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Backend identity endpoint -> ${res.status}: ${await res.text()}`);
    // Backend wraps in ApiResponse<T>: { success, message, data: [...], errorCode, timestamp }
    const envelope = (await res.json()) as {
        success?: boolean;
        data?: { clerkUserId: string; userType: string }[];
    };
    if (!envelope?.success || !Array.isArray(envelope.data)) {
        throw new Error(`Backend identity endpoint returned an unexpected shape`);
    }
    const rows = envelope.data;
    const map = new Map<string, string>();
    for (const row of rows) {
        if (!row.clerkUserId || !USER_TYPES.has(row.userType)) {
            throw new Error(`Invalid backend row: ${JSON.stringify(row)}`);
        }
        map.set(row.clerkUserId, row.userType);
    }
    return map;
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
    const secretKey = arg("--secret") ?? process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
        console.error("CLERK_SECRET_KEY required (env or --secret). Refusing to run.");
        process.exit(1);
    }

    const sourceFile = arg("--source");
    const backendUrl = arg("--backend");
    const backendToken = arg("--token");

    console.log("Fetching all Clerk users…");
    const users = await listAllUsers(secretKey);
    console.log(`  → ${users.length} users found`);

    let truth: Map<string, string>;
    if (sourceFile) {
        truth = await loadSourceTruth(sourceFile);
        console.log(`Truth: snapshot file ${sourceFile} (${truth.size} rows)`);
    } else if (backendUrl && backendToken) {
        truth = await fetchBackendTruth(backendUrl, backendToken);
        console.log(`Truth: backend ${backendUrl} (${truth.size} rows)`);
    } else {
        console.warn(
            "⚠️  No --source or --backend provided — using Clerk-only HEURISTIC " +
                "(org membership → landlord, else renter). Approximate; prefer a backend snapshot."
        );
        truth = await heuristicTruth(secretKey, users);
    }

    let seeded = 0;
    let skipped = 0;
    let noTruth = 0;
    const failures: string[] = [];

    for (const user of users) {
        const desired = truth.get(user.id);
        if (!desired) {
            noTruth++;
            log(`NO TRUTH for ${user.id} — skipping (review manually)`);
            continue;
        }
        const existing = user.public_metadata?.userType;
        if (typeof existing === "string" && existing.length > 0) {
            if (existing !== desired) {
                log(`DIFFERS ${user.id}: metadata=${existing} truth=${desired} (backend authority — skipping, inspect)`);
            }
            skipped++;
            continue;
        }
        seeded++;
        log(`seed ${user.id} → ${desired}`);
        if (APPLY) {
            try {
                await clerkRequest(`/users/${user.id}/metadata`, secretKey, {
                    method: "PATCH",
                    body: JSON.stringify({
                        public_metadata: { ...(user.public_metadata ?? {}), userType: desired },
                    }),
                });
            } catch (e) {
                failures.push(`${user.id}: ${(e as Error).message}`);
            }
        }
    }

    console.log("\n── Summary ────────────────────────────────");
    console.log(`Total users        : ${users.length}`);
    console.log(`Seeded (would)     : ${seeded}`);
    console.log(`Skipped (already)  : ${skipped}`);
    console.log(`No truth record    : ${noTruth}`);
    console.log(`Failures           : ${failures.length}`);
    if (failures.length) {
        console.log(failures.join("\n"));
    }
    if (!APPLY) {
        console.log("\nDry run complete. Re-run with --apply to write.");
    }
}

main().catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
});
