import React, { useEffect } from "react";
import { siteConfig } from "../utility/siteConfig";

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
  <li>
    <a href={sideProject.link} className="grey darken-4">
      {sideProject.label}
      <i className="material-icons">{sideProject.icon || "developer_mode"}</i>
    </a>
  </li>
));

const Heading: React.FC<HeadingProps> = ({ title }) => {
  useEffect(() => {
    //@ts-ignore
    $(".dropdown-trigger").dropdown();
    // @ts-ignore
    $(".sidenav").sidenav();
  }, []);

  return (
    <div className="application-header">
      <ul id="sideProjects" className="dropdown-content">
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
