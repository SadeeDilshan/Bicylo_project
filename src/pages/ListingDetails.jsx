import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase'; // <--- 1. Import Supabase

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- 2. STATE MANAGEMENT ---
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ownerInfo, setOwnerInfo] = useState(null); // To store phone number
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [newReview, setNewReview] = useState({ rating: 5, text: "" });

  // --- 3. FETCH DATA ---
  useEffect(() => {
    const fetchListingData = async () => {
      setLoading(true);
      try {
        // A. Check Session (for review submission)
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);

        // B. Fetch Property Details (Join with Districts & Cities)
        const { data: prop, error } = await supabase
          .from('properties')
          .select(`
            *,
            districts (name),
            cities (name)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setListing(prop);

        // C. Fetch Reviews (Join with Users to get names)
        const { data: revs } = await supabase
          .from('reviews')
          .select(`
            *,
            users ( full_name )
          `)
          .eq('property_id', id)
          .order('created_at', { ascending: false });
        
        setReviews(revs || []);

        // D. Fetch Owner Phone Number (from owner_applications table)
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
        // navigate('/'); // Optional: Redirect if not found
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
  }, [id, navigate]);

  // --- 4. CALCULATE RATINGS ---
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : "New";

  // --- 5. SUBMIT REVIEW HANDLER ---
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Please login to post a review.");
    if (!newReview.text) return alert("Please write a comment.");

    try {
        const { data, error } = await supabase
            .from('reviews')
            .insert([{
                property_id: id,
                user_id: currentUser.id,
                rating: parseInt(newReview.rating),
                comment: newReview.text
            }])
            .select(`*, users ( full_name )`) // Return the new review with user name
            .single();

        if (error) throw error;

        // Update UI immediately
        setReviews([data, ...reviews]);
        setNewReview({ rating: 5, text: "" });
        alert("Review Posted Successfully!");

    } catch (err) {
        alert("Error posting review: " + err.message);
    }
  };

  // --- 6. LOADING STATE ---
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        <Navbar />
        <div className="text-center pt-5 mt-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Loading Property Details...</p>
        </div>
    </div>
  );

  if (!listing) return <div className="text-center pt-5 mt-5"><h3>Property not found</h3></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
        
        {/* --- TOP SECTION: IMAGES & INFO --- */}
        <div className="row mb-5">
            <div className="col-lg-8">
                <img 
                    // Handle array of images, fallback to placeholder
                    src={listing.images && listing.images.length > 0 ? listing.images[0] : "https://via.placeholder.com/800x400"} 
                    className="w-100 rounded-4 shadow-sm mb-3" 
                    style={{ height: '450px', objectFit: 'cover' }} 
                    alt="Main"
                />
                {/* Optional: Small gallery for other images could go here */}
            </div>

            <div className="col-lg-4">
                <div className="card border-0 shadow-sm p-4 rounded-4 h-100 sticky-top" style={{ top: '100px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className={`badge ${listing.status === 'approved' ? 'bg-success' : 'bg-warning'}`}>
                            {listing.status === 'approved' ? 'Available' : listing.status}
                        </span>
                        <span className="fw-bold text-warning" style={{ fontSize: '1.2rem' }}>★ {avgRating} ({reviews.length} reviews)</span>
                    </div>
                    
                    <h2 className="fw-bold">{listing.title}</h2>
                    {/* Display City and District Names */}
                    <p className="text-muted mb-3">📍 {listing.cities?.name}, {listing.districts?.name}</p>
                    
                    <h3 className="text-primary fw-bold mb-4">
                        {Number(listing.price).toLocaleString()} LKR <span className="text-muted fs-6 fw-normal">/ month</span>
                    </h3>
                    
                    <div className="d-grid gap-2">
                        <a href={`tel:${ownerInfo?.phone || ''}`} className="btn btn-dark rounded-pill py-3 fw-bold">
                            📞 Call Owner {ownerInfo?.phone ? `(${ownerInfo.phone})` : '(No Number)'}
                        </a>
                        <button className="btn btn-success rounded-pill py-3 fw-bold" onClick={() => alert("WhatsApp integration coming soon!")}>
                            💬 WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* --- BOTTOM SECTION: DETAILS & REVIEWS --- */}
        <div className="row">
            <div className="col-lg-8">
                
                {/* DETAILS CARD */}
                <div className="card border-0 shadow-sm p-4 rounded-4 mb-4">
                    <h4 className="fw-bold mb-3">About this place</h4>
                    <p className="text-muted lead" style={{ fontSize: '1rem', whiteSpace: 'pre-line' }}>
                        {listing.description || "No description provided."}
                    </p>
                    
                    {listing.rules && (
                        <div className="mt-4 p-3 bg-light rounded-3 border-start border-4 border-danger">
                            <h6 className="fw-bold text-danger">House Rules:</h6>
                            <p className="m-0 text-muted small">{listing.rules}</p>
                        </div>
                    )}
                </div>

                {/* REVIEWS SECTION */}
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
                                    <div className="rating-select">
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
                                        className="form-control border-0" 
                                        rows="3" 
                                        placeholder="Share your experience (e.g. Is it quiet? Is the owner nice?)" 
                                        value={newReview.text}
                                        onChange={(e) => setNewReview({...newReview, text: e.target.value})}
                                        required
                                    ></textarea>
                                </div>
                                <button className="btn btn-primary rounded-pill px-4 fw-bold">Post Review</button>
                            </form>
                        ) : (
                            <div className="text-center text-muted py-3">
                                <p>Please <a href="/login" className="fw-bold text-primary">Login</a> to leave a review.</p>
                            </div>
                        )}
                    </div>

                    {/* 2. REVIEWS LIST */}
                    {reviews.length > 0 ? (
                        reviews.map((rev) => (
                            <div key={rev.id} className="mb-4 pb-3 border-bottom">
                                <div className="d-flex justify-content-between mb-1">
                                    {/* User name comes from the joined 'users' table */}
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