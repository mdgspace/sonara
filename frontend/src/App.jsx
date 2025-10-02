import { useState } from 'react'

import './App.css'
import Synthesizer from './components/Synthesizer'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Synthesizer/>
    </>
  )
}

export default App
