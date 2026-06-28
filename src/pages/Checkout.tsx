import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { cart, clearCart, cartTotal } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Check if cart contains items from another college campus
  const isCrossCollege = cart.some(
    item => item.product.collegeName && user?.verification?.collegeName &&
            item.product.collegeName.toLowerCase() !== user.verification.collegeName.toLowerCase()
  );

  const deliveryCharge = isCrossCollege ? 40 : 0;
  const finalTotal = cartTotal + deliveryCharge;

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    zipCode: '600025',
    paymentMethod: 'COD',
    
    // Meetup parameters
    meetupOption: 'Campus', // Campus, Hostel, Home
    meetupLocation: '',
    meetupDate: '',
    meetupTime: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Prefill form if user is logged in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        addressLine: user.verification?.collegeName || ''
      }));
    }
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0 && !loading) {
      navigate('/cart');
    }
  }, [cart, navigate, loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (cart.length === 0) {
      setError('Your shopping cart is empty');
      setLoading(false);
      return;
    }

    if (form.meetupOption !== 'Home' && (!form.meetupLocation || !form.meetupDate || !form.meetupTime)) {
      setError('Please specify meetup coordinates (location, date, and time).');
      setLoading(false);
      return;
    }

    try {
      const items = cart.map(item => ({ productId: item.productId, quantity: item.quantity }));
      const payload = {
        ...form,
        meetupOption: isCrossCollege 
          ? 'Campus (Delivery Agent)' 
          : (form.meetupOption + ' (Self Handover)'),
        items
      };
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      await clearCart();
      navigate('/order-confirmation', { state: { order: data } });
    } catch (err: any) {
      setError(err.message || 'Something went wrong while placing your order.');
    } finally {
      setLoading(false);
    }
  };

  const isMeetupNeeded = form.meetupOption === 'Campus' || form.meetupOption === 'Hostel';

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1rem' }}>
      <div className="glass" style={{ padding: '2.5rem 2rem', borderRadius: '16px', boxShadow: 'var(--glow-shadow)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem' }}>Checkout Details</h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.95rem', marginBottom: '2.2rem' }}>
          Please complete meetup details & contact information
        </p>

        {error && (
          <div className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.05)' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.4rem', color: 'var(--accent-secondary)' }}>Contact Info</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name</label>
            <input
              name="fullName"
              type="text"
              required
              placeholder="e.g. Ashwin Raj"
              value={form.fullName}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Phone Number</label>
              <input
                name="phone"
                type="tel"
                required
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.4rem', color: 'var(--accent-secondary)', marginTop: '0.5rem' }}>Campus Meetup & Delivery Coordinate</h3>

          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Handover Option</label>
              <select
                name="meetupOption"
                value={form.meetupOption}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="Campus">Meet Inside College Campus 🏫</option>
                <option value="Hostel">Hostel Pickup 🏢</option>
                <option value="Home">Home Delivery (Courier/Post) 📦</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>College / Delivery Address</label>
              <input
                name="addressLine"
                type="text"
                required
                placeholder="College/Campus location"
                value={form.addressLine}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {isMeetupNeeded && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Specific Meeting Spot Location</label>
                <input
                  name="meetupLocation"
                  type="text"
                  required
                  placeholder="e.g. Main Library ground floor lobby, Hostel block-C lounge"
                  value={form.meetupLocation}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              <div className="form-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Meeting Date</label>
                  <input
                    name="meetupDate"
                    type="date"
                    required
                    value={form.meetupDate}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--card-border)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Meeting Time Slot</label>
                  <input
                    name="meetupTime"
                    type="time"
                    required
                    value={form.meetupTime}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--card-border)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.4rem', color: 'var(--accent-secondary)', marginTop: '0.5rem' }}>Billing & Payment</h3>

          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Payment Method</label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="COD">Cash on Hand / GPay at Handover Spot</option>
                <option value="UPI">UPI Transfer (Simulated)</option>
                <option value="Card">Credit/Debit Card (Simulated)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ZIP/Pincode</label>
              <input
                name="zipCode"
                type="text"
                required
                value={form.zipCode}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {isCrossCollege && (
            <div className="glass" style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontSize: '0.82rem', background: 'rgba(251, 191, 36, 0.03)', marginTop: '0.5rem', lineHeight: 1.5 }}>
              ⚠️ <strong>Cross-Campus Handover:</strong> Products from different college campus detected. The delivery will be securely routed via a <strong>CampusMart Delivery Boy Agent</strong>.
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Items Subtotal:</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Delivery Fee (Agent):</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: isCrossCollege ? 'var(--accent-secondary)' : '#34d399' }}>
                {isCrossCollege ? '₹40' : 'FREE'}
              </span>
            </div>
            <div style={{ borderTop: '1px dashed var(--card-border)', paddingTop: '0.6rem', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Grand Total:</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-large"
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontWeight: 700 }}
          >
            {loading ? 'Confirming Meetup & Placing Order...' : 'Place Handover Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
