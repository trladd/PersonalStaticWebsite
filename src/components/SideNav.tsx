import React, { useContext } from "react";
import { siteConfig } from "../utility/siteConfig";
import { ThemeContext } from "../utility/ThemeContext";

const SideNav: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const navLinkList = siteConfig.socialLinks.map((navLink) => (
    <li>
      <a href={navLink.link}>
        {navLink.label}
        <i className="material-icons">
          <img className="navLinkIcon" src={navLink.image} alt={navLink.label} />
        </i>
      </a>
    </li>
  ));

  const sideProjectList = siteConfig.sideProjects.map((sideProject) => (
    <li>
      <a href={sideProject.link}>
        {sideProject.label}
        {sideProject.iconImage ? (
          <img
            className="sideProjectMenuIcon sideProjectMenuIcon--mobile"
            src={sideProject.iconImage}
            alt={`${sideProject.label} icon`}
          />
        ) : (
          <i className="material-icons">{sideProject.icon || "developer_mode"}</i>
        )}
      </a>
    </li>
  ));

  return (
    <ul className="sidenav" id="mobileSideNav">
      {navLinkList}
      <li className="divider"></li>
      {sideProjectList}
      <li className="divider"></li>
      <li>
        <div className="switch">
          <label id="darkModeToggle">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={toggleDarkMode}
            />
            <span className="lever"></span>
            {isDarkMode ? "Dark Mode" : "Light Mode"}
          </label>
        </div>
      </li>
      <li className="divider"></li>
      <li>
        <a
          href="/resume.pdf"
          className="primaryColor waves-effect waves-light btn"
        >
          <i className="material-icons left white-text">attach_file</i>My Resume
        </a>
      </li>
    </ul>
  );
};

export default SideNav;
