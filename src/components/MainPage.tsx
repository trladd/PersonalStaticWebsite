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
            <p>
              These projects are where I explore product ideas, sharpen my
              engineering skills, and build tools around problems I care about.
            </p>
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
                  Emaily Survey Application (Earlier Project)
                  <i className="material-icons right">more_vert</i>
                </span>
                <p>
                  <a
                    href="https://github.com/trladd/EmailyUdemyCourseRepo"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View the source on GitHub
                  </a>
                </p>
              </div>
              <div className="card-reveal">
                <span className="card-title grey-text text-darken-4">
                  Emaily Survey Application (Earlier Project)
                  <i className="material-icons right">close</i>
                </span>
                <p>
                  I originally built Emaily after completing a full-stack
                  JavaScript course, then expanded the course foundation with
                  LinkedIn and Google OAuth, custom web surveys, reusable survey
                  templates, and richer account management. The hosted demo is
                  retired, but the project remains a useful snapshot of my
                  earlier full-stack work.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-image waves-effect waves-block waves-light">
                <img
                  className="activator"
                  src="images/tctd_main_logo_cropped.png"
                  alt="True Cost To Drive project logo"
                />
              </div>
              <div className="card-content">
                <span className="card-title activator grey-text text-darken-4">
                  TrueCostToDrive.com
                  <i className="material-icons right">more_vert</i>
                </span>
                <p>
                  <a
                    href="https://www.truecosttodrive.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit the standalone site
                  </a>
                </p>
                <p>
                  <a href="/sideProjects/trueCostToDrive">
                    Open it here inside my side projects
                  </a>
                </p>
              </div>
              <div className="card-reveal">
                <span className="card-title grey-text text-darken-4">
                  TrueCostToDrive.com
                  <i className="material-icons right">close</i>
                </span>
                <p>
                  True Cost To Drive is my deeper dive into helping people
                  understand what vehicle ownership is really costing them. It
                  goes beyond fuel economy to explore insurance, maintenance,
                  depreciation, acquisition decisions, trip planning, and how
                  different vehicles shape a household budget.
                </p>
                <p>
                  I am building it as a standalone product so it has room to
                  grow beyond a side-project calculator into a more guided and
                  complete ownership-planning experience.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-image waves-effect waves-block waves-light">
                <img
                  className="activator"
                  src="images/wrx.JPG"
                  alt="Road Trip Atlas project preview"
                />
              </div>
              <div className="card-content">
                <span className="card-title activator grey-text text-darken-4">
                  Road Trip Atlas
                  <i className="material-icons right">more_vert</i>
                </span>
                <p>
                  <a href="/sideProjects/roadTrips">
                    Explore the reusable trip map and summary dashboard
                  </a>
                </p>
              </div>
              <div className="card-reveal">
                <span className="card-title grey-text text-darken-4">
                  Road Trip Atlas
                  <i className="material-icons right">close</i>
                </span>
                <p>
                  This side project is a reusable road-trip tracker that lets me
                  load many multi-stop routes onto one map, shade the states I
                  have covered, and keep wishlist trips in the same view without
                  losing the distinction between planned and completed travel.
                </p>
                <p>
                  The component is driven by config data so I can keep adding
                  trips over time and have the cumulative miles, trip counts,
                  and state coverage update automatically.
                </p>
              </div>
            </div>

            <h2>Professional Highlights</h2>
            <p>
              Selected accomplishments spanning product engineering, enterprise
              platforms, architecture, delivery, and technical leadership.
            </p>
            <ul className="collapsible">
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">dynamic_feed</i>
                  Content Authoring & Personalization
                </div>
                <div className="collapsible-body">
                  <p>
                    Providing technical leadership for Salesforce Marketing
                    Cloud Advanced content and content authoring capabilities,
                    driving architectural decisions across initiatives and
                    helping teams deliver scalable experiences for email and
                    SMS.
                  </p>
                  <p>
                    Building content authoring and scripting capabilities such
                    as Handlebars and AMPscript tooling, merge fields, repeating
                    content blocks, reusable components, and in-builder
                    scripting experiences.
                  </p>
                  <p>
                    I led the cross-team design and implementation of repeating
                    content blocks in Advanced Content Builder and improved
                    email rendering performance by up to 80% through
                    architectural and implementation optimizations.
                  </p>
                </div>
              </li>
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">account_tree</i>
                  Architecture, Product & Customer Impact
                </div>
                <div className="collapsible-body">
                  <p>
                    Partnering with product managers, engineering leadership,
                    and cross-functional stakeholders to shape product
                    direction, evaluate technical tradeoffs, and prioritize
                    investments based on customer value and implementation
                    complexity.
                  </p>
                  <p>
                    Leading design and code reviews, establishing engineering
                    best practices, mentoring engineers, and investigating
                    complex customer-reported production issues through root
                    cause analysis and cross-functional collaboration.
                  </p>
                  <img
                    src="images/salesforce-presidents-award.jpg"
                    className="responsive-img professionalHighlightBanner"
                    alt=""
                    aria-hidden="true"
                  />
                  <p>
                    Salesforce recognized this combination of engineering impact
                    and technical ownership with its FY25 President’s Award, an
                    honor awarded to the top 1% of its engineering talent.
                  </p>
                </div>
              </li>
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">code</i>
                  Full-Stack Engineering & Delivery
                </div>
                <div className="collapsible-body">
                  <p>
                    Building customer-facing products and the APIs and services
                    behind them with React, TypeScript, Node.js, Lightning Web
                    Components, and Java.
                  </p>
                  <p>
                    Developing Salesforce Marketing Cloud Package Manager as
                    part of a dedicated product team, integrating with Marketing
                    Cloud APIs to support application package deployment and
                    management.
                  </p>
                  <p>
                    I also invest in engineering quality through automated
                    testing, CI/CD, performance improvements, and practical team
                    practices that help complex work move from design to
                    production with confidence.
                  </p>
                </div>
              </li>
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">storage</i>
                  MarkLogic & NoSQL Data Platforms
                </div>
                <div className="collapsible-body">
                  <p>
                    Serving as technical lead and hands-on engineer for an
                    enterprise-wide data hub built on MarkLogic, using
                    server-side JavaScript to deliver critical data-processing
                    capabilities alongside automated testing and change
                    detection.
                  </p>
                  <p>
                    Building a Node.js development utility that generated more
                    than 30 files and 900 lines of project boilerplate,
                    configuration, and tests from seven inputs. The tool grew
                    into a team-adopted codebase with configurable workspaces,
                    cached data, and its own installation flow.
                  </p>
                </div>
              </li>
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">schema</i>
                  Pega Platform Leadership
                </div>
                <div className="collapsible-body">
                  <img
                    src="images/SSA.png"
                    className="responsive-img"
                    alt="Pega Senior System Architect certification badge"
                  />
                  <p>
                    Establishing an internal Pega competency, resolving gaps in
                    architecture and delivery, defining a DevOps strategy, and
                    helping deliver the organization’s first large production
                    Pega application.
                  </p>
                  <p>
                    Earning Pega Certified System Architect and Senior System
                    Architect credentials while overseeing solution
                    architecture, application maintenance, and onboarding for
                    new engineers.
                  </p>
                  <p>
                    Building reusable Pega rulesets, including an advanced
                    DocuSign integration shared across company applications.
                  </p>
                </div>
              </li>
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">code</i>
                  Enterprise Java Applications
                </div>
                <div className="collapsible-body">
                  <p>
                    Designing, developing, maintaining, and supporting
                    enterprise Java systems, including JSF full-stack
                    applications, REST services, and applications with direct
                    DB2 integrations.
                  </p>
                </div>
              </li>
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">groups</i>
                  Team Organization, Agile & CI/CD
                </div>
                <div className="collapsible-body">
                  <p>
                    Serving as Scrum Master while contributing as an engineer,
                    managing the backlog, coordinating delivery priorities,
                    facilitating ceremonies, and driving sprint execution.
                  </p>
                  <p>
                    Leading Agile and DevOps adoption for a greenfield platform,
                    balancing feature and operational priorities, shifting
                    quality left, expanding automated testing and workspace
                    validation, improving build pipelines, and streamlining
                    enterprise change management.
                  </p>
                  <p>
                    Establishing engineering standards and SDLC governance while
                    coaching engineers through technical guidance, code reviews,
                    and knowledge-sharing sessions.
                  </p>
                </div>
              </li>
              <li>
                <div className="collapsible-header">
                  <i className="material-icons">accessibility_new</i>
                  Accessibility & ADA Compliance
                </div>
                <div className="collapsible-body">
                  <p>
                    Researching accessibility standards, educating design and
                    frontend teams, auditing company websites requirement by
                    requirement, and defining a practical roadmap toward WCAG
                    2.1 AA compliance.
                  </p>
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
