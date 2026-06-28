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

  // UPI payment simulation states
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [selectedUPIApp, setSelectedUPIApp] = useState('GPay'); // GPay or PhonePe
  const [upiPin, setUpiPin] = useState('');
  const [upiProcessing, setUpiProcessing] = useState(false);

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

  const submitOrder = async (overridePaymentMethod?: string) => {
    setError('');
    setLoading(true);
    try {
      const items = cart.map(item => ({ productId: item.productId, quantity: item.quantity }));
      const payload = {
        ...form,
        paymentMethod: overridePaymentMethod || form.paymentMethod,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (cart.length === 0) {
      setError('Your shopping cart is empty');
      return;
    }

    if (form.meetupOption !== 'Home' && (!form.meetupLocation || !form.meetupDate || !form.meetupTime)) {
      setError('Please specify meetup coordinates (location, date, and time).');
      return;
    }

    if (form.paymentMethod === 'UPI') {
      // Open UPI simulated overlay
      setShowUPIModal(true);
    } else {
      submitOrder();
    }
  };

  const handleConfirmUPIPayment = () => {
    if (upiPin.length < 4) {
      alert('Please enter a valid 4-digit UPI PIN');
      return;
    }
    setUpiProcessing(true);
    setTimeout(async () => {
      setUpiProcessing(false);
      setShowUPIModal(false);
      setUpiPin('');
      await submitOrder(selectedUPIApp); // Place order using selected app name GPay/PhonePe
    }, 1800);
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexGrow: 1 }}>
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
                <option value="UPI">UPI (Unified Payments Interface)</option>
                <option value="Card">Credit/Debit Card (Simulated)</option>
                <option value="COD">Cash on Hand / Cash on Delivery</option>
              </select>

              {form.paymentMethod === 'UPI' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select UPI App:</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedUPIApp('GPay')}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.8rem',
                        borderRadius: '6px',
                        border: selectedUPIApp === 'GPay' ? '2px solid var(--accent-primary)' : '1px solid var(--card-border)',
                        background: selectedUPIApp === 'GPay' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      🔵 Google Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUPIApp('PhonePe')}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.8rem',
                        borderRadius: '6px',
                        border: selectedUPIApp === 'PhonePe' ? '2px solid var(--accent-primary)' : '1px solid var(--card-border)',
                        background: selectedUPIApp === 'PhonePe' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      🟣 PhonePe
                    </button>
                  </div>
                </div>
              )}
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

      {/* UPI Simulation Modal Overlay */}
      {showUPIModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass" style={{
            width: '400px',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid var(--card-border)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Brand Header */}
            <div style={{
              background: selectedUPIApp === 'GPay' ? 'linear-gradient(135deg, #1a73e8, #1557b0)' : 'linear-gradient(135deg, #5f259f, #4a1c7d)',
              padding: '1.5rem',
              color: '#fff',
              textAlign: 'center',
              position: 'relative'
            }}>
              <button 
                onClick={() => { setShowUPIModal(false); setUpiPin(''); }}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {selectedUPIApp === 'GPay' ? '🔵 Google Pay' : '🟣 PhonePe'}
              </h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>Launch Native App & Complete Handover Payment</p>
            </div>

            {/* Content Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
              {upiProcessing ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div className="spinner" style={{ margin: '0 auto 1.5rem auto', width: '50px', height: '50px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }}></div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Verifying Transaction...</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Securing transaction token. Please wait.</p>
                </div>
              ) : (
                <>
                  {/* Amount Card */}
                  <div style={{ textAlign: 'center', width: '100%', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Amount to Pay:</span>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-secondary)', margin: '0.1rem 0 0 0' }}>
                      ₹{finalTotal.toLocaleString('en-IN')}
                    </h2>
                  </div>

                  {/* Deep Link CTA Button */}
                  <a
                    href={`upi://pay?pa=aswinraj17-1@okaxis&pn=CampusMart&am=${finalTotal}&cu=INR&tn=CampusMartOrder`}
                    style={{
                      textDecoration: 'none',
                      width: '100%',
                      textAlign: 'center',
                      padding: '0.8rem',
                      borderRadius: '8px',
                      background: selectedUPIApp === 'GPay' ? '#1a73e8' : '#5f259f',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  >
                    📲 Open {selectedUPIApp === 'GPay' ? 'Google Pay' : 'PhonePe'} App
                  </a>

                  {/* QR Code Segment */}
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Or scan this QR code on your phone to pay directly:
                    </p>
                    <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '12px', display: 'inline-block', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                          `upi://pay?pa=aswinraj17-1@okaxis&pn=CampusMart&am=${finalTotal}&cu=INR&tn=CampusMartOrder`
                        )}`}
                        alt="UPI Payment QR Code"
                        style={{ display: 'block', width: '160px', height: '160px' }}
                      />
                    </div>
                  </div>

                  {/* Verification & Pin display */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '100%', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>UPI PIN CONFIRMATION</span>
                    <div style={{ display: 'flex', gap: '0.8rem', margin: '0.2rem 0' }}>
                      {[...Array(4)].map((_, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            border: '2px solid var(--accent-primary)',
                            background: upiPin.length > idx ? 'var(--accent-primary)' : 'transparent',
                            transition: 'all 0.1s ease'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Keypad */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    width: '100%',
                    maxWidth: '220px'
                  }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (upiPin.length < 4) setUpiPin(prev => prev + num);
                        }}
                        style={{
                          padding: '0.6rem',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          borderRadius: '50%',
                          border: '1px solid var(--card-border)',
                          background: 'rgba(255,255,255,0.02)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          width: '46px',
                          height: '46px',
                          margin: '0 auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          outline: 'none'
                        }}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setUpiPin('')}
                      style={{
                        padding: '0.4rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        borderRadius: '50%',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        background: 'rgba(239, 68, 68, 0.05)',
                        color: '#f87171',
                        cursor: 'pointer',
                        width: '46px',
                        height: '46px',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none'
                      }}
                    >
                      CLR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (upiPin.length < 4) setUpiPin(prev => prev + '0');
                      }}
                      style={{
                        padding: '0.6rem',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        borderRadius: '50%',
                        border: '1px solid var(--card-border)',
                        background: 'rgba(255,255,255,0.02)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        width: '46px',
                        height: '46px',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none'
                      }}
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiPin(prev => prev.slice(0, -1))}
                      style={{
                        padding: '0.4rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        borderRadius: '50%',
                        border: '1px solid var(--card-border)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        width: '46px',
                        height: '46px',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none'
                      }}
                    >
                      ⌫
                    </button>
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="button"
                    onClick={handleConfirmUPIPayment}
                    disabled={upiPin.length < 4}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: upiPin.length < 4 ? 'var(--card-border)' : '#10b981',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: upiPin.length < 4 ? 'not-allowed' : 'pointer',
                      fontSize: '0.95rem',
                      marginTop: '0.4rem',
                      boxShadow: upiPin.length < 4 ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    🚀 Verify PIN & Confirm Order
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
