import React, { useEffect } from "react";
import M from "materialize-css";
import Introduction from "./Introduction";
import Skills from "./Skills";

const MainPage: React.FC = () => {
  useEffect(() => {
    // @ts-ignore
    $(".parallax").parallax();
    // @ts-ignore
    $(".carousel-slider").carousel({
      fullWidth: true,
    });

    // @ts-ignore
    $(".collapsible").collapsible();

    const elems = document.querySelectorAll(".scrollspy");
    const instances = M.ScrollSpy.init(elems, {
      scrollOffset: 80, // align with fixed header so sections deactivate when scrolled past
    });
    const tocElem = document.querySelector(".mainpage-scrollspy");
    tocElem?.setAttribute("style", "position: fixed;");

    return () => {
      const arr = Array.isArray(instances) ? instances : [instances];
      arr.forEach((inst) => inst?.destroy?.());
    };
  }, []);
  return (
    <div id="bodybox" className="container flow-text">
      <div className="row">
        <div className="col s12 m9 l10">
          <Introduction />
          <div className="divider"></div>
          <Skills />
          <div className="divider"></div>
          <div id="portfolio" className="section scrollspy">
            <h1>Portfolio</h1>
            <h2>Personal Projects</h2>
            <p>Here you can see some of my side projects that I have done.</p>
            <div className="card">
              <div className="card-image waves-effect waves-block waves-light">
                <img
                  className="activator"
                  src="images/emaily.PNG"
                  alt="Emaily survey application preview"
                />
              </div>
              <div className="card-content">
                <span className="card-title activator grey-text text-darken-4">
                  Emaily - Survey Application
                  <i className="material-icons right">more_vert</i>
                </span>
                <p>
                  <a
                    href="https://stormy-lake-36747.herokuapp.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    See Website Here
                  </a>
                </p>
                <p>
                  <a
                    href="https://stormy-lake-36747.herokuapp.com/about"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read More About Website Here!
                  </a>
                </p>
              </div>
              <div className="card-reveal">
                <span className="card-title grey-text text-darken-4">
                  Emaily - Survey Application
                  <i className="material-icons right">close</i>
                </span>
                <p>
                  Emaily is an application that I built after completing a
                  fullstack JavaScript course. I took what was started with the
                  course and extended functionality to include LinkedIn and
                  Google oauth, custom web surveys, personal and global survey
                  templates, advanced account page with pictures pulled from
                  oauth sources and more! Check out my about page linked below!
                </p>
              </div>
            </div>

            <h2>Professional Projects by Technology/Category</h2>
            <p>
              Here I discuss my involvement in some professional projects
              organized by technology or category.
            </p>
            <ul className="collapsible">
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">code</i>
                  JavaScript/TypeScript
                </div>
                <div className="collapsible-body">
                  <p>
                    <b>Full-stack TypeScript</b> building{" "}
                    <a href="https://help.salesforce.com/s/articleView?id=sf.mc_overview_marketing_cloud_package_manager.htm&type=5">
                      Salesforce's marketing cloud 'Package Manager'
                    </a>{" "}
                    application. In this role I was able to work on a team of
                    skilled engineers building and maintaining a global
                    application. This complex application involved a lot of
                    dependency management and integrated with many marketing
                    cloud APIs.
                  </p>
                  <hr />
                  <p>
                    <b>MarkLogic</b> data hub using server side javascript (not
                    node.js but built on chrome's v8 engine). I was responsible
                    for building out critical code for an enterprise wide data
                    hub implemented using MarkLogic as a NoSQL data hub. In
                    addition to contributing code, I served as the technical
                    lead for the majority of my time on the initiative. This
                    included automated testing, change detection and more.
                  </p>
                  <hr />
                  <p>
                    <b>Node.js custom CLI tool</b> for MarkLogic development. I
                    built a custom development utility which using command line
                    questions and answers builds out boilerplate code, json file
                    configurations, test cases, and more. This utility would
                    build out over 30 files and 900 lines of code with just 7
                    inputs. This program features cached data via local files,
                    an installation program that sets up the developer
                    workspace, user customizable configurations, and more. After
                    building out the application, I was able to gain team
                    adoption where the full team was using it and contributing
                    to the codebase.
                  </p>
                </div>
              </li>
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">code</i>Java
                </div>
                <div className="collapsible-body">
                  <p>
                    Maintaining enterprise Java applications. This includes both
                    JSF 'full stack' java applications as well as Java services.
                    Some Java applications were primarily REST applications,
                    while others had direct integrations with DB2.
                  </p>
                </div>
              </li>
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">code</i>Pega
                </div>
                <div className="collapsible-body">
                  <img
                    src="images/SSA.png"
                    className="responsive-img"
                    alt="Pega Senior System Architect certification badge"
                  />
                  <p>
                    <a href="https://www.pega.com/about">Pega platform</a> is a
                    low-code / no-code development technology that is marketed
                    toward rapid development, and engaging business stakeholders
                    with visual workflows, helping relate development with the
                    business.
                  </p>
                  <p>
                    I helped to establish Pega competency at my company where
                    there was initially none internal to the company. We started
                    by hiring Pega resources, but communication gaps and
                    development performance quickly became a concern. I inserted
                    myself into the process and the problems at hand helping to
                    work through them.
                  </p>
                  <p>
                    In one year's time, I helped solidify a pega competency,
                    lead a strategy for implementing devops with in our Pega
                    development space, built out our first large production
                    application, and achieved my Pega Certified Systems
                    Architect and Pega Certified Senior Systems Architect
                  </p>
                  <p>
                    From there on I would oversee onboarding for new resources,
                    overall Pega architecture, application maintenance, building
                    out reusable Pega rulesets such as an advanced integration
                    with DocuSign for company applications.
                  </p>
                </div>
              </li>
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">info_outline</i>ADA Compliance
                </div>
                <div className="collapsible-body">
                  <div>
                    <p>
                      I was tasked with exploring ADA compliance for my company
                      where we previously had no experience with. In an effort
                      to improve our websites, I explored ADA compliance, what
                      it means, levels of compliance, etc. to educate others in
                      our design and frontend space.
                    </p>
                    <p>
                      After gather necessary information on ADA compliance, I
                      did a full audit of our websites pinpointing level of
                      compliance by site (by compliance requirement), and
                      illustrating next best steps to get to WCAG 2.1 AA
                      compliance level on all sites.
                    </p>
                  </div>
                </div>
              </li>
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">info_outline</i>DevOps | Agile |
                  CI/CD
                </div>
                <div className="collapsible-body">
                  <div>
                    <p>
                      <b>Serving as Scrum Master</b> while working at
                      Salesforce. In this role I help manage work for the team,
                      facilitate conversations, and find areas for improvement
                      in our team operations while still contributing as an
                      engineer.
                    </p>
                    <hr />
                    <p>
                      <b>Agile/DevOps Adoption:</b> Throughout 2020 and into
                      2021 my project team was trying to figure out how agile
                      and DevOps fit into our organization. The benefit to this
                      was that we were building a greenfield software solution
                      where we were able to structure our people around these
                      concepts from the start. My involvement in this effort as
                      a technical lead was to help guide the team and project
                      leadership through prioritization of support (ops) tasks
                      and not become too focused on (dev) but to see the full
                      picture. To help reduce bugs we shifted quality left,
                      built out extensive automated testing and workspace
                      validation tooling, built custom CLI tools to speed up
                      code development, improved build pipelines, and
                      streamlined enterprise change management tasks.
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="col hide-on-small-only m3 l2 rightNav">
          <ul className="section table-of-contents mainpage-scrollspy">
            <li>
              <a href="#introduction">About Me</a>
            </li>
            <li>
              <a href="#hobbies">Hobbies/Interests</a>
            </li>
            <li>
              <a href="#skills">Skills</a>
            </li>
            <li>
              <a href="#portfolio">Portfolio</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
