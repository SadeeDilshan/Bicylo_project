import React from 'react';

const Footer = () => {
  return (
    <footer className="pt-5 pb-3" style={{ background: 'white', borderTop: '1px solid rgba(0,0,0,0.05)', position: 'relative', zIndex: 10 }}>
      <div className="container">
        <div className="row g-4 justify-content-between">
          
          {/* 1. BRAND SECTION */}
          <div className="col-lg-4 col-md-6">
            <a className="navbar-brand fw-bold fs-3 mb-3 d-block" href="/">
              By<span className="text-primary">Cylo</span>
            </a>
            <p className="text-muted small mb-4" style={{ maxWidth: '300px' }}>
              Revolutionizing the rental experience in Sri Lanka. Whether you are studying, working, or traveling, find your perfect space with us.
            </p>
            {/* Social Icons */}
            <div className="d-flex gap-3">
              {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                <a key={social} href="#" className="btn btn-light rounded-circle shadow-sm" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={`https://www.svgrepo.com/show/303${social === 'facebook' ? '114/facebook-3-logo' : social === 'twitter' ? '115/twitter-3-logo' : social === 'instagram' ? '145/instagram-2-1-logo' : '299/linkedin-icon-2-logo'}.svg`} alt={social} width="18" />
                </a>
              ))}
            </div>
          </div>

          {/* 2. QUICK LINKS - PORTALS */}
          <div className="col-lg-2 col-md-6">
            <h6 className="fw-bold mb-3">Discover</h6>
            <ul className="list-unstyled d-grid gap-2">
              <li><a href="/student-listings" className="text-decoration-none text-muted small hover-primary">Student Boardings</a></li>
              <li><a href="/worker-listings" className="text-decoration-none text-muted small hover-primary">Worker Annexes</a></li>
              <li><a href="/traveler-listings" className="text-decoration-none text-muted small hover-primary">Holiday Villas</a></li>
            </ul>
          </div>

          {/* 3. COMPANY LINKS */}
          <div className="col-lg-2 col-md-6">
            <h6 className="fw-bold mb-3">Company</h6>
            <ul className="list-unstyled d-grid gap-2">
              <li><a href="/about" className="text-decoration-none text-muted small hover-primary">About Us</a></li>
              <li><a href="/contact" className="text-decoration-none text-muted small hover-primary">Contact Support</a></li>
              <li><a href="#" className="text-decoration-none text-muted small hover-primary">Careers</a></li>
            </ul>
          </div>

        </div>

        <hr className="my-5 opacity-10" />

        {/* BOTTOM BAR */}
        <div className="d-md-flex justify-content-between align-items-center text-center">
          <p className="small text-muted mb-2 mb-md-0">&copy; 2025 ByCylo. All rights reserved.</p>
          <div className="d-flex gap-4 justify-content-center">
            <a href="#" className="small text-muted text-decoration-none">Privacy Policy</a>
            <a href="#" className="small text-muted text-decoration-none">Terms of Service</a>
          </div>
        </div>
      </div>
      
      {/* Simple CSS for hover effect in footer */}
      <style>
        {`
        .hover-primary:hover { color: #007AFF !important; }
        `}
      </style>
    </footer>
  );
};

export default Footer;