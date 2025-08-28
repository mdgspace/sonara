import React, { useEffect, useState } from 'react';
import AddModule from './add.js';  // Just import, no declare here

const WasmAddComponent: React.FC = () => {
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    AddModule().then((Module) => {
      const sum = Module.ccall('add', 'number', ['number', 'number'], [5, 10]);
      setResult(sum);
    });
  }, []);

  return (
    <div>
      <h1>Wasm C++ Addition with React + Vite + TypeScript</h1>
      {result !== null ? <p>Result of 5 + 10 = {result}</p> : <p>Loading...</p>}
    </div>
  );
};

export default WasmAddComponent;
