import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabase';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Data States
  const [stats, setStats] = useState(null);
  const [owners, setOwners] = useState([]);
  const [pendingAds, setPendingAds] = useState([]);
  const [activeAds, setActiveAds] = useState([]);
  const [users, setUsers] = useState([]);

  // 🚨 MODIFIED Modal States to handle BOTH actions
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [adToReject, setAdToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [modalAction, setModalAction] = useState('reject'); // 'reject' or 'revoke'

  const [viewUserModalOpen, setViewUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: statData, error: statError } = await supabase.rpc('get_admin_stats');
      if (!statError) setStats(statData);

      const { data: ownerData } = await supabase
        .from('owner_applications')
        .select(`*, users ( email, full_name, role, is_banned, phone, created_at )`)
        .eq('status', 'pending');
      setOwners(ownerData || []);

      const { data: pendingAdData } = await supabase
        .from('properties')
        .select(`*, users:owner_id(email), districts(name), cities(name)`)
        .eq('status', 'pending');
      setPendingAds(pendingAdData || []);

      const { data: allAds, error: adsError } = await supabase
        .from('properties')
        .select(`*, users:owner_id(email), districts(name), cities(name)`)
        .order('created_at', { ascending: false });

      if (!adsError) {
        const validStatuses = ['approved', 'active', 'published'];
        setActiveAds((allAds || []).filter(ad => validStatuses.includes((ad.status || '').toLowerCase())));
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(userData || []);

    } catch (error) {
      console.error("General Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerAction = async (id, userId, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toUpperCase()} this applicant?`)) return;
    setOwners(prev => prev.filter(item => item.id !== id));
    const { error } = await supabase.from('owner_applications').update({ status }).eq('id', id);
    if (!error && status === 'approved') await supabase.from('users').update({ role: 'owner' }).eq('id', userId);
    fetchAllData();
  };

  const handleApproveAd = async (propertyId) => {
    if (!window.confirm("Are you sure you want to approve this property and make it live?")) return;
    try {
      const { error } = await supabase.from('properties').update({ status: 'approved', admin_comment: null }).eq('id', propertyId);
      if (error) throw error;

      const approvedAd = pendingAds.find(ad => ad.id === propertyId);
      setPendingAds(prevAds => prevAds.filter(ad => ad.id !== propertyId));
      if (approvedAd) setActiveAds(prev => [{ ...approvedAd, status: 'approved' }, ...prev]);
      
      setStats(prev => prev ? { ...prev, active_ads: prev.active_ads + 1, pending_approvals: prev.pending_approvals > 0 ? prev.pending_approvals - 1 : 0 } : prev);
      alert("Property successfully approved and is now live!");
    } catch (error) {
      alert("Failed to approve property.");
    }
  };

  // 🚨 MODIFIED REJECT / REVOKE AD LOGIC
  const openRejectModal = (ad, actionType) => {
    setAdToReject(ad);
    setRejectReason('');
    setModalAction(actionType); // 'reject' or 'revoke'
    setRejectModalOpen(true);
  };

  const submitRejectAd = async () => {
    if (!rejectReason.trim()) {
        alert("Please provide a reason for the owner.");
        return;
    }

    try {
      const targetStatus = modalAction === 'revoke' ? 'revoked' : 'rejected';

      const { error } = await supabase.from('properties')
        .update({ status: targetStatus, admin_comment: rejectReason })
        .eq('id', adToReject.id);
      
      if (error) throw error;

      setPendingAds(prevAds => prevAds.filter(ad => ad.id !== adToReject.id));
      setActiveAds(prevAds => prevAds.filter(ad => ad.id !== adToReject.id));

      alert(`Property successfully ${targetStatus}.`);
      setRejectModalOpen(false);
      setAdToReject(null);
      fetchAllData(); 

    } catch (error) {
      alert(`Failed to ${modalAction} property. Please try again.`);
    }
  };

  const openUserModal = (user) => {
      setSelectedUser(user);
      setViewUserModalOpen(true);
  };

  const toggleBanUser = async (userId, currentStatus) => {
    const action = currentStatus ? "UNBAN" : "BAN";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    const { error } = await supabase.from('users').update({ is_banned: !currentStatus }).eq('id', userId);
    if (error) alert(error.message);
    else fetchAllData();
  };

  const getFilteredData = () => {
    const lowerSearch = searchTerm.toLowerCase();
    if (activeTab === 'users') return users.filter(u => (u.email || '').toLowerCase().includes(lowerSearch) || (u.full_name || '').toLowerCase().includes(lowerSearch));
    if (activeTab === 'active_ads') return activeAds.filter(ad => ad.title.toLowerCase().includes(lowerSearch));
    return [];
  };

  const viewDoc = (url) => window.open(url, '_blank');

  const MediaGallery = ({ images, videoUrl }) => {
    const hasImages = images && images.length > 0;
    if (!hasImages && !videoUrl) return <span className="text-muted small">No Media</span>;
    return (
      <div className="d-flex gap-2 align-items-center" style={{ overflowX: 'auto', maxWidth: '350px', paddingBottom: '5px' }}>
        {hasImages && images.map((img, index) => (
          <img key={index} src={img} alt={`Ad ${index}`} className="border rounded bg-white shadow-sm" style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }} onClick={() => viewDoc(img)} />
        ))}
        {videoUrl && (
            <div className="border rounded bg-dark position-relative shadow-sm" style={{ width: '60px', height: '60px', cursor: 'pointer', flexShrink: 0, overflow: 'hidden' }} onClick={() => viewDoc(videoUrl)}>
                <video src={videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} muted />
                <div className="position-absolute top-50 start-50 translate-middle text-white d-flex flex-column align-items-center"><span className="fs-5">▶</span><span className="badge bg-warning text-dark p-1" style={{ fontSize: '0.5rem' }}>VIP</span></div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8' }}>
      <Navbar />
      
      <div className="bg-dark text-white py-3" style={{ marginTop: '70px' }}>
        <div className="container d-flex justify-content-between align-items-center">
          <h5 className="m-0 fw-bold">🛡️ SUPER ADMIN DASHBOARD</h5>
          <button className="btn btn-sm btn-outline-light" onClick={fetchAllData}>🔄 Refresh Data</button>
        </div>
      </div>

      <div className="container py-5">
        <div className="row">
          
          <div className="col-lg-3 mb-4">
            <div className="card border-0 shadow-sm p-3 sticky-top" style={{ borderRadius: '15px', top: '100px' }}>
              <div className="list-group list-group-flush gap-2">
                <button className={`list-group-item list-group-item-action border-0 rounded fw-bold ${activeTab === 'stats' ? 'bg-primary text-white' : ''}`} onClick={() => setActiveTab('stats')}>📊 Statistics</button>
                <button className={`list-group-item list-group-item-action border-0 rounded fw-bold ${activeTab === 'owners' ? 'bg-primary text-white' : ''}`} onClick={() => setActiveTab('owners')}>👥 Verify Owners {owners.length > 0 && <span className="badge bg-danger ms-2">{owners.length}</span>}</button>
                <button className={`list-group-item list-group-item-action border-0 rounded fw-bold ${activeTab === 'pending_ads' ? 'bg-primary text-white' : ''}`} onClick={() => setActiveTab('pending_ads')}>⏳ Moderate Ads {pendingAds.length > 0 && <span className="badge bg-warning text-dark ms-2">{pendingAds.length}</span>}</button>
                <hr className="my-2"/>
                <button className={`list-group-item list-group-item-action border-0 rounded fw-bold ${activeTab === 'active_ads' ? 'bg-primary text-white' : ''}`} onClick={() => { setActiveTab('active_ads'); setSearchTerm(''); }}>✅ Published Ads</button>
                <button className={`list-group-item list-group-item-action border-0 rounded fw-bold ${activeTab === 'users' ? 'bg-primary text-white' : ''}`} onClick={() => { setActiveTab('users'); setSearchTerm(''); }}>🚫 Manage Users</button>
              </div>
            </div>
          </div>

          <div className="col-lg-9">
            {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}

            {!loading && activeTab === 'stats' && stats && (
              <div className="row g-3">
                <div className="col-md-6"><div className="card border-0 shadow-sm p-4 text-center h-100"><h1 className="display-4 fw-bold text-primary">{stats.total_users}</h1><p className="text-muted text-uppercase fw-bold">Total Users</p></div></div>
                <div className="col-md-6"><div className="card border-0 shadow-sm p-4 text-center h-100"><h1 className="display-4 fw-bold text-success">{stats.active_ads}</h1><p className="text-muted text-uppercase fw-bold">Live Ads</p></div></div>
                <div className="col-md-6"><div className="card border-0 shadow-sm p-4 text-center h-100"><h1 className="display-4 fw-bold text-warning">{stats.pending_approvals}</h1><p className="text-muted text-uppercase fw-bold">Pending Owners</p></div></div>
                <div className="col-md-6"><div className="card border-0 shadow-sm p-4 text-center h-100"><h1 className="display-4 fw-bold text-info">{stats.total_owners}</h1><p className="text-muted text-uppercase fw-bold">Registered Owners</p></div></div>
              </div>
            )}

            {['users', 'active_ads'].includes(activeTab) && (
              <div className="card border-0 shadow-sm p-3 mb-4"><input type="text" className="form-control border-0" placeholder="Search by name, email, or title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
            )}

            {!loading && activeTab === 'users' && (
              <div className="card border-0 shadow-sm p-4">
                <h4 className="fw-bold mb-4">User Management</h4>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead className="bg-light"><tr><th>User</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {getFilteredData().map(u => (
                        <tr key={u.id} className={u.is_banned ? "table-danger" : ""}>
                          <td><div className="fw-bold">{u.full_name || "No Name"}</div><small className="text-muted">{u.email}</small></td>
                          <td><span className={`badge bg-${u.role === 'admin' ? 'danger' : u.role === 'owner' ? 'info' : 'secondary'}`}>{u.role}</span></td>
                          <td>{u.is_banned ? <span className="text-danger fw-bold">BANNED</span> : <span className="text-success">Active</span>}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openUserModal(u)}>👤 Profile</button>
                            {u.role !== 'admin' && (
                              <button className={`btn btn-sm ${u.is_banned ? 'btn-success' : 'btn-outline-danger'}`} onClick={() => toggleBanUser(u.id, u.is_banned)}>
                                {u.is_banned ? "Unban" : "Ban"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loading && activeTab === 'active_ads' && (
               <div className="card border-0 shadow-sm p-4">
               <h4 className="fw-bold mb-4">Published Ads Manager</h4>
               <div className="table-responsive">
                 <table className="table align-middle">
                   <thead className="bg-light"><tr><th>Ad Details</th><th>Owner</th><th>Price</th><th>Media</th><th>Action</th></tr></thead>
                   <tbody>
                     {getFilteredData().map(ad => (
                       <tr key={ad.id}>
                         <td><div className="fw-bold">{ad.title}</div><small className="text-muted">{ad.cities?.name || 'Unknown'}, {ad.districts?.name || 'Unknown'} | {ad.type}</small></td>
                         <td>{ad.users?.email || 'Unknown'}</td>
                         <td>{ad.price} LKR</td>
                         <td><MediaGallery images={ad.images} videoUrl={ad.video_url} /></td>
                         <td>
                            {/* 🚨 Opens modal and tells it we are REVOKING */}
                            <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => openRejectModal(ad, 'revoke')}>Revoke Ad</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
            )}

            {!loading && activeTab === 'owners' && (
              <div className="card border-0 shadow-sm p-4">
                 <h4 className="fw-bold mb-3">Pending Owners</h4>
                 {owners.length === 0 ? <p>No pending applications.</p> : (
                   <table className="table">
                     <tbody>
                       {owners.map(app => (
                         <tr key={app.id}>
                           <td><strong>{app.users?.full_name}</strong><br/><small>{app.users?.email}</small></td>
                           <td><button className="btn btn-sm btn-outline-secondary me-2" onClick={()=>viewDoc(app.id_front_url)}>ID Front</button><button className="btn btn-sm btn-outline-secondary" onClick={()=>viewDoc(app.selfie_url)}>Selfie</button></td>
                           <td><button onClick={() => handleOwnerAction(app.id, app.user_id, 'approved')} className="btn btn-sm btn-success me-2">Approve</button><button onClick={() => handleOwnerAction(app.id, app.user_id, 'rejected')} className="btn btn-sm btn-outline-danger">Reject</button></td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 )}
              </div>
            )}

            {!loading && activeTab === 'pending_ads' && (
              <div className="card border-0 shadow-sm p-4">
                 <h4 className="fw-bold mb-3">Ads Pending Review</h4>
                 {pendingAds.length === 0 ? <p>No ads waiting for review.</p> : (
                   <div className="table-responsive">
                     <table className="table align-middle">
                      <thead className="bg-light"><tr><th>Ad Details</th><th>Media</th><th>Actions</th></tr></thead>
                       <tbody>
                         {pendingAds.map(ad => (
                           <tr key={ad.id}>
                             <td><div className="fw-bold">{ad.title}</div><div className="small text-muted">{ad.cities?.name}, {ad.districts?.name}</div><div className="small fw-bold">{ad.price} LKR - {ad.type}</div></td>
                             <td><MediaGallery images={ad.images} videoUrl={ad.video_url} /></td>
                             <td>
                                <button onClick={() => handleApproveAd(ad.id)} className="btn btn-sm btn-success me-2">Approve</button>
                                {/* 🚨 Opens modal and tells it we are REJECTING */}
                                <button onClick={() => openRejectModal(ad, 'reject')} className="btn btn-sm btn-outline-danger">Reject</button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 🚨 DYNAMIC MODAL FOR BOTH REVOKE AND REJECT */}
      {rejectModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="bg-white p-4" style={{ borderRadius: '15px', width: '90%', maxWidth: '500px' }}>
                  <h4 className="fw-bold text-danger mb-3">
                      {modalAction === 'revoke' ? 'Revoke Live Ad' : 'Reject New Ad'}
                  </h4>
                  <p className="small text-muted">Please provide a reason. The owner will see this and can edit the ad to fix the issue.</p>
                  
                  <textarea 
                    className="form-control mb-3" 
                    rows="4" 
                    placeholder="E.g., Images are blurry, price is unrealistic, inappropriate content..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  ></textarea>

                  <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-light" onClick={() => setRejectModalOpen(false)}>Cancel</button>
                      <button className="btn btn-danger fw-bold" onClick={submitRejectAd}>
                          {modalAction === 'revoke' ? 'Revoke Ad' : 'Reject Ad'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* USER PROFILE MODAL */}
      {viewUserModalOpen && selectedUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="bg-white p-4 shadow-lg" style={{ borderRadius: '20px', width: '90%', maxWidth: '400px' }}>
                  <div className="text-center mb-4">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{width:'80px', height:'80px', fontSize:'2rem'}}>👤</div>
                      <h4 className="fw-bold mb-0">{selectedUser.full_name || 'No Name Provided'}</h4>
                      <span className={`badge mt-2 bg-${selectedUser.role === 'admin' ? 'danger' : selectedUser.role === 'owner' ? 'info' : 'secondary'}`}>{selectedUser.role.toUpperCase()}</span>
                  </div>
                  
                  <ul className="list-group list-group-flush mb-4">
                      <li className="list-group-item d-flex justify-content-between px-0">
                          <span className="text-muted fw-bold small">Email:</span>
                          <span>{selectedUser.email}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between px-0">
                          <span className="text-muted fw-bold small">Phone:</span>
                          <span>{selectedUser.phone || 'N/A'}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between px-0">
                          <span className="text-muted fw-bold small">Joined:</span>
                          <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between px-0">
                          <span className="text-muted fw-bold small">Account Status:</span>
                          {selectedUser.is_banned ? <span className="text-danger fw-bold">Banned</span> : <span className="text-success fw-bold">Active</span>}
                      </li>
                  </ul>

                  <button className="btn btn-dark w-100 rounded-pill" onClick={() => setViewUserModalOpen(false)}>Close Profile</button>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminDashboard;