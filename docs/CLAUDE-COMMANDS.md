## Quick Commands

### Backend Development
```bash
./mvnw quarkus:dev          # Backend :9003/:9004
./mvnw compile               # Compile code
./mvnw test                  # Run tests
./mvnw clean package         # Build production jar
```

### Frontend Development
```bash
npm install                  # Install dependencies
npm run dev                  # Start dev server
npm run build                # Build production bundle
```

### Testing & Quality
```bash
npx playwright test          # Run E2E tests
./mvnw test-compile          # Compile test code
```

### Resume Workflow
```bash
git log -5 --oneline && ./mvnw compile -q && ./mvnw quarkus:dev
```
