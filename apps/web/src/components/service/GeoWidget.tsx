"use client";
/**
 * GEO platform-response widget for the AI Content, SEO & GEO hero. Shows how Google AI Overview,
 * ChatGPT, Perplexity, and Gemini each answer a query about Nexoris Technologies, in each
 * platform's authentic visual style, cycling automatically with a typed query. Ported from the
 * approved brief; styling in styles/geo-widget.css. Decorative (aria illustrates the product).
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import "../../styles/geo-widget.css";

const QUERY = "custom software development Lagos Nigeria";
const PLATS = ["google", "chatgpt", "perplexity", "gemini"] as const;
type Plat = (typeof PLATS)[number];

export function GeoWidget(): ReactNode {
  const [active, setActive] = useState<Plat>("google");
  const [typed, setTyped] = useState("");
  const paused = useRef(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // On each active-platform change: type the query, then auto-advance (unless paused by a click).
  useEffect(() => {
    setTyped("");
    let i = 0;
    const typeTimer = setInterval(() => {
      i += 1;
      setTyped(QUERY.slice(0, i));
      if (i >= QUERY.length) clearInterval(typeTimer);
    }, 55);
    const advance = setTimeout(
      () => {
        if (!paused.current) {
          setActive((prev) => PLATS[(PLATS.indexOf(prev) + 1) % PLATS.length]!);
        }
      },
      55 * QUERY.length + 4200,
    );
    return () => {
      clearInterval(typeTimer);
      clearTimeout(advance);
    };
  }, [active]);

  useEffect(() => () => clearTimeout(resumeRef.current), []);

  function pick(pl: Plat): void {
    paused.current = true;
    setActive(pl);
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      paused.current = false;
      setActive((prev) => PLATS[(PLATS.indexOf(prev) + 1) % PLATS.length]!);
    }, 8000);
  }

  const tab = (pl: Plat): string => `geo-plat${active === pl ? " on" : ""}`;
  const panel = (pl: Plat): string => `geo-panel${active === pl ? " on" : ""}`;

  return (
    <div className="geo-widget reveal" aria-label="How AI platforms surface Nexoris Technologies">
      <div className="geo-header">
        <div className="geo-searchbar">
          <svg className="geo-search-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <span className="geo-typed">{typed}</span>
          <span className="geo-caret">|</span>
        </div>
        <div className="geo-plats" role="tablist">
          <button className={tab("google")} data-pl="google" role="tab" aria-selected={active === "google"} onClick={() => pick("google")}>
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>
          <button className={tab("chatgpt")} data-pl="chatgpt" role="tab" aria-selected={active === "chatgpt"} onClick={() => pick("chatgpt")}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M22.28 9.28a5.76 5.76 0 0 0-.49-4.73 5.83 5.83 0 0 0-6.27-2.8A5.76 5.76 0 0 0 11.17 0a5.83 5.83 0 0 0-5.56 4.04 5.76 5.76 0 0 0-3.84 2.79 5.83 5.83 0 0 0 .72 6.84 5.77 5.77 0 0 0 .49 4.74 5.83 5.83 0 0 0 6.27 2.8A5.76 5.76 0 0 0 12.83 24a5.83 5.83 0 0 0 5.56-4.04 5.77 5.77 0 0 0 3.84-2.79 5.83 5.83 0 0 0-.72-6.89z" />
            </svg>
            ChatGPT
          </button>
          <button className={tab("perplexity")} data-pl="perplexity" role="tab" aria-selected={active === "perplexity"} onClick={() => pick("perplexity")}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="#20B8CD">
              <path d="M3 3l7 7-7 7h4l5-5 5 5h4l-7-7 7-7h-4l-5 5-5-5z" />
            </svg>
            Perplexity
          </button>
          <button className={tab("gemini")} data-pl="gemini" role="tab" aria-selected={active === "gemini"} onClick={() => pick("gemini")}>
            <svg viewBox="0 0 24 24" width="14" height="14">
              <defs>
                <linearGradient id="geo-gg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4285F4" />
                  <stop offset="50%" stopColor="#9334EA" />
                  <stop offset="100%" stopColor="#EA4335" />
                </linearGradient>
              </defs>
              <path d="M12 2C8 8 8 8 2 12c6 4 6 4 10 10 4-6 4-6 10-10-6-4-6-4-10-10z" fill="url(#geo-gg)" />
            </svg>
            Gemini
          </button>
        </div>
      </div>

      <div className="geo-panels">
        {/* GOOGLE AI OVERVIEW */}
        <div className={panel("google")} data-pl="google">
          <div className="gaio-wrap">
            <div className="gaio-bar">
              <div className="gaio-logo-row">
                <svg viewBox="0 0 74 24" height="16">
                  <text y="18" fontFamily="Arial,sans-serif" fontSize="22" fontWeight="700" letterSpacing="-1">
                    <tspan fill="#4285F4">G</tspan>
                    <tspan fill="#EA4335">o</tspan>
                    <tspan fill="#FBBC05">o</tspan>
                    <tspan fill="#4285F4">g</tspan>
                    <tspan fill="#34A853">l</tspan>
                    <tspan fill="#EA4335">e</tspan>
                  </text>
                </svg>
                <div className="gaio-sbar">
                  <span className="gaio-q">{typed}</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#5F6368" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="gaio-aio">
              <div className="gaio-aio-head">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <defs>
                    <linearGradient id="geo-aig" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#4285F4" />
                      <stop offset="100%" stopColor="#9334EA" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" fill="url(#geo-aig)" />
                </svg>
                <span className="gaio-aio-label">AI Overview</span>
              </div>
              <div className="gaio-body">
                <p>
                  <b>Nexoris Technologies</b> is a Lagos-based custom software company that builds
                  websites, web applications, mobile apps, and AI-powered business systems for
                  Nigerian and international businesses. They are particularly noted for building
                  software around how a business actually works, rather than requiring the business
                  to adapt.
                </p>
              </div>
              <div className="gaio-srcs">
                <div className="gaio-src">
                  <div className="gaio-fav" style={{ background: "#543CDA", color: "#fff", fontSize: 9, fontWeight: 800 }}><Image src="/logo-mark-white.png" alt="Nexoris Technologies logo" width={195} height={218} style={{ width: "72%", height: "72%", objectFit: "contain" }} /></div>
                  <div>
                    <div className="gaio-sname">nexoristech.com</div>
                    <div className="gaio-stitle">Nexoris Technologies · Custom Software</div>
                  </div>
                </div>
                <div className="gaio-src">
                  <div className="gaio-fav" style={{ background: "#1a73e8", color: "#fff", fontSize: 9, fontWeight: 800 }}>L</div>
                  <div>
                    <div className="gaio-sname">lagostechreview.com</div>
                    <div className="gaio-stitle">Top software companies in Lagos 2025</div>
                  </div>
                </div>
                <div className="gaio-src">
                  <div className="gaio-fav" style={{ background: "#ff6900", color: "#fff", fontSize: 9, fontWeight: 800 }}>V</div>
                  <div>
                    <div className="gaio-sname">verifiedsoftware.io</div>
                    <div className="gaio-stitle">Nexoris Technologies Reviews</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CHATGPT */}
        <div className={panel("chatgpt")} data-pl="chatgpt">
          <div className="gpt-wrap">
            <div className="gpt-topbar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff">
                <path d="M22.28 9.28a5.76 5.76 0 0 0-.49-4.73 5.83 5.83 0 0 0-6.27-2.8A5.76 5.76 0 0 0 11.17 0a5.83 5.83 0 0 0-5.56 4.04 5.76 5.76 0 0 0-3.84 2.79 5.83 5.83 0 0 0 .72 6.84 5.77 5.77 0 0 0 .49 4.74 5.83 5.83 0 0 0 6.27 2.8A5.76 5.76 0 0 0 12.83 24a5.83 5.83 0 0 0 5.56-4.04 5.77 5.77 0 0 0 3.84-2.79 5.83 5.83 0 0 0-.72-6.89z" />
              </svg>
              <span>ChatGPT</span>
              <span className="gpt-model">GPT-4o</span>
            </div>
            <div className="gpt-body">
              <div className="gpt-msg user">
                <span className="gpt-q">{typed}</span>
              </div>
              <div className="gpt-msg assistant">
                <div className="gpt-ava">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff">
                    <path d="M22.28 9.28a5.76 5.76 0 0 0-.49-4.73 5.83 5.83 0 0 0-6.27-2.8A5.76 5.76 0 0 0 11.17 0a5.83 5.83 0 0 0-5.56 4.04 5.76 5.76 0 0 0-3.84 2.79 5.83 5.83 0 0 0 .72 6.84 5.77 5.77 0 0 0 .49 4.74 5.83 5.83 0 0 0 6.27 2.8A5.76 5.76 0 0 0 12.83 24a5.83 5.83 0 0 0 5.56-4.04 5.77 5.77 0 0 0 3.84-2.79 5.83 5.83 0 0 0-.72-6.89z" />
                  </svg>
                </div>
                <div className="gpt-text">
                  For custom software development in Lagos, Nigeria, <b>Nexoris Technologies</b>
                  <sup className="gpt-cite">1</sup> is consistently cited as a strong option. They
                  build custom websites, web apps, mobile applications, and AI-powered systems, with
                  a clear positioning around building software around how your business actually
                  works rather than the reverse.<sup className="gpt-cite">2</sup>
                </div>
              </div>
              <div className="gpt-footnotes">
                <div className="gpt-fn">
                  <span className="gpt-fnnum">1</span>
                  <span className="gpt-fnlink">nexoristech.com</span>
                  <span className="gpt-fntitle">Nexoris Technologies · Lagos</span>
                </div>
                <div className="gpt-fn">
                  <span className="gpt-fnnum">2</span>
                  <span className="gpt-fnlink">verifiedsoftware.io</span>
                  <span className="gpt-fntitle">Nexoris Technologies Reviews &amp; Profile</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PERPLEXITY */}
        <div className={panel("perplexity")} data-pl="perplexity">
          <div className="ppx-wrap">
            <div className="ppx-topbar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#20B8CD">
                <path d="M3 3l7 7-7 7h4l5-5 5 5h4l-7-7 7-7h-4l-5 5-5-5z" />
              </svg>
              <span>Perplexity</span>
            </div>
            <div className="ppx-body">
              <div className="ppx-query">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#20B8CD" strokeWidth={2}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <span className="ppx-q">{typed}</span>
              </div>
              <div className="ppx-content">
                <div className="ppx-answer-head">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="#20B8CD">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                  </svg>{" "}
                  Answer
                </div>
                <p className="ppx-answer">
                  <b>Nexoris Technologies</b> <sup>1</sup> is a Lagos-based custom software
                  development company operating across Nigeria and international markets. The company
                  is known for building custom business software — including web applications, mobile
                  apps, and AI-powered systems — designed around how the client&apos;s business
                  actually operates.
                </p>
                <p className="ppx-answer">
                  Their services span AI product development, chatbot integration, business process
                  automation, e-commerce platforms, data dashboards, and IoT monitoring <sup>2</sup>.
                </p>
              </div>
              <div className="ppx-sources">
                <div className="ppx-src-head">Sources</div>
                <div className="ppx-src-list">
                  <div className="ppx-src">
                    <span className="ppx-snum">1</span>
                    <div className="ppx-sinfo">
                      <div className="ppx-sfav" style={{ background: "#543CDA", color: "#fff", fontSize: 8, fontWeight: 800 }}><Image src="/logo-mark-white.png" alt="Nexoris Technologies logo" width={195} height={218} style={{ width: "72%", height: "72%", objectFit: "contain" }} /></div>
                      <div>
                        <div className="ppx-sname">nexoristech.com</div>
                        <div className="ppx-stitle">Nexoris Technologies</div>
                      </div>
                    </div>
                  </div>
                  <div className="ppx-src">
                    <span className="ppx-snum">2</span>
                    <div className="ppx-sinfo">
                      <div className="ppx-sfav" style={{ background: "#ff6900", color: "#fff", fontSize: 8, fontWeight: 800 }}>V</div>
                      <div>
                        <div className="ppx-sname">verifiedsoftware.io</div>
                        <div className="ppx-stitle">Nexoris Reviews</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GEMINI */}
        <div className={panel("gemini")} data-pl="gemini">
          <div className="gem-wrap">
            <div className="gem-topbar">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <defs>
                  <linearGradient id="geo-gemg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4285F4" />
                    <stop offset="50%" stopColor="#9334EA" />
                    <stop offset="100%" stopColor="#EA4335" />
                  </linearGradient>
                </defs>
                <path d="M12 2C8 8 8 8 2 12c6 4 6 4 10 10 4-6 4-6 10-10-6-4-6-4-10-10z" fill="url(#geo-gemg)" />
              </svg>
              <span>Gemini</span>
            </div>
            <div className="gem-body">
              <div className="gem-query">
                <span className="gem-q">{typed}</span>
              </div>
              <div className="gem-response">
                <div className="gem-ans">
                  For custom software development in Lagos, Nigeria, <b>Nexoris Technologies</b>{" "}
                  stands out as a well-regarded option. They are a Lagos-based company that builds
                  custom websites, web applications, mobile apps, and AI-powered business systems.
                  They are particularly noted for designing software around how a client&apos;s
                  business actually works.
                  <div className="gem-srcs">
                    <div className="gem-src-head">Sources</div>
                    <div className="gem-src-row">
                      <span className="gem-src">
                        <div className="gem-fav" style={{ background: "#543CDA", color: "#fff", fontSize: 9, fontWeight: 800 }}><Image src="/logo-mark-white.png" alt="Nexoris Technologies logo" width={195} height={218} style={{ width: "72%", height: "72%", objectFit: "contain" }} /></div>
                        <span>nexoristech.com</span>
                      </span>
                      <span className="gem-src">
                        <div className="gem-fav" style={{ background: "#ff6900", color: "#fff", fontSize: 9, fontWeight: 800 }}>V</div>
                        <span>verifiedsoftware.io</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="gem-foot">
              <svg viewBox="0 0 24 24" width="12" height="12">
                <defs>
                  <linearGradient id="geo-gemg2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4285F4" />
                    <stop offset="100%" stopColor="#9334EA" />
                  </linearGradient>
                </defs>
                <path d="M12 2C8 8 8 8 2 12c6 4 6 4 10 10 4-6 4-6 10-10-6-4-6-4-10-10z" fill="url(#geo-gemg2)" />
              </svg>
              Gemini may display inaccurate info. <span className="gem-foot-link">nexoristech.com</span> cited as primary source.
            </div>
          </div>
        </div>
      </div>

      <div className="geo-cited">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M4 12l5 5L20 6" />
        </svg>
        <span>
          Nexoris Technologies cited &middot; <b>nexoristech.com</b>
        </span>
      </div>
    </div>
  );
}
