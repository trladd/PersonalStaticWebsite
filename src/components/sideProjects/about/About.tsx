import React from "react";
import GoldStars from "../../GoldStars";

function About() {
  return (
    <div className="container flow-text">
      <p>
        <b>Why did I create this site?</b> I created this site to have a place
        to showcase my skills, play around, and in general keep my general
        software development skills sharp. Often times working in an enterprise
        environment, we find ourselves working on the same tech stack, sometimes
        which might be isolated to a niche technology. I think it is best to
        maintain a variety of tools and tech stack to help maintain a spirit of
        innovation.
      </p>
      <p>
        Aside from showcasing my skills, I enjoy having an area where I can play
        around with simple projects.
      </p>
      <h2>How is this site built?</h2>
      <h3>Frontend</h3>
      <p>
        This site is built using React. It provides great features like state
        management, routers for managing different pages, and a great way to
        render content in a metadata driven fashion. Much of the content on my
        main page is stored as configuration. In simplest terms, why hardcode
        html when you can programatically render repeating elements instead? It
        also provides the ability for me to host side projects as well. These
        side projects are here for fun, and to occasinoally play around with a
        new topic.
      </p>
      <h3>Hosting</h3>
      <p>
        For hosting, I am using AWS S3. I like that AWS offers scalability of
        free tier services that can also scale up to enterprise size allowing
        for vast differences in demand. I use AWS Route 53 where I have
        registered domains, codepipeline where my code is deployed once pushed
        to my main branch.
      </p>
    </div>
  );
}

export default About;
