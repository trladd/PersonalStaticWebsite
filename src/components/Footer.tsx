import React from "react";
import { siteConfig } from "../siteConfig";

const navLinkList = siteConfig.socialLinks.map((navLink) => (
  <li>
    <a href={navLink.link} className="grey-text text-lighten-3">
      {navLink.label}
      <i className="material-icons">
        <img className="navLinkIcon" src={navLink.image} />
      </i>
    </a>
  </li>
));

const Footer: React.FC = () => {
  return (
    <footer className="page-footer secondaryColor">
      <div className="container">
        <div className="row">
          <div className="col l6 s12">
            <h5 className="white-text">Connect with me</h5>
            <p className="grey-text text-lighten-4">
              If you would like to get to know me more, or collaborate - feel
              free to reach out to me on one of my linked social media platforms
              or email
            </p>

            <p>
              <a
                className="white-text"
                href="mailto:trevarladd@gmail.com?subject = Reaching out from your website&body = Hi Trevar, \nI was browsing your website and wanted to understand more about you..."
              >
                trevarladd@gmail.com
              </a>
            </p>
          </div>
          <div className="col l4 offset-l2 s12">
            <h5 className="white-text">Links</h5>
            <ul>{navLinkList}</ul>
          </div>
        </div>
      </div>
      <div className="footer-copyright primaryColor">
        <div className="container">
          © 2024 Copyright
          <a
            className="grey-text text-lighten-4 right"
            href="/resources/resume.pdf"
          >
            View My Resume
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
