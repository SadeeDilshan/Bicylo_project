import React, { useState } from 'react';
import Navbar from '../components/Navbar';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Message Sent! We will get back to you shortly.");
    setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Navbar />

      {/* --- HERO HEADER --- */}
      <div 
        className="text-center text-white d-flex align-items-center justify-content-center"
        style={{ 
            height: '40vh', 
            background: 'linear-gradient(135deg, #007AFF, #00c6ff)',
            marginBottom: '-100px', // Overlap effect
            paddingBottom: '100px'
        }}
      >
        <div data-aos="fade-up">
            <h1 className="fw-bold display-4">Get in Touch</h1>
            <p className="lead opacity-75">Have questions? We'd love to hear from you.</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '80px' }}>
        <div className="row justify-content-center">
          
          {/* --- LEFT: CONTACT FORM --- */}
          <div className="col-lg-7 mb-5" data-aos="fade-up" data-aos-delay="100">
            <div className="card border-0 shadow-lg p-5" style={{ borderRadius: '30px', background: 'rgba(255,255,255,0.95)' }}>
              <h3 className="fw-bold mb-4">Send us a Message</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-3">
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">YOUR NAME</label>
                        <input type="text" name="name" className="form-control rounded-pill bg-light border-0 py-3 px-4" required value={formData.name} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">EMAIL ADDRESS</label>
                        <input type="email" name="email" className="form-control rounded-pill bg-light border-0 py-3 px-4" required value={formData.email} onChange={handleChange} />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">SUBJECT</label>
                    <select name="subject" className="form-select rounded-pill bg-light border-0 py-3 px-4" value={formData.subject} onChange={handleChange}>
                        <option value="">Select a Topic...</option>
                        <option value="Support">Help & Support</option>
                        <option value="Listing">Problem with a Listing</option>
                        <option value="Owner">Owner Registration</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="form-label small fw-bold text-muted">MESSAGE</label>
                    <textarea name="message" className="form-control bg-light border-0 px-4 py-3" rows="5" placeholder="How can we help you?" style={{ borderRadius: '20px' }} required value={formData.message} onChange={handleChange}></textarea>
                </div>

                <button type="submit" className="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-sm">
                    Send Message ✈️
                </button>
              </form>
            </div>
          </div>

          {/* --- RIGHT: INFO & FAQ --- */}
          <div className="col-lg-5" data-aos="fade-up" data-aos-delay="200">
            
            {/* Info Cards */}
            <div className="card border-0 shadow-sm p-4 mb-4 text-center" style={{ borderRadius: '20px' }}>
                <div className="mb-3 text-primary" style={{ fontSize: '2rem' }}>📍</div>
                <h5 className="fw-bold">Our Office</h5>
                <p className="text-muted small">123, Lotus Road, Colombo 07, Sri Lanka</p>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-6">
                    <div className="card border-0 shadow-sm p-4 text-center h-100" style={{ borderRadius: '20px' }}>
                        <div className="mb-2 text-success" style={{ fontSize: '1.5rem' }}>📞</div>
                        <h6 className="fw-bold">Phone</h6>
                        <p className="text-muted small m-0">+94 77 123 4567</p>
                    </div>
                </div>
                <div className="col-6">
                    <div className="card border-0 shadow-sm p-4 text-center h-100" style={{ borderRadius: '20px' }}>
                        <div className="mb-2 text-warning" style={{ fontSize: '1.5rem' }}>✉️</div>
                        <h6 className="fw-bold">Email</h6>
                        <p className="text-muted small m-0">help@bycylo.com</p>
                    </div>
                </div>
            </div>

            {/* FAQ Accordion */}
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
                <h5 className="fw-bold mb-3">FAQ</h5>
                
                <div className="accordion accordion-flush" id="faqAccordion">
                    
                    <div className="accordion-item border-0 mb-2">
                        <h2 className="accordion-header">
                            <button className="accordion-button collapsed bg-light rounded-3 fw-bold shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                                Is ByCylo free to use?
                            </button>
                        </h2>
                        <div id="faq1" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                            <div className="accordion-body text-muted small">
                                Yes! Students and workers can search for free. Only owners pay a small fee to list premium properties.
                            </div>
                        </div>
                    </div>

                    <div className="accordion-item border-0 mb-2">
                        <h2 className="accordion-header">
                            <button className="accordion-button collapsed bg-light rounded-3 fw-bold shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                                How do I contact an owner?
                            </button>
                        </h2>
                        <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                            <div className="accordion-body text-muted small">
                                Simply click "View Details" on any ad. You will see the owner's phone number or a "Chat" button.
                            </div>
                        </div>
                    </div>

                    <div className="accordion-item border-0">
                        <h2 className="accordion-header">
                            <button className="accordion-button collapsed bg-light rounded-3 fw-bold shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                                Can I list my house?
                            </button>
                        </h2>
                        <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                            <div className="accordion-body text-muted small">
                                Absolutely. Create an account, select "Property Owner", and verify your ID to start publishing ads.
                            </div>
                        </div>
                    </div>

                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;