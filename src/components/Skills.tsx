import React from "react";
import { siteConfig } from "../siteConfig";

const Skills: React.FC = () => {
  const skillsList = siteConfig.skills.map((skill) => (
    <div className="col l4 m12">
      <h2>{skill.title}</h2>
      <ul>
        {skill.list.map((item) => (
          <li>{item.name}</li>
        ))}
      </ul>
    </div>
  ));

  return (
    <div id="skills" className="section scrollspy row">
      {skillsList}
    </div>
  );
};

export default Skills;
