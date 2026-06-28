import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';

export default function SellerDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { categories, fetchCategories } = useProducts();

  // Tab State
  const [activeTab, setActiveTab] = useState('listings');

  // Listings State
  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  // Incoming Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Multiple Images State
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Form States (for Create / Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    condition: 'New',
    collegeName: '',
    contactDetails: '',
    categoryId: '',
    listingType: 'Sell', // Sell, Exchange, SellOrExchange, Donate
    department: '',
    semester: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCategories();
  }, [token, user, navigate, fetchCategories]);

  // Fetch Seller Listings
  const loadListings = async () => {
    setListingsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      if (res.ok) {
        const data = await res.json();
        const all = data.products || [];
        const filtered = all.filter((p: any) => p.sellerId === user?.id);
        setListings(filtered);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setListingsLoading(false);
    }
  };

  // Fetch Seller Incoming Orders
  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/seller`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching seller orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.verificationStatus === 'Verified') {
      if (activeTab === 'listings') {
        loadListings();
      } else if (activeTab === 'orders') {
        loadOrders();
      }
    }
  }, [activeTab, token, user]);

  // Read selected files and convert to Base64 strings
  const handleMultipleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const readPromises = files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readPromises).then((base64Strings) => {
        setUploadedImages((prev) => [...prev, ...base64Strings]);
      });
    }
  };

  // Handle Create / Edit Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    if (!form.categoryId) {
      setFormError('Please select a Category');
      setFormLoading(false);
      return;
    }

    try {
      const url = isEditing
        ? `${API_BASE}/api/products/${editId}`
        : `${API_BASE}/api/products`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const firstImage = uploadedImages[0] || '';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          imageUrl: firstImage, // fallback first image URL for single-image grids compatibility
          imagesJson: JSON.stringify(uploadedImages), // complete uploaded images array
          price: form.listingType === 'Donate' ? 0 : Number(form.price),
          categoryId: Number(form.categoryId),
          semester: form.semester ? Number(form.semester) : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit product');

      setFormSuccess(isEditing ? 'Listing updated successfully!' : 'Listing created successfully!');
      
      // Clear form and images state on success if not editing
      if (!isEditing) {
        setForm({
          name: '',
          description: '',
          price: '',
          imageUrl: '',
          condition: 'New',
          collegeName: user?.verification?.collegeName || '',
          contactDetails: user?.phone || '',
          categoryId: '',
          listingType: 'Sell',
          department: user?.department || '',
          semester: user?.semester ? String(user.semester) : ''
        });
        setUploadedImages([]);
      }

      // Go back to listings list tab after delay
      setTimeout(() => {
        setIsEditing(false);
        setEditId(null);
        setActiveTab('listings');
        loadListings();
      }, 1000);

    } catch (err: any) {
      setFormError(err.message || 'Form submission failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (prod: any) => {
    setIsEditing(true);
    setEditId(prod.id);
    setForm({
      name: prod.name,
      description: prod.description || '',
      price: String(prod.price),
      imageUrl: prod.imageUrl || '',
      condition: prod.condition,
      collegeName: prod.collegeName || '',
      contactDetails: prod.contactDetails || '',
      categoryId: String(prod.categoryId),
      listingType: prod.listingType || 'Sell',
      department: prod.department || '',
      semester: prod.semester ? String(prod.semester) : ''
    });

    // Load multiple images from json
    if (prod.imagesJson) {
      try {
        setUploadedImages(JSON.parse(prod.imagesJson));
      } catch (err) {
        setUploadedImages(prod.imageUrl ? [prod.imageUrl] : []);
      }
    } else {
      setUploadedImages(prod.imageUrl ? [prod.imageUrl] : []);
    }
    
    setActiveTab('form');
  };

  const handleDeleteClick = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        loadListings();
        alert('Product deleted successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  // Update status of incoming order
  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        loadOrders();
        alert(`Order status updated to: ${status}`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Update failed');
    }
  };

  const handleCreateClick = () => {
    setIsEditing(false);
    setEditId(null);
    setUploadedImages([]);
    setForm({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      condition: 'New',
      collegeName: user?.verification?.collegeName || '',
      contactDetails: user?.phone || '',
      categoryId: '',
      listingType: 'Sell',
      department: user?.department || '',
      semester: user?.semester ? String(user.semester) : ''
    });
    setActiveTab('form');
  };

  // Verification status block message
  if (user && user.verificationStatus !== 'Verified' && user.role !== 'admin') {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '1rem' }}>
        <div className="glass" style={{ padding: '3rem 2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <span style={{ fontSize: '4rem' }}>🔒</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '1.5rem 0 0.5rem 0' }}>Student Verification Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Only verified college students can upload and manage products on CampusMart. <br />
            Please go to your Profile and submit your verification details first.
          </p>
          <button onClick={() => navigate('/user-dashboard?tab=verification')} className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontWeight: 700 }}>
            Check ID Verification Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '2rem' }}>Seller Dashboard</h1>

      <div className="dashboard-container">
        
        {/* Sidebar */}
        <aside className="dashboard-sidebar glass">
          <div style={{ textAlign: 'center', padding: '1rem 0', borderBottom: '1px solid var(--card-border)', marginBottom: '1rem' }}>
            <span style={{ fontSize: '3rem' }}>🏬</span>
            <h3 style={{ marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Seller Portal</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Welcome, {user?.name}</p>
          </div>

          <button
            onClick={() => setActiveTab('listings')}
            className={`sidebar-tab ${activeTab === 'listings' ? 'active' : ''}`}
          >
            🏷️ Manage Listings
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`sidebar-tab ${activeTab === 'orders' ? 'active' : ''}`}
          >
            📥 Incoming Orders
          </button>

          <button
            onClick={handleCreateClick}
            className={`sidebar-tab ${activeTab === 'form' && !isEditing ? 'active' : ''}`}
          >
            ➕ Add New Product
          </button>

          <button
            onClick={() => navigate('/user-dashboard')}
            className="sidebar-tab"
            style={{ marginTop: '2rem' }}
          >
            👤 User Dashboard
          </button>
        </aside>

        {/* Content */}
        <main className="dashboard-content glass">
          
          {/* TAB 1: LISTINGS LIST */}
          {activeTab === 'listings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Active Listings</h2>
                <button onClick={handleCreateClick} className="btn btn-primary btn-sm">
                  + Add Product
                </button>
              </div>

              {listingsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <div className="spinner"></div>
                </div>
              ) : listings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>📦</span>
                  <h3 style={{ marginTop: '1rem' }}>No products listed</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>List your books or devices to earn cash.</p>
                  <button onClick={handleCreateClick} className="btn btn-primary">
                    Create Listing
                  </button>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Price</th>
                        <th>Listing Type</th>
                        <th>Condition</th>
                        <th>Category</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((prod) => (
                        <tr key={prod.id}>
                          <td>
                            <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                              {prod.imageUrl ? (
                                <img src={prod.imageUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span>📦</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <strong>{prod.name}</strong>
                          </td>
                          <td>{prod.listingType === 'Donate' ? 'FREE 💚' : `₹${Number(prod.price).toLocaleString('en-IN')}`}</td>
                          <td>
                            <span className="badge-status badge-verified" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: prod.listingType === 'Donate' ? '#10b981' : prod.listingType === 'Exchange' ? '#fbbf24' : '#06b6d4', color: '#000' }}>
                              {prod.listingType}
                            </span>
                          </td>
                          <td>{prod.condition}</td>
                          <td>{prod.category?.name || 'General'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => handleEditClick(prod)} className="btn btn-secondary btn-sm">
                                Edit
                              </button>
                              <button onClick={() => handleDeleteClick(prod.id)} className="btn btn-secondary btn-sm" style={{ color: '#f87171' }}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INBOUND ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Incoming Orders & Handovers</h2>
              {ordersLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <div className="spinner"></div>
                </div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No incoming orders or swap claims yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {orders.map((ord: any) => (
                    <div key={ord.id} className="glass" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', fontSize: '0.85rem' }}>
                        <span>Order **#{ord.id}**</span>
                        <span style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>{ord.status}</span>
                      </div>

                      <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                        <strong>Buyer Details:</strong> {ord.fullName} ({ord.phone} / {ord.email})
                      </div>

                      {/* Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {ord.items.map((it: any) => (
                          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{it.productName} (x{it.quantity})</span>
                            <span>₹{it.productPrice}</span>
                          </div>
                        ))}
                      </div>

                      {ord.meetup && (
                        <div className="glass font-secondary" style={{ padding: '0.75rem', borderRadius: '8px', marginTop: '0.75rem', fontSize: '0.8rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
                          📍 <strong>Campus Handover Meetup:</strong> {ord.meetup.option} - {ord.meetup.location} on **{ord.meetup.date}** at **{ord.meetup.time}**
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span>Total: ₹{ord.totalAmount}</span>
                        
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid var(--card-border)',
                              background: 'var(--bg-main)',
                              color: 'var(--text-primary)',
                              fontSize: '0.8rem'
                            }}
                          >
                            <option value="Order Placed">Order Placed</option>
                            <option value="Seller Confirmed">Seller Confirmed</option>
                            <option value="Packed">Packed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FORM */}
          {activeTab === 'form' && (
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                {isEditing ? 'Edit Listing Details' : 'Publish Student Listing'}
              </h2>

              {formSuccess && <div className="glass badge-verified" style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px' }}>{formSuccess}</div>}
              {formError && <div className="glass badge-rejected" style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px' }}>{formError}</div>}

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div className="form-row">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Product Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Scientific Calculator fx-991EX"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Listing Options</label>
                    <select
                      value={form.listingType}
                      onChange={(e) => setForm({ ...form, listingType: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                    >
                      <option value="Sell">For Sell Only</option>
                      <option value="Exchange">For Swap / Exchange Only</option>
                      <option value="SellOrExchange">Sell or Exchange Swap</option>
                      <option value="Donate">Free Donation Box</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Price (₹)</label>
                    <input
                      type="number"
                      required={form.listingType !== 'Donate'}
                      disabled={form.listingType === 'Donate'}
                      placeholder={form.listingType === 'Donate' ? 'FREE' : 'Price in Rupees'}
                      value={form.listingType === 'Donate' ? '' : form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Condition</label>
                    <select
                      value={form.condition}
                      onChange={(e) => setForm({ ...form, condition: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                    >
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>College / Location Spot</label>
                    <input
                      type="text"
                      placeholder="e.g. Anna University"
                      value={form.collegeName}
                      onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Department (For Books Recommendations)</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Semester</label>
                    <select
                      value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
                    >
                      <option value="">N/A</option>
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Contact Details</label>
                    <input
                      type="text"
                      placeholder="e.g. Phone or Telegram handle"
                      value={form.contactDetails}
                      onChange={(e) => setForm({ ...form, contactDetails: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Upload Product Images (Select multiple)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultipleImagesUpload}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}
                    />
                    
                    {uploadedImages.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                            <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                              style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.8)', border: 'none', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.3rem', cursor: 'pointer', borderRadius: '0 0 0 4px' }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your item, key specifications, and availability details..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}
                  >
                    {formLoading ? 'Submitting...' : isEditing ? 'Update Listing' : 'Publish Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditId(null);
                      setActiveTab('listings');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
