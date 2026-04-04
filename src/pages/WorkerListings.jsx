import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DistrictSearch from '../components/DistrictSearch'; 
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase'; // <--- 1. IMPORT SUPABASE

const WorkerListings = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [selectedDistrictName, setSelectedDistrictName] = useState(null); // Keep name for display
  const [filterType, setFilterType] = useState("all"); 
  const [maxPrice, setMaxPrice] = useState(100000);
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- FETCH DATA LOGIC ---
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      
      try {
        // Base Query: Get Approved Worker properties
        // We filter by 'worker' audience AND approved status
        let query = supabase
          .from('properties')
          .select(`
            *,
            districts!inner(name),  // !inner performs an INNER JOIN to filter by district name
            cities (name)
          `)
          .contains('audiences', ['worker'])
          .or('status.eq.approved,status.eq.active,status.eq.published');

        // 1. Filter by District Name (via the joined table)
        if (selectedDistrictName) {
           query = query.eq('districts.name', selectedDistrictName);
        }

        // 2. Filter by Type (Annex, House, etc.)
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
        } else {
          setListings(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Trigger fetch if a district is selected OR if it's the initial load (optional)
    if (selectedDistrictName) {
      fetchProperties();
    }
  }, [selectedDistrictName, filterType, maxPrice]);

  // --- HELPER: Get Image ---
  const getDisplayImage = (item) => {
    if (item.images && item.images.length > 0) return item.images[0];
    return 'https://placehold.co/600x400?text=No+Image';
  };

  return (
    <div style={{ background: '#f4f6f8', minHeight: '100vh' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: '120px', paddingBottom: '50px' }}>
        
        {/* --- VIEW 1: SELECT DISTRICT --- */}
        {!selectedDistrictName ? (
          <div className="text-center" style={{ maxWidth: '800px', margin: '0 auto', marginTop: '50px' }}>
            <h1 className="fw-bold mb-3 display-4" data-aos="fade-down">Find Work Rentals</h1>
            <p className="text-muted mb-5 lead" data-aos="fade-down" data-aos-delay="100">
                Search your work district to find convenient annexes & houses.
            </p>
            
            <div data-aos="zoom-in" data-aos-delay="200">
                {/* DistrictSearch passes back the name string */}
                <DistrictSearch onSelect={(distName) => setSelectedDistrictName(distName)} />
            </div>

            <p className="text-muted small mt-4">
                Popular: Colombo, Gampaha, Kandy, Galle...
            </p>
          </div>
        ) : (
            
          /* --- VIEW 2: DASHBOARD --- */
          <div className="dashboard-view" data-aos="fade-up">
            
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold m-0">Rentals in <span className="text-success">{selectedDistrictName}</span></h2>
                    <p className="text-muted m-0 small">Showing {listings.length} results</p>
                </div>
                <button className="btn btn-white border rounded-pill px-4 shadow-sm fw-bold" onClick={() => setSelectedDistrictName(null)}>
                    ← BACK
                </button>
            </div>

            {/* MAP SECTION */}
            <div className="map-container mb-5" style={{ height: '350px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedDistrictName + " Sri Lanka")}&t=&z=11&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
            </div>

            <div className="row">
                {/* FILTERS */}
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm p-4 sticky-top" style={{ borderRadius: '20px', top: '100px', zIndex: 1 }}>
                        <h5 className="fw-bold mb-3">Filters</h5>
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-muted">PROPERTY TYPE</label>
                            <select 
                                className="form-select rounded-pill bg-light border-0"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="all">All Types</option>
                                <option value="annex">Annex</option>
                                <option value="house">Full House</option>
                                <option value="room">Single Room</option>
                                <option value="apartment">Apartment</option>
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

                {/* LISTINGS */}
                <div className="col-md-9">
                    {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}

                    <div className="row g-4">
                        {!loading && listings.map((worker) => (
                            <div className="col-md-6" key={worker.id}>
                                <div className="card h-100 ios-card border-0" style={{ background: 'white', overflow: 'hidden' }}>
                                    
                                    <div style={{ height: '220px', background: `url(${getDisplayImage(worker)}) center/cover`, position: 'relative' }}>
                                        <span className="badge bg-success position-absolute m-3 shadow-sm text-uppercase">
                                            {worker.type}
                                        </span>
                                    </div>

                                    <div className="card-body p-3">
                                        <div className="d-flex justify-content-between">
                                            <h5 className="fw-bold">{worker.title}</h5>
                                            <span className="text-warning fw-bold">★ {worker.rating || "New"}</span>
                                        </div>
                                        <p className="text-muted small mb-2">
                                            📍 {worker.cities?.name}, {worker.districts?.name}
                                        </p>
                                        <p className="text-secondary small text-truncate">{worker.description}</p>
                                        <h5 className="text-dark fw-bold">
                                            {Number(worker.price).toLocaleString()} LKR <span className="text-muted small fw-normal">/ month</span>
                                        </h5>
                                    </div>

                                    <div className="card-footer bg-white border-0 pb-3 pt-0">
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

                        {!loading && listings.length === 0 && (
                            <div className="col-12 text-center py-5">
                                <h4 className="text-muted">No rentals found in this area.</h4>
                                <button className="btn btn-outline-success rounded-pill mt-3" onClick={() => setSelectedDistrictName(null)}>Try another District</button>
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

export default WorkerListings;