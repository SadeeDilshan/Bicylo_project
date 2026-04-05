import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import imageCompression from 'browser-image-compression';

const AddProperty = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- REFERENCE DATA STATES (Database එකෙන් ගන්න දේවල්) ---
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [universities, setUniversities] = useState([]);

  // --- FORM STATES ---
  const [plan, setPlan] = useState('basic'); // 'basic' or 'vip'
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', type: 'Boarding', category: 'Student', gender: 'Any',
    district_id: '', city_id: '', address: ''
  });
  const [selectedUniversities, setSelectedUniversities] = useState([]);

  // --- UPLOAD STATES ---
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // 🚨 අලුත් State: Video එක Upload වෙන ප්‍රතිශතය තියාගන්න
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  // 1. Component Load වෙද්දි Database එකෙන් Districts, Cities, Universities ගන්නවා
  useEffect(() => {
    const fetchReferenceData = async () => {
      const { data: distData } = await supabase.from('districts').select('*');
      const { data: cityData } = await supabase.from('cities').select('*');
      const { data: uniData } = await supabase.from('universities').select('*');
      
      if (distData) setDistricts(distData);
      if (cityData) setCities(cityData);
      if (uniData) setUniversities(uniData);
    };
    fetchReferenceData();
  }, []);

  // 2. District එක මාරු කරද්දි අදාළ Cities ටික Filter කරනවා
  const handleDistrictChange = (e) => {
    const distId = e.target.value;
    setFormData({ ...formData, district_id: distId, city_id: '' }); // Reset city
    const filtered = cities.filter(city => city.district_id === parseInt(distId));
    setFilteredCities(filtered);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUniversityToggle = (uniId) => {
    setSelectedUniversities(prev => 
      prev.includes(uniId) ? prev.filter(id => id !== uniId) : [...prev, uniId]
    );
  };

  // 3. PHOTOS UPLOAD KIRIMA (Instant Upload + Compression)
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
        // Compress Image
        const compressedFile = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
        const fileExt = compressedFile.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        // Upload to Storage
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

  // 4. VIDEO UPLOAD KIRIMA (Background Upload + Progress Bar)
  const handleVideoUpload = async (e) => {
    if (plan !== 'vip') return;
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
        alert("Video file size must be less than 20MB!");
        return;
    }

    setUploadingMedia(true);
    setVideoUploadProgress(10); // 🚨 Progress එක පටන් ගන්නවා
    const { data: { user } } = await supabase.auth.getUser();
    
    let progressInterval;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-video.${fileExt}`;
      
      // 🚨 Simulated Progress (බොරුවට පිරෙනවා වගේ පෙන්නනවා Upload වෙනකම්)
      progressInterval = setInterval(() => {
        setVideoUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 500);

      const { error } = await supabase.storage.from('property-images').upload(fileName, file);
      
      clearInterval(progressInterval); // 🚨 Upload ඉවර වුණාම නවත්වනවා

      if (error) throw error;
      
      setVideoUploadProgress(100); // 🚨 100% සම්පූර්ණයි
      const { data } = supabase.storage.from('property-images').getPublicUrl(fileName);
      setUploadedVideo(data.publicUrl);
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      console.error("Video Upload Error:", error);
      alert("Video upload failed. Please try again.");
      setVideoUploadProgress(0); // Error ආවොත් Progress එක 0 කරනවා
    } finally {
      setUploadingMedia(false);
    }
  };

  // 5. FINAL SUBMIT EKA (Database එකට Save කිරීම)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadedPhotos.length === 0) {
        alert("Please upload at least 1 photo!");
        return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save to Properties table (STATUS EKA PENDING WIDIYATA YANAWA)
      const { error } = await supabase.from('properties').insert([{
        owner_id: user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        type: formData.type,
        category: formData.category,
        gender: formData.gender,
        tier: plan,
        district_id: parseInt(formData.district_id),
        city_id: parseInt(formData.city_id),
        address: formData.address,
        university_ids: selectedUniversities,
        images: uploadedPhotos,
        video_url: uploadedVideo,
        status: 'pending' // 🚨 ADMIN APPROVE KARANA KAN PENDING
      }]);

      if (error) throw error;

      alert("Property submit is successful! Admin will review it shortly.");
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
                        <select name="type" className="form-control" onChange={handleInputChange}>
                            <option value="Boarding">Boarding Place</option>
                            <option value="Annex">Annex</option>
                            <option value="Apartment">Apartment</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">TARGET AUDIENCE</label>
                        <select name="category" className="form-control" onChange={handleInputChange}>
                            <option value="Student">Students</option>
                            <option value="Working">Working Professionals</option>
                            <option value="Tourist">Tourists</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold">PREFERRED GENDER</label>
                        <select name="gender" className="form-control" onChange={handleInputChange}>
                            <option value="Any">Any</option>
                            <option value="Male">Male Only</option>
                            <option value="Female">Female Only</option>
                        </select>
                    </div>
                    <div className="col-12">
                        <label className="form-label small fw-bold">DESCRIPTION</label>
                        <textarea name="description" className="form-control" rows="3" onChange={handleInputChange}></textarea>
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
                    
                    {formData.category === 'Student' && (
                        <div className="col-12 mt-3">
                            <label className="form-label small fw-bold">NEARBY UNIVERSITIES</label>
                            <div className="d-flex flex-wrap gap-3">
                                {universities.map(uni => (
                                    <div key={uni.id} className="form-check">
                                        <input className="form-check-input" type="checkbox" id={`uni-${uni.id}`}
                                            onChange={() => handleUniversityToggle(uni.id)} />
                                        <label className="form-check-label small" htmlFor={`uni-${uni.id}`}>{uni.name}</label>
                                    </div>
                                ))}
                            </div>
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

                {/* 🚨 VIP VIDEO UPLOAD කොටස */}
                {plan === 'vip' && (
                    <div className="mb-4">
                        <label className="form-label small fw-bold text-warning">VIP FEATURE: PROPERTY VIDEO (Max 20MB)</label>
                        <input type="file" className="form-control" accept="video/*" onChange={handleVideoUpload} disabled={uploadingMedia || uploadedVideo} />
                        
                        {/* 🚨 අලුත් Progress Bar එක */}
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

                <button type="submit" className="btn btn-dark w-100 py-3 fw-bold mt-3" disabled={loading || uploadingMedia}>
                    {loading ? "Submitting Ad..." : "Submit Ad for Review"}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AddProperty;