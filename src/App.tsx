import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sonara from './pages/Sonara';
import './App.css';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Sonara />} />
            </Routes>
        </Router>
    );
};

export default App;