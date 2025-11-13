# Migration Guide: Color System → Image+Question System

## Overview
This migration transforms the interactivity system from a color-based contribution model to an image+question-based model with configurable questions and aggregated statistics.

## Database Migration

**IMPORTANT:** Run this migration in your Supabase SQL Editor before testing:

```sql
-- Function to get image statistics for a room
CREATE OR REPLACE FUNCTION get_room_image_stats(p_room_id UUID)
RETURNS TABLE (
  image_id TEXT,
  contribution_count BIGINT,
  mean_valence NUMERIC,
  mean_arousal NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    (c.data->>'image_id')::TEXT as image_id,
    COUNT(c.id) as contribution_count,
    AVG(CASE
      WHEN c.data->>'question_id' = 'valence'
      THEN (c.data->>'answer')::NUMERIC
      ELSE NULL
    END) as mean_valence,
    AVG(CASE
      WHEN c.data->>'question_id' = 'arousal'
      THEN (c.data->>'answer')::NUMERIC
      ELSE NULL
    END) as mean_arousal
  FROM contributions c
  WHERE c.room_id = p_room_id
  GROUP BY (c.data->>'image_id')
  ORDER BY contribution_count DESC;
$$;
```

## Testing the New System

### 1. Prepare Test Data

Use the provided test CSV at `/resources/test_data_input.csv` or create your own with these columns:
- `image_id` (string)
- `url` (valid image URL)
- `details` (JSON string with metadata)

### 2. Prepare Question Configuration

Example configuration for valence/arousal questions:

```json
{
  "type": "single-randomly-picked",
  "questions": [
    {
      "id": "valence",
      "prompt": "What is the valence of this picture?",
      "details": "Please evaluate this image in terms of what emotion it evokes in you. How positively does this image make you feel? Being 1 extremely negative, 7 extremely positive and 3-4 indifferent.",
      "type": "range",
      "implementation": [1, 7]
    },
    {
      "id": "arousal",
      "prompt": "What is the arousal of this picture?",
      "details": "Please evaluate this image in terms of what emotion it evokes in you. How intensely does this image make you feel? Being 1 extremely un-energized, 7 extremely energized and 3-4 indifferent.",
      "type": "range",
      "implementation": [1, 7]
    }
  ]
}
```

### 3. Create a Room

1. Navigate to `/home` (requires login)
2. Upload CSV file in the "Image Dataset" field
3. Paste JSON configuration in the "Question Configuration" field
4. Click "Create Room"
5. Validation will check:
   - CSV has required columns
   - Image URLs are reachable
   - JSON matches expected schema

### 4. Test Audience View

1. Share the QR code or URL with audience members
2. Each view will show:
   - A random image from the dataset
   - A random question (if using 'single-randomly-picked')
   - Range slider (for range questions)
   - Info button with question details
3. After submission, a new image+question is automatically loaded

### 5. Monitor Presenter View

1. Presenter view shows all configured images in a grid
2. Each card displays:
   - Image thumbnail (lazy-loaded)
   - Image ID
   - Number of contributions
   - Mean valence (calculated from all valence answers for that image)
   - Mean arousal (calculated from all arousal answers for that image)
3. Stats update in real-time as contributions come in

## Breaking Changes

### Data Structure Changes
- **Old:** `room.config = {colors: string[]}`
- **New:** `room.config = {images: ImageData[], questions: QuestionConfig}`

- **Old:** `contribution.data = {color: string}`
- **New:** `contribution.data = {image_id: string, question_id: string, answer: number|string}`

### Component Changes
- `RoomCreationModal` removed, replaced with inline `RoomCreationForm`
- `AudienceView` completely rewritten for image+question interface
- `PresenterView` completely rewritten for statistics display

### Removed Features
- Color palette selection
- Color-based contributions
- Color grid in presenter view

## Rollback Instructions

If you need to rollback:

1. Restore the following files from git:
   - `components/RoomCreationForm.tsx`
   - `components/RoomCreationModal.tsx`
   - `components/AudienceView.tsx`
   - `components/PresenterView.tsx`
   - `lib/types/database.ts`
   - `app/home/page.tsx`

2. Drop the new function from Supabase:
   ```sql
   DROP FUNCTION IF EXISTS get_room_image_stats(UUID);
   ```

3. Uninstall new dependencies:
   ```bash
   npm uninstall papaparse zod @types/papaparse
   ```

## Notes

- Existing color-based rooms in the database will not work with the new system
- Consider clearing the `rooms` and `contributions` tables if migrating production
- Image URLs must be publicly accessible and CORS-enabled
- CSV validation can be slow if checking many URLs
