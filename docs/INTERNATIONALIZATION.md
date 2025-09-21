# Internationalization (i18n) Guide

This document provides guidelines for maintaining and extending the internationalization (i18n) capabilities of the Legaliseringstjänst application.

## Current Supported Languages

- Swedish (sv) - Default language
- English (en)

## Adding a New Language

To add support for a new language, follow these steps:

1. **Create translation files**:
   - Create a new directory under `/public/locales/[language-code]/`
   - Copy `common.json` from an existing language directory
   - Translate all strings in the file

2. **Update configuration**:
   - Add the new language code to `next-i18next.config.js`:
   ```javascript
   module.exports = {
     i18n: {
       defaultLocale: 'sv',
       locales: ['sv', 'en', 'your-new-language-code'],
       // ...
     },
     // ...
   };
   ```

3. **Add language to the LanguageSelector component**:
   - Open `/src/components/ui/LanguageSelector.tsx`
   - Add your new language to the `languages` array:
   ```typescript
   const languages: Language[] = [
     { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
     { code: 'en', name: 'English', flag: '🇬🇧' },
     { code: 'your-code', name: 'Your Language Name', flag: '🇺🇳' }, // Add your language here
   ];
   ```

4. **Add accessibility label**:
   - Add a new translation key in both `en/common.json` and `sv/common.json`:
   ```json
   "accessibility": {
     // ...existing keys
     "switchToYourLanguage": "Switch to Your Language"
   }
   ```
   - Update the `aria-label` logic in `LanguageSelector.tsx`

## Translation Structure

The translation files are organized by namespaces. Currently, we use:

- `common.json` - Contains all translations for the application

### Key Sections in Translation Files

- `accessibility` - Screen reader and accessibility labels
- `nav` - Navigation menu items
- `common` - Common UI elements and buttons
- `services` - Service-specific content
- `order` - Order process related content
- `confirmation` - Order confirmation content
- `errorBoundary` - Error messages and UI elements

## Best Practices

1. **Use translation keys consistently** - Follow the established naming patterns
2. **Keep translations organized** - Group related translations together
3. **Use variables for dynamic content** - Example: `{{count}} documents`
4. **Test all languages** - Verify UI layout works with longer text in different languages
5. **Use the i18n helper functions** - See `/src/utils/i18n-helpers.ts`

## Error Handling

The application includes internationalized error handling:

- `ErrorBoundary` component - Catches React errors
- Custom 404 and 500 error pages
- Error messages in forms and API responses

## Date and Number Formatting

Use the helper functions in `/src/utils/i18n-helpers.ts` for formatting:

```typescript
import { formatLocalizedDate, formatLocalizedNumber } from '@/utils/i18n-helpers';

// Format a date according to the user's locale
const formattedDate = formatLocalizedDate(new Date(), locale);

// Format a number/currency according to the user's locale
const formattedPrice = formatLocalizedNumber(1000, locale);
```

## Testing Translations

1. Start the development server: `npm run dev`
2. Switch between languages using the language selector
3. Verify all UI elements are properly translated
4. Test error scenarios to ensure error messages are translated

## Translation Workflow

1. Extract new strings that need translation
2. Add them to `sv/common.json` (default language)
3. Add translations to all other language files
4. Use the translation keys in your components

## Resources

- [Next.js Internationalization Documentation](https://nextjs.org/docs/advanced-features/i18n-routing)
- [next-i18next Documentation](https://github.com/isaachinman/next-i18next)
- [i18next Documentation](https://www.i18next.com/)
