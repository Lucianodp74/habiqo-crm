import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Fake Supabase client ─────────────────────────────────────────────
// Records every query so the tests can assert exactly what publishProperty
// sends to the database (UPDATE on the existing id, never an INSERT).

type Op = "select" | "update" | "insert" | "upsert" | "delete";
type Call = { table: string; op: Op; payload?: unknown; filters: Array<[string, unknown]> };
type DbError = { code: string; message: string; details?: string; hint?: string };

const db = {
  user: { id: "user-1" } as { id: string } | null,
  property: null as Record<string, unknown> | null,
  membership: null as { role: string } | null,
  agency: { slug: "agenzia-test" } as { slug: string } | null,
  updateError: null as DbError | null,
  calls: [] as Call[],
  /** Concurrency tests: hold every UPDATE until this many property reads happened. */
  holdUpdatesUntilReads: 0,
  propertyReads: 0,
};

let releaseUpdates: () => void = () => {};
let updatesReleased: Promise<void> = Promise.resolve();

/**
 * Same semantics as PostgreSQL for `UPDATE ... WHERE id = $1 AND
 * is_public = false RETURNING slug`: updates are applied one at a time and
 * the condition is checked against the row as it is at that moment.
 */
function applyUpdate(call: Call) {
  if (db.updateError) return { data: null, error: db.updateError };
  const draftOnly = call.filters.some(([c, v]) => c === "is_public" && v === false);
  if (!db.property || (draftOnly && db.property.is_public)) return { data: [], error: null };
  db.property = { ...db.property, ...(call.payload as Record<string, unknown>) };
  return { data: [{ slug: db.property.slug }], error: null };
}

function builder(table: string) {
  const call: Call = { table, op: "select", filters: [] };
  db.calls.push(call);
  const result = async () => {
    if (call.op === "update") {
      await updatesReleased;
      return applyUpdate(call);
    }
    if (table === "properties") {
      // a snapshot, like a row read before another transaction commits
      const snapshot = db.property ? { ...db.property } : null;
      db.propertyReads += 1;
      if (db.holdUpdatesUntilReads && db.propertyReads >= db.holdUpdatesUntilReads)
        releaseUpdates();
      return { data: snapshot, error: null };
    }
    if (table === "agency_members") return { data: db.membership, error: null };
    if (table === "agencies") return { data: db.agency, error: null };
    return { data: null, error: null };
  };
  const b = {
    select: () => b,
    update: (payload: unknown) => {
      call.op = "update";
      call.payload = payload;
      return b;
    },
    insert: (payload: unknown) => {
      call.op = "insert";
      call.payload = payload;
      return b;
    },
    upsert: (payload: unknown) => {
      call.op = "upsert";
      call.payload = payload;
      return b;
    },
    delete: () => {
      call.op = "delete";
      return b;
    },
    eq: (col: string, val: unknown) => {
      call.filters.push([col, val]);
      return b;
    },
    maybeSingle: () => result(),
    single: () => result(),
    // biome-ignore lint/suspicious/noThenProperty: mimics the awaitable Supabase query builder
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      result().then(resolve, reject),
  };
  return b;
}

const notify = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: db.user } }) },
    from: (table: string) => builder(table),
  }),
}));
vi.mock("@/lib/email/send-match-notification", () => ({
  sendMatchNotificationForProperty: (...args: unknown[]) => notify(...args),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { publishProperty } = await import("./publish-property");

const DB_SLUG_CHECK = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])?$/;
const DRAFT_ID = "11111111-2222-4333-8444-555555555555";
const LONG_TITLE = "Appartamento luminoso con doppi servizi vicino al lungomare";

const updates = () => db.calls.filter((c) => c.op === "update");
const writesOtherThanUpdate = () =>
  db.calls.filter((c) => c.op === "insert" || c.op === "upsert" || c.op === "delete");

let errorLog: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  db.user = { id: "user-1" };
  db.property = {
    id: DRAFT_ID,
    agency_id: "agency-1",
    title: LONG_TITLE,
    slug: null,
    is_public: false,
    city: "Taranto",
    price_eur: 150000,
    rooms: 3,
    sqm: 90,
    listing_type: "sale",
  };
  db.membership = { role: "agent" };
  db.agency = { slug: "agenzia-test" };
  db.updateError = null;
  db.calls = [];
  db.holdUpdatesUntilReads = 0;
  db.propertyReads = 0;
  updatesReleased = Promise.resolve();
  notify.mockReset();
  errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorLog.mockRestore();
});

describe("publishProperty: publishing an existing draft", () => {
  it("updates the existing row by id and never inserts a new property", async () => {
    const res = await publishProperty({ propertyId: DRAFT_ID });

    expect(res.ok).toBe(true);
    expect(updates()).toHaveLength(1);
    const [update] = updates();
    expect(update?.table).toBe("properties");
    expect(update?.filters).toEqual([
      ["id", DRAFT_ID],
      ["is_public", false],
    ]);
    expect(update?.payload).toMatchObject({ status: "active", is_public: true });
    expect(writesOtherThanUpdate()).toEqual([]);
  });

  it("generates a DB-compatible slug from a long title without touching the title", async () => {
    const res = await publishProperty({ propertyId: DRAFT_ID });
    const payload = updates()[0]?.payload as Record<string, unknown>;

    expect(typeof payload.slug).toBe("string");
    expect((payload.slug as string).length).toBeLessThanOrEqual(60);
    expect(payload.slug).toMatch(DB_SLUG_CHECK);
    expect(payload).not.toHaveProperty("title");
    expect(res).toEqual({
      ok: true,
      data: { propertyId: DRAFT_ID, propertySlug: payload.slug, agencySlug: "agenzia-test" },
    });
  });

  it("keeps a slug the draft already has", async () => {
    db.property = { ...db.property, slug: "slug-esistente-abcde" };
    await publishProperty({ propertyId: DRAFT_ID });
    expect((updates()[0]?.payload as Record<string, unknown>).slug).toBe("slug-esistente-abcde");
  });

  it("notifies matching leads once", async () => {
    await publishProperty({ propertyId: DRAFT_ID });
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("does nothing on an already public property (no second publication)", async () => {
    db.property = { ...db.property, is_public: true, slug: "gia-pubblicato-abcde" };
    const res = await publishProperty({ propertyId: DRAFT_ID });

    expect(res).toEqual({
      ok: true,
      data: {
        propertyId: DRAFT_ID,
        propertySlug: "gia-pubblicato-abcde",
        agencySlug: "agenzia-test",
      },
    });
    expect(updates()).toHaveLength(0);
    expect(notify).not.toHaveBeenCalled();
  });
});

describe("publishProperty: creation wizard (step 4) keeps working", () => {
  it("applies the optional step-4 fields in the same UPDATE, as before", async () => {
    const res = await publishProperty({
      propertyId: DRAFT_ID,
      address: " Via Roma 1 ",
      postalCode: "74121",
      region: "Puglia",
      floor: 2,
      hasElevator: true,
      hasGarage: false,
      energyClass: "B",
    });

    expect(res.ok).toBe(true);
    expect(updates()).toHaveLength(1);
    expect(updates()[0]?.payload).toMatchObject({
      status: "active",
      is_public: true,
      address: "Via Roma 1",
      postal_code: "74121",
      region: "Puglia",
      floor: 2,
      has_elevator: true,
      has_garage: false,
      energy_class: "B",
    });
    expect(writesOtherThanUpdate()).toEqual([]);
  });

  it("leaves out empty optional fields", async () => {
    await publishProperty({ propertyId: DRAFT_ID, address: "  ", floor: null, hasElevator: null });
    const payload = updates()[0]?.payload as Record<string, unknown>;
    expect(payload).not.toHaveProperty("address");
    expect(payload).not.toHaveProperty("floor");
    expect(payload).not.toHaveProperty("has_elevator");
  });
});

describe("publishProperty: authorization (server side)", () => {
  it("rejects a viewer of the agency", async () => {
    db.membership = { role: "viewer" };
    const res = await publishProperty({ propertyId: DRAFT_ID });
    expect(res).toMatchObject({ ok: false, error: { code: "forbidden" } });
    expect(updates()).toHaveLength(0);
  });

  it("rejects a user who is not a member of the property's agency", async () => {
    db.membership = null;
    const res = await publishProperty({ propertyId: DRAFT_ID });
    expect(res).toMatchObject({ ok: false, error: { code: "forbidden" } });
    expect(updates()).toHaveLength(0);
  });

  it("allows owner and admin as well as agent", async () => {
    for (const role of ["owner", "admin", "agent"]) {
      db.calls = [];
      db.membership = { role };
      const res = await publishProperty({ propertyId: DRAFT_ID });
      expect(res.ok).toBe(true);
    }
  });

  it("returns not_found when the property is not visible to the user (RLS)", async () => {
    db.property = null;
    const res = await publishProperty({ propertyId: DRAFT_ID });
    expect(res).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(updates()).toHaveLength(0);
  });

  it("requires a session", async () => {
    db.user = null;
    const res = await publishProperty({ propertyId: DRAFT_ID });
    expect(res).toMatchObject({ ok: false, error: { code: "unauthenticated" } });
    expect(db.calls).toHaveLength(0);
  });
});

describe("publishProperty: database errors", () => {
  const SQL_WORDS = /constraint|violates|properties_|sql|23514|23505|row/i;

  it("turns a check violation (23514) into a clear message without SQL details", async () => {
    db.updateError = {
      code: "23514",
      message:
        'new row for relation "properties" violates check constraint "properties_slug_format_chk"',
      details: "Failing row contains (...)",
    };
    const res = await publishProperty({ propertyId: DRAFT_ID });

    expect(res).toMatchObject({ ok: false, error: { code: "validation_error" } });
    if (!res.ok) expect(res.error.message).not.toMatch(SQL_WORDS);
    expect(errorLog).toHaveBeenCalledWith(
      "publishProperty: update failed",
      expect.objectContaining({ code: "23514", propertyId: DRAFT_ID }),
    );
    expect(notify).not.toHaveBeenCalled();
  });

  it("turns a unique violation (23505) into a 'try again' conflict message", async () => {
    db.updateError = {
      code: "23505",
      message: 'duplicate key value violates unique constraint "uniq_properties_agency_slug"',
    };
    const res = await publishProperty({ propertyId: DRAFT_ID });

    expect(res).toMatchObject({ ok: false, error: { code: "conflict" } });
    if (!res.ok) expect(res.error.message).not.toMatch(SQL_WORDS);
  });

  it("keeps the generic message for any other error", async () => {
    db.updateError = { code: "XX000", message: "internal error" };
    const res = await publishProperty({ propertyId: DRAFT_ID });
    expect(res).toEqual({
      ok: false,
      error: { code: "unknown", message: "Errore nella pubblicazione. Riprova." },
    });
  });
});

describe("publishProperty: two concurrent publications of the same draft", () => {
  /** Both requests read the draft (still private) before either one updates it. */
  function startTogether() {
    db.holdUpdatesUntilReads = 2;
    updatesReleased = new Promise<void>((resolve) => {
      releaseUpdates = resolve;
    });
  }

  it("only one request performs the transition and notifies; both get the same slug", async () => {
    startTogether();
    const [a, b] = await Promise.all([
      publishProperty({ propertyId: DRAFT_ID }),
      publishProperty({ propertyId: DRAFT_ID }),
    ]);

    expect(a.ok && b.ok).toBe(true);
    const storedSlug = db.property?.slug as string;
    expect(storedSlug).toMatch(DB_SLUG_CHECK);
    if (a.ok && b.ok) {
      expect(a.data.propertySlug).toBe(storedSlug);
      expect(b.data.propertySlug).toBe(storedSlug);
    }
    expect(notify).toHaveBeenCalledTimes(1);
    // both tried with their own generated slug, only one was written
    const slugsTried = updates().map((u) => (u.payload as { slug: string }).slug);
    expect(slugsTried).toHaveLength(2);
    expect(slugsTried[0]).not.toBe(slugsTried[1]);
    expect(slugsTried).toContain(storedSlug);
  });

  it("the second request does not overwrite the step-4 data saved by the first", async () => {
    startTogether();
    await Promise.all([
      publishProperty({ propertyId: DRAFT_ID, address: "Via Roma 1", energyClass: "B" }),
      publishProperty({ propertyId: DRAFT_ID, address: "Via Sbagliata 99", energyClass: "G" }),
    ]);
    expect(db.property).toMatchObject({
      address: "Via Roma 1",
      energy_class: "B",
      is_public: true,
    });
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("a request that finds the draft already published (no row updated) does not notify", async () => {
    // the draft is published by someone else between the read and the update
    db.holdUpdatesUntilReads = 1;
    updatesReleased = new Promise<void>((resolve) => {
      releaseUpdates = () => {
        db.property = {
          ...db.property,
          is_public: true,
          status: "active",
          slug: "pubblicato-altrove-abcde",
        };
        resolve();
      };
    });
    const res = await publishProperty({ propertyId: DRAFT_ID });
    expect(res).toEqual({
      ok: true,
      data: {
        propertyId: DRAFT_ID,
        propertySlug: "pubblicato-altrove-abcde",
        agencySlug: "agenzia-test",
      },
    });
    expect(db.property?.slug).toBe("pubblicato-altrove-abcde");
    expect(updates()).toHaveLength(1); // the update ran and changed no row
    expect(notify).not.toHaveBeenCalled();
  });

  it("no row updated and the property is not public: generic error, no notification", async () => {
    db.holdUpdatesUntilReads = 1;
    updatesReleased = new Promise<void>((resolve) => {
      releaseUpdates = () => {
        db.property = null; // deleted or hidden meanwhile
        resolve();
      };
    });
    const res = await publishProperty({ propertyId: DRAFT_ID });
    expect(res).toEqual({
      ok: false,
      error: { code: "unknown", message: "Errore nella pubblicazione. Riprova." },
    });
    expect(updates()).toHaveLength(1);
    expect(notify).not.toHaveBeenCalled();
  });
});
