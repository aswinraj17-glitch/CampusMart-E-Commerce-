import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication Engineering (ECE)',
  'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering (Mech)',
  'Civil Engineering (Civil)',
  'Chemical Engineering',
  'Biotechnology',
  'Aerospace Engineering',
  'Biomedical Engineering',
  'B.Sc Computer Science',
  'BCA (Computer Applications)',
  'B.Sc Physics',
  'B.Sc Chemistry',
  'B.Sc Mathematics',
  'B.A English Literature',
  'B.A Economics',
  'B.Com (Commerce)',
  'BBA (Business Administration)',
  'MBA (Management)',
  'MBBS / Medicine',
  'B.Pharm (Pharmacy)'
];

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('buyer');
  
  // Verification details
  const [collegeName, setCollegeName] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('1');
  const [semester, setSemester] = useState('1');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [idCardUrl, setIdCardUrl] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleIdCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdCardUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!collegeName || !department || !idCardUrl) {
      setError('College Name, Department, and College ID Card Image link are required for verification.');
      setLoading(false);
      return;
    }

    try {
      const verificationData = {
        collegeName,
        department,
        yearOfStudy: Number(yearOfStudy),
        semester: Number(semester),
        collegeEmail: collegeEmail || undefined,
        idCardUrl
      };

      const result = await signUp(name, email, password, role, phone, verificationData);
      if (result.error) {
        throw new Error(result.error);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem 1rem' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '650px', borderRadius: '16px', padding: '2.5rem 2rem', boxShadow: 'var(--glow-shadow)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem' }}>Student Registration</h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Verify your student status to buy, sell, exchange, or donate essentials on campus.
        </p>

        {error && (
          <div className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.05)' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.4rem', color: 'var(--accent-secondary)' }}>Personal Details</h3>
          
          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }} htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }} htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }} htmlFor="role">
                Account Role
              </label>
              <select
                id="role"
                value={role}
                onChange={e => setRole(e.target.value)}
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
                <option value="buyer">Buyer (I want to search & buy essentials)</option>
                <option value="seller">Seller (I want to list/sell/donate products)</option>
              </select>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.4rem', color: 'var(--accent-secondary)', marginTop: '0.5rem' }}>College Verification</h3>

          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                College Name
              </label>
              <select
                value={collegeName}
                onChange={e => setCollegeName(e.target.value)}
                required
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
                <option value="">Select College</option>
                <option value="Anna University">Anna University</option>
                <option value="IIT Madras">IIT Madras</option>
                <option value="PSG Tech">PSG Tech</option>
                <option value="VIT Vellore">VIT Vellore</option>
                <option value="SRM University">SRM University</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Department
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                required
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
                <option value="">Select Department</option>
                {DEPARTMENTS.map((dept, idx) => (
                  <option key={idx} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Year of Study
              </label>
              <select
                value={yearOfStudy}
                onChange={e => setYearOfStudy(e.target.value)}
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
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Current Semester
              </label>
              <select
                value={semester}
                onChange={e => setSemester(e.target.value)}
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
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Official College Email (Optional)
              </label>
              <input
                type="email"
                placeholder="name@college.edu"
                value={collegeEmail}
                onChange={e => setCollegeEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Upload College ID Card
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleIdCardUpload}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              {idCardUrl && (
                <div style={{ marginTop: '0.5rem', width: '120px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                  <img src={idCardUrl} alt="ID preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }} htmlFor="password">
              Password (min 6 chars)
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', fontWeight: 700 }}
          >
            {loading ? 'Submitting Application...' : 'Submit Application & Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-secondary)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
