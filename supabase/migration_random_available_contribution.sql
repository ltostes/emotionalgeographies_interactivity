-- Function to get a random available image+question combination for an identifier
-- This prevents duplicate contributions by checking what the user has already submitted

CREATE OR REPLACE FUNCTION get_random_available_contribution(
  p_room_id UUID,
  p_identifier TEXT
)
RETURNS TABLE (
  image_id TEXT,
  question_id TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_config JSONB;
  v_image JSONB;
  v_question JSONB;
  v_images JSONB;
  v_questions JSONB;
  v_available_combos JSONB[] := '{}';
  v_selected_combo JSONB;
  v_completed_key TEXT;
BEGIN
  -- Get room config
  SELECT config INTO v_config
  FROM rooms
  WHERE id = p_room_id;

  IF v_config IS NULL THEN
    RETURN;
  END IF;

  v_images := v_config->'images';
  v_questions := v_config->'questions'->'questions';

  -- Build array of available combinations
  FOR v_image IN SELECT jsonb_array_elements(v_images)
  LOOP
    FOR v_question IN SELECT jsonb_array_elements(v_questions)
    LOOP
      -- Check if this combination has been completed by this identifier
      SELECT (c.data->>'image_id') || ':' || (c.data->>'question_id')
      INTO v_completed_key
      FROM contributions c
      WHERE c.room_id = p_room_id
        AND c.identifier = p_identifier
        AND c.data->>'image_id' = v_image->>'image_id'
        AND c.data->>'question_id' = v_question->>'id'
      LIMIT 1;

      -- If not completed, add to available combos
      IF v_completed_key IS NULL THEN
        v_available_combos := array_append(
          v_available_combos,
          jsonb_build_object(
            'image_id', v_image->>'image_id',
            'question_id', v_question->>'id'
          )
        );
      END IF;
    END LOOP;
  END LOOP;

  -- If no available combos, return empty
  IF array_length(v_available_combos, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Pick random combo
  v_selected_combo := v_available_combos[1 + floor(random() * array_length(v_available_combos, 1))::int];

  -- Return the selected combination
  RETURN QUERY
  SELECT
    (v_selected_combo->>'image_id')::TEXT,
    (v_selected_combo->>'question_id')::TEXT;
END;
$$;
