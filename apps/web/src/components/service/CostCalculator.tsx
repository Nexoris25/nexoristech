"use client";
/**
 * Business Process Automation hero widget. A live "what is manual work costing you?" calculator:
 * three sliders (people, hours lost each per week, average monthly salary) drive an estimated
 * annual cost and hours. Ported from the approved handoff; a rough guide, not a quote. Styling:
 * styles/calc-widget.css.
 */
import { useState } from "react";
import type { ReactNode } from "react";

const naira = (n: number): string => "₦" + Math.round(n).toLocaleString("en-NG");
const kfmt = (n: number): string => (n >= 1000 ? `${n / 1000}k` : String(n));

export function CostCalculator(): ReactNode {
  const [people, setPeople] = useState(8);
  const [hours, setHours] = useState(10);
  const [salary, setSalary] = useState(250000);

  const hourly = (salary * 12) / (52 * 40);
  const hoursYear = people * hours * 52;
  const cost = hoursYear * hourly;

  return (
    <div className="calcw reveal" aria-label="Manual work cost estimate">
      <div className="ct">Rough estimate</div>
      <h3>What is manual work costing you?</h3>

      <div className="calcw-field">
        <label htmlFor="calcw-people">
          People doing repetitive work <b>{people}</b>
        </label>
        <input
          id="calcw-people"
          type="range"
          min={1}
          max={60}
          value={people}
          onChange={(e) => setPeople(+e.target.value)}
        />
      </div>

      <div className="calcw-field">
        <label htmlFor="calcw-hours">
          Hours each loses per week <b>{hours}</b>
        </label>
        <input
          id="calcw-hours"
          type="range"
          min={1}
          max={30}
          value={hours}
          onChange={(e) => setHours(+e.target.value)}
        />
      </div>

      <div className="calcw-field">
        <label htmlFor="calcw-salary">
          Average monthly salary (₦) <b>{kfmt(salary)}</b>
        </label>
        <input
          id="calcw-salary"
          type="range"
          min={80000}
          max={900000}
          step={10000}
          value={salary}
          onChange={(e) => setSalary(+e.target.value)}
        />
      </div>

      <div className="calcw-out">
        <div className="ol">Roughly what those hours cost you every year</div>
        <div className="ov" aria-live="polite">
          {naira(cost)}
        </div>
        <div className="os">
          {hoursYear.toLocaleString("en-NG")} hours a year on work software could do
        </div>
      </div>

      <p className="calcw-note">
        A rough guide, not a quote. The process audit replaces these sliders with your real numbers.
      </p>
    </div>
  );
}
