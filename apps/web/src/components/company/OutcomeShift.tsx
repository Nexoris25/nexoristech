import { ArrowDown, Check } from "lucide-react";
import { industryWorkflows } from "../../content/industry-workflows.js";
import "../../styles/workflow.css";
/** An illustrative operational journey, separate from CMS case studies. */
export function OutcomeShift({ industry }: { industry: string }) {
  const workflow = industryWorkflows[industry];
  if (!workflow) return null;
  return (
    <div className="journey-comparison">
      <div className="journey-heading">
        <span className="kicker">Before & after Nexoris</span>
        <h3>{workflow.title}</h3>
      </div>
      <ol className="journey-stages">
        {workflow.steps.map((step, index) => (
          <li className="journey-stage" key={step.label}>
            <div className="journey-label">
              <span aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h4>{step.label}</h4>
            </div>
            <div className="journey-before">
              <span className="journey-caption">Before</span>
              <p>{step.before}</p>
            </div>
            <div className="journey-connection" aria-hidden="true">
              <ArrowDown size={20} />
            </div>
            <div className="journey-after">
              <span className="journey-caption">
                <Check size={16} aria-hidden="true" /> With Nexoris
              </span>
              <p>{step.after}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="journey-result">
        <span>Connected from start to finish</span>
        <p>{workflow.record}, together.</p>
      </div>
    </div>
  );
}
