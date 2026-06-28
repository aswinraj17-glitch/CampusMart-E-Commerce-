import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Swap overlay states
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [selectedMyProductId, setSelectedMyProductId] = useState('');
  const [swapSubmitting, setSwapSubmitting] = useState(false);

  // Chat/Inquiry loading state
  const [chatLoading, setChatLoading] = useState(false);

  // Seller average rating state
  const [sellerAvgRating, setSellerAvgRating] = useState<number | null>(null);

  // Active product image index for multiple uploads gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/products/${id}`);
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      setProduct(data);

      // Fetch seller average rating
      if (data.sellerId) {
        fetchSellerRating(data.sellerId);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerRating = async (sellerId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`);
      if (res.ok) {
        // Fetch seller reviews from DB fallback logic
      }
      
      // Let's call database stats or reviews endpoint to get seller reviews average
      const reviewsRes = await fetch(`${API_BASE}/api/products`);
      if (reviewsRes.ok) {
        const allProds = await reviewsRes.json();
        // Find reviews matching this seller
        let totalRating = 0;
        let count = 0;
        const productsList = allProds.products || [];
        for (const p of productsList) {
          if (p.sellerId === sellerId) {
            const pDetailsRes = await fetch(`${API_BASE}/api/products/${p.id}`);
            if (pDetailsRes.ok) {
              const pData = await pDetailsRes.json();
              const reviews = pData.reviews || [];
              for (const r of reviews) {
                totalRating += r.rating;
                count++;
              }
            }
          }
        }
        if (count > 0) {
          setSellerAvgRating(Number((totalRating / count).toFixed(1)));
        } else {
          setSellerAvgRating(5.0); // default
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Check if item is in wishlist
  const checkWishlistStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        const found = list.some((item: any) => item.productId === Number(id));
        setIsWishlisted(found);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch my products to list in the exchange/swap modal
  const fetchMyProducts = async () => {
    if (!token || !user) return;
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      if (res.ok) {
        const data = await res.json();
        const all = data.products || [];
        const mine = all.filter((p: any) => p.sellerId === user.id && p.isAvailable);
        setMyProducts(mine);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProductDetails();
    checkWishlistStatus();
    setActiveImageIndex(0);
  }, [id]);

  const handleToggleWishlist = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setWishlistLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/wishlist/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsWishlisted(data.wishlisted);
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleInquireChat = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setChatLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: product.sellerId,
          productId: product.id,
          text: `Hi, I am interested in inquiring about your product: "${product.name}". Is it still available?`
        })
      });
      if (res.ok) {
        // Redirect to UserDashboard Chats tab
        navigate('/user-dashboard?tab=chat');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to start chat conversation');
      }
    } catch (err) {
      console.error(err);
      alert('Error initializing chat thread');
    } finally {
      setChatLoading(false);
    }
  };

  const handleOpenSwapModal = () => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchMyProducts();
    setShowSwapModal(true);
  };

  const handleProposeSwap = async () => {
    if (!selectedMyProductId) {
      alert('Please select one of your products to swap.');
      return;
    }
    setSwapSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: product.sellerId,
          proposedProductId: Number(selectedMyProductId),
          requestedProductId: product.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Exchange proposal sent successfully!');
        setShowSwapModal(false);
      } else {
        alert(data.error || 'Failed to send swap proposal');
      }
    } catch (err) {
      console.error(err);
      alert('Network error sending swap proposal');
    } finally {
      setSwapSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product);
    alert(`Added "${product.name}" to your cart!`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product);
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!token) {
      navigate('/login');
      return;
    }

    setReviewSubmitLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }
      
      setComment('');
      setRating(5);
      fetchProductDetails();
      alert('Review submitted successfully!');
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner-container">
        <div className="spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="glass" style={{ padding: '4rem 2rem', textAlign: 'center', borderRadius: '12px', maxWidth: '600px', margin: '2rem auto' }}>
        <h2>Listing Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error || 'This listing may have been removed.'}</p>
        <Link to="/products" className="btn btn-primary">Back to Catalog</Link>
      </div>
    );
  }

  const isSellable = product.listingType === 'Sell' || product.listingType === 'SellOrExchange';
  const isSwappable = product.listingType === 'Exchange' || product.listingType === 'SellOrExchange';
  const isDonation = product.listingType === 'Donate';

  // Parse imagesJson from database
  let imagesList: string[] = [];
  if (product && product.imagesJson) {
    try {
      imagesList = JSON.parse(product.imagesJson);
    } catch (err) {
      imagesList = product.imageUrl ? [product.imageUrl] : [];
    }
  } else if (product && product.imageUrl) {
    imagesList = [product.imageUrl];
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', margin: '2rem 0' }}>
        
        {/* Product Image Panel */}
        <div>
          <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--card-border)', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '380px' }}>
            {imagesList.length > 0 ? (
              <img src={imagesList[activeImageIndex]} alt={product.name} style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '12px', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '6rem' }}>📦</span>
            )}
          </div>

          {imagesList.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem', justifyContent: 'center' }}>
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    padding: 0,
                    border: idx === activeImageIndex ? '2px solid var(--accent-primary)' : '1px solid var(--card-border)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    width: '60px',
                    height: '60px',
                    background: 'none',
                    cursor: 'pointer',
                    opacity: idx === activeImageIndex ? 1 : 0.6
                  }}
                >
                  <img src={img} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <span className="badge-status badge-verified" style={{ background: isDonation ? '#10b981' : isSwappable ? '#fbbf24' : '#06b6d4', color: '#000', marginBottom: '0.5rem' }}>
                {isDonation ? 'FREE DONATION' : isSwappable ? 'SWAP / EXCHANGE' : 'FOR SALE'}
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.2rem 0 0.5rem 0' }}>{product.name}</h1>
            </div>

            {/* Wishlist toggle */}
            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className="glass"
              style={{
                padding: '0.6rem 0.8rem',
                borderRadius: '50%',
                border: '1px solid var(--card-border)',
                background: isWishlisted ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.02)',
                color: isWishlisted ? '#f43f5e' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                lineHeight: 1
              }}
            >
              ♥
            </button>
          </div>

          <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: isDonation ? '#34d399' : 'var(--accent-secondary)' }}>
              {isDonation ? 'FREE 💚' : `₹${product.price.toLocaleString('en-IN')}`}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
            <div><strong style={{ color: 'var(--text-secondary)' }}>Condition:</strong> {product.condition}</div>
            <div><strong style={{ color: 'var(--text-secondary)' }}>Category:</strong> {product.category?.name || 'General'}</div>
            <div><strong style={{ color: 'var(--text-secondary)' }}>Campus:</strong> 📍 {product.collegeName || 'General Campus'}</div>
            {product.department && (
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Department:</strong> {product.department} {product.semester ? `(Sem ${product.semester})` : ''}
              </div>
            )}
          </div>

          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', margin: '0.5rem 0' }}>
            {product.description || 'No description provided.'}
          </p>

          <div className="glass" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
            <div style={{ fontWeight: 600 }}>Seller Information:</div>
            <div>Name: {product.seller?.name || 'Anonymous Student'}</div>
            <div>Rating: <span style={{ color: '#fbbf24' }}>★ {sellerAvgRating || '5.0'}</span></div>
            <div>Contact: {product.contactDetails || 'Viewable inside Portal'}</div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {isSellable && product.sellerId !== user?.id && (
              <>
                <button onClick={handleAddToCart} className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem', fontWeight: 700 }}>
                  Add to Cart
                </button>
                <button onClick={handleBuyNow} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontWeight: 700 }}>
                  Buy Now
                </button>
              </>
            )}

            {isSwappable && product.sellerId !== user?.id && (
              <button onClick={handleOpenSwapModal} className="btn btn-primary" style={{ background: '#fbbf24', color: '#000', padding: '0.8rem 1.5rem', fontWeight: 700 }}>
                🔄 Propose Swap
              </button>
            )}

            {isDonation && product.sellerId !== user?.id && (
              <button
                onClick={() => {
                  alert('Thank you for claiming! Order placed under Donation category. The donor will coordinate pickup details with you.');
                  handleBuyNow();
                }}
                className="btn btn-primary"
                style={{ background: '#34d399', color: '#000', padding: '0.8rem 1.5rem', fontWeight: 700 }}
              >
                Claim Free Book 💚
              </button>
            )}

            {product.sellerId !== user?.id && (
              <button
                onClick={handleInquireChat}
                disabled={chatLoading}
                className="btn btn-secondary"
                style={{ padding: '0.8rem 1.5rem', fontWeight: 600 }}
              >
                {chatLoading ? 'Loading Chat...' : '💬 Chat with Seller'}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <section className="glass" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--card-border)', marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Student Reviews</h2>
        
        {/* Write a review form */}
        {token && product.sellerId !== user?.id && (
          <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '2rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Rate this transaction / seller</h4>
            
            {reviewError && <div style={{ color: '#f87171', fontSize: '0.85rem' }}>{reviewError}</div>}
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Rating:</span>
              <div style={{ display: 'flex', gap: '0.2rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: star <= rating ? '#fbbf24' : 'rgba(255,255,255,0.15)' }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <textarea
                placeholder="Share your experience trading with this seller..."
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <button type="submit" disabled={reviewSubmitLoading} className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
              {reviewSubmitLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {product.reviews.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No reviews yet for this product listing.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {product.reviews.map((rev: any) => (
              <div key={rev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{rev.reviewer?.name || 'Student'}</div>
                  <div style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{rev.comment}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(rev.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* EXCHANGE PROPOSAL MODAL */}
      {showSwapModal && (
        <div className="modal-overlay">
          <div className="modal-content-glass">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Propose Exchange</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Select one of your active listings to offer to the seller in exchange for **{product.name}**.
            </p>

            <div className="swap-card-grid">
              <div className="swap-card-box">
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>THEIRS</div>
                <img src={product.imageUrl || 'https://via.placeholder.com/150'} className="swap-card-image" alt="requested" />
                <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
              </div>
              <div style={{ fontSize: '1.5rem' }}>⇄</div>
              <div className="swap-card-box">
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>YOURS</div>
                {myProducts.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: '#f87171', padding: '1rem 0' }}>No active items to swap</div>
                ) : (
                  <>
                    <select
                      value={selectedMyProductId}
                      onChange={e => setSelectedMyProductId(e.target.value)}
                      style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', borderRadius: '4px', fontSize: '0.8rem' }}
                    >
                      <option value="">Select Item</option>
                      {myProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowSwapModal(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={handleProposeSwap}
                disabled={swapSubmitting || myProducts.length === 0}
                className="btn btn-primary btn-sm"
                style={{ background: '#fbbf24', color: '#000' }}
              >
                {swapSubmitting ? 'Sending...' : 'Send Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
