import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase'; // <--- 1. Import Supabase

const UniversitySearch = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [universities, setUniversities] = useState([]); // Stores objects: {id, name, nicknames}
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // --- 2. FETCH UNIVERSITIES FROM DB ---
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const { data, error } = await supabase
          .from('universities') // <--- New Table
          .select('id, name, nicknames')
          .order('name');

        if (error) throw error;
        if (data) setUniversities(data);
        
      } catch (error) {
        console.error("Error fetching universities:", error.message);
      }
    };

    fetchUniversities();
  }, []);

  // --- 3. SMART FILTER LOGIC (Name + Nicknames) ---
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // If empty, show nothing (or you can show top 5 popular ones)
      setSuggestions([]);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      
      const filtered = universities.filter((uni) => {
        // Check Name
        if (uni.name.toLowerCase().includes(lowerSearch)) return true;
        
        // Check Nicknames (Array)
        if (uni.nicknames && uni.nicknames.some(nick => nick.toLowerCase().includes(lowerSearch))) return true;
        
        return false;
      });

      setSuggestions(filtered);
    }
  }, [searchTerm, universities]);

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (uni) => {
    setSearchTerm(uni.name); // Show the official name in the input
    setShowSuggestions(false);
    if (onSelect) onSelect(uni.id); // <--- RETURN THE ID, NOT THE NAME (Important for DB)
  };

  return (
    <div ref={wrapperRef} className="position-relative w-100" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="input-group input-group-lg shadow-sm rounded-pill overflow-hidden border">
        <span className="input-group-text bg-white border-0 ps-4">🔍</span>
        <input
          type="text"
          className="form-control border-0"
          placeholder="Type your university (e.g., NSBM, SLIIT)..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
             // Show all if empty on focus
             if(searchTerm === '') setSuggestions(universities);
             setShowSuggestions(true);
          }}
        />
        {searchTerm && (
          <button 
            className="btn bg-white border-0 text-muted" 
            onClick={() => { setSearchTerm(''); onSelect(null); }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="list-group position-absolute w-100 shadow mt-2" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto', borderRadius: '15px' }}>
          {suggestions.map((uni) => (
            <li
              key={uni.id}
              className="list-group-item list-group-item-action cursor-pointer border-0 py-3"
              style={{ cursor: 'pointer' }}
              onClick={() => handleSelect(uni)}
            >
              🎓 <strong>{uni.name}</strong>
              {/* Show nickname match if relevant */}
              {uni.nicknames && uni.nicknames.length > 0 && (
                 <small className="text-muted d-block ms-4" style={{fontSize: '0.8rem'}}>
                    Also known as: {uni.nicknames.join(', ')}
                 </small>
              )}
            </li>
          ))}
        </ul>
      )}
      
      {showSuggestions && searchTerm && suggestions.length === 0 && (
        <div className="position-absolute w-100 text-center bg-white p-3 shadow mt-2 rounded text-muted">
           No university found with that name.
        </div>
      )}
    </div>
  );
};

export default UniversitySearch;