import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Synth from './pages/Synth.jsx';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Synth />} />
            </Routes>
        </Router>
    );
}

export default App;
