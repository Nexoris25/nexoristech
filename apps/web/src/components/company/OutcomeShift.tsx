import { ArrowRight } from "lucide-react";
import { industryWorkflows } from "../../content/industry-workflows.js";
import "../../styles/workflow.css";
/** Capability explanation; actual client case studies remain CMS controlled. */
export function OutcomeShift({ industry }: { industry: string }) {
  const workflow = industryWorkflows[industry];
  if (!workflow) return null;
  return (
    <div className="flow-story">
      <div className="flow-story-heading">
        <span className="kicker">Before & after Nexoris</span>
        <h3>{workflow.title}</h3>
        <p>Follow each step to see what changes.</p>
      </div>
      <ol className="flow-stages">
        {workflow.steps.map((step, index) => (
          <li key={step.label}>
            <details className="flow-stage" open={index === 0}>
              <summary>
                <span className="flow-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{step.label}</span>
                <span className="flow-toggle" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="flow-pair">
                <div className="flow-old">
                  <span>Before</span>
                  <p>{step.before}</p>
                </div>
                <ArrowRight
                  className="flow-direction"
                  size={22}
                  aria-hidden="true"
                />
                <div className="flow-new">
                  <span>With Nexoris</span>
                  <p>{step.after}</p>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ol>
      <div className="flow-together">
        <span>One shared view</span>
        <p>{workflow.record}, together.</p>
      </div>
    </div>
  );
}
