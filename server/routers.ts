import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getSql } from "./lib/db";
import { fetchMetaInsights } from "./lib/metaApi";
import { fetchGhlLeadCount } from "./lib/ghlApi";
import { calculateCpl } from "./lib/cplCalculator";
import { resolveDateRange } from "./lib/dateUtils";
import pLimit from "p-limit";
import { validateCredentials, signLocalJwt } from "./lib/localAuth";
import { TRPCError } from "@trpc/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientRow {
  id: number;
  name: string;
  slug: string | null;
  metaAdAccountId: string | null;
  metaPageId: string | null;
  metaPixelId: string | null;
  ghlLocationId: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SettingsRow {
  id: number;
  metaAccessToken: string | null;
  ghlAgencyToken: string | null;
  ghlCompanyId: string | null;
  cplGreenMax: string;
  cplOrangeMax: string;
  updatedAt: Date;
}

// ─── Helper: mask token ───────────────────────────────────────────────────────

function maskToken(token: string | null): string | null {
  if (!token || token.length < 8) return token ? '••••••••' : null;
  return `••••••••${token.slice(-8)}`;
}

// ─── Settings Router ──────────────────────────────────────────────────────────

const settingsRouter = router({
  get: protectedProcedure.query(async () => {
    const sql = getSql();
    const rows = await sql<SettingsRow[]>`SELECT * FROM settings WHERE id = 1 LIMIT 1`;
    const s = rows[0];
    if (!s) return null;
    return {
      id: s.id,
      metaAccessToken: maskToken(s.metaAccessToken),
      ghlAgencyToken: maskToken(s.ghlAgencyToken),
      ghlCompanyId: s.ghlCompanyId,
      cplGreenMax: parseFloat(s.cplGreenMax),
      cplOrangeMax: parseFloat(s.cplOrangeMax),
      updatedAt: s.updatedAt,
    };
  }),

  update: protectedProcedure
    .input(z.object({ field: z.string(), value: z.string() }))
    .mutation(async ({ input }) => {
      const allowed = [
        'metaAccessToken',
        'ghlAgencyToken',
        'ghlCompanyId',
        'cplGreenMax',
        'cplOrangeMax',
      ];
      if (!allowed.includes(input.field)) {
        throw new Error(`Field "${input.field}" is not updatable`);
      }
      const sql = getSql();
      await sql`
        UPDATE settings
        SET ${sql({ [input.field]: input.value, updatedAt: new Date() })}
        WHERE id = 1
      `;
      return { success: true };
    }),
});

// ─── Clients Router ───────────────────────────────────────────────────────────

const clientsRouter = router({
  list: protectedProcedure.query(async () => {
    const sql = getSql();
    const rows = await sql<ClientRow[]>`
      SELECT id, name, slug, "metaAdAccountId", "metaPageId", "metaPixelId",
             "ghlLocationId", "isActive", notes, "createdAt", "updatedAt"
      FROM clients
      WHERE "isActive" = true
      ORDER BY name ASC
    `;
    return rows;
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().optional(),
      metaAdAccountId: z.string().optional(),
      metaPageId: z.string().optional(),
      metaPixelId: z.string().optional(),
      ghlLocationId: z.string().optional(),
      ghlPrivateToken: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const sql = getSql();
      const rows = await sql`
        INSERT INTO clients (name, slug, "metaAdAccountId", "metaPageId", "metaPixelId",
                             "ghlLocationId", "ghlPrivateToken", notes)
        VALUES (
          ${input.name},
          ${input.slug ?? null},
          ${input.metaAdAccountId ?? null},
          ${input.metaPageId ?? null},
          ${input.metaPixelId ?? null},
          ${input.ghlLocationId ?? null},
          ${input.ghlPrivateToken ?? null},
          ${input.notes ?? null}
        )
        RETURNING id, name, slug, "metaAdAccountId", "metaPageId", "metaPixelId",
                  "ghlLocationId", "isActive", notes, "createdAt", "updatedAt"
      `;
      return rows[0];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      slug: z.string().optional(),
      metaAdAccountId: z.string().optional(),
      metaPageId: z.string().optional(),
      metaPixelId: z.string().optional(),
      ghlLocationId: z.string().optional(),
      ghlPrivateToken: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const sql = getSql();
      const { id, ...fields } = input;
      const updateData: Record<string, unknown> = { ...fields, updatedAt: new Date() };
      await sql`
        UPDATE clients
        SET ${sql(updateData)}
        WHERE id = ${id}
      `;
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const sql = getSql();
      await sql`
        UPDATE clients SET "isActive" = false, "updatedAt" = NOW()
        WHERE id = ${input.id}
      `;
      return { success: true };
    }),
});

// ─── Insights Router (with 1-hour cache) ─────────────────────────────────────

export interface ClientInsight {
  clientId: number;
  clientName: string;
  spend: number;
  leads: number;
  cpl: number | null;
  cplColor: 'green' | 'orange' | 'red' | 'gray';
  ctr: number;
  impressions: number;
  dateRange: string;
  error?: string;
}

const insightsRouter = router({
  get: protectedProcedure
    .input(z.object({
      datePreset: z.string().optional(),
      since: z.number().optional(),
      until: z.number().optional(),
      bust: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const sql = getSql();
      const { datePreset, since, until, bust } = input;

      // Build cache key
      const cacheKey = datePreset
        ? `insights:${datePreset}`
        : `insights:custom:${since}:${until}`;

      // ── Cache check ────────────────────────────────────────────────────────
      if (!bust) {
        const cached = await sql<{ data: ClientInsight[]; fetchedAt: Date }[]>`
          SELECT data, "fetchedAt"
          FROM insights_cache
          WHERE "cacheKey" = ${cacheKey}
          LIMIT 1
        `;
        if (cached.length > 0) {
          const ageMs = Date.now() - new Date(cached[0].fetchedAt).getTime();
          if (ageMs < 60 * 60 * 1000) {
            // Handle both native JSONB array and legacy string-encoded data
            const rawData = cached[0].data;
            const parsedData: ClientInsight[] = Array.isArray(rawData)
              ? rawData
              : typeof rawData === 'string'
              ? (JSON.parse(rawData) as ClientInsight[])
              : [];
            return { data: parsedData, fromCache: true, cachedAt: cached[0].fetchedAt };
          }
        }
      }

      // ── Live fetch ─────────────────────────────────────────────────────────

      const settingsRows = await sql<SettingsRow[]>`SELECT * FROM settings WHERE id = 1 LIMIT 1`;
      const settings = settingsRows[0];
      if (!settings?.metaAccessToken) {
        throw new Error('Meta Access Token is not configured. Please add it in Settings.');
      }

      const greenMax = parseFloat(settings.cplGreenMax) || 35;
      const orangeMax = parseFloat(settings.cplOrangeMax) || 50;

      const dateRange = resolveDateRange(datePreset, since, until);
      const dateRangeLabel = datePreset || `${dateRange.sinceStr} – ${dateRange.untilStr}`;

      // Fetch all active clients (including ghlPrivateToken server-side only)
      const clients = await sql<(ClientRow & { ghlPrivateToken: string | null })[]>`
        SELECT id, name, slug, "metaAdAccountId", "ghlLocationId", "ghlPrivateToken"
        FROM clients
        WHERE "isActive" = true
        ORDER BY name ASC
      `;

      const limit = pLimit(10);

      const results = await Promise.all(
        clients.map((client) =>
          limit(async (): Promise<ClientInsight> => {
            try {
              let spend = 0;
              let impressions = 0;
              let ctr = 0;

              if (client.metaAdAccountId && settings.metaAccessToken) {
                const metaOpts = datePreset
                  ? { datePreset }
                  : { since: dateRange.sinceStr, until: dateRange.untilStr };

                const metaResult = await fetchMetaInsights(
                  client.metaAdAccountId,
                  settings.metaAccessToken,
                  metaOpts
                );
                spend = metaResult.totalSpend;
                impressions = metaResult.totalImpressions;
                ctr = metaResult.weightedCtr;
              }

              let leads = 0;
              if (client.ghlLocationId && client.ghlPrivateToken) {
                leads = await fetchGhlLeadCount(
                  client.ghlLocationId,
                  client.ghlPrivateToken,
                  dateRange.sinceMs,
                  dateRange.untilMs
                );
              }

              const { cpl, color } = calculateCpl(spend, leads, greenMax, orangeMax);

              return {
                clientId: client.id,
                clientName: client.name,
                spend,
                leads,
                cpl,
                cplColor: color,
                ctr,
                impressions,
                dateRange: dateRangeLabel,
              };
            } catch (err) {
              return {
                clientId: client.id,
                clientName: client.name,
                spend: 0,
                leads: 0,
                cpl: null,
                cplColor: 'gray',
                ctr: 0,
                impressions: 0,
                dateRange: dateRangeLabel,
                error: err instanceof Error ? err.message : 'Unknown error',
              };
            }
          })
        )
      );

      // Sort by CPL descending (worst first); null/gray at bottom
      const sorted = [...results].sort((a, b) => {
        if (a.cpl === null && b.cpl === null) return 0;
        if (a.cpl === null) return 1;
        if (b.cpl === null) return -1;
        return b.cpl - a.cpl;
      });

      // Store in cache — use sql.json() to store as native JSONB array, not a string
      await sql`
        INSERT INTO insights_cache ("cacheKey", data, "fetchedAt")
        VALUES (${cacheKey}, ${sql.json(sorted as any)}, NOW())
        ON CONFLICT ("cacheKey")
        DO UPDATE SET data = EXCLUDED.data, "fetchedAt" = NOW()
      `;

      return { data: sorted, fromCache: false, cachedAt: new Date() };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const user = validateCredentials(input.username, input.password);
        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid username or password',
          });
        }
        const token = await signLocalJwt(user);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        });
        return { success: true, user } as const;
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  settings: settingsRouter,
  clients: clientsRouter,
  insights: insightsRouter,
});

export type AppRouter = typeof appRouter;
