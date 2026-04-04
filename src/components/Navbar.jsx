import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase'; 

const Navbar = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(true);
  const [user, setUser] = useState(null); // Stores combined Auth + DB Profile data
  const lastScrollY = useRef(0);

  // 1. AUTH & DATABASE CONNECTION
  useEffect(() => {
    // Helper: Fetch detailed profile (Role, Avatar) from 'public.users' table
    const fetchUserProfile = async (sessionUser) => {
      if (!sessionUser) return null;

      try {
        const { data: profile, error } = await supabase
          .from('users') // <--- Connects to your new DB table
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (error) {
          console.warn("Profile fetch warning:", error.message);
          return sessionUser; // Fallback to basic auth user if DB fails
        }

        // Merge Auth data with DB data
        return { ...sessionUser, ...profile };
      } catch (err) {
        console.error("Unexpected error:", err);
        return sessionUser;
      }
    };

    // A. Check active session immediately on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user).then((fullProfile) => setUser(fullProfile));
      }
    });

    // B. Listen for changes (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const fullProfile = await fetchUserProfile(session.user);
        setUser(fullProfile);
      } else {
        setUser(null);
      }
    });

    // Cleanup listener on unmount
    return () => subscription.unsubscribe();
  }, []);

  // 2. LOGOUT FUNCTION
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      
      // Clear legacy local storage (just in case)
      localStorage.removeItem('currentUser'); 
      localStorage.removeItem('intendedRole');
      
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // 3. SCROLL LOGIC (Unchanged)
  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY === 0) setShow(true);
      else if (currentScrollY < lastScrollY.current) setShow(true);
      else if (currentScrollY > lastScrollY.current && currentScrollY > 50) setShow(false);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, []);

  return (
    <nav className={`navbar navbar-expand-lg ios-glass-nav ${show ? '' : 'nav-hidden'}`}>
      <div className="container-fluid p-0">
        
        {/* LOGO */}
        <a className="navbar-brand fw-bold" href="/">By<span className="text-primary">Cylo</span></a>

        {/* TOGGLE FOR MOBILE */}
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
           <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>

        {/* LINKS */}
        <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
                <li className="nav-item"><a className="nav-link" href="/about">About</a></li>
                <li className="nav-item"><a className="nav-link" href="/contact">Contact</a></li>
                
                {/* --- DYNAMIC USER SECTION --- */}
                {user ? (
                    <li className="nav-item dropdown ms-lg-3">
                        <a className="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" role="button" data-bs-toggle="dropdown">
                            <img 
                                // Uses DB avatar_url, falls back to Google avatar, then default
                                src={user.avatar_url || user.user_metadata?.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                                alt="Profile" 
                                className="rounded-circle border border-2 border-primary" 
                                width="40" height="40" 
                                style={{ objectFit: 'cover' }}
                            />
                            {/* Uses DB full_name, falls back to email */}
                            <span className="text-white small fw-bold">
                              {user.full_name ? user.full_name.split(' ')[0] : 'User'}
                            </span>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                            <li><span className="dropdown-item-text text-muted small">{user.email}</span></li>
                            <li><hr className="dropdown-divider" /></li>
                            
                            {/* --- CHECK DB ROLE FOR DASHBOARD ACCESS --- */}
                            {user.role === 'owner' || user.role === 'admin' ? (
                                <li><a className="dropdown-item fw-bold" href="/owner-dashboard">📊 Dashboard</a></li>
                            ) : null}

                            <li><a className="dropdown-item" href="#">👤 My Profile</a></li>
                            <li><button className="dropdown-item text-danger fw-bold" onClick={handleLogout}>🚪 Logout</button></li>
                        </ul>
                    </li>
                ) : (
                    <li className="nav-item ms-lg-2">
                        <a className="btn btn-ios-pill" href="/login">Login</a>
                    </li>
                )}

            </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;