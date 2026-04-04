import React from 'react';

const Hero = () => {
  return (
    <header className="hero-section">
        <div className="container">
            <h1 className="display-3 fw-bold mb-3" data-aos="fade-up">
                Find Your Space.
            </h1>
            <p className="lead mb-4 mx-auto" style={{ maxWidth: '600px', opacity: 0.9 }} data-aos="fade-up" data-aos-delay="200">
                Connecting students, professionals, and travelers with the perfect rental spaces.
            </p>
        </div>
    </header>
  );
};

export default Hero;