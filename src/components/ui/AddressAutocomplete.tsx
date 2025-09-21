import React, { useEffect, useRef, useState } from 'react';

// Declare global google object
declare global {
  interface Window {
    google: any;
    initGoogleMapsCallback: () => void;
  }
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Sök adress...",
  className = "",
  required = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed' | 'fallback'>('loading');
  const [inputValue, setInputValue] = useState(value);

  // Load Google Maps API using script tag (more reliable than @googlemaps/js-api-loader)
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('✅ Google Maps already loaded');
        setStatus('ready');
        return;
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.log('🔄 Google Maps script already loading');
        return;
      }

      // Hardcode the API key for testing (we know it works from our test)
      const apiKey = 'AIzaSyA0uJLoyjTcAJGvuVvyiBP_u12RPQLv_aE';

      if (!apiKey) {
        console.error('❌ No Google Maps API key found');
        setStatus('fallback');
        return;
      }

      console.log('🔄 Loading Google Maps API with key:', apiKey.substring(0, 10) + '...');

      // Create callback function
      window.initGoogleMapsCallback = () => {
        console.log('✅ Google Maps API loaded via callback');
        console.log('Google Maps object:', !!window.google);
        console.log('Maps API:', !!(window.google && window.google.maps));
        console.log('Places API:', !!(window.google && window.google.maps && window.google.maps.places));
        setStatus('ready');
      };

      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('📜 Google Maps script loaded successfully');
      };

      script.onerror = (error) => {
        console.error('❌ Failed to load Google Maps script:', error);
        console.log('Script src:', script.src);
        setStatus('fallback');
      };

      console.log('📜 Adding Google Maps script to document head');
      document.head.appendChild(script);

      // Increased timeout and better status checking
      const timeoutId = setTimeout(() => {
        if (status === 'loading') {
          console.error('❌ Google Maps loading timeout after 15 seconds');
          setStatus('fallback');
        }
      }, 15000);

      // Cleanup timeout on unmount
      return () => clearTimeout(timeoutId);
    };

    loadGoogleMaps();
  }, []);

  // Initialize autocomplete when Google Maps is ready
  useEffect(() => {
    if (status === 'ready' && inputRef.current && window.google && window.google.maps && window.google.maps.places) {
      try {
        console.log('🔧 Creating Places Autocomplete...');

        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            componentRestrictions: { country: 'se' },
            fields: ['formatted_address', 'address_components'],
            types: ['address']
          }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log('📍 Place selected:', place);

          if (place && place.formatted_address) {
            const address = place.formatted_address;
            console.log('📍 Setting address to:', address);
            setInputValue(address);
            onChange(address);
          } else {
            console.log('⚠️ Place selected but no formatted_address, using current input value');
            // If no formatted address, use the current input value
            onChange(inputValue);
          }
        });

        autocompleteRef.current = autocomplete;
        console.log('✅ Places Autocomplete initialized successfully');

      } catch (error) {
        console.error('❌ Error creating Places Autocomplete:', error);
        console.error('Error details:', error);
        setStatus('fallback');
      }
    }
  }, [status, onChange, inputValue]);

  // Update local input value when prop changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('⌨️ Input changed to:', newValue);
    setInputValue(newValue);

    // Always call onChange when user types, unless we're in the middle of a place selection
    // This ensures the parent component gets the value even if user doesn't select from dropdown
    console.log('📤 Calling onChange with:', newValue);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
        required={required}
      />

      {/* Status indicators */}
      {status === 'loading' && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        </div>
      )}

      {status === 'ready' && autocompleteRef.current && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <span className="text-xs text-green-600">✅ Active</span>
        </div>
      )}

      {status === 'failed' && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <span className="text-xs text-red-600">❌ Failed</span>
        </div>
      )}

      {status === 'fallback' && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <span className="text-xs text-blue-600">📝 Manual</span>
        </div>
      )}

      {/* Help text */}
      {status === 'fallback' && (
        <p className="text-xs text-gray-500 mt-1">
          Skriv din adress manuellt (Google Maps är inte tillgängligt)
        </p>
      )}

      {status === 'ready' && autocompleteRef.current && (
        <p className="text-xs text-gray-500 mt-1">
          💡 Skriv för att få adressförslag från Google Maps
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;