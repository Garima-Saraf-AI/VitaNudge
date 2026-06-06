# NutriTrack Automated Testing

Run all local regression checks from the project root:

```bash
npm test
```

This runs:

```bash
npm --prefix frontend run test:build
npm --prefix backend run test:regression
```

## What Is Covered

The frontend check runs a production build. This catches JSX, import, bundling, and CSS reference errors.

The backend regression suite starts the API on a temporary local port, creates a throwaway user, tests the main flows, then deletes that user. It covers:

- Auth register, session, profile update
- Goal read/update
- Food library list/create/update/delete
- Meal log create/read/edit/range/copy yesterday/delete
- Water log create/read/range/delete
- Glucose log create/read/range/delete
- Weight log create/read/range/delete
- Blood pressure and HbA1c create/read/range/delete
- Medication create, mark taken, undo, delete
- Meal templates create/list/log/delete
- Doctor report endpoint
- Weekly email preference flow
- Coach local fallback
- Scan and barcode validation endpoints

## External Integrations

These tests avoid live network dependencies by default. They validate local behavior and request validation for:

- AI label scan / plate scan
- Open Food Facts barcode lookup
- Real email delivery

Full end-to-end checks for those require valid API keys/network and should be tested separately before release.
