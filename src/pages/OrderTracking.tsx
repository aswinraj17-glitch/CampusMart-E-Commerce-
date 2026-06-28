import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OrderTracking() {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch order tracking info');
      setOrder(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load order info');
    } finally {
      setLoading(false);
    }
  }, [id, token, API_BASE]);

  useEffect(() => {
    if (token) {
      fetchOrder();
    }
  }, [token, fetchOrder]);

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="spinner"></div>
        <p>Loading order tracker...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="glass" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '12px', maxWidth: '600px', margin: '2rem auto' }}>
        <span style={{ fontSize: '3rem' }}>⚠️</span>
        <h2 style={{ margin: '1rem 0' }}>Order Tracking Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error || 'Make sure you are logged in to track your orders.'}</p>
        <Link to="/orders" className="btn btn-primary">
          View Purchases
        </Link>
      </div>
    );
  }

  const statuses = [
    'Order Placed',
    'Seller Confirmed',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered'
  ];

  const currentStep = statuses.indexOf(order.status);
  const progressPercent = (currentStep / (statuses.length - 1)) * 100;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Track Order #{order.id}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Placed on: {new Date(order.createdAt).toLocaleString()}</p>
      </div>

      {/* Stepper Progress bar */}
      <div className="glass" style={{ padding: '2.5rem 1.5rem', borderRadius: '16px', marginBottom: '2.5rem', boxShadow: 'var(--glow-shadow)' }}>
        
        {/* Progress Tracker Stepper */}
        <div className="tracker-stepper">
          {/* Progress bar line background */}
          <div className="tracker-stepper-progress" style={{ width: `${progressPercent}%` }}></div>
          
          {statuses.map((status, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            return (
              <div
                key={status}
                className={`step-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
              >
                <div className="step-circle">
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="step-label">{status}</div>
              </div>
            );
          })}
        </div>

        {/* Estimated Date / Subtitle */}
        <div style={{ textAlign: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          {order.status === 'Delivered' ? (
            <h3 style={{ color: '#10b981', fontWeight: 700 }}>🎉 Your order has been delivered!</h3>
          ) : (
            <h3>
              Estimated Campus Delivery Date:{' '}
              <span style={{ color: 'var(--accent-secondary)' }}>
                {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '3-5 Days'}
              </span>
            </h3>
          )}
        </div>
      </div>

      {/* Handover Location Spot Map */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🗺️ Meet-up Handover Tracker Map
        </h2>
        
        {/* Dynamic Google Map Embed */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', height: '350px', border: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.2)' }}>
          <iframe
            title="Handover Spot Map"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(
              (order.meetup?.location ? order.meetup.location + ', ' : '') + order.addressLine + ', ' + order.city
            )}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
            allowFullScreen
          />
        </div>
        
        {/* Simulated Handover Distance Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Destination Spot:</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
              📍 {order.meetup?.location || order.addressLine}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Seller Proximity:</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>
              {order.status === 'Delivered' ? '✅ Arrived at meet-up spot' : '📡 Connected - Live Radar Tracking'}
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address and Items split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Items inside the order */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
            Items Ordered
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {order.items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.productName}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quantity: {item.quantity}</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.95rem', fontWeight: 600 }}>
                  ₹{(Number(item.productPrice) * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Address and summary info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              Pickup Details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.92rem' }}>
              <p>👤 <strong>Recipient:</strong> {order.fullName}</p>
              <p>📞 <strong>Phone:</strong> {order.phone}</p>
              <p>📧 <strong>Email:</strong> {order.email}</p>
              <p>📍 <strong>Campus spot:</strong> {order.addressLine}</p>
              <p>🏙️ <strong>City:</strong> {order.city}, {order.state} - {order.zipCode}</p>
            </div>
          </div>

          <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              Payment status
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
              <span>Method:</span>
              <strong>{order.payments?.[0]?.paymentMethod || 'COD'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
              <span>Status:</span>
              <span className={`badge ${order.payments?.[0]?.status === 'Completed' ? 'badge-success' : 'badge-pending'}`}>
                {order.payments?.[0]?.status || 'Pending'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
              <span>Transaction ID:</span>
              <strong style={{ fontSize: '0.8rem' }}>{order.payments?.[0]?.transactionId || 'N/A'}</strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
