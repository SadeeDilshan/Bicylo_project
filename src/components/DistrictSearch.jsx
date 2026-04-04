import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase'; // <--- 1. Import Supabase

const DistrictSearch = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [districts, setDistricts] = useState([]); // <--- 2. State for DB data
  const wrapperRef = useRef(null);

  // --- 3. FETCH DATA FROM DB ON LOAD ---
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const { data, error } = await supabase
          .from('districts')
          .select('name')
          .order('name');
        
        if (error) throw error;

        // Extract just the names into a simple array: ['Colombo', 'Kandy', ...]
        if (data) {
          setDistricts(data.map(d => d.name));
        }
      } catch (err) {
        console.error("Error fetching districts:", err.message);
      }
    };

    fetchDistricts();
  }, []);

  // --- FILTER LOGIC (Uses the fetched 'districts' state) ---
  const filteredDistricts = districts.filter(dist => 
    dist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (dist) => {
    setSearchTerm(dist);
    setIsOpen(false);
    onSelect(dist);
  };

  // --- CLICK OUTSIDE LISTENER ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* CAPSULE INPUT */}
      <div 
        className="d-flex align-items-center bg-white shadow-sm border"
        style={{ borderRadius: '50px', padding: '5px 10px 5px 25px', height: '60px' }}
      >
        <span className="me-2 text-muted">📍</span>
        <input 
          type="text"
          className="form-control border-0 shadow-none fw-bold"
          placeholder="Search your Work District..."
          value={searchTerm}
          onChange={(e) => {
             setSearchTerm(e.target.value);
             setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{ fontSize: '1.1rem' }}
        />
        <button className="btn btn-success rounded-circle" style={{ width: '45px', height: '45px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
        </button>
      </div>

      {/* DROPDOWN LIST */}
      {isOpen && (
        <div className="card shadow-lg border-0 mt-3 p-2" style={{ position: 'absolute', width: '100%', borderRadius: '20px', zIndex: 100, maxHeight: '300px', overflowY: 'auto' }}>
            {filteredDistricts.length > 0 ? (
                <ul className="list-group list-group-flush">
                    {filteredDistricts.map((dist, index) => (
                        <li 
                            key={index} 
                            className="list-group-item list-group-item-action border-0 rounded p-3 fw-bold text-dark"
                            style={{ cursor: 'pointer', fontSize: '1rem' }}
                            onClick={() => handleSelect(dist)}
                        >
                            {dist} District
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-3 text-muted text-center">No district found.</div>
            )}
        </div>
      )}
    </div>
  );
};

export default DistrictSearch;