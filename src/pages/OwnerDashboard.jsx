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
        // We use IDs now, but for display/edit we might want to keep it simple or expand it later.
        description: property.description
    });

    const [currentImages, setCurrentImages] = useState(property.images || []);
    const [newFiles, setNewFiles] = useState([]); 
    const [previewUrls, setPreviewUrls] = useState([]); 

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setNewFiles(files);
            setPreviewUrls(files.map(file => URL.createObjectURL(file)));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalImageUrls = currentImages;

            if (newFiles.length > 0) {
                const uploadedUrls = [];
                const userId = (await supabase.auth.getUser()).data.user.id;

                for (const file of newFiles) {
                    const fileName = `${Date.now()}-${file.name}`;
                    const filePath = `${userId}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('property-images')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
                    uploadedUrls.push(data.publicUrl);
                }
                
                finalImageUrls = uploadedUrls;
            }

            const { error } = await supabase
                .from('properties')
                .update({
                    title: formData.title,
                    price: formData.price,
                    description: formData.description,
                    images: finalImageUrls
                })
                .eq('id', property.id);

            if (error) throw error;

            alert("Property Updated Successfully!");
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
            
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label fw-bold small">Title</label>
                    <input name="title" type="text" className="form-control rounded-pill" value={formData.title} onChange={handleChange} />
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold small">Price (LKR)</label>
                        <input name="price" type="number" className="form-control rounded-pill" value={formData.price} onChange={handleChange} />
                    </div>
                </div>
                <div className="mb-3">
                    <label className="form-label fw-bold small">Description</label>
                    <textarea name="description" className="form-control" rows="4" value={formData.description} onChange={handleChange}></textarea>
                </div>

                <div className="mb-4">
                    <label className="form-label fw-bold small">Images</label>
                    {newFiles.length === 0 && (
                        <div className="d-flex gap-2 overflow-auto mb-3">
                            {currentImages.map((url, i) => (
                                <img key={i} src={url} alt="current" style={{width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', opacity: 0.7}} />
                            ))}
                        </div>
                    )}
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="form-control mb-2" />
                    {previewUrls.length > 0 && (
                        <div className="d-flex gap-2 overflow-auto">
                            {previewUrls.map((url, i) => (
                                <img key={i} src={url} alt="new preview" style={{width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', border: '2px solid #0d6efd'}} />
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="d-flex mt-4">
                    <button type="submit" className="btn btn-success rounded-pill px-5 me-3 fw-bold" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onCancel}>Cancel</button>
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
                        <tr key={prop.id} style={{ background: prop.status === 'pending' ? '#fffbf0' : 'white' }}>
                            <td className="ps-4">
                                <div className="d-flex align-items-center">
                                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: `url(${prop.images?.[0] || 'https://via.placeholder.com/50'}) center/cover`, marginRight: '15px', opacity: prop.status === 'pending' ? 0.6 : 1 }}></div>
                                    <div>
                                        <div className="fw-bold text-dark">{prop.title}</div>
                                        {/* Show District Name from joined table */}
                                        <div className="small text-muted">{prop.districts?.name || 'Unknown Dist'}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                {prop.status === 'approved' ? (
                                    <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">● Live</span>
                                ) : (
                                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill">⏳ Pending Review</span>
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

            // Get Owner Status
            const { data: appData } = await supabase
                .from('owner_applications')
                .select('*')
                .eq('user_id', userId)
                .single();
            setOwnerData(appData);

            // Get Properties
            fetchProperties(userId);
        };
        fetchData();
    }, [navigate]);

    const fetchProperties = async (userId) => {
        // Updated to JOIN with districts table to get the name
        const { data } = await supabase
            .from('properties')
            .select(`
                *,
                districts (name)
            `)
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
                console.error("Delete failed:", error);
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
        // Refresh list to see changes
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