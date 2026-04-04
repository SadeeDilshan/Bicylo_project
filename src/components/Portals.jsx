import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase'; // <--- 1. Import Supabase

const Portals = () => {
  const navigate = useNavigate();
  
  // --- 2. STATE FOR COUNTS ---
  const [counts, setCounts] = useState({ student: 0, worker: 0, traveler: 0 });
  const [loading, setLoading] = useState(true);

  // --- 3. FETCH ACTIVE AD COUNTS ---
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Run 3 queries in parallel to get counts for each audience type
        const [studentRes, workerRes, travelerRes] = await Promise.all([
          supabase
            .from('properties')
            .select('*', { count: 'exact', head: true }) // 'head: true' means we only fetch the count, not the data (saves bandwidth)
            .contains('audiences', ['student'])
            .eq('status', 'approved'),
          
          supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .contains('audiences', ['worker'])
            .eq('status', 'approved'),

          supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .contains('audiences', ['traveler'])
            .eq('status', 'approved')
        ]);

        setCounts({
          student: studentRes.count || 0,
          worker: workerRes.count || 0,
          traveler: travelerRes.count || 0
        });
      } catch (error) {
        console.error("Error fetching counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <section className="portals-section">
        <div className="container">
            <div className="row g-4 justify-content-center">
                
                {/* --- STUDENT CARD --- */}
                <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="100">
                    <div 
                        className="card ios-card h-100" 
                        onClick={() => navigate('/student-listings')} 
                    >
                        <div className="ios-img-container" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')" }}></div>
                        
                        <div className="card-body text-center p-4">
                            <h3 className="card-title fw-bold">Students</h3>
                            <p className="card-text small mb-1">Affordable boardings & shared rooms.</p>
                            
                            {/* DYNAMIC COUNT DISPLAY */}
                            {!loading && (
                                <p className="small text-primary fw-bold mb-3">
                                    {counts.student} listings available
                                </p>
                            )}

                            <span className="btn btn-sm btn-ios-pill">Find Boarding</span> 
                        </div>
                    </div>
                </div>

                {/* --- WORKER CARD --- */}
                <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="200">
                    <div 
                        className="card ios-card h-100" 
                        onClick={() => navigate('/worker-listings')}
                    >
                        <div className="ios-img-container" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')" }}></div>
                        <div className="card-body text-center p-4">
                            <h3 className="card-title fw-bold">Workers</h3>
                            <p className="card-text small mb-1">Convenient annexes & apartments.</p>
                            
                            {/* DYNAMIC COUNT DISPLAY */}
                            {!loading && (
                                <p className="small text-success fw-bold mb-3">
                                    {counts.worker} listings available
                                </p>
                            )}

                            <span className="btn btn-sm btn-ios-pill">Find Rentals</span>
                        </div>
                    </div>
                </div>

                {/* --- TRAVELER CARD --- */}
                <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="300">
                    <div 
                        className="card ios-card h-100" 
                        onClick={() => navigate('/traveler-listings')}
                    >
                        <div className="ios-img-container" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')" }}></div>
                        <div className="card-body text-center p-4">
                            <h3 className="card-title fw-bold">Travelers</h3>
                            <p className="card-text small mb-1">Luxury villas & holiday homes.</p>
                            
                            {/* DYNAMIC COUNT DISPLAY */}
                            {!loading && (
                                <p className="small text-warning fw-bold mb-3">
                                    {counts.traveler} listings available
                                </p>
                            )}

                            <span className="btn btn-sm btn-ios-pill">Book Stay</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>
  );
};

export default Portals;