import React, { useState, useEffect, useRef } from 'react';
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
  const [filterType, setFilterType] = useState("all"); 
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🚨 MAP STATES & REFS
  const [mapQuery, setMapQuery] = useState(''); // Map එකේ පෙන්නන්න ඕන තැන
  const mapRef = useRef(null); // Map එකට Auto-scroll කරන්න

  // --- FETCH DATA LOGIC ---
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      
      try {
        let query = supabase
          .from('properties')
          .select(`
            *,
            districts (name),
            cities (name)
          `)
          .ilike('category', '%Student%') 
          .in('status', ['approved', 'active', 'published']);

        if (selectedUniId) query = query.contains('university_ids', [selectedUniId]);
        if (filterType !== "all") query = query.eq('type', filterType);
        if (filterGender !== "all") query = query.eq('gender', filterGender);
        if (maxPrice) query = query.lte('price', maxPrice);

        const { data, error } = await query;

        if (error) {
          console.error("🚨 Supabase Error:", error.message);
          throw error ;
        } 
        
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
  }, [selectedUniId, filterGender, filterType, maxPrice]);

  const getDisplayImage = (item) => {
    if (item.images && item.images.length > 0) return item.images[0];
    return 'https://placehold.co/600x400?text=No+Image';
  };

  const handleUniSelect = async (id) => {
      if (!id) {
          setSelectedUniId(null);
          setSelectedUniName('All Locations');
          setMapQuery(''); // Clear map when cleared
          return;
      }
      setSelectedUniId(id);
      
      try {
          const { data, error } = await supabase.from('universities').select('name').eq('id', id).single();
          if (data) {
              setSelectedUniName(data.name);
              // 🚨 Campus එක තේරුවම Map එකේ ඒ Campus එක හොයන්න දෙනවා
              setMapQuery(`${data.name}, Sri Lanka`); 
          }
      } catch (error) {
          console.error("Error fetching university name:", error);
      }
  };

  // 🚨 කාඩ් එකේ බොත්තම එබුවම Map එක අදාළ බෝඩිමට Update කරලා Scroll කරනවා
  const handleShowOnMap = (lat, lng) => {
      setMapQuery(`${lat},${lng}`);
      if (mapRef.current) {
          // Map එක තියෙන තැනට Smooth විදිහට පල්ලෙහාට/උඩට යනවා
          const yOffset = -120; // Navbar එකට ඉඩ තියන්න
          const y = mapRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
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

        {/* 🚨 THE DYNAMIC MAP SECTION */}
        {selectedUniId && mapQuery && (
            <div 
                ref={mapRef} 
                className="w-100 mb-4 bg-white p-2 shadow-sm" 
                style={{ height: '400px', borderRadius: '20px' }}
            >
                <iframe 
                    title="Dynamic Location Map"
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    style={{ borderRadius: '15px' }}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
            </div>
        )}

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
                                            {boarding.gender === 'Male' ? '♂ Boys' : boarding.gender === 'Female' ? '♀ Girls' : '⚥ Mixed'}
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

                                        {/* 🚨 අලුත් Map බොත්තම (Coordinates තියෙනවා නම් විතරක් පෙන්වයි) */}
                                        {boarding.latitude && boarding.longitude && (
                                            <button 
                                                className="btn btn-sm btn-outline-success w-100 rounded-pill mb-2 fw-bold"
                                                onClick={() => handleShowOnMap(boarding.latitude, boarding.longitude)}
                                            >
                                                📍 Show on Map
                                            </button>
                                        )}

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
                                    onClick={() => {setFilterGender("all"); setFilterType("all"); setMaxPrice(100000); handleUniSelect(null);}}
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