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

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats (Requires the RPC function from the SQL script)
      const { data: statData, error: statError } = await supabase.rpc('get_admin_stats');
      if (!statError) setStats(statData);

      // 2. Fetch Pending Owners (Joins with 'users' table)
      const { data: ownerData } = await supabase
        .from('owner_applications')
        .select(`*, users ( email, full_name, role, is_banned )`)
        .eq('status', 'pending'); // Use .eq for Enums
      setOwners(ownerData || []);

      // 3. Fetch Pending Ads (Joins with 'districts' and 'cities' to get names)
      const { data: pendingAdData } = await supabase
        .from('properties')
        .select(`
            *, 
            users:owner_id(email), 
            districts(name), 
            cities(name)
        `)
        .eq('status', 'pending');
      setPendingAds(pendingAdData || []);

      // 4. Fetch Active Ads (Joins with 'districts' and 'cities')
      const { data: allAds, error: adsError } = await supabase
        .from('properties')
        .select(`
            *, 
            users:owner_id(email), 
            districts(name), 
            cities(name)
        `)
        .order('created_at', { ascending: false });

      if (adsError) {
        console.error("Error fetching ads:", adsError.message);
      } else {
        const validStatuses = ['approved', 'active', 'published'];
        const filteredActive = (allAds || []).filter(ad => 
           validStatuses.includes((ad.status || '').toLowerCase())
        );
        setActiveAds(filteredActive);
      }

      // 5. Fetch All Users
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

  // --- ACTIONS ---

  const handleOwnerAction = async (id, userId, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toUpperCase()} this applicant?`)) return;

    // 1. Optimistic Update
    setOwners(prev => prev.filter(item => item.id !== id));

    // 2. Database Update
    const { error } = await supabase.from('owner_applications').update({ status }).eq('id', id);

    if (!error && status === 'approved') {
      await supabase.from('users').update({ role: 'owner' }).eq('id', userId);
    }
    
    if (error) {
      alert("Error: " + error.message);
      fetchAllData(); 
    } else {
      alert(`Application ${status} successfully!`);
    }
  };

  const handleAdAction = async (id, status) => {
    setPendingAds(prev => prev.filter(item => item.id !== id));

    const { error } = await supabase.from('properties').update({ status }).eq('id', id);
    
    if (error) {
      alert("Error: " + error.message);
      fetchAllData();
    } else {
      if(status === 'approved') fetchAllData(); 
    }
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY DELETE this ad?")) return;
    
    setActiveAds(prev => prev.filter(item => item.id !== id));

    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) {
      alert("Error deleting: " + error.message);
      fetchAllData();
    }
  };

  const toggleBanUser = async (userId, currentStatus) => {
    const action = currentStatus ? "UNBAN" : "BAN";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    const { error } = await supabase
      .from('users')
      .update({ is_banned: !currentStatus })
      .eq('id', userId);

    if (error) alert(error.message);
    else fetchAllData();
  };

  // --- FILTER LOGIC ---
  const getFilteredData = () => {
    const lowerSearch = searchTerm.toLowerCase();
    
    if (activeTab === 'users') {
      return users.filter(u => 
        (u.email || '').toLowerCase().includes(lowerSearch) || 
        (u.full_name || '').toLowerCase().includes(lowerSearch)
      );
    }
    if (activeTab === 'active_ads') {
      return activeAds.filter(ad => ad.title.toLowerCase().includes(lowerSearch));
    }
    return [];
  };

  const viewDoc = (url) => window.open(url, '_blank');

  // --- COMPONENT: IMAGE GALLERY ---
  const ImageGallery = ({ images }) => {
    if (!images || images.length === 0) return <span className="text-muted small">No images</span>;
    return (
      <div className="d-flex gap-2 align-items-center" style={{ overflowX: 'auto', maxWidth: '300px', paddingBottom: '5px' }}>
        {images.map((img, index) => (
          <img 
            key={index} 
            src={img} 
            alt={`Ad ${index}`} 
            className="border rounded bg-white"
            style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => viewDoc(img)}
            title="Click to Enlarge"
          />
        ))}
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
          
          {/* SIDEBAR */}
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

          {/* MAIN CONTENT */}
          <div className="col-lg-9">
            {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}

            {/* TAB: STATISTICS */}
            {!loading && activeTab === 'stats' && stats && (
              <div className="row g-3">
                <div className="col-md-6"><div className="card border-0 shadow-sm p-4 text-center h-100"><h1 className="display-4 fw-bold text-primary">{stats.total_users}</h1><p className="text-muted text-uppercase fw-bold">Total Users</p></div></div>
                <div className="col-md-6"><div className="card border-0 shadow-sm p-4 text-center h-100"><h1 className="display-4 fw-bold text-success">{stats.active_ads}</h1><p className="text-muted text-uppercase fw-bold">Live Ads</p></div></div>
                <div className="col-md-6"><div className="card border-0 shadow-sm p-4 text-center h-100"><h1 className="display-4 fw-bold text-warning">{stats.pending_approvals}</h1><p className="text-muted text-uppercase fw-bold">Pending Owners</p></div></div>
                <div className="col-md-6"><div className="card border-0 shadow-sm p-4 text-center h-100"><h1 className="display-4 fw-bold text-info">{stats.total_owners}</h1><p className="text-muted text-uppercase fw-bold">Registered Owners</p></div></div>
              </div>
            )}

            {/* SEARCH BAR */}
            {['users', 'active_ads'].includes(activeTab) && (
              <div className="card border-0 shadow-sm p-3 mb-4">
                 <input type="text" className="form-control border-0" placeholder="Search by name, email, or title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
              </div>
            )}

            {/* TAB: USERS */}
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
                            {u.role !== 'admin' && (
                              <button className={`btn btn-sm ${u.is_banned ? 'btn-success' : 'btn-outline-danger'}`} onClick={() => toggleBanUser(u.id, u.is_banned)}>
                                {u.is_banned ? "Unban User" : "🚫 Ban User"}
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

            {/* TAB: ACTIVE ADS (With Images & Updated Location) */}
            {!loading && activeTab === 'active_ads' && (
               <div className="card border-0 shadow-sm p-4">
               <h4 className="fw-bold mb-4">Published Ads Manager</h4>
               <div className="table-responsive">
                 <table className="table align-middle">
                   <thead className="bg-light"><tr><th>Ad Details</th><th>Owner</th><th>Price</th><th>Images</th><th>Action</th></tr></thead>
                   <tbody>
                     {getFilteredData().map(ad => (
                       <tr key={ad.id}>
                         <td>
                            <div className="fw-bold">{ad.title}</div>
                            {/* Updated to show District/City names from the joined tables */}
                            <small className="text-muted">
                                {ad.cities?.name || 'Unknown City'}, {ad.districts?.name || 'Unknown Dist'} | {ad.type}
                            </small>
                         </td>
                         <td>{ad.users?.email || 'Unknown'}</td>
                         <td>{ad.price} LKR</td>
                         <td>
                           <ImageGallery images={ad.images} />
                         </td>
                         <td><button className="btn btn-sm btn-danger" onClick={() => handleDeleteAd(ad.id)}>🗑 Delete</button></td>
                       </tr>
                     ))}
                     {getFilteredData().length === 0 && <tr><td colSpan="5" className="text-center text-muted py-4">No published ads found.</td></tr>}
                   </tbody>
                 </table>
               </div>
             </div>
            )}

            {/* TAB: PENDING OWNERS */}
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

            {/* TAB: PENDING ADS (With Images & Updated Location) */}
            {!loading && activeTab === 'pending_ads' && (
              <div className="card border-0 shadow-sm p-4">
                 <h4 className="fw-bold mb-3">Ads Pending Review</h4>
                 {pendingAds.length === 0 ? <p>No ads waiting for review.</p> : (
                   <div className="table-responsive">
                     <table className="table align-middle">
                      <thead className="bg-light"><tr><th>Ad Details</th><th>Images</th><th>Actions</th></tr></thead>
                       <tbody>
                         {pendingAds.map(ad => (
                           <tr key={ad.id}>
                             <td>
                               <div className="fw-bold">{ad.title}</div>
                               {/* Updated Location Display */}
                               <div className="small text-muted">
                                   {ad.cities?.name}, {ad.districts?.name}
                               </div>
                               <div className="small fw-bold">{ad.price} LKR - {ad.type}</div>
                             </td>
                             <td>
                               <ImageGallery images={ad.images} />
                             </td>
                             <td><button onClick={() => handleAdAction(ad.id, 'approved')} className="btn btn-sm btn-success me-2">Approve</button><button onClick={() => handleAdAction(ad.id, 'rejected')} className="btn btn-sm btn-outline-danger">Reject</button></td>
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
    </div>
  );
};

export default AdminDashboard;