import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ownerInfo, setOwnerInfo] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [newReview, setNewReview] = useState({ rating: 5, text: "" });

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchListingData = async () => {
      setLoading(true);
      try {
        // A. Check Session
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);

        // B. Fetch Property Details
        const { data: prop, error } = await supabase
          .from('properties')
          .select(`
            *,
            districts (name),
            cities (name),
            users:owner_id(full_name, email)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setListing(prop);
        if (prop.images && prop.images.length > 0) {
            setMainImage(prop.images[0]);
        }

        // C. Fetch Reviews
        const { data: revs } = await supabase
          .from('reviews')
          .select(`*, users ( full_name )`)
          .eq('property_id', id)
          .order('created_at', { ascending: false });
        
        setReviews(revs || []);

        // D. Fetch Owner Phone
        if (prop.owner_id) {
            const { data: ownerData } = await supabase
                .from('owner_applications')
                .select('phone')
                .eq('user_id', prop.owner_id)
                .single();
            setOwnerInfo(ownerData);
        }
      } catch (err) {
        console.error("Error loading listing:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
        fetchListingData();
    }
  }, [id]);

  // --- CALCULATE RATINGS ---
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : "New";

  // --- SUBMIT REVIEW ---
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Please login to post a review.");
    if (!newReview.text.trim()) return alert("Please write a comment.");

    try {
        const { data, error } = await supabase
            .from('reviews')
            .insert([{
                property_id: id,
                user_id: currentUser.id,
                rating: parseInt(newReview.rating),
                comment: newReview.text.trim()
            }])
            .select(`*, users ( full_name )`)
            .single();

        if (error) throw error;

        setReviews([data, ...reviews]);
        setNewReview({ rating: 5, text: "" });
        alert("Review Posted Successfully!");
    } catch (err) {
        alert("Error posting review: " + err.message);
    }
  };

  // --- UI STATES ---
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        <Navbar />
        <div className="text-center pt-5" style={{ marginTop: '100px' }}>
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 fw-bold text-muted">Loading Property Details...</p>
        </div>
    </div>
  );

  if (!listing) return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
          <Navbar />
          <div className="text-center pt-5" style={{ marginTop: '100px' }}>
              <h1 className="display-1">🏚️</h1>
              <h3>Property not found</h3>
              <p className="text-muted">This ad may have been removed or revoked.</p>
              <button className="btn btn-dark rounded-pill mt-3 px-4" onClick={() => navigate('/listings')}>
                  View All Listings
              </button>
          </div>
      </div>
  );

  // --- MAIN RENDER ---
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
        
        {/* BACK BUTTON & BADGES */}
        <div className="d-flex justify-content-between align-items-center mb-4">
            <button className="btn btn-white border rounded-pill shadow-sm fw-bold px-4" onClick={() => navigate(-1)}>
                ← Back
            </button>
            <div>
                <span className={`badge shadow-sm fs-6 ${listing.status === 'approved' ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {listing.status === 'approved' ? '● Live' : listing.status.toUpperCase()}
                </span>
                {['premium', 'vip'].includes(listing.tier?.toLowerCase()) && (
                    <span className="badge bg-warning text-dark ms-2 shadow-sm fs-6">⭐ VIP</span>
                )}
            </div>
        </div>

        <div className="row g-4">
            {/* LEFT COLUMN: MEDIA & MAP */}
            <div className="col-lg-7">
                {/* IMAGE GALLERY */}
                <div className="card border-0 shadow-sm p-3 mb-4 rounded-4">
                    <div 
                        className="mb-3" 
                        style={{ height: '400px', borderRadius: '15px', background: `url(${mainImage || 'https://placehold.co/800x600?text=No+Image'}) center/cover`, transition: 'background 0.3s ease' }}
                    ></div>
                    
                    {listing.images && listing.images.length > 1 && (
                        <div className="d-flex gap-2 overflow-auto pb-2">
                            {listing.images.map((img, idx) => (
                                <img 
                                    key={idx} src={img} alt={`Thumbnail ${idx}`} 
                                    className={`rounded ${mainImage === img ? 'border border-3 border-primary' : 'border'}`}
                                    style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer', opacity: mainImage === img ? 1 : 0.6 }}
                                    onClick={() => setMainImage(img)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* VIP VIDEO PLAYER */}
                {listing.video_url && (
                    <div className="card border-0 shadow-sm p-4 mb-4 rounded-4">
                        <h5 className="fw-bold mb-3">🎥 Video Tour</h5>
                        <video src={listing.video_url} controls style={{ width: '100%', borderRadius: '15px', maxHeight: '400px', backgroundColor: '#000' }} />
                    </div>
                )}

                {/* LOCATION MAP (Fixed URL Encoding) */}
                <div className="card border-0 shadow-sm p-4 rounded-4 mb-4">
                    <h5 className="fw-bold mb-3">📍 Location Map</h5>
                    <div style={{ height: '300px', borderRadius: '15px', overflow: 'hidden' }}>
                        <iframe 
                            title="Property Location"
                            width="100%" height="100%" frameBorder="0" scrolling="no" 
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(`${listing.address}, ${listing.cities?.name || ''}, Sri Lanka`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        ></iframe>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: DETAILS, CONTACT, REVIEWS */}
            <div className="col-lg-5">
                <div className="card border-0 shadow-sm p-4 rounded-4 h-100 sticky-top" style={{ top: '100px' }}>
                    
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <h2 className="fw-bold m-0">{listing.title}</h2>
                        <span className="fw-bold text-warning" style={{ fontSize: '1.2rem', whiteSpace: 'nowrap' }}>★ {avgRating}</span>
                    </div>
                    
                    <p className="text-muted mb-4">📍 {listing.cities?.name}, {listing.districts?.name}</p>
                    
                    <h2 className="text-primary fw-bold mb-4">
                        {Number(listing.price).toLocaleString()} LKR <span className="text-muted fs-6 fw-normal">/ month</span>
                    </h2>

                    <div className="row g-3 mb-4">
                        <div className="col-6">
                            <p className="small text-muted mb-1 fw-bold">PROPERTY TYPE</p>
                            <h6 className="fw-bold">{listing.type}</h6>
                        </div>
                        <div className="col-6">
                            <p className="small text-muted mb-1 fw-bold">FOR WHOM</p>
                            <h6 className="fw-bold">{listing.gender === 'male' ? '♂ Boys Only' : listing.gender === 'female' ? '♀ Girls Only' : '⚥ Any'}</h6>
                        </div>
                    </div>

                    <hr className="opacity-25" />

                    {/* OWNER CONTACT */}
                    <div className="bg-light p-3 rounded-4 mb-4">
                        <p className="small text-muted fw-bold mb-2">CONTACT OWNER</p>
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style={{ width: '45px', height: '45px', fontSize: '1.2rem' }}>
                                {listing.users?.full_name ? listing.users.full_name.charAt(0).toUpperCase() : '👤'}
                            </div>
                            <div>
                                <h6 className="fw-bold m-0">{listing.users?.full_name || 'Verified Owner'}</h6>
                            </div>
                        </div>
                        <div className="d-grid gap-2">
                            {ownerInfo?.phone ? (
                                <a href={`tel:${ownerInfo.phone}`} className="btn btn-dark rounded-pill py-2 fw-bold shadow-sm">
                                    📞 Call ({ownerInfo.phone})
                                </a>
                            ) : (
                                <button className="btn btn-secondary rounded-pill py-2 fw-bold" disabled>
                                    📞 Phone Unavailable
                                </button>
                            )}
                            
                            {listing.users?.email && (
                                <a href={`mailto:${listing.users.email}`} className="btn btn-outline-dark rounded-pill py-2 fw-bold">
                                    ✉️ Email Owner
                                </a>
                            )}
                        </div>
                    </div>

                    <hr className="opacity-25" />

                    <h5 className="fw-bold mb-3">About this place</h5>
                    <p className="text-muted small" style={{ whiteSpace: 'pre-line' }}>{listing.description}</p>
                    
                    {listing.rules && (
                        <div className="mt-3 p-3 bg-danger-subtle rounded-3 border-start border-4 border-danger">
                            <h6 className="fw-bold text-danger small m-0">House Rules:</h6>
                            <p className="m-0 text-dark small">{listing.rules}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- BOTTOM SECTION: REVIEWS --- */}
        <div className="row mt-4">
            <div className="col-lg-7">
                <div className="card border-0 shadow-sm p-4 rounded-4" id="reviews">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold m-0">Reviews</h4>
                        <span className="badge bg-light text-dark border">{reviews.length} Comments</span>
                    </div>

                    {/* 1. REVIEW FORM */}
                    <div className="bg-light p-4 rounded-4 mb-5">
                        <h5 className="fw-bold mb-3">Rate this place</h5>
                        {currentUser ? (
                            <form onSubmit={handleSubmitReview}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted">YOUR RATING</label>
                                    <div>
                                        {[1,2,3,4,5].map(star => (
                                            <button 
                                                key={star} type="button" 
                                                className={`btn btn-sm me-1 rounded-circle ${newReview.rating >= star ? 'btn-warning' : 'btn-outline-secondary'}`}
                                                onClick={() => setNewReview({...newReview, rating: star})}
                                            >★</button>
                                        ))}
                                        <span className="ms-2 fw-bold text-warning">{newReview.rating}/5</span>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <textarea 
                                        className="form-control border-0" rows="3" 
                                        placeholder="Share your experience..." 
                                        value={newReview.text}
                                        onChange={(e) => setNewReview({...newReview, text: e.target.value})}
                                        required
                                    ></textarea>
                                </div>
                                <button className="btn btn-primary rounded-pill px-4 fw-bold" disabled={!newReview.text.trim()}>
                                    Post Review
                                </button>
                            </form>
                        ) : (
                            <div className="text-center text-muted py-3">
                                <p>Please <Link to="/login" className="fw-bold text-primary">Login</Link> to leave a review.</p>
                            </div>
                        )}
                    </div>

                    {/* 2. REVIEWS LIST */}
                    {reviews.length > 0 ? (
                        reviews.map((rev) => (
                            <div key={rev.id} className="mb-4 pb-3 border-bottom">
                                <div className="d-flex justify-content-between mb-1">
                                    <h6 className="fw-bold m-0">{rev.users?.full_name || "Anonymous User"}</h6>
                                    <span className="small text-muted">{new Date(rev.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-warning">{'★'.repeat(rev.rating)}</span>
                                    <span className="text-muted opacity-25">{'★'.repeat(5 - rev.rating)}</span>
                                </div>
                                <p className="text-muted m-0">{rev.comment}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted py-4">No reviews yet. Be the first!</p>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ListingDetails;