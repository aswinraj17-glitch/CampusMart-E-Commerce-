import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  // Engineering Streams
  'B.E. Computer Science & Engineering (CSE)',
  'B.Tech. Information Technology (IT)',
  'B.E. Electronics & Communication Engineering (ECE)',
  'B.E. Electrical & Electronics Engineering (EEE)',
  'B.E. Mechanical Engineering (Mech)',
  'B.E. Civil Engineering (Civil)',
  'B.E. Biomedical Engineering',
  'B.Tech. Biotechnology',
  'B.Tech. Artificial Intelligence & Data Science (AI&DS)',
  'B.E. Agricultural Engineering',
  
  // Arts & Science Streams
  'B.Sc. Computer Science',
  'B.Sc. Physics',
  'B.Sc. Chemistry',
  'B.Sc. Mathematics',
  'B.Sc. Biotechnology',
  'BCA (Computer Applications)',
  'B.Com. (General Commerce)',
  'B.Com. (Computer Applications)',
  'B.A. English Literature',
  'B.A. Economics',
  'BBA (Business Administration)',
  'MBA (Master of Business Administration)',
  'M.Sc. Computer Science',
  
  // Pharmacy & Medical Streams
  'B.Pharm. (Bachelor of Pharmacy)',
  'M.Pharm. (Master of Pharmacy)',
  'Pharm.D. (Doctor of Pharmacy)',
  'B.Sc. Nursing',
  'BPT (Physiotherapy)'
];

const TAMILNADU_COLLEGES = [
  'Sri Shanmugha College of Engineering and Technology, Salem',
  'College of Engineering, Guindy (CEG), Chennai',
  'Madras Institute of Technology (MIT), Chromepet',
  'PSG College of Technology, Coimbatore',
  'SSN College of Engineering, Chennai',
  'Thiagarajar College of Engineering (TCE), Madurai',
  'Government College of Technology (GCT), Coimbatore',
  'Coimbatore Institute of Technology (CIT), Coimbatore',
  'Kongu Engineering College, Erode',
  'Bannari Amman Institute of Technology, Sathyamangalam',
  'Kumaraguru College of Technology (KCT), Coimbatore',
  'Sathyabama Institute of Science and Technology, Chennai',
  'Vel Tech Rangarajan Dr. Sagunthala R&D Institute, Chennai',
  'St. Josephs College of Engineering, Chennai',
  'Panimalar Engineering College, Chennai',
  'Loyola College, Chennai',
  'Madras Christian College (MCC), Chennai',
  'Presidency College, Chennai',
  'Stella Maris College, Chennai',
  'PSG College of Arts and Science, Coimbatore',
  'Government College of Engineering, Salem',
  'KSR College of Engineering, Tiruchengode',
  'Mepco Schlenk Engineering College, Sivakasi',
  'Sona College of Technology, Salem',
  'Knowledge Institute of Technology, Salem',
  'Madras Medical College, Chennai',
  'PSG Institute of Medical Sciences, Coimbatore'
];

export default function Products() {
  const { products, categories, fetchProducts, totalPages, currentPage, loading, error } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // URL Query Parameters Parsing
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('categoryId') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const initialListingType = searchParams.get('listingType') || 'All';
  const initialCollege = searchParams.get('collegeName') || 'All';
  const initialDept = searchParams.get('department') || '';
  const initialSem = searchParams.get('semester') || 'All';

  // Local Filter States
  const [selectedCategory, setSelectedCategory] = useState<string | number>(initialCategory);
  const [searchText, setSearchText] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  
  // New Marketplace Filters
  const [listingType, setListingType] = useState(initialListingType);
  const [collegeFilter, setCollegeFilter] = useState(initialCollege);
  const [showColSuggestions, setShowColSuggestions] = useState(false);
  const [deptFilter, setDeptFilter] = useState(initialDept);
  const [semesterFilter, setSemesterFilter] = useState(initialSem);

  // My college only toggle
  const [myCollegeOnly, setMyCollegeOnly] = useState(false);

  // Trigger search and fetch products on filter change
  useEffect(() => {
    const params: any = {
      page: 1,
      limit: 12,
      sortBy
    };

    if (selectedCategory !== 'All') params.categoryId = selectedCategory;
    if (searchText.trim()) params.search = searchText;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (condition !== 'All') params.condition = condition;
    if (listingType !== 'All') params.listingType = listingType;
    
    // Prioritize myCollegeOnly toggle, otherwise fall back to college selector
    if (myCollegeOnly && user?.verification?.collegeName) {
      params.collegeName = user.verification.collegeName;
    } else if (collegeFilter !== 'All') {
      params.collegeName = collegeFilter;
    }

    if (deptFilter.trim()) params.department = deptFilter;
    if (semesterFilter !== 'All') params.semester = semesterFilter;

    // Send user college info for own-college first sorting!
    if (user?.verification?.collegeName) {
      params.userCollegeName = user.verification.collegeName;
    }

    fetchProducts(params);
  }, [
    selectedCategory, 
    searchText, 
    minPrice, 
    maxPrice, 
    condition, 
    sortBy, 
    listingType, 
    collegeFilter, 
    deptFilter, 
    semesterFilter, 
    myCollegeOnly,
    user, 
    fetchProducts
  ]);

  // Sync state if URL changes (e.g. from Home category clicks or Home search)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const cat = searchParams.get('categoryId');
    const q = searchParams.get('search');
    const type = searchParams.get('listingType');
    const col = searchParams.get('collegeName');
    const dept = searchParams.get('department');
    const sem = searchParams.get('semester');

    if (cat !== null) setSelectedCategory(cat === 'All' ? 'All' : Number(cat));
    if (q !== null) setSearchText(q);
    if (type !== null) setListingType(type);
    if (col !== null) setCollegeFilter(col);
    if (dept !== null) setDeptFilter(dept);
    if (sem !== null) setSemesterFilter(sem);
  }, [location.search]);

  const handlePageChange = (page: number) => {
    const params: any = {
      page,
      limit: 12,
      sortBy
    };

    if (selectedCategory !== 'All') params.categoryId = selectedCategory;
    if (searchText.trim()) params.search = searchText;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (condition !== 'All') params.condition = condition;
    if (listingType !== 'All') params.listingType = listingType;
    
    if (myCollegeOnly && user?.verification?.collegeName) {
      params.collegeName = user.verification.collegeName;
    } else if (collegeFilter !== 'All') {
      params.collegeName = collegeFilter;
    }

    if (deptFilter.trim()) params.department = deptFilter;
    if (semesterFilter !== 'All') params.semester = semesterFilter;
    
    if (user?.verification?.collegeName) {
      params.userCollegeName = user.verification.collegeName;
    }

    fetchProducts(params);
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchText('');
    setMinPrice('');
    setMaxPrice('');
    setCondition('All');
    setSortBy('newest');
    setListingType('All');
    setCollegeFilter('All');
    setDeptFilter('');
    setSemesterFilter('All');
    setMyCollegeOnly(false);
    navigate('/products');
  };

  return (
    <div className="products-page-container">
      <div className="products-header">
        <h1 className="page-title">Campus Marketplace Catalog</h1>
        <p className="page-subtitle font-secondary">Browse student essentials. Listings from your college are highlighted first.</p>
      </div>

      {error && (
        <div className="info-toast glass" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Filter Sidebar & Search Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Filters Sidebar */}
        <aside className="glass" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Filters</h2>

          {user?.verification?.collegeName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(6, 182, 212, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
              <input
                id="myCollegeToggle"
                type="checkbox"
                checked={myCollegeOnly}
                onChange={(e) => setMyCollegeOnly(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="myCollegeToggle" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                📍 My College Only
              </label>
            </div>
          )}

          {/* Search bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Search</label>
            <input
              type="text"
              placeholder="e.g. laptop, CLRS..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Listing Type (Sell/Exchange/Donate) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Listing Type</label>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="All">All Types</option>
              <option value="Sell">For Sell Only</option>
              <option value="Exchange">For Swap / Exchange</option>
              <option value="Donate">For Donation</option>
              <option value="SellOrExchange">Sell or Swap</option>
            </select>
          </div>

          {/* College Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>College</label>
            <input
              type="text"
              placeholder="Search college campus..."
              value={collegeFilter === 'All' ? '' : collegeFilter}
              onChange={e => {
                setCollegeFilter(e.target.value);
                setShowColSuggestions(true);
              }}
              onFocus={() => setShowColSuggestions(true)}
              onBlur={() => setTimeout(() => setShowColSuggestions(false), 200)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            {showColSuggestions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--bg-main)',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                marginTop: '0.25rem',
                maxHeight: '180px',
                overflowY: 'auto',
                zIndex: 999,
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
              }}>
                <div
                  onClick={() => {
                    setCollegeFilter('All');
                    setShowColSuggestions(false);
                  }}
                  style={{
                    padding: '0.6rem 1rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                    fontSize: '0.85rem',
                    color: 'var(--accent-secondary)',
                    fontWeight: 700
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  🏫 All Colleges (Reset)
                </div>
                {TAMILNADU_COLLEGES.filter(c => c.toLowerCase().includes((collegeFilter === 'All' ? '' : collegeFilter).toLowerCase())).map((col, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setCollegeFilter(col);
                      setShowColSuggestions(false);
                    }}
                    style={{
                      padding: '0.6rem 1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.02)',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    🏫 {col}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Department */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((dept, idx) => (
                <option key={idx} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Semester</label>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="All">All Semesters</option>
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
              ))}
            </select>
          </div>

          {/* Category selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCategory(val === 'All' ? 'All' : Number(val));
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Price Range filter */}
          {listingType !== 'Donate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Price Range (₹)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)'
                  }}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--card-border)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          )}

          {/* Product condition */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="All">All Conditions</option>
              <option value="New">New</option>
              <option value="Used">Used</option>
            </select>
          </div>

          {/* Sorting */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="newest">Newest First</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="name">Product Name</option>
            </select>
          </div>

          <button onClick={handleResetFilters} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Reset Filters
          </button>
        </aside>

        {/* Products Grid Content Area */}
        <div>
          {loading ? (
            <div className="loading-spinner-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
              <div className="spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: '6rem 2rem', borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No Listings Found</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>We couldn't find any items matching your selected criteria.</p>
              <button onClick={handleResetFilters} className="btn btn-primary">Clear All Filters</button>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((prod) => {
                  const isOwnCollege = user?.verification?.collegeName && 
                    prod.collegeName?.toLowerCase() === user.verification.collegeName.toLowerCase();

                  return (
                    <div key={prod.id} className="product-card glass" style={{
                      borderColor: isOwnCollege ? 'rgba(6, 182, 212, 0.4)' : 'var(--card-border)',
                      boxShadow: isOwnCollege ? '0 0 15px rgba(6, 182, 212, 0.05)' : 'none'
                    }}>
                      <div className="product-image-wrapper">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="product-img" />
                        ) : (
                          <span className="product-img-fallback">📦</span>
                        )}
                        <span className="product-badge" style={{
                          background: prod.listingType === 'Donate' ? '#34d399' : prod.listingType === 'Exchange' ? '#fbbf24' : 'var(--accent-primary)',
                          color: '#000'
                        }}>
                          {prod.listingType === 'Donate' ? 'DONATION' : prod.listingType === 'Exchange' ? 'SWAP' : prod.condition}
                        </span>
                        
                        {isOwnCollege && (
                          <span className="nearby-badge" style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(6, 182, 212, 0.85)', color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                            My Campus 🏫
                          </span>
                        )}
                      </div>

                      <div className="product-info">
                        <h3 className="product-name">{prod.name}</h3>
                        <p className="product-desc" style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {prod.description || 'No description provided.'}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                          📍 {prod.collegeName || 'General Campus'}
                        </p>
                        {prod.department && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            🎓 {prod.department} {prod.semester ? `(Sem ${prod.semester})` : ''}
                          </p>
                        )}
                        <div className="product-footer" style={{ marginTop: '1rem' }}>
                          <span className="product-price">
                            {prod.listingType === 'Donate' ? 'FREE 💚' : prod.listingType === 'Exchange' ? 'SWAP 🔄' : `₹${prod.price.toLocaleString('en-IN')}`}
                          </span>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {prod.listingType === 'Sell' && prod.sellerId !== user?.id && (
                              <button
                                onClick={() => {
                                  addToCart(prod);
                                  alert('Item added to cart!');
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.4rem 0.6rem' }}
                              >
                                🛒
                              </button>
                            )}
                            <Link to={`/product/${prod.id}`} className="btn btn-primary btn-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                              Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
