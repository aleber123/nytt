# Translation System Guide

## Overview
This website uses Next.js internationalization (i18n) with next-i18next for multi-language support. Currently supports Swedish (sv) and English (en), with easy expansion to additional languages.

## Current Setup
- **Default Language**: Swedish (sv)
- **Supported Languages**: Swedish (sv), English (en)
- **Framework**: next-i18next
- **Translation Files**: JSON files in `public/locales/{locale}/common.json`

## File Structure
```
public/locales/
├── sv/
│   └── common.json    # Swedish translations
└── en/
    └── common.json    # English translations
```

## Configuration Files
- `next-i18next.config.js` - Main i18n configuration
- `next.config.js` - Next.js configuration (includes i18n setup)

## Language Switcher
Located in `src/components/layout/Header.tsx`:
- Desktop: SV/EN buttons in top navigation
- Mobile: SV/EN buttons in mobile menu
- Uses `router.push(router.pathname, router.asPath, { locale })` for switching

## Adding New Languages

### Step 1: Update Configuration
Edit `next-i18next.config.js`:
```javascript
module.exports = {
  i18n: {
    defaultLocale: 'sv',
    locales: ['sv', 'en', 'de', 'fr'], // Add new language codes
    localeDetection: false,
  },
  // ...
};
```

### Step 2: Create Translation Files
1. Create new directory: `public/locales/{locale}/`
2. Copy `common.json` from existing language
3. Translate all strings to the new language
4. Maintain the same JSON structure

### Step 3: Update Language Switcher
Edit `src/components/layout/Header.tsx`:
- Add new language button in both desktop and mobile views
- Update ARIA labels for accessibility

### Step 4: Test
- Test language switching functionality
- Verify all pages display correctly in new language
- Check mobile responsiveness

## Translation Keys Structure

### Main Sections:
- `accessibility` - Screen reader and accessibility texts
- `common` - Common UI elements (buttons, loading states)
- `nav` - Navigation menu items
- `home` - Homepage content
- `services` - Services page and service details
- `order` - Order form and process
- `confirmation` - Order confirmation page
- `about` - About us page
- `contact` - Contact page
- `faq` - Frequently asked questions
- `countries` - Countries page
- `prices` - Pricing page
- `footer` - Footer content
- `testimonials` - Customer testimonials
- `orderStatus` - Order tracking page

### Usage in Components:
```javascript
import { useTranslation } from 'next-i18next';

const MyComponent = () => {
  const { t } = useTranslation('common');

  return (
    <h1>{t('services.title')}</h1>
    <p>{t('services.description')}</p>
  );
};
```

## Best Practices

### 1. Key Naming
- Use lowercase with dots for hierarchy: `section.subsection.key`
- Be descriptive but concise
- Use consistent naming across languages

### 2. Translation Maintenance
- Keep translation files synchronized
- Use consistent terminology
- Test all languages when making changes

### 3. Accessibility
- Include proper ARIA labels in translations
- Test with screen readers
- Ensure all interactive elements have translated labels

### 4. SEO
- Update page titles and meta descriptions for each language
- Consider hreflang tags for better SEO

## Common Issues & Solutions

### Missing Translations
- Check if key exists in all language files
- Use fallback text: `{t('key', 'Fallback text')}`
- Verify JSON syntax is valid

### Language Not Switching
- Check browser URL has correct locale parameter
- Verify locale is in `locales` array in config
- Clear browser cache and cookies

### Build Errors
- Ensure all translation files have valid JSON
- Check for missing commas or brackets
- Verify file paths are correct

## Future Expansion
The system is designed to easily support additional languages. Popular additions might include:
- German (de)
- French (fr)
- Spanish (es)
- Arabic (ar)
- Chinese (zh)
- Russian (ru)

Each new language requires:
1. Translation files
2. Language switcher buttons
3. Testing across all pages
4. Cultural adaptation (dates, numbers, etc.)

## Tools & Resources
- **Translation Management**: Manual JSON editing (consider tools like Crowdin or Lokalise for larger projects)
- **Validation**: Use JSON validators to check syntax
- **Testing**: Test all user flows in each language
- **Performance**: Translations are loaded client-side for better performance