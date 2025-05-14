# Experience Calculator

The experience calculator is used to compute total years of professional experience from a candidate's experience entries.

## Features

- Handles overlapping experience periods
- Accounts for current positions
- Sorts experiences chronologically
- Prevents double-counting of concurrent experiences
- Rounds to one decimal place for precision

## How it Works

1. **Sort Experiences**
   - Experiences are sorted by start date to process them chronologically

2. **Handle Overlapping Periods**
   - Keeps track of the latest end date seen so far
   - Only counts additional time that extends beyond previous experiences
   - Prevents double-counting when positions overlap

3. **Current Positions**
   - Uses current date for positions marked as `isCurrent`
   - Properly handles multiple current positions

## Example

```typescript
// Example input
const experiences = [
  {
    startDate: '2020-01-01',
    endDate: '2021-06-30',
    isCurrent: false
  },
  {
    startDate: '2021-01-01',  // Note: Overlaps with previous
    endDate: null,
    isCurrent: true
  }
];

// Result: Only counts unique time periods
// 2020-01-01 to 2021-06-30: 18 months
// 2021-07-01 to now: remaining months
// Avoids double-counting Jan-Jun 2021
```

## Usage

```typescript
import { calculateTotalExperience } from './experience-calculator';

const yearsOfExperience = calculateTotalExperience(candidateExperiences);
```

The returned value represents total years of unique professional experience, rounded to one decimal place.