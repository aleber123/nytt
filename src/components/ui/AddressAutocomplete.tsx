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
  onSelect?: (data: {
    street?: string;
    postalCode?: string;
    city?: string;
    countryCode?: string;
    formattedAddress?: string;
  }) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  countryRestriction?: string | string[];
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Sök adress...",
  className = "",
  required = false,
  countryRestriction = 'se'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed' | 'fallback'>('loading');
  const [inputValue, setInputValue] = useState(value);

  // Load Google Maps API using script tag
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let pollId: NodeJS.Timeout;

    const checkGoogleReady = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setStatus('ready');
        return true;
      }
      return false;
    };

    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (checkGoogleReady()) return;

      // Use environment variable for API key
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        setStatus('fallback');
        return;
      }

      // Check if script is already loading/loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Script exists, poll until Google is ready
        pollId = setInterval(() => {
          if (checkGoogleReady()) {
            clearInterval(pollId);
          }
        }, 200);

        // Timeout after 10 seconds
        timeoutId = setTimeout(() => {
          clearInterval(pollId);
          if (!checkGoogleReady()) {
            setStatus('fallback');
          }
        }, 10000);
        return;
      }

      // Create callback function
      window.initGoogleMapsCallback = () => {
        setStatus('ready');
      };

      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;

      script.onerror = () => {
        setStatus('fallback');
      };

      document.head.appendChild(script);

      // Timeout fallback
      timeoutId = setTimeout(() => {
        if (!checkGoogleReady()) {
          setStatus('fallback');
        }
      }, 10000);
    };

    loadGoogleMaps();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (pollId) clearInterval(pollId);
    };
  }, []);

  // Store callbacks in refs to avoid re-creating autocomplete
  const onChangeRef = useRef(onChange);
  const onSelectRef = useRef(onSelect);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Initialize autocomplete when Google Maps is ready
  useEffect(() => {
    // Skip if already initialized or not ready
    if (autocompleteRef.current) return;
    if (status !== 'ready') return;
    if (!inputRef.current) return;
    if (!window.google?.maps?.places) return;
    
    try {
      const normalizeCountryRestriction = () => {
        if (!countryRestriction) return undefined;
        if (Array.isArray(countryRestriction)) {
          const list = countryRestriction.map((c) => (c || '').toLowerCase()).filter(Boolean);
          return list.length ? list : undefined;
        }
        const single = (countryRestriction || '').toLowerCase();
        return single ? single : undefined;
      };

      const parsePlace = (place: any) => {
        const components = place?.address_components || [];
        const get = (type: string, useShort = false) => {
          const comp = components.find((c: any) => Array.isArray(c.types) && c.types.includes(type));
          if (!comp) return '';
          return useShort ? (comp.short_name || '') : (comp.long_name || '');
        };

        const streetNumber = get('street_number');
        const route = get('route');
        const postalCode = get('postal_code');
        const postalTown = get('postal_town');
        const locality = get('locality');
        const sublocality = get('sublocality');
        const city = postalTown || locality || sublocality;
        const countryCode = get('country', true);
        const street = [route, streetNumber].filter(Boolean).join(' ').trim();

        return {
          street: street || undefined,
          postalCode: postalCode || undefined,
          city: city || undefined,
          countryCode: countryCode || undefined,
          formattedAddress: place?.formatted_address || undefined
        };
      };

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: normalizeCountryRestriction() ? { country: normalizeCountryRestriction() } : undefined,
          fields: ['formatted_address', 'address_components'],
          types: ['address']
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          const parsed = parsePlace(place);
          // Use only the street address in the input field, not the full formatted address
          // This prevents postal code, city, and country from appearing in the street field
          const streetOnly = parsed.street || place.formatted_address;
          setInputValue(streetOnly);
          onChangeRef.current(streetOnly);
          if (onSelectRef.current) {
            onSelectRef.current(parsed);
          }
        }
      });

      autocompleteRef.current = autocomplete;

    } catch (error) {
      setStatus('fallback');
    }
  }, [status, countryRestriction]);

  // Update local input value when prop changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
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

    </div>
  );
};

export default AddressAutocomplete;