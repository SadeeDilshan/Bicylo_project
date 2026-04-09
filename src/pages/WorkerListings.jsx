import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DistrictSearch from '../components/DistrictSearch'; 
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const WorkerListings = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [selectedDistrictName, setSelectedDistrictName] = useState(null); 
  const [filterType, setFilterType] = useState("all"); 
  const [maxPrice, setMaxPrice] = useState(100000);
  const [filterGender, setFilterGender] = useState("all");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA LOGIC ---
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      
      try {
        const selectString = selectedDistrictName 
            ? '*, districts!inner(name), cities(name)' 
            : '*, districts(name), cities(name)';

        
          // 🚨 පරණ Code එක: .eq('category', 'Working')
        // අලුත් Code එක: Array එක ඇතුලේ 'Working' තියෙනවද බලනවා
        let query = supabase
          .from('properties')
          .select(selectString)
          .contains('audiences', ['Working']) // <-- මේක තමයි වෙනස් වුණේ!
          .in('status', ['approved', 'active', 'published']);// <-- මේ පේළිය තමයි හැදුවේ
          

        // 1. Filter by District Name
        if (selectedDistrictName) {
           query = query.eq('districts.name', selectedDistrictName);
        }
        if (filterGender !== "all") {
          query = query.eq('gender', filterGender);
        }

        // 2. Filter by Type
        if (filterType !== "all") {
          query = query.eq('type', filterType);
        }

        // 3. Filter by Price
        if (maxPrice) {
          query = query.lte('price', maxPrice);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error loading listings:", error.message);
          throw error;
        } 
        
        // Sort Data (VIP/Premium first)
        const sortedData = (data || []).sort((a, b) => {
            const tierOrder = { vip: 1, premium: 1, regular: 2, basic: 3 };
            const tierA = a.tier ? a.tier.toLowerCase() : 'regular';
            const tierB = b.tier ? b.tier.toLowerCase() : 'regular';
            return (tierOrder[tierA] || 2) - (tierOrder[tierB] || 2);
        });
        
        setListings(sortedData);
        
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [selectedDistrictName, filterType, filterGender , maxPrice]);

  // --- HELPER: Get Image ---
  const getDisplayImage = (item) => {
    if (item.images && item.images.length > 0) return item.images[0];
    return 'https://placehold.co/600x400?text=No+Image';
  };

  return (
    <div style={{ background: '#f4f6f8', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
          
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 className="fw-bold m-0">Rentals in <span className="text-success">{selectedDistrictName || 'All Districts'}</span></h2>
                <p className="text-muted m-0 small">Showing {listings.length} results</p>
            </div>
            {selectedDistrictName && (
                <button className="btn btn-outline-danger rounded-pill px-4 shadow-sm fw-bold" onClick={() => setSelectedDistrictName(null)}>
                    ✕ Clear District
                </button>
            )}
        </div>

        <div className="row g-4">
            {/* FILTERS SIDEBAR */}
            <div className="col-md-4 col-lg-3">
                <div className="card border-0 shadow-sm p-4 sticky-top" style={{ borderRadius: '20px', top: '100px', zIndex: 1 }}>
                    <h5 className="fw-bold mb-3">Search Area</h5>
                    
                    {/* District Search Component */}
                    <div className="mb-4">
                        <DistrictSearch onSelect={(distName) => setSelectedDistrictName(distName)} />
                    </div>

                    <hr className="opacity-25" />

                    <h5 className="fw-bold mb-3">Filters</h5>

                    <div className="mb-4">
                        <label className="form-label fw-bold small text-muted">GENDER</label>
                        <select 
                            className="form-select rounded-pill bg-light border-0"
                            value={filterGender}
                            onChange={(e) => setFilterGender(e.target.value)}
                        >
                            <option value="all">Any Gender</option>
                            <option value="Male">Boys Only</option>
                            <option value="Female">Girls Only</option>
                            <option value="Mixed">Mixed</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-bold small text-muted">PROPERTY TYPE</label>
                        <select 
                            className="form-select rounded-pill bg-light border-0"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="Boarding Place">Boarding</option>
                            <option value="Annex">Annex</option>
                            <option value="Full House">Full House</option>
                            <option value="Single Room">Single Room</option>
                            <option value="Apartment">Apartment</option>
                        </select>
                    </div>
                    
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

            {/* MAIN CONTENT AREA */}
            <div className="col-md-8 col-lg-9">
                
                <div className="map-container mb-4" style={{ height: '300px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
                    <iframe 
                        title="District Location Map"
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent((selectedDistrictName || "Sri Lanka") + ", Sri Lanka")}&t=&z=${selectedDistrictName ? '12' : '7'}&ie=UTF8&iwloc=&output=embed`}
                    ></iframe>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-success" style={{ width: '3rem', height: '3rem' }}></div>
                        <h5 className="mt-3 text-muted">Loading rentals...</h5>
                    </div>
                ) : (
                    <div className="row g-4">
                        {listings.map((worker) => (
                            <div className="col-md-6 col-xl-4" key={worker.id}>
                                <div className={`card h-100 ios-card shadow-sm ${['premium', 'vip'].includes(worker.tier?.toLowerCase()) ? 'border-success border-2' : 'border-0'}`} style={{ background: 'white', overflow: 'hidden', borderRadius: '15px' }}>
                                    
                                    <div style={{ height: '200px', background: `url(${getDisplayImage(worker)}) center/cover`, position: 'relative' }}>
                                        {['premium', 'vip'].includes(worker.tier?.toLowerCase()) && (
                                            <span className="badge bg-success text-white position-absolute m-2 shadow-sm">⭐ VIP</span>
                                        )}
                                        <span className="badge bg-dark text-white position-absolute bottom-0 start-0 m-2 shadow-sm text-uppercase">
                                            {worker.type}
                                        </span>
                                    </div>

                                    <div className="card-body p-3 d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                            <h6 className="fw-bold text-truncate mb-0" title={worker.title}>{worker.title}</h6>
                                        </div>
                                        
                                        <p className="text-muted small mb-2 text-truncate">
                                            📍 {worker.cities?.name || worker.address}
                                        </p>
                                        
                                        <h5 className="text-success fw-bold mt-auto mb-3">
                                            {Number(worker.price || 0).toLocaleString()} LKR <span className="text-muted small fw-normal">/ mo</span>
                                        </h5>

                                        <button 
                                            className="btn btn-outline-dark w-100 rounded-pill fw-bold"
                                            onClick={() => navigate(`/listing/${worker.id}`)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {listings.length === 0 && (
                            <div className="col-12 text-center py-5 bg-white rounded-4 shadow-sm border">
                                <h1 className="display-1 text-muted">🏢</h1>
                                <h4 className="fw-bold text-dark mt-3">No rentals found.</h4>
                                <p className="small text-muted">Try expanding your search area or price range.</p>
                                <button className="btn btn-success rounded-pill mt-3 px-4 fw-bold" onClick={() => { setSelectedDistrictName(null); setFilterType('all'); setMaxPrice(100000); }}>
                                    Reset Search
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerListings;