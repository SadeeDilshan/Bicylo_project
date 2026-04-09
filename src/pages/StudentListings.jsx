import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabase';
import UniversitySearch from '../components/UniversitySearch'; 
import { useNavigate } from 'react-router-dom';

const StudentListings = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [selectedUniId, setSelectedUniId] = useState(null); 
  const [selectedUniName, setSelectedUniName] = useState('All Locations'); 
  const [filterGender, setFilterGender] = useState("all"); 
  const [maxPrice, setMaxPrice] = useState(100000); 
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA LOGIC ---
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      
      try {
        // 1. Base Query: Get Approved Ads
        // 🚨 FIXED: Now uses the 'catogery' column with an array check
        let query = supabase
          .from('properties')
          .select(`
            *,
            districts (name),
            cities (name)
          `)
          .contains('audiences', ['Student']) // <-- 'audiences' check here!
          .in('status', ['approved', 'active', 'published']);

        // 2. Filter by University ID (Only if selected)
        if (selectedUniId) {
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
          console.error("🚨 Supabase Error:", error.message);
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

    fetchProperties(); // Fetch immediately on page load
  }, [selectedUniId, filterGender, maxPrice]);

  const getDisplayImage = (item) => {
    if (item.images && item.images.length > 0) return item.images[0];
    return 'https://placehold.co/600x400?text=No+Image';
  };

  const handleUniSelect = async (id) => {
      if (!id) {
          setSelectedUniId(null);
          setSelectedUniName('All Locations');
          return;
      }
      setSelectedUniId(id);
      
      try {
          const { data, error } = await supabase.from('universities').select('name').eq('id', id).single();
          if (data) setSelectedUniName(data.name);
      } catch (error) {
          console.error("Error fetching university name:", error);
      }
  };

  return (
    <div style={{ background: '#f4f6f8', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
          
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 className="fw-bold m-0">Boardings near <span className="text-primary">{selectedUniName}</span></h2>
                <p className="text-muted m-0 small">Showing {listings.length} results</p>
            </div>
            {selectedUniId && (
                <button className="btn btn-outline-danger rounded-pill px-4 shadow-sm fw-bold" onClick={() => handleUniSelect(null)}>
                    ✕ Clear Location
                </button>
            )}
        </div>

        <div className="row g-4">
            {/* FILTERS SIDEBAR */}
            <div className="col-md-4 col-lg-3">
                <div className="card border-0 shadow-sm p-4 sticky-top" style={{ borderRadius: '20px', top: '100px', zIndex: 1 }}>
                    <h5 className="fw-bold mb-3">Find by Campus</h5>
                    
                    <div className="mb-4">
                        <UniversitySearch onSelect={handleUniSelect} />
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
                            <option value="male">Boys Only</option>
                            <option value="female">Girls Only</option>
                            <option value="mixed">Mixed</option>
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

            {/* LISTINGS GRID */}
            <div className="col-md-8 col-lg-9">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                        <h5 className="mt-3 text-muted">Loading properties...</h5>
                    </div>
                ) : (
                    <div className="row g-4">
                        {listings.map((boarding) => (
                            <div className="col-md-6 col-xl-4" key={boarding.id}>
                                <div className={`card h-100 ios-card shadow-sm ${['premium', 'vip'].includes(boarding.tier?.toLowerCase()) ? 'border-warning border-2' : 'border-0'}`} style={{ background: 'white', overflow: 'hidden', borderRadius: '15px' }}>
                                    
                                    <div style={{ 
                                      height: '200px', 
                                      background: `url(${getDisplayImage(boarding)}) center/cover`, 
                                      position: 'relative' 
                                    }}>
                                        {['premium', 'vip'].includes(boarding.tier?.toLowerCase()) && (
                                            <span className="badge bg-warning text-dark position-absolute m-2 shadow-sm">⭐ VIP</span>
                                        )}
                                        <span className="badge bg-dark text-white position-absolute bottom-0 start-0 m-2 shadow-sm">
                                            {boarding.gender === 'male' ? '♂ Boys' : boarding.gender === 'female' ? '♀ Girls' : '⚥ Mixed'}
                                        </span>
                                    </div>

                                    <div className="card-body p-3 d-flex flex-column">
                                        <h6 className="fw-bold text-truncate mb-1" title={boarding.title}>{boarding.title}</h6>
                                        <p className="text-muted small mb-2 text-truncate">
                                            📍 {boarding.cities?.name || boarding.address}
                                        </p>
                                        
                                        <h5 className="text-primary fw-bold mt-auto mb-3">
                                            {Number(boarding.price || 0).toLocaleString()} LKR 
                                            <span className="text-muted small fw-normal"> / mo</span>
                                        </h5>

                                        <button 
                                            className="btn btn-outline-dark w-100 rounded-pill fw-bold"
                                            onClick={() => navigate(`/listing/${boarding.id}`)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {listings.length === 0 && (
                            <div className="col-12 text-center py-5 bg-white rounded-4 shadow-sm border">
                                <h1 className="display-1 text-muted">🏚️</h1>
                                <h4 className="fw-bold text-dark mt-3">No properties found.</h4>
                                <p className="small text-muted">No approved ads match your search criteria right now.</p>
                                <button 
                                    className="btn btn-primary rounded-pill mt-3 px-4 fw-bold" 
                                    onClick={() => {setFilterGender("all"); setMaxPrice(100000); handleUniSelect(null);}}
                                >
                                    Reset All Filters
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

export default StudentListings;