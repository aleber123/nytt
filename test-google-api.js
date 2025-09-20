// Simple test to verify Google Maps API key
const apiKey = 'AIzaSyA0uJLoyjTcAJGvuVvyiBP_u12RPQLv_aE';

console.log('Testing Google Maps API key...');
console.log('API Key:', apiKey);

// Test Places API
const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Sveavägen&key=${apiKey}&components=country:se`;

console.log('Testing Places API URL:', placesUrl.replace(apiKey, '***API_KEY***'));

// Use Node.js https module instead of fetch
const https = require('https');

https.get(placesUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Places API Response Status:', response.status);

      if (response.status === 'OK') {
        console.log('✅ Places API is working!');
        console.log('Number of predictions:', response.predictions ? response.predictions.length : 0);
      } else {
        console.log('❌ Places API error:', response.status);
        if (response.error_message) {
          console.log('Error message:', response.error_message);
        }
      }
    } catch (error) {
      console.log('❌ Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
}).on('error', (error) => {
  console.log('❌ Network error:', error);
});

console.log('Test initiated. Waiting for response...');