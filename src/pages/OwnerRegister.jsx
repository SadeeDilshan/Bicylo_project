import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const OwnerRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- STATE ---
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nic: '', 
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });

  const [files, setFiles] = useState({
    idFront: null,
    idBack: null,
    selfie: null
  });
  
  const [previews, setPreviews] = useState({
    idFront: null,
    idBack: null,
    selfie: null
  });

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [fieldName]: file }));
      setPreviews(prev => ({ ...prev, [fieldName]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Basic Validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      setLoading(false);
      return;
    }
    if (!formData.termsAccepted) {
      alert("Please accept the Terms & Conditions.");
      setLoading(false);
      return;
    }
    if (!files.idFront || !files.idBack || !files.selfie) {
      alert("Please upload all required verification photos.");
      setLoading(false);
      return;
    }

    try {
      // 2. Prepare Data for Node.js Backend (Multipart Form Data)
      const data = new FormData();
      
      // Append Text Fields
      data.append('firstName', formData.firstName);
      data.append('lastName', formData.lastName);
      data.append('email', formData.email);
      data.append('password', formData.password);
      data.append('phone', formData.phone);
      data.append('address', formData.address);
      data.append('nic', formData.nic);

      // Append Files
      data.append('idFront', files.idFront);
      data.append('idBack', files.idBack);
      data.append('selfie', files.selfie);

      // 3. Send to Local Backend (XAMPP/Node)
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        body: data, // Fetch automatically sets the Content-Type to multipart/form-data
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
      }

      alert("Registration Successful! Please Login.");
      navigate('/login');

    } catch (error) {
      console.error("Registration Error:", error);
      alert("Registration Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            
            <div className="card border-0 shadow-lg p-5" style={{ borderRadius: '30px', background: 'rgba(255,255,255,0.9)' }}>
              
              <div className="text-center mb-5">
                <h2 className="fw-bold">Owner Registration</h2>
                <p className="text-muted">Join ByCylo to list your properties. We verify all owners for safety.</p>
              </div>

              <form onSubmit={handleSubmit}>
                
                {/* --- SECTION 1: PERSONAL DETAILS --- */}
                <h5 className="fw-bold mb-3 text-primary">1. Personal Information</h5>
                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">FIRST NAME</label>
                        <input type="text" name="firstName" className="form-control rounded-pill py-3 px-4 bg-light border-0" required onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">LAST NAME</label>
                        <input type="text" name="lastName" className="form-control rounded-pill py-3 px-4 bg-light border-0" required onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">CONTACT NUMBER</label>
                        <input type="tel" name="phone" className="form-control rounded-pill py-3 px-4 bg-light border-0" placeholder="+94 7..." required onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">NIC NUMBER</label>
                        <input type="text" name="nic" className="form-control rounded-pill py-3 px-4 bg-light border-0" placeholder="e.g. 199912345678" required onChange={handleInputChange} />
                    </div>
                    <div className="col-md-12">
                        <label className="form-label small fw-bold text-muted">PERMANENT ADDRESS</label>
                        <input type="text" name="address" className="form-control rounded-pill py-3 px-4 bg-light border-0" required onChange={handleInputChange} />
                    </div>
                </div>

                <hr className="my-5 opacity-10" />

                {/* --- SECTION 2: IDENTITY VERIFICATION --- */}
                <h5 className="fw-bold mb-3 text-primary">2. Identity Verification</h5>
                <p className="small text-muted mb-4">Please upload clear photos. These will not be shown to the public.</p>

                {/* Selfie Upload */}
                <div className="mb-4">
                    <label className="form-label fw-bold small">YOUR PHOTO (SELFIE)</label>
                    <div className="d-flex align-items-center">
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eee', overflow: 'hidden', marginRight: '20px', border: '2px solid #ddd' }}>
                            {previews.selfie ? (
                                <img src={previews.selfie} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span className="d-flex align-items-center justify-content-center h-100 text-muted">?</span>
                            )}
                        </div>
                        <input type="file" className="form-control rounded-pill" accept="image/*" onChange={(e) => handleImageChange(e, 'selfie')} required />
                    </div>
                </div>

                {/* ID Card Uploads */}
                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <label className="form-label fw-bold small">ID CARD (FRONT)</label>
                        <div className="card p-2 border-dashed mb-2 text-center bg-light" style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {previews.idFront ? (
                                <img src={previews.idFront} alt="Front ID" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                            ) : <span className="text-muted small">No file chosen</span>}
                        </div>
                        <input type="file" className="form-control form-control-sm" accept="image/*" onChange={(e) => handleImageChange(e, 'idFront')} required />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label fw-bold small">ID CARD (BACK)</label>
                        <div className="card p-2 border-dashed mb-2 text-center bg-light" style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {previews.idBack ? (
                                <img src={previews.idBack} alt="Back ID" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                            ) : <span className="text-muted small">No file chosen</span>}
                        </div>
                        <input type="file" className="form-control form-control-sm" accept="image/*" onChange={(e) => handleImageChange(e, 'idBack')} required />
                    </div>
                </div>

                <hr className="my-5 opacity-10" />

                {/* --- SECTION 3: ACCOUNT SECURITY --- */}
                <h5 className="fw-bold mb-3 text-primary">3. Account Security</h5>
                <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">EMAIL ADDRESS</label>
                    <input type="email" name="email" className="form-control rounded-pill py-3 px-4 bg-light border-0" required onChange={handleInputChange} />
                </div>
                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">PASSWORD</label>
                        <input type="password" name="password" className="form-control rounded-pill py-3 px-4 bg-light border-0" required onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">CONFIRM PASSWORD</label>
                        <input type="password" name="confirmPassword" className="form-control rounded-pill py-3 px-4 bg-light border-0" required onChange={handleInputChange} />
                    </div>
                </div>

                {/* Terms Checkbox - FIXED HREF WARNING */}
                <div className="form-check mb-4">
                    <input className="form-check-input" type="checkbox" name="termsAccepted" id="terms" required onChange={handleInputChange} />
                    <label className="form-check-label small text-muted" htmlFor="terms">
                        I verify that the information provided is accurate and I accept the <a href="#!" onClick={(e) => e.preventDefault()} className="fw-bold text-dark">Terms of Service</a>.
                    </label>
                </div>

                {/* Submit Button */}
                <button type="submit" className="btn btn-dark w-100 rounded-pill py-3 fw-bold shadow-lg" disabled={loading}>
                    {loading ? "Creating Account..." : "Submit Application"}
                </button>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerRegister;