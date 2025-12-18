import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login | Shan Times Admin";
    if (localStorage.getItem('shanAuth')) navigate('/admin');
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      localStorage.setItem('shanAuth', JSON.stringify({ loggedIn: true, timestamp: Date.now() }));
      navigate('/admin');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError("User not found!");
      } else if (err.code === 'auth/wrong-password') {
        setError("Wrong password!");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email format!");
      } else {
        setError("गलत ईमेल या पासवर्ड!");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '50px 40px',
        borderRadius: '20px',
        textAlign: 'center',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          background: 'linear-gradient(90deg, #b91c1c, #f59e0b)'
        }}></div>

        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #b91c1c, #991b1b)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 25px',
          boxShadow: '0 10px 30px rgba(185, 28, 28, 0.3)'
        }}>
          <i className="fas fa-newspaper" style={{ fontSize: '2rem', color: 'white' }}></i>
        </div>

        <h2 className="logo" style={{ fontSize: '2.2rem', marginBottom: '5px' }}>शान टाइम्स</h2>
        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '0.95rem' }}>
          <i className="fas fa-lock" style={{ marginRight: '8px' }}></i>
          Secure Admin Login
        </p>

        {error && (
          <div style={{
            color: '#dc2626',
            fontSize: '0.9rem',
            background: '#fef2f2',
            padding: '12px 15px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-envelope" style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }}></i>
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 15px 15px 45px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'border-color 0.3s',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#b91c1c'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <i className="fas fa-lock" style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }}></i>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 45px 15px 45px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'border-color 0.3s',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#b91c1c'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>

          <button
            disabled={loading}
            type="submit"
            style={{
              padding: '15px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #111827, #1e293b)',
              color: 'white',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Verifying...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                Login Securely
              </>
            )}
          </button>
        </form>

        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '30px',
            fontSize: '0.9rem',
            color: '#64748b',
            textDecoration: 'none',
            transition: 'color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.color = '#b91c1c'}
          onMouseOut={(e) => e.target.style.color = '#64748b'}
        >
          <i className="fas fa-arrow-left"></i>
          Back to Website
        </a>
      </div>
    </div>
  );
};

export default Login;