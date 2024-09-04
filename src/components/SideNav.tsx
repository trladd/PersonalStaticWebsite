import React from "react";
import { siteConfig } from "../utility/siteConfig";

const SideNav: React.FC = () => {
  const navLinkList = siteConfig.socialLinks.map((navLink) => (
    <li>
      <a href={navLink.link}>
        {navLink.label}
        <i className="material-icons">
          <img className="navLinkIcon" src={navLink.image} />
        </i>
      </a>
    </li>
  ));

  const sideProjectList = siteConfig.sideProjects.map((sideProject) => (
    <li>
      <a href={sideProject.link}>
        {sideProject.label}
        <i className="material-icons">{sideProject.icon || "developer_mode"}</i>
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
        <a
          href="/resources/resume.pdf"
          className="primaryColor waves-effect waves-light btn"
        >
          <i className="material-icons left">attach_file</i>My Resume
        </a>
      </li>
    </ul>
  );
};

export default SideNav;
