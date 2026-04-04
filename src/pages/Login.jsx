import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('user'); // Toggle state
  
  // Owner Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 1. HANDLE GOOGLE LOGIN (Redirects back) ---
  const handleGoogleLogin = async () => {
    localStorage.setItem('intendedRole', 'user'); 
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/login' }
    });
  };

  // --- 2. HANDLE OWNER LOGIN (Email/Pass) ---
  const handleOwnerLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      
      // Check role in DB
      checkUserRole(data.user);

    } catch (error) {
      alert("Login Failed: " + error.message);
      setLoading(false);
    }
  };

  // --- 3. COMMON FUNCTION: CHECK ROLE & REDIRECT ---
  const checkUserRole = async (user) => {
    try {
        // Fetch detailed profile from your new 'users' table
        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        if (profile) {
            // Update Local Storage (For Navbar & other components)
            localStorage.setItem('currentUser', JSON.stringify({
                uid: profile.id,
                email: profile.email,
                name: profile.full_name,
                role: profile.role,
                avatar: profile.avatar_url
            }));

            // Smart Redirect based on DB Role
            if (profile.is_banned) {
                alert("Your account has been suspended. Please contact support.");
                await supabase.auth.signOut();
                navigate('/contact');
            } else if (profile.role === 'admin') {
                navigate('/admin');
            } else if (profile.role === 'owner') {
                navigate('/owner-dashboard');
            } else {
                // If it's a normal user
                navigate('/');
            }
        }
    } catch (err) {
        console.error("Error fetching user profile:", err.message);
        // Fallback: If DB fetch fails, just go home
        navigate('/');
    }
  };

  // --- 4. CHECK SESSION ON LOAD (For Google Return) ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
         // Only run this if we aren't manually typing in the owner form
         if(!loading) checkUserRole(session.user);
      }
    };
    checkSession();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
        <div className="card border-0 shadow-lg p-5 text-center" style={{ maxWidth: '500px', borderRadius: '30px' }}>
            <h2 className="fw-bold mb-4">Welcome Back</h2>

            {/* ROLE TOGGLE */}
            <div className="d-flex p-1 mb-4 rounded-pill bg-light">
                <button className={`btn flex-fill rounded-pill fw-bold ${role === 'user' ? 'bg-white shadow-sm' : 'text-muted'}`} onClick={() => setRole('user')}>User</button>
                <button className={`btn flex-fill rounded-pill fw-bold ${role === 'owner' ? 'bg-dark text-white shadow-sm' : 'text-muted'}`} onClick={() => setRole('owner')}>Owner</button>
            </div>

            {role === 'user' ? (
                 // --- USER LOGIN ---
                <div>
                    <button className="btn btn-white border shadow-sm w-100 py-3 rounded-pill mb-3 fw-bold" onClick={handleGoogleLogin}>
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="20" className="me-2" />
                        Continue with Google
                    </button>
                </div>
            ) : (
                // --- OWNER LOGIN ---
                <form onSubmit={handleOwnerLogin}>
                    <input type="email" placeholder="Business Email" className="form-control rounded-pill py-3 mb-3 bg-light border-0 px-4"
                        required onChange={(e) => setEmail(e.target.value)} />
                    
                    <input type="password" placeholder="Password" className="form-control rounded-pill py-3 mb-4 bg-light border-0 px-4"
                        required onChange={(e) => setPassword(e.target.value)} />

                    <button type="submit" className="btn btn-dark w-100 rounded-pill py-3 fw-bold" disabled={loading}>
                        {loading ? "Logging in..." : "Login as Owner"}
                    </button>
                </form>
            )}

            <p className="mt-3 text-muted small">
                No account? <a href="/register" className="fw-bold text-dark">Sign Up</a>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;