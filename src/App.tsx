import React from "react";
import "./App.scss";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import HuggyWuggy from "./pages/HuggyWuggy";
import Dots from "./pages/Dots";
import { Link } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <header className="app__header">
          <Link to="/" className="app__header__title">
            <h1>Interactive</h1>
          </Link>
          <nav className="app__header__nav">
            <ul>
              <li>
                <Link to="/dots">dots</Link>
              </li>
              <li>
                <Link to="/huggywuggy">Huggy Wuggy</Link>
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
