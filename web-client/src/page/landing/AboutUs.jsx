const AboutUs = () => {
  const navStyle = {
    width: '100%',
    height: '80px',
    backgroundColor: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 5%',
    boxSizing: 'border-box',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    borderBottom: '1px solid #e0e0e0'
  };

  const mainWrapper = {
    backgroundColor: '#daeaf6', 
    width: '100vw',
    minHeight: 'calc(100vh - 80px)', 
    margin: 0,
    display: 'flex',
    // --- THIS MOVES EVERYTHING TO THE LEFT ---
    justifyContent: 'flex-start', 
    padding: '60px 0',
    boxSizing: 'border-box',
    overflow: 'hidden',
    position: 'relative',
  };

  const contentStyle = {
    width: '90%',
    maxWidth: '1100px',
    textAlign: 'left',
    zIndex: 2, 
    position: 'relative',
    // --- ADJUST THIS TO SET HOW FAR FROM THE LEFT EDGE IT SITS ---
    marginLeft: '5%' 
  };

  const illustrationImg = {
    position: 'absolute',
    bottom: '-40px',
    right: '-20px',
    width: '500px',
    height: 'auto',
    zIndex: 1,
    pointerEvents: 'none' 
  };

  return (
    <div style={{ margin: 0, padding: 0 }}>
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#007bff', fontWeight: 'bold', fontSize: '24px' }}>
           <div style={{ backgroundColor: '#007bff', padding: '6px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center' }}>💧</div>
           AquaFlow
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button style={{ backgroundColor: '#1a1a1a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600' }}>Home</button>
          <button style={{ backgroundColor: '#1a1a1a', color: '#4a90e2', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600' }}>About Us</button>
          <button style={{ backgroundColor: '#1a1a1a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600' }}>FAQs</button>
          <button style={{ backgroundColor: '#1a1a1a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600' }}>Contact Us</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '900', fontSize: '14px', color: '#000' }}>Sarah Johnson</div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#666' }}>HOUSEHOLD ACCOUNT</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ccc', border: '1px solid #ddd' }} />
        </div>
      </nav>

      <section style={mainWrapper}>
        <div style={contentStyle}>
          <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '0 0 20px 0', color: '#000' }}>
            About Us:
          </h1>
          
          <p style={{ fontSize: '20px', fontWeight: '700', lineHeight: '1.4', maxWidth: '600px', color: '#000' }}>
            The Water Messaging and Smart Order System makes water ordering simple 
            and convenient through an online order form. Customers can easily submit 
            their order, track delivery status in real-time, and receive instant updates.
          </p>

          <div style={{ marginTop: '80px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#000' }}>Contact us:</h2>
            <div style={{ fontSize: '26px', fontWeight: '900', color: '#000' }}>
              <p style={{ margin: '5px 0' }}>0912-345-6789</p>
              <p style={{ margin: '5px 0' }}>0987-654-3214</p>
              <p style={{ margin: '5px 0' }}>0986-475-4163</p>
            </div>
          </div>
        </div>

        <img 
          src="three.png" 
          alt="Delivery Illustration" 
          style={illustrationImg} 
        />
      </section>
    </div>
  );
};

export default AboutUs;