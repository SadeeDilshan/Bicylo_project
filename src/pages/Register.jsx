import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('user');

  // --- HANDLE GOOGLE SIGN UP ---
  const handleGoogleRegister = async () => {
    try {
      // We pass the selected 'role' in queryParams so Supabase Auth can use it.
      // However, for Google OAuth, passing custom data to the trigger is tricky.
      // Strategy: We sign them in, then update their role if they are new.
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login',
          // Pass metadata to be saved in auth.users.raw_user_meta_data
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          data: {
            role: role, // <--- This sends the role to the Auth Trigger
            full_name: '', // Google will fill this, but good to have a key
          }
        }
      });

      if (error) throw error;

      // Fallback: Save intended role just in case metadata fails
      localStorage.setItem('intendedRole', role);

    } catch (error) {
      console.error(error);
      alert("Registration Failed: " + error.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', position: 'relative' }}>
        <Navbar />

        <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', paddingTop: '80px' }}>
            <div className="card ios-card p-5 text-center" style={{ maxWidth: '500px', width: '100%', borderRadius: '30px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(30px)' }}>
                
                <h2 className="fw-bold mb-4">Create Account</h2>

                <div className="d-flex p-1 mb-4 rounded-pill" style={{ background: '#e9ecef' }}>
                    <button className={`btn flex-fill rounded-pill fw-bold ${role === 'user' ? 'bg-white shadow-sm' : 'text-muted'}`} onClick={() => setRole('user')}>User</button>
                    <button className={`btn flex-fill rounded-pill fw-bold ${role === 'owner' ? 'bg-white shadow-sm' : 'text-muted'}`} onClick={() => setRole('owner')}>Owner</button>
                </div>

                {role === 'user' ? (
                    <div>
                        <button 
                            className="btn btn-white border shadow-sm w-100 py-3 rounded-pill mb-3 fw-bold"
                            onClick={handleGoogleRegister} 
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width="20" className="me-2" />
                            Sign up with Google
                        </button>
                        <p className="text-muted small">Fastest way for students & travelers.</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-muted">Landlords must verify their identity.</p>
                        
                        <button 
                            className="btn btn-dark w-100 py-3 rounded-pill fw-bold"
                            onClick={() => navigate('/owner-register')} 
                        >
                            Start Owner Registration
                        </button>
                    </div>
                )}
                
                <p className="mt-4 text-muted small">
                    Already have an account? <a href="/login" className="fw-bold text-decoration-none">Login</a>
                </p>
            </div>
        </div>
    </div>
  );
};

export default Register;