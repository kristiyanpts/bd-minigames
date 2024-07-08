import React from "react";
import "./App.css";
import { debugData } from "../utils/debugData";
import { Route, Routes, useNavigate } from "react-router-dom";
import Home from "./Home";
import Thermite from "../minigames/thermite/Thermite";
import Pincracker from "../minigames/pincracker/Pincracker";
import Chopping from "../minigames/chopping/Chopping";
import Lockpick from "../minigames/lockpick/Lockpick";
import RoofRunning from "../minigames/roofrunning/RoofRunning";
import WordMemory from "../minigames/wordmemory/WordMemory";
import { useNuiEvent } from "../hooks/useNuiEvent";
import { Minigame } from "../types/general";
import LaptopTerminal from "../minigames/laptopterminal/LaptopTerminal";

debugData([
  {
    action: "setVisible",
    data: true,
  },
]);

const App: React.FC = () => {
  const navigate = useNavigate();

  useNuiEvent("navigateMinigame", (data: Minigame) => {
    navigate(data.minigame);
  });

  return (
    <div className="h-full w-full p-5 m-auto flex items-center justify-center">
      <Routes>
        <Route path="/">
          <Route index element={<Home />} />
          <Route path="/thermite" element={<Thermite />} />
          <Route path="/pincracker" element={<Pincracker />} />
          <Route path="/chopping" element={<Chopping />} />
          <Route path="/lockpick" element={<Lockpick />} />
          <Route path="/roof-running" element={<RoofRunning />} />
          <Route path="/word-memory" element={<WordMemory />} />
          <Route path="/laptop-terminal" element={<LaptopTerminal />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
