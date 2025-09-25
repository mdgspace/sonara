import { useState, useMemo, useEffect } from "react";
import Display from "./components/Display";
import { applyShape } from "./utils";

function App() {
  const [nodes, setNodes] = useState([
    { x: 0, y: 0.5 },
    { x: 1, y: 0.2 },
    { x: 2, y: 0.8 },
    { x: 3, y: 0.4 },
    { x: 4, y: 0.6 },
  ]);
  const xRange = [0, 4];
  const [curves, setCurves] = useState([0.8, -0.8, 0.5, -0.5]);

  return (
    <>
      <h1>Sonara Synthesizer</h1>
      <Display
        width={400}
        height={200}
        nodes={nodes}
        onNodesChange={setNodes}
        xRange={xRange}
        curves={curves}
        onCurvesChange={setCurves} />
    </>
  )
}

export default App
