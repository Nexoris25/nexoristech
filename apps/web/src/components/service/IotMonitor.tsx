"use client";
/**
 * IoT Development hero widget. A live device monitor with a big readout (that jitters slightly),
 * an animated sparkline, a device list, and a drift-alert banner, switchable between Fleet, Cold
 * room, and Line. The accent colour follows the device; the "updated Ns ago" counter ticks; the
 * Cold room raises a drift alert. Auto-cycles the devices, pausing on click. Ported from the
 * approved handoff. Respects prefers-reduced-motion. Styling: styles/monitor-widget.css.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import "../../styles/monitor-widget.css";

type DeviceId = "fleet" | "cold" | "line";
type Chip = "ok" | "warn";

interface Device {
  id: DeviceId;
  tab: string;
  tabIcon: ReactNode;
  name: string;
  status: string;
  ac: string;
  big: number;
  unit: string;
  dec: number;
  k: string;
  d: string;
  alert: ReactNode | null;
  list: { chip: Chip; name: string; value: string }[];
}

const DEVICES: Device[] = [
  {
    id: "fleet",
    tab: "Fleet",
    tabIcon: (
      <>
        <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
        <circle cx="7" cy="17" r="1.6" />
        <circle cx="17.5" cy="17" r="1.6" />
      </>
    ),
    name: "Fleet · Lagos depot",
    status: "12 vehicles reporting",
    ac: "#6A55F2",
    big: 7.9,
    unit: "km/L",
    dec: 1,
    k: "Avg fuel economy",
    d: "across the active fleet",
    alert: null,
    list: [
      { chip: "ok", name: "GT-241 · Apapa run", value: "moving" },
      { chip: "ok", name: "GT-188 · Ikeja", value: "moving" },
      { chip: "warn", name: "GT-203 · idling 14 min", value: "flagged" },
    ],
  },
  {
    id: "cold",
    tab: "Cold room",
    tabIcon: <path d="M12 3v18M5 7l14 10M19 7L5 17M9 4l3 2 3-2M9 20l3-2 3 2" />,
    name: "Cold room 2 · Main store",
    status: "sensor healthy",
    ac: "#1FA97E",
    big: 4.1,
    unit: "°C",
    dec: 1,
    k: "Internal temperature",
    d: "threshold 5.0°C",
    alert: (
      <>
        <b>Drift detected:</b> Cold room 2 at 6.4°C · SMS sent to supervisor
      </>
    ),
    list: [
      { chip: "ok", name: "Cold room 1", value: "3.8°C" },
      { chip: "warn", name: "Cold room 2", value: "rising" },
      { chip: "ok", name: "Freezer A", value: "-18.2°C" },
    ],
  },
  {
    id: "line",
    tab: "Line",
    tabIcon: <path d="M3 21V9l6 4V9l6 4V5l6 4v12z" />,
    name: "Press 3 · Line B",
    status: "running nominal",
    ac: "#6A55F2",
    big: 2.3,
    unit: "mm/s",
    dec: 1,
    k: "Vibration (RMS)",
    d: "predictive baseline 2.1",
    alert: null,
    list: [
      { chip: "ok", name: "Press 1", value: "1.9 mm/s" },
      { chip: "ok", name: "Press 2", value: "2.0 mm/s" },
      { chip: "ok", name: "Press 3", value: "2.3 mm/s" },
    ],
  },
];

const SPARK = Array.from({ length: 14 });

const reduceMotion = (): boolean =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function IotMonitor(): ReactNode {
  const [active, setActive] = useState<DeviceId>("fleet");
  const [value, setValue] = useState(DEVICES[0]!.big);
  const [since, setSince] = useState(2);
  const [alertShown, setAlertShown] = useState(false);
  const paused = useRef(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const timers = useRef<ReturnType<typeof setTimeout | typeof setInterval>[]>([]);

  const d = DEVICES.find((x) => x.id === active)!;

  useEffect(() => {
    timers.current.forEach((t) => {
      clearTimeout(t);
      clearInterval(t);
    });
    timers.current = [];
    setValue(d.big);
    setSince(2);
    setAlertShown(false);

    const reduce = reduceMotion();

    // reveal the drift alert shortly after the device loads
    if (d.alert) {
      timers.current.push(setTimeout(() => setAlertShown(true), 1200));
    }

    if (!reduce) {
      // live jitter on the headline reading
      timers.current.push(
        setInterval(() => {
          setValue(+(d.big + (Math.random() - 0.5) * 0.3).toFixed(d.dec));
        }, 1500),
      );
      // "updated Ns ago" ticks up
      timers.current.push(setInterval(() => setSince((s) => (s >= 9 ? 2 : s + 1)), 1000));
      // advance to the next device
      timers.current.push(
        setTimeout(() => {
          if (!paused.current) setActive((a) => DEVICES[(DEVICES.findIndex((x) => x.id === a) + 1) % DEVICES.length]!.id);
        }, 5200),
      );
    }

    return () => {
      timers.current.forEach((t) => {
        clearTimeout(t);
        clearInterval(t);
      });
    };
  }, [active, d.big, d.dec, d.alert]);

  useEffect(
    () => () => {
      clearTimeout(resumeRef.current);
      timers.current.forEach((t) => {
        clearTimeout(t);
        clearInterval(t);
      });
    },
    [],
  );

  function pick(id: DeviceId): void {
    paused.current = true;
    setActive(id);
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      paused.current = false;
      setActive((a) => DEVICES[(DEVICES.findIndex((x) => x.id === a) + 1) % DEVICES.length]!.id);
    }, 12000);
  }

  return (
    <div className="monw reveal" aria-label="Live monitoring demo" style={{ ["--ac" as string]: d.ac }}>
      <div className="monw-tabs" role="tablist" aria-label="Device">
        {DEVICES.map((dev) => (
          <button
            key={dev.id}
            type="button"
            role="tab"
            aria-selected={active === dev.id}
            className={`monw-tab${active === dev.id ? " on" : ""}`}
            onClick={() => pick(dev.id)}
          >
            <svg viewBox="0 0 24 24">{dev.tabIcon}</svg>
            {dev.tab}
          </button>
        ))}
      </div>

      <div className="monw-head">
        <div className="hx">
          <b>{d.name}</b>
          <span className="st">
            <span className="live" />
            {d.status}
          </span>
        </div>
        <span className="since">updated {since}s ago</span>
      </div>

      <div className="monw-readout">
        <div className="big">
          {value.toFixed(d.dec)}
          <u>{d.unit}</u>
        </div>
        <div className="rl">
          <div className="k">{d.k}</div>
          <div className="d">{d.d}</div>
        </div>
      </div>

      <div className="monw-spark" aria-hidden="true">
        {SPARK.map((_, i) => (
          <i key={i} />
        ))}
      </div>

      {d.alert ? (
        <div className={`monw-alert${alertShown ? " show" : ""}`}>
          <span className="ai">
            <svg viewBox="0 0 24 24">
              <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
          </span>
          <span className="at">{d.alert}</span>
        </div>
      ) : null}

      <div className="monw-list">
        {d.list.map((item) => (
          <div className="ml" key={item.name}>
            <span className={`md ${item.chip}`} />
            <span className="mn">{item.name}</span>
            <span className="mv">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
