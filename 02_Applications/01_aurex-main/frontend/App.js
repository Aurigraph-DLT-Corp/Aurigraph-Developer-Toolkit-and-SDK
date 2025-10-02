import React from 'react';

function App() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '50px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
        🌱 Aurex Platform
      </h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '30px' }}>
        Sustainable Technology Solutions
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        backdropFilter: 'blur(10px)'
      }}>
        <h2>✅ React App is Working!</h2>
        <p>The blank page issue has been resolved.</p>
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>
      <div style={{ marginTop: '30px' }}>
        <button 
          onClick={() => window.location.href = 'http://localhost:8080/admin'}
          style={{
            background: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '1.1rem',
            borderRadius: '25px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Keycloak Admin
        </button>
        <button 
          onClick={() => window.location.reload()}
          style={{
            background: '#ff9800',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            fontSize: '1.1rem',
            borderRadius: '25px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default App;
