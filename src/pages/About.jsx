import React from 'react';
import Navbar from '../components/Navbar';

const About = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Navbar />

      {/* --- HERO SECTION --- */}
      <div 
        className="position-relative d-flex align-items-center justify-content-center text-center text-white"
        style={{ 
            height: '60vh', 
            background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }}
      >
        <div className="container" data-aos="fade-up">
            <h1 className="display-2 fw-bold mb-3">We Are ByCylo.</h1>
            <p className="lead mx-auto" style={{ maxWidth: '700px', fontSize: '1.4rem', opacity: 0.9 }}>
                Revolutionizing the way students, professionals, and travelers find their perfect space in Sri Lanka.
            </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-80px', paddingBottom: '80px', position: 'relative', zIndex: 2 }}>
        
        {/* --- MISSION CARD --- */}
        <div className="card border-0 shadow-lg p-5 mb-5" style={{ borderRadius: '30px', background: 'rgba(255,255,255,0.95)' }} data-aos="fade-up">
            <div className="row align-items-center">
                <div className="col-md-6 mb-4 mb-md-0">
                    <h5 className="text-primary fw-bold text-uppercase ls-2">Our Mission</h5>
                    <h2 className="fw-bold mb-4 display-6">Connecting People to Places.</h2>
                    <p className="text-muted lead">
                        Finding a boarding place used to be hard. Walking miles, calling random numbers, and dealing with brokers.
                    </p>
                    <p className="text-muted">
                        <strong>ByCylo</strong> changes that. We built a platform where trust meets convenience. Whether you are a student looking for a budget room near campus, or a traveler seeking a villa in Ella, we bridge the gap between you and property owners.
                    </p>
                </div>
                <div className="col-md-6 text-center">
                    <img 
                        src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                        alt="Teamwork" 
                        className="img-fluid shadow-sm"
                        style={{ borderRadius: '20px' }}
                    />
                </div>
            </div>
        </div>

        {/* --- STATS SECTION --- */}
        <div className="row g-4 mb-5 text-center" data-aos="fade-up" data-aos-delay="100">
            <div className="col-md-4">
                <div className="p-4 bg-white shadow-sm rounded-4 h-100">
                    <h1 className="fw-bold text-primary display-4">50+</h1>
                    <p className="text-muted fw-bold m-0">Universities Covered</p>
                </div>
            </div>
            <div className="col-md-4">
                <div className="p-4 bg-white shadow-sm rounded-4 h-100">
                    <h1 className="fw-bold text-success display-4">1,200+</h1>
                    <p className="text-muted fw-bold m-0">Verified Listings</p>
                </div>
            </div>
            <div className="col-md-4">
                <div className="p-4 bg-white shadow-sm rounded-4 h-100">
                    <h1 className="fw-bold text-warning display-4">10k+</h1>
                    <p className="text-muted fw-bold m-0">Happy Users</p>
                </div>
            </div>
        </div>

        {/* --- TEAM SECTION --- */}
        <div className="text-center mt-5" data-aos="fade-up">
            <h6 className="text-uppercase text-muted fw-bold mb-3">Who Built This?</h6>
            <h2 className="fw-bold mb-5">Meet the Creator</h2>
            
            <div className="card border-0 shadow-sm d-inline-block p-4" style={{ borderRadius: '20px', maxWidth: '400px' }}>
                <div className="mb-3">
                    {/* Placeholder for your photo */}
                    <div style={{ width: '100px', height: '100px', background: '#ddd', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        👨‍💻
                    </div>
                </div>
                <h4 className="fw-bold m-0">Sadeepa Dilshan</h4>
                <p className="text-primary fw-bold small">Founder & Lead Developer</p>
                <p className="text-muted small mt-3">
                    "I built ByCylo to solve the struggle I faced finding boarding places. Technology should make life easier, not harder."
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default About;