import React from "react";
import "./App.scss";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import HuggyWuggy from "./pages/HuggyWuggy";
import Dots from "./pages/Dots";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <header className="app__header">
         
          <nav className="app__header__nav">
            <ul>
              <li>
                <NavLink
                  to="/dots"
                  className={({ isActive }) => (isActive ? "nav--active" : "")}
                >
                  DOTS
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/huggywuggy"
                  className={({ isActive }) => (isActive ? "nav--active" : "")}
                >
                  HUGGY WUGGY
                </NavLink>
              </li>
            </ul>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dots" element={<Dots />} />
          <Route path="/huggywuggy" element={<HuggyWuggy />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
