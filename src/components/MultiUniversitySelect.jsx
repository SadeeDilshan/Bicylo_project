import React, { useState, useEffect, useRef } from 'react';

const MultiUniversitySelect = ({ availableUniversities, selectedIds, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  // එළියෙන් click කරාම dropdown එක වැහෙන්න
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search එකට අනුව ෆිල්ටර් කිරීම සහ දැනටමත් Select කරපු ඒවා අයින් කිරීම
  const filteredUnis = availableUniversities.filter(uni => {
    // දැනටමත් තෝරලා නම් Dropdown එකේ පෙන්වන්න එපා
    if (selectedIds.includes(uni.id)) return false; 
    
    if (!searchTerm) return true;

    const lowerSearch = searchTerm.toLowerCase().trim();
    const matchName = uni.name?.toLowerCase().includes(lowerSearch);
    const matchNick = uni.nicknames && Array.isArray(uni.nicknames) 
        ? uni.nicknames.some(n => n.toLowerCase().includes(lowerSearch)) 
        : false;

    return matchName || matchNick;
  });

  const handleSelect = (uni) => {
    onChange([...selectedIds, uni.id]); // අලුත් ID එක Array එකට දානවා
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleRemove = (idToRemove) => {
    onChange(selectedIds.filter(id => id !== idToRemove)); // අයින් කරනවා
  };

  // Select කරපු ID වලට අදාළ නම් ටික හොයාගන්නවා (Tags වල පෙන්වන්න)
  const selectedUnisDetails = selectedIds.map(id => 
    availableUniversities.find(u => u.id === id)
  ).filter(Boolean);

  return (
    <div ref={wrapperRef} className="w-100 position-relative">
      
      {/* 1. තෝරපු Universities ටික Tags (Keycards) විදිහට පෙන්වීම */}
      {selectedUnisDetails.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3 p-3 bg-light rounded-4 border">
          {selectedUnisDetails.map(uni => (
            <span key={uni.id} className="badge bg-primary text-white d-flex align-items-center p-2 px-3 rounded-pill shadow-sm" style={{ fontSize: '0.9rem' }}>
              🎓 {uni.name}
              <button 
                type="button" 
                className="btn-close btn-close-white ms-2" 
                style={{ fontSize: '0.6rem' }} 
                onClick={() => handleRemove(uni.id)}
                aria-label="Remove"
              ></button>
            </span>
          ))}
        </div>
      )}

      {/* 2. Search Input එක */}
      <input
        type="text"
        className="form-control form-control-lg rounded-pill border-secondary shadow-none px-4"
        placeholder="Type to search & add universities (e.g. Japura, SLIIT)..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsDropdownOpen(true);
        }}
        onFocus={() => setIsDropdownOpen(true)}
        style={{ fontSize: '1rem' }}
      />

      {/* 3. Suggestions Dropdown එක */}
      {isDropdownOpen && filteredUnis.length > 0 && (
        <ul className="list-group position-absolute w-100 shadow-lg mt-2" style={{ zIndex: 1050, maxHeight: '250px', overflowY: 'auto', borderRadius: '15px' }}>
          {filteredUnis.map(uni => (
            <li
              key={uni.id}
              className="list-group-item list-group-item-action border-0 py-3"
              style={{ cursor: 'pointer' }}
              onClick={() => handleSelect(uni)}
            >
              <div className="fw-bold text-dark">{uni.name}</div>
              {uni.nicknames && Array.isArray(uni.nicknames) && uni.nicknames.length > 0 && (
                 <small className="text-primary fw-bold">💡 {uni.nicknames.join(', ')}</small>
              )}
            </li>
          ))}
        </ul>
      )}

      {isDropdownOpen && searchTerm && filteredUnis.length === 0 && (
        <div className="position-absolute w-100 text-center bg-white p-3 shadow-lg mt-2 rounded-4 text-muted border" style={{ zIndex: 1050 }}>
            No university found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default MultiUniversitySelect;