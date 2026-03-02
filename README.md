# 🐐 FarmTrack — Livestock Dashboard

A mobile-first Vue 3 livestock tracking app.

## Project Structure

```
farmtrack/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.js               # App entry point
│   ├── App.vue               # Root component (toast + modal + router)
│   ├── assets/
│   │   └── main.css          # Global styles & design tokens
│   ├── router/
│   │   └── index.js          # Vue Router (6 routes)
│   ├── stores/               # Pinia stores
│   │   ├── animals.js        # Animal list, counts, add/remove
│   │   ├── finance.js        # Transactions, profit, breakdown
│   │   ├── breeding.js       # Pregnancies, birth records
│   │   ├── health.js         # Health/treatment records
│   │   └── ui.js             # Toast messages, active modal
│   ├── components/
│   │   ├── BottomNav.vue     # Fixed bottom navigation bar
│   │   ├── PageHeader.vue    # Green header with slots
│   │   ├── AppModal.vue      # All add/edit modals in one place
│   │   ├── PregnancyCard.vue # Single pregnancy progress card
│   │   └── TransactionItem.vue # Single transaction row
│   └── views/
│       ├── Dashboard.vue     # Home screen
│       ├── Animals.vue       # Animal list with filter
│       ├── Finance.vue       # Finance tracker
│       ├── Breeding.vue      # Pregnancy & birth tracking
│       ├── Health.vue        # Health records
│       └── Reports.vue       # Analytics & reports
```

## Setup

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Connecting Firebase (Next Step)

Each Pinia store is ready for Firebase. Replace the `ref([...])` sample data with Firestore:

```js
// In any store, replace:
const animals = ref([...sampleData])

// With:
import { collection, onSnapshot, addDoc } from 'firebase/firestore'
import { db } from '@/firebase'

const animals = ref([])
onSnapshot(collection(db, 'animals'), (snapshot) => {
  animals.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
})
```

Create `src/firebase.js`:
```js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ... rest of config
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
```

## Features Tracked

### Animals
- Goats, Chickens, Ducks, Pigs, Cows
- Male/Female counts
- Health status (Healthy, Sick, Pregnant, Under Treatment)
- Age & weight tracking
- Record deaths (removes from herd)

### Finance
- Income vs Expenses
- Capital investment
- Profit/Loss & ROI
- Expense breakdown by category (Feeds, Medicine, Labor, etc.)

### Breeding
- Mark goats pregnant with mate date
- 150-day gestation auto-calculates expected birth
- Progress bar + countdown
- 3-step timeline (mated → mid-check → birth)
- Birth records with kid counts (male/female)

### Health Records
- Treatment types: Vaccination, Deworming, Antibiotic, etc.
- Medicine/product used
- Next due date reminders
- Upcoming follow-up alerts

### Reports
- Monthly summary
- Herd composition charts
- Gender split
- Finance summary with ROI
