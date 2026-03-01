import React from "react";

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
        management, routing for managing different pages, and a great way to
        render content in a metadata-driven fashion. Much of the content on my
        main page is stored as configuration. In simplest terms, why hardcode
        HTML when you can programmatically render repeating elements instead? It
        also provides the ability for me to host side projects as well. These
        side projects are here for fun, and to occasionally play around with a
        new topic.
      </p>
      <h3>Hosting</h3>
      <p>
        For hosting, I am using AWS. Why? The answer to that is pretty simple -
        because at a previous company I started doing training for AWS and went
        pretty far with it. I also did some training in Azure but prefer AWS.
        While there are much easier platforms for hosting a static site, I like
        using AWS because it translates to something real companies can use -
        and a transferable skill.
      </p>
      <p>
        Of course I like that AWS offers scalability of free tier services that
        can also scale up to enterprise size allowing for vast differences in
        demand.
      </p>
      <p>
        I started out with a simple S3 bucket, but as my needs grew, I started
        using other services too.
      </p>
      <ul>
        <li>
          <b>S3</b>: For simple static hosting
        </li>
        <li>
          <b>CloudFront</b>: For CDN and HTTPS
        </li>
        <li>
          <b>Route 53</b>: For DNS
        </li>
        <li>
          <b>CodeBuild</b>: For Building into my S3 Bucket
        </li>
        <li>
          <b>CodePipeline</b>: For Continuous Deployment when I push to main
        </li>
      </ul>
      <h3>Analytics</h3>
      <p>
        I am using Google Analytics to track user interactions. It's not that
        this site gets much (if any) traffic, but nevertheless it is interesting
        to see traffic, and play around with a common tool used by many. I don't
        use this data for anything other than personal interest.
      </p>
      <h3>Source Code</h3>
      <p>
        <a href="https://github.com/trladd/PersonalStaticWebsite/tree/main">
          Github Source Code
        </a>
      </p>
    </div>
  );
}

export default About;
