"use client";
import { useId, useState, useSyncExternalStore } from "react";
import { ArrowRight, Check, Unplug, Workflow } from "lucide-react";
import { industryWorkflows } from "../../content/industry-workflows.js";
import "../../styles/workflow.css";
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
/** Capability illustration. Client evidence is rendered separately from CMS. */
export function OutcomeShift({ industry }: { industry: string }) {
  const [phase, setPhase] = useState<"before" | "after">("after");
  const panelId = useId();
  const interactive = useSyncExternalStore(subscribe, clientReady, serverReady);
  const workflow = industryWorkflows[industry];
  if (!workflow) return null;
  return (
    <div className={`workflow-preview show-${phase}`}>
      <div className="workflow-heading">
        <div>
          <span className="workflow-eyebrow">Before & after Nexoris</span>
          <h3>{workflow.title}</h3>
        </div>
        <span className="workflow-context">
          One workflow. A clearer way to work.
        </span>
      </div>
      <div
        className="workflow-switch"
        role="group"
        aria-label="Compare before and after"
      >
        <button
          type="button"
          disabled={!interactive}
          aria-pressed={phase === "before"}
          aria-controls={panelId}
          onClick={() => setPhase("before")}
        >
          Before
        </button>
        <button
          type="button"
          disabled={!interactive}
          aria-pressed={phase === "after"}
          aria-controls={panelId}
          onClick={() => setPhase("after")}
        >
          With Nexoris
        </button>
      </div>
      <div className="workflow-comparison" id={panelId}>
        <div className="workflow-column-head workflow-before">
          <Unplug size={22} aria-hidden="true" />
          <div>
            <h4>Before</h4>
            <p>Separate tools. Manual handoffs.</p>
          </div>
        </div>
        <div className="workflow-column-head workflow-after">
          <Workflow size={22} aria-hidden="true" />
          <div>
            <h4>With Nexoris</h4>
            <p>A connected flow of work.</p>
          </div>
        </div>
        {workflow.steps.map((step, index) => (
          <div className="workflow-comparison-row" key={step.label}>
            <div className="workflow-cell workflow-before">
              <span className="workflow-step-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h5>{step.label}</h5>
                <p>{step.before}</p>
              </div>
            </div>
            <span className="workflow-transition" aria-hidden="true">
              <ArrowRight size={17} />
            </span>
            <div className="workflow-cell workflow-after">
              <span className="workflow-step-status" aria-hidden="true">
                <Check size={17} />
              </span>
              <div>
                <h5>{step.label}</h5>
                <p>{step.after}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="workflow-summary workflow-before">
          <span>The missing connection</span>
          <p>{workflow.record}, kept apart.</p>
        </div>
        <div className="workflow-summary workflow-after">
          <span>One shared view</span>
          <p>{workflow.record}, together.</p>
        </div>
      </div>
      <p className="workflow-accessible-status" role="status">
        Showing {phase === "after" ? "With Nexoris" : "Before"} on compact
        screens.
      </p>
    </div>
  );
}
