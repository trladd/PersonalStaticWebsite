import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import M from "materialize-css";
import roadmap from "./roadmap.json";

type RoadmapItem = {
  status: "Done" | "Todo";
  title: string;
  points: number;
};

type RoadmapData = {
  completed: RoadmapItem[];
  backlog: RoadmapItem[];
};

function renderItems(items: RoadmapItem[]) {
  return (
    <table className="striped">
      <thead>
        <tr>
          <th>Status</th>
          <th>Item</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.title}>
            <td>{item.status === "Done" ? "✓ Done" : "○ Todo"}</td>
            <td>{item.title}</td>
            <td>{item.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CarCostAbout() {
  const roadmapData = roadmap as RoadmapData;
  const collapsibleRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!collapsibleRef.current) {
      return;
    }

    const instance = M.Collapsible.init(collapsibleRef.current, {
      accordion: false,
    });

    return () => {
      instance.destroy();
    };
  }, []);

  const totalCompletedPoints = roadmapData.completed.reduce((sum, item) => sum + item.points, 0);
  const totalBacklogPoints = roadmapData.backlog.reduce((sum, item) => sum + item.points, 0);

  return (
    <div className="container flow-text">
      <div style={{ marginTop: "1rem", marginBottom: "1.25rem" }}>
        <Link
          to="/sideProjects/carCost"
          className="waves-effect waves-light btn secondaryColor"
          style={{ textTransform: "none" }}
        >
          Back to calculator
        </Link>
      </div>
      <h1>Car Cost Calculator About</h1>
      <p>
        The Car Cost Calculator is a side project focused on helping people understand the
        true cost of owning and driving a vehicle. It combines operating costs, depreciation,
        annual ownership costs, trip planning, recurring driving totals, and benchmark-based
        insights so users can make better decisions about daily driving, gig work, and trip
        planning.
      </p>
      <h2>Roadmap</h2>
      <div className="row">
        <div className="col s12 m4">
          <div className="card-panel">
            <strong>Completed stories</strong>
            <div>{roadmapData.completed.length}</div>
          </div>
        </div>
        <div className="col s12 m4">
          <div className="card-panel">
            <strong>Completed points</strong>
            <div>{totalCompletedPoints}</div>
          </div>
        </div>
        <div className="col s12 m4">
          <div className="card-panel">
            <strong>Backlog points</strong>
            <div>{totalBacklogPoints}</div>
          </div>
        </div>
      </div>
      <ul className="collapsible popout" ref={collapsibleRef}>
        <li className="active">
          <div className="collapsible-header">
            <strong>Backlog</strong>
          </div>
          <div className="collapsible-body">{renderItems(roadmapData.backlog)}</div>
        </li>
        <li>
          <div className="collapsible-header">
            <strong>Completed</strong>
          </div>
          <div className="collapsible-body">{renderItems(roadmapData.completed)}</div>
        </li>
      </ul>
    </div>
  );
}

export default CarCostAbout;
