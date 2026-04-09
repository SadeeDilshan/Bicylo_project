import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';

const UniversitySearch = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [universities, setUniversities] = useState([]); 
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // --- 1. FETCH UNIVERSITIES FROM DB ---
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const { data, error } = await supabase
          .from('universities')
          .select('id, name, nicknames') // 🚨 nicknames ගත්තා
          .order('name');

        if (error) throw error;
        if (data) setUniversities(data);
        
      } catch (error) {
        console.error("Error fetching universities:", error.message);
      }
    };

    fetchUniversities();
  }, []);

  // --- 2. SMART FILTER LOGIC (Name + Nicknames) ---
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions(universities); // හිස් නම් ඔක්කොම පෙන්නනවා (onFocus එකට ලේසි වෙන්න)
    } else {
      const lowerSearch = searchTerm.toLowerCase().trim();
      
      const filtered = universities.filter((uni) => {
        // 1. ප්‍රධාන නමෙන් (name) Check කරනවා
        if (uni.name?.toLowerCase().includes(lowerSearch)) return true;
        
        // 2. Nicknames වලින් Check කරනවා (Array එකක්ද කියලා ෂුවර් කරගෙන)
        if (uni.nicknames && Array.isArray(uni.nicknames)) {
            const hasNicknameMatch = uni.nicknames.some(nick => 
                nick?.toLowerCase().includes(lowerSearch)
            );
            if (hasNicknameMatch) return true;
        }
        
        return false;
      });

      setSuggestions(filtered);
    }
  }, [searchTerm, universities]);

  // --- 3. CLICK OUTSIDE HANDLER ---
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
    setSearchTerm(uni.name); // නිල නම Input එකට දානවා
    setShowSuggestions(false);
    if (onSelect) onSelect(uni.id); // ID එක යවනවා
  };

  return (
    <div ref={wrapperRef} className="position-relative w-100" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="input-group input-group-lg shadow-sm rounded-pill overflow-hidden border">
        <span className="input-group-text bg-white border-0 ps-4">🔍</span>
        <input
          type="text"
          className="form-control border-0 shadow-none"
          placeholder="Type your university (e.g., NSBM, SLIIT, Japura)..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        {searchTerm && (
          <button 
            className="btn bg-white border-0 text-muted" 
            onClick={() => { setSearchTerm(''); onSelect(null); setShowSuggestions(false); }}
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
              {uni.nicknames && Array.isArray(uni.nicknames) && uni.nicknames.length > 0 && (
                 <small className="text-primary fw-bold d-block ms-4 mt-1" style={{fontSize: '0.8rem'}}>
                   💡 aka {uni.nicknames.join(', ')}
                 </small>
              )}
            </li>
          ))}
        </ul>
      )}
      
      {showSuggestions && searchTerm && suggestions.length === 0 && (
        <div className="position-absolute w-100 text-center bg-white p-3 shadow mt-2 rounded-4 text-muted" style={{ zIndex: 1000 }}>
            No university found with that name.
        </div>
      )}
    </div>
  );
};

export default UniversitySearch;