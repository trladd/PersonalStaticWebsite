const socialLinks: { link: string; image: string; label: string }[] = [
  {
    link: "https://www.linkedin.com/in/trevarladd",
    image: "images/linkedin.png",
    label: "LinkedIn",
  },
  {
    link: "https://github.com/trladd/",
    image: "images/github.png",
    label: "GitHub",
  },
  {
    link: "https://www.facebook.com/trevor.ladd.71",
    image: "images/facebook.png",
    label: "Facebook",
  },
  {
    link: "https://www.instagram.com/trevarladd/",
    image: "images/instagram.png",
    label: "Instagram",
  },
];

const skills: { title: string; list: { name: string; rating: number }[] }[] = [
  {
    title: "Technology",
    list: [
      { name: "JavaScript/Typescript (frontend and backend)", rating: 5 },
      { name: "Java", rating: 4 },
      { name: "C++", rating: 3 },
      { name: "AWS", rating: 5 },
      { name: "Azure", rating: 4 },
      { name: "MongoDB", rating: 4 },
      { name: "Pega Platform", rating: 4 },
      { name: "Jest", rating: 5 },
    ],
  },
  {
    title: "Software",
    list: [
      { name: "Salesforce", rating: 4 },
      { name: "Mac OS", rating: 5 },
      { name: "MS Windows", rating: 5 },
      { name: "VSCode", rating: 5 },
      { name: "Microsoft Office", rating: 5 },
      { name: "Git", rating: 5 },
      { name: "NPM", rating: 5 },
      { name: "Putty", rating: 5 },
      { name: "WinSCP", rating: 5 },
      { name: "Eclipse", rating: 5 },
      { name: "Jenkins", rating: 5 },
      { name: "Swagger", rating: 5 },
    ],
  },
  {
    title: "Soft Skills",
    list: [
      { name: "Technical Leadership", rating: 5 },
      { name: "Software Engineering", rating: 5 },
      { name: "Leading Agile Adoption", rating: 5 },
      { name: "Educating Others", rating: 5 },
      { name: "Continuous Learning", rating: 5 },
    ],
  },
];

const sideProjects: { link: string; label: string }[] = [
  {
    link: "/sideProjects/numeronym",
    label: "Numeronym Generator",
  },
];

const siteConfig = {
  socialLinks,
  skills,
  sideProjects,
};

export { siteConfig };
