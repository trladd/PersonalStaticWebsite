import React from "react";
import Numeronym from "../components/sideProjects/numeronym/Numeronym";
import About from "../components/sideProjects/about/About";
import SiteDebugTools from "../components/sideProjects/siteDebugTools/SiteDebugTools";

interface ComponentWithNavWrapperRefProps {
  navWrapperRef: React.RefObject<HTMLDivElement>;
}

type ComponentWithNavWrapperRef = React.FC<ComponentWithNavWrapperRefProps>;

const socialLinks: { link: string; image: string; label: string }[] = [
  {
    link: "https://www.linkedin.com/in/trevarladd",
    image: "/images/linkedin.png",
    label: "LinkedIn",
  },
  {
    link: "https://github.com/trladd/",
    image: "/images/github.png",
    label: "GitHub",
  },
  {
    link: "https://www.facebook.com/trevor.ladd.71",
    image: "/images/facebook.png",
    label: "Facebook",
  },
  {
    link: "https://www.instagram.com/trevarladd/",
    image: "/images/instagram.png",
    label: "Instagram",
  },
];

const skills: { title: string; list: { name: string; rating: number }[] }[] = [
  {
    title: "Technology",
    list: [
      { name: "JavaScript/Typescript General", rating: 5 },
      { name: "NodeJS", rating: 4 },
      { name: "React", rating: 4 },
      { name: "LWC", rating: 5 },
      { name: "Java", rating: 4 },
      { name: "C++", rating: 2 },
      { name: "AWS", rating: 3 },
      { name: "Azure", rating: 1 },
      { name: "MongoDB", rating: 2 },
      { name: "Pega Platform", rating: 5 },
      { name: "Jest", rating: 5 },
    ],
  },
  {
    title: "Software",
    list: [
      { name: "Salesforce", rating: 4 },
      { name: "Splunk", rating: 4 },
      { name: "Mac OS", rating: 5 },
      { name: "MS Windows", rating: 5 },
      { name: "VSCode", rating: 5 },
      { name: "Microsoft Office", rating: 5 },
      { name: "Git", rating: 5 },
      { name: "NPM", rating: 4 },
      { name: "Vscode", rating: 5 },
      { name: "Jenkins", rating: 3 },
      { name: "Swagger", rating: 3 },
    ],
  },
  {
    title: "Soft Skills",
    list: [
      { name: "Technical Leadership", rating: 5 },
      { name: "Software Engineering", rating: 5 },
      { name: "Agile Practices", rating: 5 },
      { name: "Educating Others", rating: 4 },
      { name: "Continuous Learning", rating: 4 },
    ],
  },
  {
    title: "Miscellaneous",
    list: [
      { name: "Automotive", rating: 5 },
      { name: "Plumbing", rating: 4 },
      { name: "Electrical", rating: 4 },
      { name: "Carpentry", rating: 3 },
      { name: "Cooking", rating: 1 },
      { name: "Gardening", rating: 3 },
      { name: "Home Repair", rating: 5 },
      { name: "Music", rating: 0 },
    ],
  },
];

const sideProjects: {
  link: string;
  label: string;
  icon?: string;
  component: ComponentWithNavWrapperRef;
}[] = [
  {
    link: "/sideProjects/about",
    label: "About This Site",
    icon: "info_outline",
    component: About as ComponentWithNavWrapperRef,
  },
  {
    link: "/sideProjects/numeronym",
    label: "Numeronym Converter",
    icon: "shuffle",
    component: Numeronym as ComponentWithNavWrapperRef,
  },
  {
    link: "/sideProjects/siteDebugTools",
    label: "Site Debug Tools",
    component: SiteDebugTools as ComponentWithNavWrapperRef,
  },
];

const siteConfig = {
  socialLinks,
  skills,
  sideProjects,
};

export { siteConfig };
