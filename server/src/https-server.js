import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HTTPS server setup for PWA support
export const createHttpsServer = (app, port = 5000) => {
  // Try multiple certificate locations
  const certPaths = [
    path.join(__dirname, '../../server.crt'),
    path.join(__dirname, '../server.crt'),
    './server.crt',
    '/etc/ssl/certs/server.crt'
  ];
  
  const keyPaths = [
    path.join(__dirname, '../../server.key'),
    path.join(__dirname, '../server.key'),
    './server.key',
    '/etc/ssl/private/server.key'
  ];
  
  let certPath = null;
  let keyPath = null;
  
  // Find existing certificates
  for (let i = 0; i < certPaths.length; i++) {
    if (fs.existsSync(certPaths[i]) && fs.existsSync(keyPaths[i])) {
      certPath = certPaths[i];
      keyPath = keyPaths[i];
      break;
    }
  }
  
  // Check if certificates exist
  if (certPath && keyPath) {
    console.log('📋 SSL certificates found, starting HTTPS server...');
    console.log(`📁 Using certificate: ${certPath}`);
    console.log(`📁 Using key: ${keyPath}`);
    
    try {
      const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
      
      const httpsServer = https.createServer(options, app);
      
      httpsServer.listen(port, '0.0.0.0', () => {
        console.log(`🔐 HTTPS Server running on https://0.0.0.0:${port}`);
        console.log(`🌐 Accessible at: https://ticket.sunvalleycyprus.com:${port}`);
        console.log(`✅ Ready for PWA push notifications and WebSocket connections!`);
      });
      
      return httpsServer;
    } catch (error) {
      console.error('❌ Error creating HTTPS server:', error.message);
      console.log('📋 Falling back to HTTP server...');
      return null;
    }
  } else {
    console.log('⚠️ SSL certificates not found in any of these locations:');
    certPaths.forEach(p => console.log(`   - ${p}`));
    console.log('');
    console.log('🔧 To generate SSL certificates, run one of these commands:');
    console.log('   Windows: openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/C=CY/ST=Cyprus/L=Nicosia/O=SunValley/CN=ticket.sunvalleycyprus.com"');
    console.log('   Linux:   openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/C=CY/ST=Cyprus/L=Nicosia/O=SunValley/CN=ticket.sunvalleycyprus.com"');
    console.log('');
    console.log('📋 Falling back to HTTP server...');
    
    return null;
  }
};
