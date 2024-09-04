import React from "react";
import { siteConfig } from "../utility/siteConfig";
import GoldStars from "./GoldStars";

const Skills: React.FC = () => {
  const skillsList = siteConfig.skills
    .sort((a, b) => {
      return b.list.length - a.list.length;
    })
    .map((skill) => (
      <div className="col l6 m12">
        <h2>{skill.title}</h2>
        <ul>
          {skill.list
            .sort((a, b) => {
              //sort on rating

              return b.rating - a.rating;
            })
            .map((item) => (
              <li className="row">
                <div className="col l7 m7 truncate ">{item.name}</div>
                <div className="col l5 m5 right-align">
                  <GoldStars stars={item.rating} scale={5} />
                </div>
              </li>
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
