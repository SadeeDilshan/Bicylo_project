import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const AddProperty = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- 1. STATE ---
  const [formData, setFormData] = useState({
    title: '',
    audiences: [],
    university_ids: [], // <--- CHANGED: Stores IDs now, not names
    type: 'Annex',
    district_id: '',    // <--- CHANGED: Stores ID
    city_id: '',        // <--- NEW: Stores City ID
    address: '',
    latitude: '',
    longitude: '',
    price: '',
    description: '',
    rules: ''
  });

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [mapUrl, setMapUrl] = useState('');

  // --- 2. DYNAMIC DATA LISTS ---
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [universities, setUniversities] = useState([]);
  
  const propertyTypes = ["Annex", "Single Room", "Shared Room", "Full House", "Apartment", "Villa", "Bungalow"];

  // --- 3. FETCH INITIAL DATA (Auth + Masters) ---
  useEffect(() => {
    const fetchData = async () => {
      // A. Check Auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Please login as an Owner first.");
        navigate('/login');
        return;
      }
      setCurrentUser(session.user);

      // B. Fetch Districts
      const { data: distData } = await supabase.from('districts').select('*').order('name');
      if (distData) setDistricts(distData);

      // C. Fetch Universities
      const { data: uniData } = await supabase.from('universities').select('*').order('name');
      if (uniData) setUniversities(uniData);
    };

    fetchData();
  }, [navigate]);

  // --- 4. FETCH CITIES WHEN DISTRICT CHANGES ---
  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.district_id) {
        setCities([]);
        return;
      }
      const { data } = await supabase
        .from('cities')
        .select('*')
        .eq('district_id', formData.district_id)
        .order('name');
      
      if (data) setCities(data);
    };

    fetchCities();
  }, [formData.district_id]);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (e, field) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const list = prev[field];
      if (checked) return { ...prev, [field]: [...list, value] };
      else return { ...prev, [field]: list.filter(item => item !== value) };
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviewUrls(files.map(file => URL.createObjectURL(file)));
  };

  // --- SMART LOCATION LOGIC (Updated for IDs) ---
  const updateMapFromAddress = () => {
    if (!formData.address || !formData.district_id) return;
    
    // Find district name from ID for Google Maps
    const distName = districts.find(d => String(d.id) === String(formData.district_id))?.name || '';
    const cityName = cities.find(c => String(c.id) === String(formData.city_id))?.name || '';

    const query = `${formData.address}, ${cityName}, ${distName}, Sri Lanka`;
    setMapUrl(`https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
  };

  const updateMapFromCoords = () => {
    if (formData.latitude && formData.longitude) {
       setMapUrl(`https://maps.google.com/maps?q=${formData.latitude},${formData.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
    }
  };

  // --- SUBMIT TO SUPABASE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (formData.audiences.length === 0) return alert("Select at least one Target Audience.");
    if (images.length === 0) return alert("Please upload at least one photo.");

    setLoading(true);

    try {
      // 1. Upload Images Loop
      const uploadedImageUrls = [];
      for (const file of images) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${currentUser.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
        uploadedImageUrls.push(data.publicUrl);
      }

      // 2. Insert Data into DB (Using IDs now)
      const { error: dbError } = await supabase
        .from('properties')
        .insert([{
            owner_id: currentUser.id,
            title: formData.title,
            description: formData.description,
            price: formData.price,
            type: formData.type,
            
            // New ID Fields
            district_id: formData.district_id ? parseInt(formData.district_id) : null,
            city_id: formData.city_id ? parseInt(formData.city_id) : null,
            university_ids: formData.university_ids.map(id => parseInt(id)), // Convert strings to ints
            
            address: formData.address,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            
            rules: formData.rules,
            audiences: formData.audiences,
            images: uploadedImageUrls,
            status: 'pending'
        }]);

      if (dbError) throw dbError;

      alert("Property Submitted Successfully! Waiting for Admin Approval.");
      navigate('/owner-dashboard');

    } catch (error) {
      console.error(error);
      alert("Submission Failed: " + error.message);
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
            
            <div className="card border-0 shadow-lg p-5" style={{ borderRadius: '30px' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold m-0">Publish Property</h2>
                <button className="btn btn-light rounded-pill" onClick={() => navigate('/owner-dashboard')}>Cancel</button>
              </div>

              <form onSubmit={handleSubmit}>
                
                {/* 1. TARGET AUDIENCE */}
                <div className="card bg-light border-0 p-4 mb-4" style={{ borderRadius: '20px' }}>
                    <h5 className="fw-bold text-primary mb-3">1. Target Audience</h5>
                    <div className="d-flex gap-3 flex-wrap">
                        {['student', 'worker', 'traveler'].map((type) => (
                            <div key={type} className="form-check form-check-inline p-3 bg-white rounded shadow-sm" style={{ minWidth: '120px' }}>
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    value={type} 
                                    id={type} 
                                    onChange={(e) => handleMultiSelectChange(e, 'audiences')} 
                                    style={{ transform: 'scale(1.2)', marginRight: '10px' }} 
                                />
                                <label className="form-check-label fw-bold text-capitalize" htmlFor={type}>
                                    {type}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- DYNAMIC UNIVERSITIES --- */}
                <div className="card bg-light border-0 p-4 mb-4" style={{ borderRadius: '20px' }}>
                    <h5 className="fw-bold text-primary mb-3">🎓 Nearby Universities</h5>
                    <p className="small text-muted mb-2">Select all universities within travel distance.</p>
                    
                    <div className="row g-2" style={{maxHeight: '300px', overflowY: 'auto'}}>
                        {universities.map((uni) => (
                            <div key={uni.id} className="col-md-6">
                                <div className="form-check bg-white p-2 rounded border border-0">
                                    <input 
                                        className="form-check-input ms-1" 
                                        type="checkbox" 
                                        value={uni.id} // Save ID
                                        id={`uni-${uni.id}`}
                                        onChange={(e) => handleMultiSelectChange(e, 'university_ids')} 
                                    />
                                    <label className="form-check-label small fw-bold ms-2" htmlFor={`uni-${uni.id}`}>
                                        {uni.name}
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. PROPERTY DETAILS */}
                <h5 className="fw-bold mb-3 text-primary">2. Property Details</h5>
                <div className="mb-3">
                    <label className="form-label fw-bold small">AD TITLE</label>
                    <input type="text" name="title" className="form-control rounded-pill bg-light border-0 py-3 px-4" placeholder="e.g. Luxury Room near SLIIT" required onChange={handleInputChange} />
                </div>
                <div className="row g-3 mb-3">
                    <div className="col-md-6">
                        <label className="form-label fw-bold small">TYPE</label>
                        <select name="type" className="form-select rounded-pill bg-light border-0 py-3 px-4" onChange={handleInputChange}>
                            {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold small">PRICE (LKR/Month)</label>
                        <input type="number" name="price" className="form-control rounded-pill bg-light border-0 py-3 px-4" required onChange={handleInputChange} />
                    </div>
                </div>
                <div className="mb-3">
                    <textarea name="description" className="form-control bg-light border-0 px-4 py-3" rows="3" placeholder="Description..." style={{ borderRadius: '20px' }} onChange={handleInputChange}></textarea>
                </div>
                <div className="mb-4">
                    <label className="form-label fw-bold small text-danger">RULES</label>
                    <textarea name="rules" className="form-control bg-white border border-danger px-4 py-3" rows="2" placeholder="House Rules (e.g. No liquor, Curfew 10pm)" style={{ borderRadius: '20px' }} onChange={handleInputChange}></textarea>
                </div>

                {/* 3. SMART LOCATION (DYNAMIC DISTRICTS & CITIES) */}
                <h5 className="fw-bold mb-3 text-primary">3. Location Verification</h5>
                <div className="card p-4 border-0 shadow-sm mb-4" style={{ borderRadius: '20px', background: '#e9ecef' }}>
                    <div className="row g-3 mb-3">
                        <div className="col-md-4">
                            <label className="form-label fw-bold small">DISTRICT</label>
                            <select name="district_id" className="form-select rounded-pill border-0 py-3 px-4" onChange={handleInputChange} value={formData.district_id}>
                                <option value="">Select District</option>
                                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        
                        {/* NEW CITY DROPDOWN */}
                        <div className="col-md-4">
                            <label className="form-label fw-bold small">CITY / TOWN</label>
                            <select name="city_id" className="form-select rounded-pill border-0 py-3 px-4" onChange={handleInputChange} disabled={!formData.district_id}>
                                <option value="">Select City</option>
                                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="col-md-4">
                            <label className="form-label fw-bold small">ADDRESS</label>
                            <input 
                                type="text" 
                                name="address" 
                                className="form-control border-0 py-3 px-4" 
                                placeholder="Type address..." 
                                style={{ borderRadius: '50px' }} 
                                onChange={handleInputChange}
                                onBlur={updateMapFromAddress} 
                            />
                        </div>
                    </div>

                    {/* MAP PREVIEW */}
                    <div className="mb-3 bg-white rounded overflow-hidden shadow-sm position-relative" style={{ height: '300px', borderRadius: '20px' }}>
                        {mapUrl ? (
                            <iframe width="100%" height="100%" frameBorder="0" src={mapUrl}></iframe>
                        ) : (
                            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                Select District, City & Type Address to load map.
                            </div>
                        )}
                    </div>

                    {/* COORDINATE OVERRIDE */}
                    <div className="accordion" id="accordionExample">
                        <div className="accordion-item border-0 bg-transparent">
                            <h2 className="accordion-header">
                                <button className="accordion-button collapsed bg-white rounded-pill shadow-sm collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">
                                    📍 Map is wrong? Use Exact Coordinates
                                </button>
                            </h2>
                            <div id="collapseOne" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                                <div className="accordion-body pt-3">
                                    <div className="row g-2">
                                        <div className="col-5">
                                            <input type="text" name="latitude" placeholder="Latitude" className="form-control rounded-pill" onChange={handleInputChange} />
                                        </div>
                                        <div className="col-5">
                                            <input type="text" name="longitude" placeholder="Longitude" className="form-control rounded-pill" onChange={handleInputChange} />
                                        </div>
                                        <div className="col-2">
                                            <button type="button" className="btn btn-dark w-100 rounded-pill" onClick={updateMapFromCoords}>Set</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. PHOTOS */}
                <h5 className="fw-bold mb-3 text-primary">4. Photos</h5>
                <div className="mb-4">
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="form-control" />
                    <div className="d-flex gap-2 overflow-auto mt-3">
                        {previewUrls.map((url, i) => (
                            <div key={i} style={{ minWidth: '100px', height: '100px', borderRadius: '10px', overflow: 'hidden' }}>
                                <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ))}
                    </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-lg" disabled={loading}>
                    {loading ? "Uploading Property..." : "🚀 Submit Ad for Review"}
                </button>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProperty;