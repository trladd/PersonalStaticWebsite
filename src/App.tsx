import React, { useEffect } from "react";
import "./App.css";
import {
  checkProfileSizing,
  getAge,
  makeScrollspyMove,
} from "./utility/utility";
import Heading from "./components/Heading";
import SideNav from "./components/SideNav";
import MainPage from "./components/MainPage";
import Numeronym from "./components/sideProjects/numeronym/Numeronym";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <div className="App">
        <body>
          <Heading title="Trevar Ladd" />
          <SideNav />
          <div className="bodyArea">
            <Routes>
              <Route path="/" Component={MainPage} />
              <Route path="/sideProjects/numeronym" Component={Numeronym} />
            </Routes>
          </div>
        </body>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
