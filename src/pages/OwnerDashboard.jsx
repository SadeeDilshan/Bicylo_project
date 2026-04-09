import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

// --- 1. EDIT FORM COMPONENT ---
const EditListing = ({ property, onCancel, onSave }) => {
    const [loading, setLoading] = useState(false);
    
    // Form Data
    const [formData, setFormData] = useState({
        title: property.title,
        price: property.price,
        description: property.description
    });

    // MEDIA STATES
    const [existingImages, setExistingImages] = useState(property.images || []);
    const [newFiles, setNewFiles] = useState([]); 
    const [previewUrls, setPreviewUrls] = useState([]); 
    
    // Tracks which image is the cover { isNew: boolean, index: number }
    const [coverIndex, setCoverIndex] = useState({ isNew: false, index: 0 });

    // VIP Video States
    const [currentVideo, setCurrentVideo] = useState(property.video_url || null);
    const [newVideoFile, setNewVideoFile] = useState(null);
    const [removeVideo, setRemoveVideo] = useState(false); // New state to track video removal

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Image Handlers ---
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setNewFiles(files);
            setPreviewUrls(files.map(file => URL.createObjectURL(file)));
        } else {
            setNewFiles([]);
            setPreviewUrls([]);
        }
        // Safety Reset: If files change, reset cover to the first existing image to prevent errors
        setCoverIndex({ isNew: false, index: 0 });
    };

    const handleRemoveExistingImage = (indexToRemove) => {
        setExistingImages(prev => prev.filter((_, i) => i !== indexToRemove));
        // Adjust cover index if the removed image was the cover or came before it
        if (!coverIndex.isNew) {
            if (coverIndex.index === indexToRemove) setCoverIndex({ isNew: false, index: 0 });
            else if (coverIndex.index > indexToRemove) setCoverIndex({ isNew: false, index: coverIndex.index - 1 });
        }
    };

    // --- Video Handler ---
    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 20 * 1024 * 1024) {
                alert("Video must be less than 20MB!");
                e.target.value = '';
                return;
            }
            setNewVideoFile(file);
            setRemoveVideo(false); // If they select a new video, cancel the removal request
        }
    };

    // --- Submit Flow ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (existingImages.length === 0 && newFiles.length === 0) {
            alert("You must have at least one image!");
            return;
        }

        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user.id;

            // 1. Upload New Images
            let uploadedUrls = [];
            for (const file of newFiles) {
                const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, '')}`;
                const filePath = `${userId}/${fileName}`;

                const { error: uploadError } = await supabase.storage.from('property-images').upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
                uploadedUrls.push(data.publicUrl);
            }

            // 2. Set Cover Image
            let allUrls = [...existingImages, ...uploadedUrls];
            let coverUrl = null;

            if (coverIndex.isNew && uploadedUrls.length > coverIndex.index) {
                coverUrl = uploadedUrls[coverIndex.index];
            } else if (!coverIndex.isNew && existingImages.length > coverIndex.index) {
                coverUrl = existingImages[coverIndex.index];
            }

            // Move the cover image to the front of the array (index 0)
            if (coverUrl) {
                allUrls = allUrls.filter(url => url !== coverUrl);
                allUrls.unshift(coverUrl);
            }

            // 3. Handle Video Update/Removal (If VIP)
            let finalVideoUrl = currentVideo;
            
            if (removeVideo) {
                finalVideoUrl = null; // Owner explicitly removed the video
            } else if (newVideoFile && property.tier === 'vip') {
                const fileName = `${Date.now()}-video.${newVideoFile.name.split('.').pop()}`;
                const filePath = `${userId}/${fileName}`;
                
                const { error: videoError } = await supabase.storage.from('property-images').upload(filePath, newVideoFile);
                if (videoError) throw videoError;
                
                const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
                finalVideoUrl = data.publicUrl;
            }

            // 4. Update Database
            const updatePayload = {
                title: formData.title,
                price: formData.price,
                description: formData.description,
                images: allUrls,
                status: 'pending', 
                admin_comment: null 
            };

            if (property.tier === 'vip') {
                updatePayload.video_url = finalVideoUrl;
            }

            const { error } = await supabase.from('properties').update(updatePayload).eq('id', property.id);
            if (error) throw error;

            alert("Property Updated Successfully! It is now pending admin review.");
            onSave(); 

        } catch (error) {
            console.error("Update failed:", error);
            alert("Update Failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card border-0 shadow-sm p-5" style={{ borderRadius: '20px' }}>
            <h3 className="fw-bold mb-4">Edit Property</h3>
            
            {['rejected', 'revoked'].includes(property.status) && (
                <div className="alert alert-danger border-0 small mb-4">
                    <strong>{property.status === 'revoked' ? "Ad Revoked by Admin:" : "Ad Rejected by Admin:"}</strong><br/>
                    <span className="text-dark">{property.admin_comment || "Please update your ad details."}</span><br/><br/>
                    Editing and saving will resubmit this ad for admin approval.
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label fw-bold small">Title</label>
                    <input name="title" type="text" className="form-control rounded-pill" value={formData.title} onChange={handleChange} required />
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold small">Price (LKR)</label>
                        <input name="price" type="number" className="form-control rounded-pill" value={formData.price} onChange={handleChange} required />
                    </div>
                </div>
                <div className="mb-3">
                    <label className="form-label fw-bold small">Description</label>
                    <textarea name="description" className="form-control" rows="4" value={formData.description} onChange={handleChange} required></textarea>
                </div>

                {/* VIP VIDEO SECTION */}
                {property.tier === 'vip' && (
                    <div className="mb-4 p-4 border rounded bg-light" style={{ borderColor: '#ffc107' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-bold small text-warning m-0">⭐ VIP FEATURE: PROPERTY VIDEO</label>
                            
                            {/* New Remove Video Button */}
                            {currentVideo && !removeVideo && (
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setRemoveVideo(true)}>
                                    🗑 Remove Video
                                </button>
                            )}
                            {removeVideo && (
                                <span className="badge bg-danger">Video will be removed on save</span>
                            )}
                        </div>

                        {currentVideo && !newVideoFile && !removeVideo && (
                            <div className="mb-3">
                                <video src={currentVideo} style={{ height: '150px', borderRadius: '10px' }} controls className="shadow-sm" />
                            </div>
                        )}

                        <input type="file" accept="video/*" className="form-control" onChange={handleVideoChange} />
                        {newVideoFile && <p className="small text-success mt-2 fw-bold">New video selected ✔️</p>}
                        <small className="text-muted">Max size: 20MB. Uploading a new video will replace the current one.</small>
                    </div>
                )}

                {/* IMAGE SECTION WITH COVER SELECTOR */}
                <div className="mb-4">
                    <label className="form-label fw-bold small">Manage Images (Click "Make Cover" to set the main thumbnail)</label>
                    
                    <div className="d-flex flex-wrap gap-3 mb-3">
                        {existingImages.map((url, i) => {
                            const isCover = !coverIndex.isNew && coverIndex.index === i;
                            return (
                                <div key={`old-${i}`} className="position-relative" style={{ width: '120px' }}>
                                    <img src={url} alt="current" style={{ width: '100%', height: '100px', borderRadius: '10px', objectFit: 'cover', border: isCover ? '3px solid #198754' : '1px solid #ddd' }} />
                                    
                                    <button type="button" className={`btn btn-sm w-100 mt-1 fw-bold ${isCover ? 'btn-success' : 'btn-light border'}`} onClick={() => setCoverIndex({ isNew: false, index: i })}>
                                        {isCover ? '⭐ Cover' : 'Make Cover'}
                                    </button>
                                    
                                    <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle" style={{ padding: '0px 6px' }} onClick={() => handleRemoveExistingImage(i)} title="Remove Image">
                                        ×
                                    </button>
                                </div>
                            );
                        })}
                        
                        {previewUrls.map((url, i) => {
                            const isCover = coverIndex.isNew && coverIndex.index === i;
                            return (
                                <div key={`new-${i}`} className="position-relative" style={{ width: '120px' }}>
                                    <img src={url} alt="new preview" style={{ width: '100%', height: '100px', borderRadius: '10px', objectFit: 'cover', border: isCover ? '3px solid #198754' : '2px dashed #0d6efd' }} />
                                    
                                    <button type="button" className={`btn btn-sm w-100 mt-1 fw-bold ${isCover ? 'btn-success' : 'btn-light border'}`} onClick={() => setCoverIndex({ isNew: true, index: i })}>
                                        {isCover ? '⭐ Cover' : 'Make Cover'}
                                    </button>
                                    <span className="badge bg-primary position-absolute top-0 start-0 m-1">New</span>
                                </div>
                            );
                        })}
                    </div>

                    <label className="form-label small text-muted">Upload Additional Images:</label>
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="form-control mb-2" />
                </div>
                
                <div className="d-flex mt-4">
                    <button type="submit" className="btn btn-dark rounded-pill px-5 me-3 fw-bold shadow-sm" disabled={loading}>
                        {loading ? "Saving Changes..." : "Save & Resubmit"}
                    </button>
                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onCancel} disabled={loading}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

// --- 2. LISTINGS TABLE ---
const MyListings = ({ properties, onDelete, onEdit }) => {
    return (
        <div className="card shadow-sm border-0" style={{ borderRadius: '20px' }}>
             <div className="card-header bg-white border-bottom p-4">
                <h4 className="fw-bold m-0">My Listings</h4>
            </div>
            <div className="table-responsive">
             <table className="table table-hover align-middle mb-0">
                <thead className="small text-muted text-uppercase">
                    <tr><th className="ps-4">Property</th><th>Status</th><th>Price</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    {properties.map((prop) => (
                        <tr key={prop.id} style={{ background: prop.status === 'pending' ? '#fffbf0' : ['rejected', 'revoked'].includes(prop.status) ? '#fff5f5' : 'white' }}>
                            <td className="ps-4">
                                <div className="d-flex align-items-center">
                                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: `url(${prop.images?.[0] || 'https://via.placeholder.com/50'}) center/cover`, marginRight: '15px', opacity: prop.status === 'approved' ? 1 : 0.6 }}></div>
                                    <div>
                                        <div className="fw-bold text-dark">{prop.title}</div>
                                        <div className="small text-muted">{prop.districts?.name || 'Unknown Dist'}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                {prop.status === 'approved' && (
                                    <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">● Live</span>
                                )}
                                {prop.status === 'pending' && (
                                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill">⏳ Pending Review</span>
                                )}
                                {prop.status === 'rejected' && (
                                    <div>
                                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill mb-1">🚫 Rejected</span>
                                        {prop.admin_comment && (
                                            <div className="small text-danger fw-bold" style={{ maxWidth: '200px', whiteSpace: 'normal', lineHeight: '1.2' }}>
                                                Reason: {prop.admin_comment}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {prop.status === 'revoked' && (
                                    <div>
                                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill mb-1">⛔ Revoked</span>
                                        {prop.admin_comment && (
                                            <div className="small text-danger fw-bold" style={{ maxWidth: '200px', whiteSpace: 'normal', lineHeight: '1.2' }}>
                                                Reason: {prop.admin_comment}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </td>
                            <td className="fw-bold">{Number(prop.price).toLocaleString()} LKR</td>
                            <td>
                                <button onClick={() => onEdit(prop)} className="btn btn-sm btn-outline-dark me-2 rounded-pill">Edit</button>
                                <button onClick={() => onDelete(prop.id)} className="btn btn-sm btn-outline-danger rounded-pill">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
            </div>
            {properties.length === 0 && <div className="p-5 text-center text-muted">No listings found. Start by adding one!</div>}
        </div>
    );
};

// --- 3. MAIN DASHBOARD ---
const OwnerDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [ownerData, setOwnerData] = useState(null);
    const [properties, setProperties] = useState([]);
    const [activeView, setActiveView] = useState('listings'); 
    const [editingItem, setEditingItem] = useState(null);

    // FETCH DATA
    useEffect(() => {
        const fetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }
            const userId = session.user.id;

            const { data: appData } = await supabase
                .from('owner_applications')
                .select('*')
                .eq('user_id', userId)
                .single();
            setOwnerData(appData);

            fetchProperties(userId);
        };
        fetchData();
    }, [navigate]);

    const fetchProperties = async (userId) => {
        const { data } = await supabase
            .from('properties')
            .select(`*, districts (name)`)
            .eq('owner_id', userId)
            .order('created_at', { ascending: false });
        
        if (data) setProperties(data);
        setLoading(false);
    };

    // --- ACTIONS ---
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this ad? This cannot be undone.")) {
            const { error } = await supabase.from('properties').delete().eq('id', id);
            if (!error) {
                setProperties(properties.filter(p => p.id !== id));
                alert("Ad deleted successfully.");
            } else {
                alert("Error deleting: " + error.message);
            }
        }
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setActiveView('edit');
    };

    const handleSaveEdit = () => {
        setEditingItem(null);
        setActiveView('listings');
        if(ownerData) fetchProperties(ownerData.user_id);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handlePublishClick = () => {
        if (ownerData?.status !== 'approved') {
            alert("⛔ Account Not Verified!\n\nYou must wait for Admin approval before publishing ads.");
        } else {
            navigate('/add-property');
        }
    };

    if (loading) return <div className="text-center mt-5">Loading Dashboard...</div>;
    const isVerified = ownerData?.status === 'approved';

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
            <Navbar />
            <div className="container-fluid" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
                
                <div className="row">
                    {/* SIDEBAR */}
                    <div className="col-lg-3 mb-4">
                        <div className="card border-0 shadow-sm p-4 sticky-top" style={{ borderRadius: '20px', top: '100px' }}>
                            <div className="text-center mb-4">
                                <div className="position-relative d-inline-block">
                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width:'60px', height:'60px', fontSize:'1.5rem'}}>👤</div>
                                    {isVerified ? (
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success border border-white">✓</span>
                                    ) : (
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning border border-white">!</span>
                                    )}
                                </div>
                                <h5 className="fw-bold m-0">Owner Dashboard</h5>
                                <p className={`small m-0 ${isVerified ? 'text-success' : 'text-warning fw-bold'}`}>
                                    {isVerified ? "Identity Verified" : "Verification Pending"}
                                </p>
                            </div>
                            
                            <div className="d-grid gap-2">
                                <button className={`btn text-start fw-bold ${activeView === 'listings' ? 'btn-primary' : 'btn-light'}`} onClick={() => setActiveView('listings')}>
                                    📋 My Listings
                                </button>
                                
                                <button 
                                    className={`btn text-start fw-bold ${isVerified ? 'btn-success' : 'btn-secondary'}`} 
                                    onClick={handlePublishClick}
                                    style={{ opacity: isVerified ? 1 : 0.6 }}
                                >
                                    {isVerified ? "➕ Publish New Ad" : "🔒 Publish Locked"}
                                </button>
                                
                                <hr />
                                <button className="btn btn-outline-danger text-start fw-bold" onClick={handleLogout}>
                                    🚪 Logout
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="col-lg-9">
                        {!isVerified && (
                            <div className="alert alert-warning border-0 shadow-sm rounded-4 mb-4 d-flex align-items-center">
                                <span className="fs-2 me-3">⏳</span>
                                <div>
                                    <h5 className="fw-bold m-0">Your Account is Under Review</h5>
                                    <p className="m-0 small">You cannot publish new ads until our Admins verify your ID photos.</p>
                                </div>
                            </div>
                        )}

                        {activeView === 'listings' && (
                            <MyListings properties={properties} onDelete={handleDelete} onEdit={handleEditClick} />
                        )}

                        {activeView === 'edit' && editingItem && (
                            <EditListing 
                                property={editingItem} 
                                onSave={handleSaveEdit} 
                                onCancel={() => setActiveView('listings')} 
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;