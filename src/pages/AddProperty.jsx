import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import imageCompression from 'browser-image-compression';
import MultiUniversitySelect from '../components/MultiUniversitySelect'; 

const AddProperty = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false); // 🚨 අලුත් State එක Location ගන්නකොට Loading පෙන්නන්න

  // --- REFERENCE DATA STATES ---
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [universities, setUniversities] = useState([]);

  // --- FORM STATES ---
  const [plan, setPlan] = useState('basic'); 
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', type: 'Boarding Place', gender: 'Any',
    district_id: '', city_id: '', address: '',
    latitude: '', longitude: '' // 🚨 අලුත් Fields 2
  });
  
  const [selectedAudiences, setSelectedAudiences] = useState(['Student']); 
  const [selectedUniversities, setSelectedUniversities] = useState([]);

  // --- UPLOAD STATES ---
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  useEffect(() => {
    const fetchReferenceData = async () => {
      const { data: distData } = await supabase.from('districts').select('*').order('name');
      const { data: cityData } = await supabase.from('cities').select('*').order('name');
      const { data: uniData } = await supabase.from('universities').select('*').order('name');
      
      if (distData) setDistricts(distData);
      if (cityData) setCities(cityData);
      if (uniData) setUniversities(uniData);
    };
    fetchReferenceData();
  }, []);

  const handleDistrictChange = (e) => {
    const distId = e.target.value;
    setFormData({ ...formData, district_id: distId, city_id: '' });
    const filtered = cities.filter(city => city.district_id === parseInt(distId));
    setFilteredCities(filtered);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAudienceToggle = (audience) => {
    setSelectedAudiences(prev => 
      prev.includes(audience) ? prev.filter(a => a !== audience) : [...prev, audience]
    );
  };

  // 🚨 --- GET CURRENT LOCATION ---
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please ensure location permissions are enabled in your browser.");
        setGettingLocation(false);
      }
    );
  };

  // --- MEDIA UPLOAD ---
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const maxPhotos = plan === 'vip' ? 5 : 4;
    if (uploadedPhotos.length + files.length > maxPhotos) {
      alert(`You can only upload a maximum of ${maxPhotos} photos for the ${plan.toUpperCase()} plan!`);
      return;
    }

    setUploadingMedia(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const newUrls = [];
      for (const file of files) {
        const compressedFile = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
        const fileExt = compressedFile.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error } = await supabase.storage.from('property-images').upload(fileName, compressedFile);
        if (error) throw error;
        
        const { data } = supabase.storage.from('property-images').getPublicUrl(fileName);
        newUrls.push(data.publicUrl);
      }
      setUploadedPhotos(prev => [...prev, ...newUrls]);
    } catch (error) {
      console.error("Photo Upload Error:", error);
      alert("Photo upload failed. Please try again.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleVideoUpload = async (e) => {
    if (plan !== 'vip') return;
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
        alert("Video file size must be less than 20MB!");
        return;
    }

    setUploadingMedia(true);
    setVideoUploadProgress(10); 
    const { data: { user } } = await supabase.auth.getUser();
    
    let progressInterval;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-video.${fileExt}`;
      
      progressInterval = setInterval(() => {
        setVideoUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 500);

      const { error } = await supabase.storage.from('property-images').upload(fileName, file);
      
      clearInterval(progressInterval); 

      if (error) throw error;
      
      setVideoUploadProgress(100); 
      const { data } = supabase.storage.from('property-images').getPublicUrl(fileName);
      setUploadedVideo(data.publicUrl);
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      console.error("Video Upload Error:", error);
      alert("Video upload failed. Please try again.");
      setVideoUploadProgress(0); 
    } finally {
      setUploadingMedia(false);
    }
  };

  // --- SUBMIT FORM ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadedPhotos.length === 0) {
        alert("Please upload at least 1 photo!");
        return;
    }

    if (selectedAudiences.length === 0) {
        alert("Please select at least one Target Audience!");
        return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('properties').insert([{
        owner_id: user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        type: formData.type,
        category: selectedAudiences, 
        gender: formData.gender,
        tier: plan,
        district_id: parseInt(formData.district_id),
        city_id: parseInt(formData.city_id),
        address: formData.address,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null, // 🚨 Save Latitude
        longitude: formData.longitude ? parseFloat(formData.longitude) : null, // 🚨 Save Longitude
        university_ids: selectedUniversities,
        images: uploadedPhotos,
        video_url: uploadedVideo,
        status: 'pending' 
      }]);

      if (error) throw error;

      alert("Property submitted successfully! It will be published once approved by an admin.");
      navigate('/owner-dashboard');

    } catch (error) {
      console.error("Submit Error:", error);
      alert("Submit failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
        <div className="card border-0 shadow-lg p-5" style={{ borderRadius: '20px' }}>
            <h2 className="fw-bold mb-4">Post New Ad</h2>
            
            <form onSubmit={handleSubmit}>
                
                {/* --- PLAN SELECTION --- */}
                <h5 className="fw-bold text-primary mb-3">1. Select Package</h5>
                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className={`card p-3 border-2 cursor-pointer ${plan === 'basic' ? 'border-primary bg-light' : ''}`} 
                             onClick={() => { setPlan('basic'); setUploadedVideo(null); setVideoUploadProgress(0); }}>
                            <h5 className="fw-bold">Basic Plan</h5>
                            <p className="small mb-0">Max 4 Photos. No videos allowed.</p>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className={`card p-3 border-2 cursor-pointer ${plan === 'vip' ? 'border-warning bg-light' : ''}`} 
                             onClick={() => setPlan('vip')}>
                            <h5 className="fw-bold text-warning">VIP Plan</h5>
                            <p className="small mb-0">Max 5 Photos + 1 Video included.</p>
                        </div>
                    </div>
                </div>

                {/* --- BASIC DETAILS --- */}
                <h5 className="fw-bold text-primary mb-3">2. Property Details</h5>
                <div className="row g-3 mb-4">
                    <div className="col-md-12">
                        <label className="form-label small fw-bold">AD TITLE</label>
                        <input type="text" name="title" className="form-control" required onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">MONTHLY RENT (LKR)</label>
                        <input type="number" name="price" className="form-control" required onChange={handleInputChange} />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label small fw-bold">PROPERTY TYPE</label>
                        <select name="type" className="form-control" onChange={handleInputChange} value={formData.type}>
                            <option value="Boarding Place">Boarding Place</option>
                            <option value="Annex">Annex</option>
                            <option value="Full House">Full House</option>
                            <option value="Single Room">Single Room</option>
                            <option value="Apartment">Apartment</option>
                        </select>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label small fw-bold">PREFERRED GENDER</label>
                        <select name="gender" className="form-control" onChange={handleInputChange} value={formData.gender}>
                            <option value="Any">Any</option>
                            <option value="Male">Male Only</option>
                            <option value="Female">Female Only</option>
                            <option value="Mixed">Mixed</option>
                        </select>
                    </div>

                    <div className="col-md-12">
                        <label className="form-label small fw-bold">TARGET AUDIENCE (Select multiple if applicable)</label>
                        <div className="d-flex flex-wrap gap-4 mt-1 bg-light p-3 rounded border">
                            {['Student', 'Working', 'Tourist'].map(aud => (
                                <div key={aud} className="form-check form-switch">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id={`aud-${aud}`}
                                        checked={selectedAudiences.includes(aud)}
                                        onChange={() => handleAudienceToggle(aud)} 
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <label className="form-check-label" htmlFor={`aud-${aud}`} style={{ cursor: 'pointer' }}>
                                        {aud === 'Working' ? 'Working Professionals' : aud + 's'}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="col-12">
                        <label className="form-label small fw-bold">DESCRIPTION</label>
                        <textarea name="description" className="form-control" rows="3" required onChange={handleInputChange}></textarea>
                    </div>
                </div>

                {/* --- LOCATION & UNIVERSITIES --- */}
                <h5 className="fw-bold text-primary mb-3">3. Location Information</h5>
                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">DISTRICT</label>
                        <select name="district_id" className="form-control" required onChange={handleDistrictChange}>
                            <option value="">Select District</option>
                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">CITY</label>
                        <select name="city_id" className="form-control" required onChange={handleInputChange} disabled={!formData.district_id}>
                            <option value="">Select City</option>
                            {filteredCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="col-12">
                        <label className="form-label small fw-bold">ADDRESS</label>
                        <input type="text" name="address" className="form-control" required onChange={handleInputChange} />
                    </div>

                    {/* 🚨 MAP COORDINATES SECTION */}
                    <div className="col-12 mt-2">
                        <label className="form-label small fw-bold text-muted">MAP COORDINATES (OPTIONAL)</label>
                        <div className="d-flex gap-2 mb-2">
                            <input 
                                type="number" step="any" name="latitude" className="form-control bg-light" 
                                placeholder="Latitude (e.g. 6.9271)" value={formData.latitude} onChange={handleInputChange} 
                            />
                            <input 
                                type="number" step="any" name="longitude" className="form-control bg-light" 
                                placeholder="Longitude (e.g. 79.8612)" value={formData.longitude} onChange={handleInputChange} 
                            />
                        </div>
                        <button 
                            type="button" 
                            className="btn btn-outline-primary btn-sm rounded-pill fw-bold"
                            onClick={handleGetLocation}
                            disabled={gettingLocation}
                        >
                            {gettingLocation ? "📍 Getting location..." : "📍 Get My Current Location"}
                        </button>
                        <p className="text-muted small mt-2">
                            Click the button if you are currently at the property, or enter coordinates manually from Google Maps.
                        </p>
                    </div>
                    
                    {/* Multi-Select University Component */}
                    {selectedAudiences.includes('Student') && (
                        <div className="col-12 mt-3">
                            <label className="form-label small fw-bold">NEARBY UNIVERSITIES (Optional)</label>
                            <p className="text-muted small mb-2">Search and select campuses close to your property to attract more students.</p>
                            
                            <MultiUniversitySelect 
                              availableUniversities={universities} 
                              selectedIds={selectedUniversities} 
                              onChange={setSelectedUniversities} 
                            />
                        </div>
                    )}
                </div>

                {/* --- MEDIA UPLOAD --- */}
                <h5 className="fw-bold text-primary mb-3">4. Upload Media</h5>
                <div className="mb-4">
                    <label className="form-label small fw-bold">
                        PHOTOS ({uploadedPhotos.length} / {plan === 'vip' ? 5 : 4})
                        {uploadingMedia && !videoUploadProgress && <span className="text-primary ms-2">Uploading...</span>}
                    </label>
                    <input type="file" className="form-control mb-2" multiple accept="image/*" onChange={handlePhotoUpload} disabled={uploadingMedia || uploadedPhotos.length >= (plan === 'vip' ? 5 : 4)} />
                    <div className="d-flex gap-2">
                        {uploadedPhotos.map((url, i) => (
                            <img key={i} src={url} alt="Uploaded" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '5px' }} />
                        ))}
                    </div>
                </div>

                {/* VIP VIDEO UPLOAD */}
                {plan === 'vip' && (
                    <div className="mb-4 p-4 border rounded bg-light" style={{ borderColor: '#ffc107' }}>
                        <label className="form-label small fw-bold text-warning">VIP FEATURE: PROPERTY VIDEO (Max 20MB)</label>
                        <input type="file" className="form-control" accept="video/*" onChange={handleVideoUpload} disabled={uploadingMedia || uploadedVideo} />
                        
                        {uploadingMedia && videoUploadProgress > 0 && videoUploadProgress < 100 && (
                            <div className="progress mt-2" style={{ height: '10px' }}>
                                <div className="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                                     role="progressbar" 
                                     style={{ width: `${videoUploadProgress}%`, transition: 'width 0.5s ease' }}>
                                </div>
                            </div>
                        )}

                        {uploadedVideo && <p className="text-success small mt-2 fw-bold">Video Uploaded Successfully ✔️</p>}
                    </div>
                )}

                <button type="submit" className="btn btn-dark w-100 py-3 fw-bold mt-3 shadow-sm" disabled={loading || uploadingMedia}>
                    {loading ? "Submitting Ad..." : "Submit Ad for Review"}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AddProperty;