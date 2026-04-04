import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './index.css';



// COMPONENTS
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Portals from './components/Portals';
import Footer from './components/Footer';

// PAGES
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerRegister from './pages/OwnerRegister';
import AddProperty from './pages/AddProperty';
import About from './pages/About';
import Contact from './pages/Contact';
import StudentListings from './pages/StudentListings';
import WorkerListings from './pages/WorkerListings';
import TravelerListings from './pages/TravelerListings';
import AdminDashboard from './pages/AdminDashboard';

// --- 1. NEW IMPORT (This was missing) ---
import ListingDetails from './pages/ListingDetails';

function App() {
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <Router>
      <div className="App d-flex flex-column min-vh-100">
        
        <div className="flex-grow-1">
          <Routes>
            
            {/* HOME */}
            <Route path="/" element={
              <>
                <Navbar />
                <Hero />
                <Portals />
              </>
            } />

            {/* LISTINGS */}
            <Route path="/student-listings" element={<StudentListings />} />
            <Route path="/worker-listings" element={<WorkerListings />} />
            <Route path="/traveler-listings" element={<TravelerListings />} />

            {/* --- 2. NEW ROUTE (This fixes the blank page) --- */}
            <Route path="/listing/:id" element={<ListingDetails />} />

            {/* AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* OWNER */}
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/owner-register" element={<OwnerRegister />} />
            <Route path="/add-property" element={<AddProperty />} />
            
            {/* INFO */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* ADMIN */}
            <Route path="/admin" element={<AdminDashboard />} />
            

            <Route path="/owner-register" element={<OwnerRegister />} />

          </Routes>
        </div>

        <Footer />
        
      </div>
    </Router>
  );
}

export default App;