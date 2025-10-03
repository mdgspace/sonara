import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sonara from './pages/Sonara';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Sonara />} />
            </Routes>
        </Router>
    );
}

export default App;