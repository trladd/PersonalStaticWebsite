import React from "react";
import { siteConfig } from "../utility/siteConfig";
import GoldStars from "./GoldStars";

const Skills: React.FC = () => {
  const skillsList = [...siteConfig.skills]
    .sort((a, b) => {
      return b.list.length - a.list.length;
    })
    .map((skill) => (
      <div className="col l6 m12 skills__group" key={skill.title}>
        <h2 className="skills__groupTitle">{skill.title}</h2>
        <ul className="skills__list">
          {[...skill.list]
            .sort((a, b) => {
              //sort on rating

              return b.rating - a.rating;
            })
            .map((item) => (
              <li className="skills__item" key={item.name}>
                <span className="skills__name">{item.name}</span>
                <span className="skills__rating">
                  <GoldStars stars={item.rating} scale={5} />
                </span>
              </li>
            ))}
        </ul>
      </div>
    ));

  return (
    <div id="skills" className="section scrollspy row">
      <h1>Skills</h1>
      {skillsList}
    </div>
  );
};

export default Skills;
