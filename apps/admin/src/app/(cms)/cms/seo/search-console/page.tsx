/**
 * Search Console (CMS SEO Operations design). Live performance from the Google Search Console API for the
 * configured property: the four Search Console metrics in Google's own colours (clicks blue, impressions
 * purple, CTR teal, position orange), selectable on the chart with a period-over-period compare, plus the
 * real top queries, device split and country split. The date range uses the same selectable pattern as the
 * CMS dashboard overview. Falls back to the cms_metric_daily mirror when Google is not connected, and says
 * which it is showing. CMS access only. Responsive to 360px.
 */
import type { ReactNode } from "react";
import { MousePointerClick, Eye, Percent, TrendingUp, Search as SearchIcon, Sparkles, EyeOff } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import {
  fetchGscLatestDays, fetchGscByDimension, fetchGscSearchAppearance, isAiAppearance, appearanceLabel,
} from "../../../../../lib/google/gsc.js";
import { GscScopeFilter } from "../../../../../components/cms/GscScopeFilter.js";
import { GSC_RANGES, GSC_COLORS, resolveRange } from "../../../../../lib/google/gsc-constants.js";
import { RangeFilter } from "../../../../../components/cms/RangeFilter.js";
import { SearchConsolePanel, type GscDay } from "../../../../../components/cms/SearchConsolePanel.js";

export const dynamic = "force-dynamic";

const fmt = (n: number): string => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(Math.round(n)));
const dayLabel = (isoDate: string): string => new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
const pctChange = (cur: number, prev: number): number => (prev > 0 ? ((cur - prev) / prev) * 100 : 0);
const sum = (rows: GscDay[], key: "clicks" | "impressions"): number => rows.reduce((s, r) => s + r[key], 0);
const avg = (rows: GscDay[], key: "position"): number => (rows.length ? rows.reduce((s, r) => s + r[key], 0) / rows.length : 0);

const DEVICE_COLORS: Record<string, string> = { DESKTOP: GSC_COLORS.clicks, MOBILE: GSC_COLORS.impressions, TABLET: "#B39DDB" };

/**
 * Search Console reports countries as lowercase ISO-3166-1 alpha-3. Intl names regions from alpha-2, so
 * the codes are mapped explicitly and anything unrecognised falls back to the code itself.
 *
 * This replaces a version that took the first two letters of the alpha-3 code, which is right often
 * enough to look correct and wrong in ways that matter: Ireland (irl) was labelled Iran, the UAE (are)
 * was Argentina, China (chn) was Switzerland and Pakistan (pak) was Panama.
 */
const ALPHA3_TO_2: Record<string, string> = {
  nga: "NG", usa: "US", gbr: "GB", gha: "GH", zaf: "ZA", ken: "KE", can: "CA", ind: "IN",
  deu: "DE", fra: "FR", esp: "ES", ita: "IT", nld: "NL", irl: "IE", are: "AE", aus: "AU",
  bra: "BR", chn: "CN", egy: "EG", jpn: "JP", mar: "MA", pak: "PK", phl: "PH", sau: "SA",
  sen: "SN", sgp: "SG", tza: "TZ", uga: "UG", zwe: "ZW", civ: "CI", cmr: "CM", eth: "ET",
};
function countryName(code: string): string {
  const two = ALPHA3_TO_2[code.toLowerCase()];
  if (!two) return code.toUpperCase();
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(two) ?? two;
  } catch {
    return two;
  }
}

export default async function SearchConsolePage({ searchParams }: { searchParams: Promise<{ range?: string; country?: string; page?: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const sp = await searchParams;
  const activeRange = resolveRange(sp.range);
  const days = activeRange.days;

  // The narrowing goes into the API request, so every figure on the screen describes the same scope.
  // Applying it to the returned rows instead would re-rank a top ten that was itself chosen from the
  // unfiltered property.
  const scope = {
    ...(sp.country ? { country: sp.country } : {}),
    ...(sp.page ? { page: sp.page } : {}),
  };
  const scoped = Boolean(sp.country || sp.page);

  // Live Google data where possible; the local mirror otherwise. Both windows are fetched so the compare
  // toggle always has an equal-length previous period.
  //
  // The country list for the picker is deliberately unscoped: it has to keep offering every country the
  // property has traffic for, or selecting one would leave the picker with only that one country in it.
  const [live, queries, devices, countries, allCountries, appearances] = await Promise.all([
    fetchGscLatestDays(days * 2, scope),
    fetchGscByDimension("query", days, 10, scope),
    fetchGscByDimension("device", days, 5, scope),
    fetchGscByDimension("country", days, 6, scope),
    fetchGscByDimension("country", days, 25),
    fetchGscSearchAppearance(days, scope),
  ]);

  let series: GscDay[] = [];
  if (live && live.length) {
    series = live.map((d) => ({ label: dayLabel(d.date), clicks: d.clicks, impressions: d.impressions, ctr: d.ctr, position: d.position }));
  } else {
    const { rows } = await cmsDb().query<{ label: string; clicks: string; impressions: string; avg_position: string }>(
      "SELECT to_char(day,'Mon DD') AS label, clicks::text, impressions::text, avg_position::text FROM cms_metric_daily ORDER BY day");
    series = rows.map((r) => ({ label: r.label, clicks: +r.clicks, impressions: +r.impressions, ctr: +r.impressions > 0 ? (+r.clicks / +r.impressions) * 100 : 0, position: +r.avg_position }));
  }
  const isLive = Boolean(live && live.length);
  const cur = series.slice(-days);
  const prev = series.slice(-days * 2, -days);

  const curClicks = sum(cur, "clicks"), curImpr = sum(cur, "impressions");
  const prvClicks = sum(prev, "clicks"), prvImpr = sum(prev, "impressions");
  const curCtr = curImpr > 0 ? (curClicks / curImpr) * 100 : 0;
  const prvCtr = prvImpr > 0 ? (prvClicks / prvImpr) * 100 : 0;
  const curPos = avg(cur, "position"), prvPos = avg(prev, "position");

  /*
   * Impressions that ended without a click.
   *
   * This is the closest thing Search Console will give to a figure for AI Overviews and AI Mode. Those
   * are answered on the results page, so they show as an impression and no click, and Google counts
   * them inside the totals above without breaking them out — there is no appearance type for either,
   * as the API says when asked. So the number is presented as what it measurably is, every result that
   * was seen and not clicked, rather than being labelled as something the data does not say.
   */
  const curZero = Math.max(0, curImpr - curClicks);
  const prvZero = Math.max(0, prvImpr - prvClicks);
  const zeroShare = curImpr > 0 ? (curZero / curImpr) * 100 : 0;

  const kpis = [
    { icon: MousePointerClick, label: "Total Clicks", value: fmt(curClicks), color: GSC_COLORS.clicks },
    { icon: Eye, label: "Total Impressions", value: fmt(curImpr), color: GSC_COLORS.impressions },
    { icon: Percent, label: "Average CTR", value: `${curCtr.toFixed(2)}%`, color: GSC_COLORS.ctr },
    { icon: TrendingUp, label: "Average Position", value: curPos.toFixed(1), color: GSC_COLORS.position },
  ];

  const deviceRows = (devices ?? []).filter((d) => d.clicks + d.impressions > 0);
  const deviceTotal = deviceRows.reduce((s, d) => s + d.impressions, 0) || 1;
  let acc = 0;
  const dGrad = deviceRows.map((d) => {
    const start = (acc / deviceTotal) * 360; acc += d.impressions;
    return `${DEVICE_COLORS[d.key.toUpperCase()] ?? "#94A3B8"} ${start}deg ${(acc / deviceTotal) * 360}deg`;
  }).join(", ");
  const countryTotal = (countries ?? []).reduce((s, c) => s + c.impressions, 0) || 1;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[1.4rem] font-700 text-slate-900">Search Console</h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-700 ${isLive ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-[#16A34A]" : "bg-slate-400"}`} />{isLive ? "Live" : "Mirror"}
            </span>
          </div>
          <p className="mt-1 text-[0.86rem] text-slate-500">{isLive ? "Live performance from the Google Search Console API." : "Showing the local metrics mirror. Connect Google to see live data."}</p>
        </div>
        {/* The default must be the range the data was actually fetched for, or the chip claims one
            window while the figures below describe another. */}
        <div className="flex flex-wrap items-center gap-2">
          <GscScopeFilter countries={(allCountries ?? []).map((c) => ({ code: c.key, label: countryName(c.key) }))} />
          <RangeFilter defaultValue={activeRange.value} options={GSC_RANGES.map((r) => ({ value: r.value, label: r.label }))} />
        </div>
      </div>

      {scoped ? (
        <p className="mt-3 rounded-lg border border-[#DCD6F9] bg-[#F4F1FD] px-3.5 py-2.5 text-[0.82rem] text-[#4330B8]">
          Every figure below is narrowed to
          {sp.country ? <> <b className="font-600">{countryName(sp.country)}</b></> : null}
          {sp.country && sp.page ? " and" : null}
          {sp.page ? <> pages containing <b className="font-mono font-600">{sp.page}</b></> : null}.
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${c.color}1A`, color: c.color }}><c.icon size={17} /></span>
            <p className="mt-3 text-[1.5rem] font-700 text-slate-900">{c.value}</p>
            <p className="text-[0.78rem] text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Performance</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.72rem] font-600 text-slate-600">{cur.length} days</span>
        </div>
        <div className="mt-4">
          <SearchConsolePanel
            metrics={[
              { key: "clicks", label: "Total Clicks", color: GSC_COLORS.clicks, value: fmt(curClicks), delta: pctChange(curClicks, prvClicks), compareValue: fmt(prvClicks), compareDelta: pctChange(curClicks, prvClicks) },
              { key: "impressions", label: "Total Impressions", color: GSC_COLORS.impressions, value: fmt(curImpr), delta: pctChange(curImpr, prvImpr), compareValue: fmt(prvImpr), compareDelta: pctChange(curImpr, prvImpr) },
              { key: "ctr", label: "Average CTR", color: GSC_COLORS.ctr, value: `${curCtr.toFixed(2)}%`, delta: pctChange(curCtr, prvCtr), compareValue: `${prvCtr.toFixed(2)}%`, compareDelta: pctChange(curCtr, prvCtr) },
              { key: "position", label: "Average Position", color: GSC_COLORS.position, value: curPos.toFixed(1), delta: -pctChange(curPos, prvPos), compareValue: prvPos.toFixed(1), compareDelta: -pctChange(curPos, prvPos) },
            ]}
            days={cur}
            prevDays={prev}
            compareLabel={activeRange.label.toLowerCase()}
          />
        </div>
      </section>

      {/* How Google presented the results, and what share of them were never clicked. */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-slate-500" />
            <h2 className="text-[0.95rem] font-700 text-slate-900">Search appearance</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.72rem] font-600 text-slate-600">
            {appearances === null ? "Not connected" : `${appearances.length} recorded`}
          </span>
        </div>

        <div className="flex flex-wrap items-start gap-3 border-b border-slate-100 px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EEEBFC] text-[#543CDA]"><EyeOff size={17} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[1.5rem] font-700 leading-none text-slate-900">{fmt(curZero)}</p>
            <p className="mt-1 text-[0.78rem] text-slate-500">
              Impressions with no click — {zeroShare.toFixed(1)}% of all impressions, against {fmt(prvZero)} in the previous {activeRange.label.toLowerCase()}.
            </p>
          </div>
        </div>

        {appearances && appearances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Appearance</th><th className="px-5 py-3 text-right font-600">Impressions</th><th className="px-5 py-3 text-right font-600">Clicks</th><th className="px-5 py-3 text-right font-600">CTR</th><th className="px-5 py-3 text-right font-600">Position</th></tr></thead>
              <tbody>
                {appearances.map((a) => (
                  <tr key={a.key} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <span className="text-[0.85rem] font-600 text-slate-800">{appearanceLabel(a.key)}</span>
                        {isAiAppearance(a.key) ? (
                          <span className="rounded-full bg-[#EEEBFC] px-2 py-0.5 text-[0.64rem] font-700 text-[#543CDA]">AI surface</span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[0.82rem] font-600 tabular-nums" style={{ color: GSC_COLORS.impressions }}>{Math.round(a.impressions).toLocaleString("en-NG")}</td>
                    <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums text-slate-600">{Math.round(a.clicks).toLocaleString("en-NG")}</td>
                    <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums text-slate-600">{a.ctr.toFixed(2)}%</td>
                    <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums text-slate-600">{a.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-4 text-[0.84rem] text-slate-500">
            {appearances === null
              ? "Connect Google to read the appearance breakdown."
              : `Search Console records no special appearance for this property over ${activeRange.label.toLowerCase()}. It logs an appearance type only when it uses one, so this stays empty until it does.`}
          </p>
        )}

        {/* Said plainly, because the alternative is a screen that implies a number it does not have. */}
        <p className="border-t border-slate-100 px-5 py-3.5 text-[0.78rem] leading-relaxed text-slate-500">
          <b className="font-600 text-slate-700">On AI Overviews and AI Mode.</b> Google counts their
          impressions and clicks inside the totals on this screen and does not break them out: the
          Search Analytics API has no appearance type for either, and rejects the request when asked
          for one. The zero-click figure above is the measurable part — an AI answer is an impression
          that ends without a click — and this table will list an AI surface by name on the day Google
          starts reporting one. For assistant traffic that did arrive, see AI Visibility.
        </p>
      </section>

      {/* Top queries */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
          <SearchIcon size={16} className="text-slate-500" />
          <h2 className="text-[0.95rem] font-700 text-slate-900">Top Queries</h2>
        </div>
        {queries && queries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Query</th><th className="px-5 py-3 text-right font-600">Clicks</th><th className="px-5 py-3 text-right font-600">Impressions</th><th className="px-5 py-3 text-right font-600">CTR</th><th className="px-5 py-3 text-right font-600">Position</th></tr></thead>
              <tbody>
                {queries.map((q) => (
                  <tr key={q.key} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3"><span className="block max-w-[22rem] truncate text-[0.85rem] font-600 text-slate-800">{q.key}</span></td>
                    <td className="px-5 py-3 text-right font-mono text-[0.82rem] font-600 tabular-nums" style={{ color: GSC_COLORS.clicks }}>{q.clicks.toLocaleString("en-NG")}</td>
                    <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums text-slate-600">{q.impressions.toLocaleString("en-NG")}</td>
                    <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums text-slate-600">{q.ctr.toFixed(2)}%</td>
                    <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums text-slate-600">{q.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="px-5 py-6 text-[0.84rem] text-slate-500">No query data for this range yet.</p>}
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Performance by Device</h2>
          {deviceRows.length > 0 ? (
            <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
              <div className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${dGrad})` }}>
                <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center"><span className="text-[0.72rem] font-600 text-slate-500">Devices</span></div>
              </div>
              <ul className="w-full flex-1 space-y-2 text-[0.82rem]">
                {deviceRows.map((d) => (
                  <li key={d.key} className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: DEVICE_COLORS[d.key.toUpperCase()] ?? "#94A3B8" }} />
                    <span className="min-w-0 flex-1 capitalize text-slate-600">{d.key.toLowerCase()}</span>
                    <span className="shrink-0 font-mono font-600 tabular-nums text-slate-900">{fmt(d.clicks)}</span>
                    <span className="w-14 shrink-0 text-right font-mono tabular-nums text-slate-500">{((d.impressions / deviceTotal) * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : <p className="mt-3 text-[0.84rem] text-slate-500">No device data for this range yet.</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Performance by Country</h2>
          {countries && countries.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2.5">
              {countries.map((c) => (
                <li key={c.key} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-[0.83rem] font-600 text-slate-700">{countryName(c.key)}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full" style={{ width: `${Math.max(2, (c.impressions / countryTotal) * 100)}%`, background: GSC_COLORS.clicks }} /></span>
                  <span className="w-12 shrink-0 text-right font-mono text-[0.78rem] font-600 tabular-nums text-slate-500">{((c.impressions / countryTotal) * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-[0.84rem] text-slate-500">No country data for this range yet.</p>}
        </section>
      </div>
    </div>
  );
}
