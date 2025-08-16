require('dotenv/config');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('Is DATABASE_URL defined?', !!process.env.DATABASE_URL);

// Test if the URL is valid
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('Protocol:', url.protocol);
    console.log('Host:', url.host);
    console.log('Database:', url.pathname);
    console.log('Username:', url.username);
    console.log('Password:', url.password ? '[HIDDEN]' : 'Not set');
  } catch (error) {
    console.log('Invalid URL format:', error.message);
  }
} else {
  console.log('DATABASE_URL is not set');
}