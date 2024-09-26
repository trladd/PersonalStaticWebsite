import React, { useEffect, useState } from "react";
import "./App.css";
import "./DarkMode.css";
import Heading from "./components/Heading";
import SideNav from "./components/SideNav";
import MainPage from "./components/MainPage";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import { siteConfig } from "./utility/siteConfig";
import { ThemeProvider } from "./utility/ThemeContext";

function renderSideProjects() {
  return siteConfig.sideProjects.map((sideProject) => (
    <Route path={sideProject.link} Component={sideProject.component} />
  ));
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <body>
            <Heading title="Trevar Ladd" />
            <SideNav />
            <div className="bodyArea">
              <Routes>
                <Route path="/" Component={MainPage} />
                {renderSideProjects()}
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
