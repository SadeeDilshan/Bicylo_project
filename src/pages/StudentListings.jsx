import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabase';
import UniversitySearch from '../components/UniversitySearch'; 
import { useNavigate } from 'react-router-dom';

const StudentListings = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [selectedUniId, setSelectedUniId] = useState(null); // Stores ID now
  const [selectedUniName, setSelectedUniName] = useState(''); // Stores Name for display
  const [filterGender, setFilterGender] = useState("all"); 
  const [maxPrice, setMaxPrice] = useState(100000); 
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- FETCH DATA LOGIC ---
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      
      try {
        // 1. Base Query: Get Approved Ads
        let query = supabase
          .from('properties')
          .select(`
            *,
            districts (name),
            cities (name)
          `)
          .or('status.eq.approved,status.eq.active,status.eq.published'); // Removed duplicate 'Approved'

        // 2. Filter by University ID (Array Check)
        if (selectedUniId) {
          // Check if 'university_ids' array contains the selected ID
          query = query.contains('university_ids', [selectedUniId]);
        }

        // 3. Filter by Gender
        if (filterGender !== "all") {
          query = query.eq('gender', filterGender);
        }

        // 4. Filter by Price
        if (maxPrice) {
          query = query.lte('price', maxPrice);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error loading listings:", error.message);
        } else {
          // Sort Data (Premium Tier first)
          const sortedData = (data || []).sort((a, b) => {
             const tierOrder = { premium: 1, regular: 2, basic: 3 };
             // Handle null tier gracefully
             const tierA = a.tier ? a.tier.toLowerCase() : 'regular';
             const tierB = b.tier ? b.tier.toLowerCase() : 'regular';
             return (tierOrder[tierA] || 2) - (tierOrder[tierB] || 2);
          });
          setListings(sortedData);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if a university is selected
    if (selectedUniId) {
      fetchProperties();
    }
  }, [selectedUniId, filterGender, maxPrice]);

  // --- HELPER: Get Image safely ---
  const getDisplayImage = (item) => {
    if (item.images && item.images.length > 0) return item.images[0];
    return 'https://placehold.co/600x400?text=No+Image';
  };

  // --- HANDLER: University Selection ---
  const handleUniSelect = async (id) => {
      if (!id) {
          setSelectedUniId(null);
          setSelectedUniName('');
          return;
      }
      setSelectedUniId(id);
      
      // Fetch name for display (Optional, but good UX)
      const { data } = await supabase.from('universities').select('name').eq('id', id).single();
      if(data) setSelectedUniName(data.name);
  };

  return (
    <div style={{ background: '#f4f6f8', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: '120px', paddingBottom: '50px' }}>
        
        {/* --- VIEW 1: SELECT UNIVERSITY --- */}
        {!selectedUniId ? (
          <div className="text-center" style={{ maxWidth: '800px', margin: '0 auto', marginTop: '50px' }}>
            <h1 className="fw-bold mb-3 display-4">Where are you studying?</h1>
            <p className="text-muted mb-5 lead">
                Search your university to find the closest approved boardings.
            </p>
            
            {/* The Updated Component is Used Here */}
            <UniversitySearch onSelect={handleUniSelect} />
            
            <p className="text-muted small mt-4">
               The search list now automatically updates based on available properties.
            </p>
          </div>
        ) : (
            
          /* --- VIEW 2: THE DASHBOARD --- */
          <div className="dashboard-view">
            
            {/* Header & Back Button */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold m-0">Boardings near <span className="text-primary">{selectedUniName}</span></h2>
                    <p className="text-muted m-0 small">Showing {listings.length} results</p>
                </div>
                <button className="btn btn-white border rounded-pill px-4 shadow-sm fw-bold" onClick={() => { setSelectedUniId(null); setSelectedUniName(''); }}>
                    ← BACK
                </button>
            </div>

            {/* GOOGLE MAP SECTION */}
            <div className="map-container mb-5" style={{ height: '350px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <iframe 
                    title="University Location Map"
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedUniName + " Sri Lanka")}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
            </div>

            <div className="row">
                {/* FILTERS SIDEBAR */}
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-4 sticky-top" style={{ borderRadius: '20px', top: '100px', zIndex: 1 }}>
                        <h5 className="fw-bold mb-3">Filters</h5>
                        
                        {/* Gender Filter */}
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted">GENDER</label>
                            <select 
                                className="form-select rounded-pill bg-light border-0"
                                value={filterGender}
                                onChange={(e) => setFilterGender(e.target.value)}
                            >
                                <option value="all">Any Gender</option>
                                <option value="male">Boys Only</option>
                                <option value="female">Girls Only</option>
                                <option value="mixed">Mixed</option>
                            </select>
                        </div>

                        {/* Price Filter */}
                        <div className="mb-2">
                            <label className="form-label fw-bold small text-muted">MAX PRICE</label>
                            <input 
                                type="range" 
                                className="form-range" 
                                min="5000" max="100000" step="5000"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                            <div className="d-flex justify-content-between text-muted small">
                                <span>5k</span>
                                <span className="fw-bold text-dark">{Number(maxPrice).toLocaleString()} LKR</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LISTINGS GRID */}
                <div className="col-md-9">
                    {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}

                    <div className="row g-4">
                        {!loading && listings.map((boarding) => (
                            <div className="col-md-6" key={boarding.id}>
                                <div className={`card h-100 ios-card ${boarding.tier === 'premium' ? 'border-warning' : 'border-0'}`} style={{ background: 'white', overflow: 'hidden' }}>
                                    
                                    {/* Image Section */}
                                    <div style={{ 
                                      height: '220px', 
                                      background: `url(${getDisplayImage(boarding)}) center/cover`, 
                                      position: 'relative' 
                                    }}>
                                        {boarding.tier === 'premium' && (
                                            <span className="badge bg-warning text-dark position-absolute m-3 shadow-sm">Premium</span>
                                        )}
                                        <span className="badge bg-white text-dark position-absolute bottom-0 end-0 m-3 shadow-sm">
                                            {boarding.gender === 'male' ? '♂ Boys' : boarding.gender === 'female' ? '♀ Girls' : '⚥ Mixed'}
                                        </span>
                                    </div>

                                    {/* Card Content */}
                                    <div className="card-body p-3">
                                        <div className="d-flex justify-content-between">
                                            <h5 className="fw-bold text-truncate" title={boarding.title}>{boarding.title}</h5>
                                            <span className="text-warning fw-bold">★ {boarding.rating || "New"}</span>
                                        </div>
                                        {/* Display District/City Name if available, else address */}
                                        <p className="text-muted small mb-2 text-truncate">
                                            📍 {boarding.cities?.name || boarding.address}, {boarding.districts?.name}
                                        </p>
                                        
                                        {/* PRICE DISPLAY */}
                                        <h5 className="text-primary fw-bold">
                                            {Number(boarding.price || 0).toLocaleString()} LKR 
                                            <span className="text-muted small fw-normal"> / month</span>
                                        </h5>
                                    </div>

                                    <div className="card-footer bg-white border-0 pb-3 pt-0">
                                        <button 
                                            className="btn btn-primary w-100 rounded-pill fw-bold"
                                            onClick={() => navigate(`/listing/${boarding.id}`)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!loading && listings.length === 0 && (
                            <div className="col-12 text-center py-5">
                                <h4 className="text-muted">No approved boardings found near {selectedUniName}.</h4>
                                <p className="small text-muted">Try adjusting your filters or check back later.</p>
                                <button 
                                    className="btn btn-outline-primary rounded-pill mt-3" 
                                    onClick={() => {setFilterGender("all"); setMaxPrice(100000);}}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentListings;