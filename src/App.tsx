import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import "./DarkMode.css";
import Heading from "./components/Heading";
import SideNav from "./components/SideNav";
import MainPage from "./components/MainPage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import { siteConfig } from "./utility/siteConfig";
import { ThemeProvider } from "./utility/ThemeContext";
import CarCostAbout from "./components/sideProjects/carCost/about/CarCostAbout";

function renderSideProjects(navWrapperRef: React.RefObject<HTMLDivElement>) {
  return siteConfig.sideProjects.map((sideProject) => (
    <Route
      key={sideProject.link}
      path={sideProject.link}
      element={React.cloneElement(React.createElement(sideProject.component), {
        navWrapperRef,
      })}
    />
  ));
}

function App() {
  const navWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <body>
            <Heading title="Trevar Ladd" navWrapperRef={navWrapperRef} />
            <SideNav />
            <div className="bodyArea">
              <Routes>
                <Route path="/" Component={MainPage} />
                <Route path="/sideProjects/carCost/about" Component={CarCostAbout} />
                {renderSideProjects(navWrapperRef)}
              </Routes>
            </div>
          </body>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
