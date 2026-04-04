import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../supabase'; // <--- 1. IMPORT SUPABASE

const TravelerListings = () => {
  const navigate = useNavigate(); 

  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); 
  const [listings, setListings] = useState([]); // Stores DB data
  const [loading, setLoading] = useState(false);

  // --- FETCH DATA FROM DB ---
  useEffect(() => {
    const fetchTravelerListings = async () => {
      setLoading(true);
      try {
        // Base Query: Get Approved properties for 'traveler' audience
        let query = supabase
          .from('properties')
          .select('*')
          .contains('audiences', ['traveler']) // Filter for travelers
          .or('status.eq.approved,status.eq.active,status.eq.published');

        // Apply Tab Filter (Stay vs Dining)
        if (activeTab !== "all") {
            query = query.eq('category', activeTab);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        // Apply Client-side Search Filter (for smoother typing experience)
        // (Alternatively, you can do this via SQL .ilike() for larger datasets)
        let filtered = data || [];
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(item => 
                (item.title && item.title.toLowerCase().includes(lowerTerm)) ||
                (item.district && item.district.toLowerCase().includes(lowerTerm)) ||
                (item.address && item.address.toLowerCase().includes(lowerTerm))
            );
        }

        setListings(filtered);

      } catch (err) {
        console.error("Error fetching traveler listings:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTravelerListings();
  }, [activeTab, searchTerm]); // Re-fetch when filters change

  // --- HELPER: Get Image ---
  const getDisplayImage = (item) => {
    if (item.images && item.images.length > 0) return item.images[0];
    return 'https://placehold.co/600x400?text=No+Image';
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <Navbar />

      {/* --- HERO WITH SEARCH PILL --- */}
      <div className="travel-hero" style={{ 
          background: "linear-gradient(to bottom, #e0f7fa, #fff)", 
          paddingTop: '150px', 
          paddingBottom: '80px',
          textAlign: 'center'
      }}>
        <div className="container" data-aos="fade-down">
            <h1 className="display-4 fw-bold mb-5">Plan your perfect trip.</h1>

            {/* THE SEARCH PILL */}
            <div className="search-pill-container">
                
                {/* 1. WHERE */}
                <div className="search-section">
                    <span className="search-label">Where</span>
                    <input 
                        type="text" 
                        className="search-input-transparent" 
                        placeholder="Search destinations (e.g. Ella)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* 2. WHEN */}
                <div className="search-section">
                    <span className="search-label">When</span>
                    <input type="text" className="search-input-transparent" placeholder="Add dates" disabled />
                </div>

                {/* 3. WHO */}
                <div className="search-section" style={{ borderRight: 'none' }}>
                    <span className="search-label">Who</span>
                    <input type="text" className="search-input-transparent" placeholder="Add guests" disabled />
                </div>

                {/* SEARCH BUTTON */}
                <button className="search-btn-round">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                    </svg>
                </button>
            </div>
        </div>
      </div>

      {/* --- RESULTS SECTION --- */}
      <div className="container mb-5" id="results">
        
        {/* Toggle Filters (Stays vs Restaurants) */}
        <div className="d-flex justify-content-center mb-5">
            <div className="btn-group shadow-sm rounded-pill overflow-hidden" role="group">
                <button 
                    className={`btn px-4 py-2 fw-bold ${activeTab === 'all' ? 'btn-dark' : 'btn-light'}`}
                    onClick={() => setActiveTab('all')}
                >All</button>
                <button 
                    className={`btn px-4 py-2 fw-bold ${activeTab === 'stay' ? 'btn-dark' : 'btn-light'}`}
                    onClick={() => setActiveTab('stay')}
                >🛌 Stays</button>
                <button 
                    className={`btn px-4 py-2 fw-bold ${activeTab === 'dining' ? 'btn-dark' : 'btn-light'}`}
                    onClick={() => setActiveTab('dining')}
                >🍽️ Restaurants</button>
            </div>
        </div>

        {/* LISTINGS GRID */}
        <div className="col-12">
            {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}
            
            <div className="row g-4">
                {!loading && listings.map((item) => (
                    <div className="col-lg-3 col-md-6" key={item.id} data-aos="fade-up">
                        <div 
                            className="card h-100 border-0 shadow-sm" 
                            style={{ borderRadius: '15px', overflow: 'hidden', cursor: 'pointer' }}
                            // 3. CONNECT CLICK TO DETAILS PAGE
                            onClick={() => navigate(`/listing/${item.id}`)}
                        >
                            
                            {/* Image */}
                            <div style={{ height: '250px', background: `url(${getDisplayImage(item)}) center/cover`, position: 'relative' }}>
                                <span className="badge bg-white text-dark position-absolute top-0 start-0 m-3 shadow-sm">
                                    {item.category === 'stay' ? '🏠' : '🍴'} {item.type}
                                </span>
                                {/* Optional: Add Rating Logic if available in DB */}
                                {/* <span className="badge bg-dark position-absolute bottom-0 end-0 m-3">★ 4.5</span> */}
                            </div>

                            {/* Content */}
                            <div className="card-body">
                                <div className="d-flex justify-content-between mb-1">
                                    {/* Use district if city is not available (since this page doesn't join with cities yet) */}
                                    <h5 className="fw-bold mb-0">{item.district || "Sri Lanka"}</h5>
                                    <span className="text-muted small">View</span>
                                </div>
                                <p className="text-secondary small mb-2">{item.title}</p>
                                <p className="text-dark fw-bold mb-0">
                                    {Number(item.price).toLocaleString()} LKR <span className="fw-normal text-muted">/ night</span>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            
                {!loading && listings.length === 0 && (
                    <div className="col-12 text-center py-5">
                        <h3 className="text-muted">No results found for "{searchTerm}".</h3>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default TravelerListings;