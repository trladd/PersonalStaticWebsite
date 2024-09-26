import React, { useEffect, useContext, useRef } from "react";
import { siteConfig } from "../utility/siteConfig";
import { ThemeContext } from "../utility/ThemeContext"; // Adjust the import path as necessary

interface HeadingProps {
  title: string;
}

//build a nav link for each object in the navLinks array
const navLinkList = siteConfig.socialLinks.map((navLink) => (
  <li>
    <a href={navLink.link}>
      <img className="navLinkIcon" src={navLink.image} />
    </a>
  </li>
));
const sideProjectList = siteConfig.sideProjects.map((sideProject) => (
  <li className="black-text">
    <a href={sideProject.link} className="black-text">
      {sideProject.label}
      <i className="material-icons black-text">
        {sideProject.icon || "developer_mode"}
      </i>
    </a>
  </li>
));

const Heading: React.FC<HeadingProps> = ({ title }) => {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  useEffect(() => {
    var sideNav = document.querySelectorAll(".sidenav");
    var instances = M.Sidenav.init(sideNav, {});

    var dropDown = document.querySelectorAll(".dropdown-trigger");
    M.Dropdown.init(dropDown, {
      alignment: "right",
      constrainWidth: false,
      inDuration: 300,
      outDuration: 500,
    });
  }, []);

  return (
    <div className="application-header">
      <ul id="sideProjects" className="dropdown-content sideProjects">
        {sideProjectList}
      </ul>

      <nav className="primaryColor">
        <div className="nav-wrapper">
          <a href="/" className="brand-logo" id="headerName">
            {" "}
            {title}
          </a>
          <a href="#" data-target="mobileSideNav" className="sidenav-trigger">
            <i className="material-icons">menu</i>
          </a>
          <ul id="nav-links" className="right hide-on-med-and-down">
            <li>
              <div className="switch">
                <label id="darkModeToggle">
                  {isDarkMode ? "Dark Mode" : "Light Mode"}
                  <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={toggleDarkMode}
                  />
                  <span className="lever"></span>
                </label>
              </div>
            </li>
            {navLinkList}
            <li>
              <a
                className="dropdown-trigger"
                href="#!"
                data-target="sideProjects"
              >
                Side Projects
                <i className="material-icons right">arrow_drop_down</i>
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Heading;
