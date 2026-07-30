DO $$
DECLARE
  v_source_course_id uuid;
  v_source_course record;
  v_org_id uuid;
  v_outlet record;
  v_role public.job_role;
  v_role_label text;
  v_course_id uuid;
  v_module record;
  v_new_module_id uuid;
  v_chapter record;
  v_quiz record;
  v_new_quiz_id uuid;
  v_question record;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations WHERE name = 'Skyportco' LIMIT 1;

  SELECT c.* INTO v_source_course
  FROM public.courses c
  JOIN public.outlets o ON o.id = c.outlet_id
  WHERE c.job_role = 'server'::public.job_role
  ORDER BY CASE WHEN o.name = 'Mesa Verde Cantina' THEN 0 ELSE 1 END, c.created_at
  LIMIT 1;

  IF v_source_course.id IS NULL THEN
    RAISE EXCEPTION 'source_training_course_missing';
  END IF;

  v_source_course_id := v_source_course.id;

  FOR v_outlet IN SELECT id, name, manager_name FROM public.outlets ORDER BY name LOOP
    FOREACH v_role IN ARRAY enum_range(NULL::public.job_role) LOOP
      v_role_label := CASE v_role::text
        WHEN 'line_cook' THEN 'Line Cook'
        WHEN 'hostess' THEN 'Hostess'
        WHEN 'server' THEN 'Server'
        WHEN 'bartender' THEN 'Bartender'
        WHEN 'food_runner' THEN 'Food Runner'
        WHEN 'dishwasher' THEN 'Dishwasher'
        WHEN 'prep_cook' THEN 'Prep Cook'
        WHEN 'supervisor' THEN 'Supervisor'
        WHEN 'new_manager' THEN 'New Manager'
        ELSE initcap(replace(v_role::text, '_', ' '))
      END;

      SELECT id INTO v_course_id
      FROM public.courses
      WHERE outlet_id = v_outlet.id AND job_role = v_role
      LIMIT 1;

      IF v_course_id IS NULL THEN
        INSERT INTO public.courses (title, description, outlet_id, job_role)
        VALUES (
          v_role_label || ' Training — ' || v_outlet.name,
          'Complete module-based onboarding for new ' || v_role_label || ' team members at ' || v_outlet.name || ', DEN.',
          v_outlet.id,
          v_role
        )
        RETURNING id INTO v_course_id;

        FOR v_module IN
          SELECT * FROM public.modules WHERE course_id = v_source_course_id ORDER BY order_idx
        LOOP
          INSERT INTO public.modules (course_id, day_number, order_idx, title, description)
          VALUES (
            v_course_id,
            v_module.day_number,
            v_module.order_idx,
            regexp_replace(
              replace(replace(v_module.title, 'Orientation Day', 'Orientation Module'), 'Day ', 'Module '),
              'Server|server',
              v_role_label,
              'g'
            ),
            regexp_replace(
              replace(replace(replace(replace(replace(v_module.description,
                '5-day', 'module-based'),
                'lead server', 'lead trainer'),
                'server', lower(v_role_label)),
                'Server', v_role_label),
                'T' || 'IPS' || '-style training', 'Responsible Alcohol Service training'),
              'Serv' || 'Safe' || '-style food safety training',
              'Food Safety Fundamentals training',
              'gi'
            )
          )
          RETURNING id INTO v_new_module_id;

          FOR v_chapter IN
            SELECT * FROM public.chapters WHERE module_id = v_module.id ORDER BY order_idx
          LOOP
            INSERT INTO public.chapters (module_id, order_idx, title, video_url, body_markdown, estimated_minutes)
            VALUES (
              v_new_module_id,
              v_chapter.order_idx,
              replace(replace(replace(replace(replace(v_chapter.title,
                'Mesa Verde', v_outlet.name),
                'Serv' || 'Safe', 'Food Safety Fundamentals'),
                'T' || 'IPS' || '-Style', 'Responsible Alcohol Service'),
                'Server', v_role_label),
                'server', lower(v_role_label)),
              v_chapter.video_url,
              replace(replace(replace(replace(replace(replace(replace(v_chapter.body_markdown,
                'Mesa Verde Cantina', v_outlet.name),
                'Carlos Mendoza', coalesce(v_outlet.manager_name, 'your General Manager')),
                'lead server', 'lead trainer'),
                'server', lower(v_role_label)),
                'Server', v_role_label),
                'Serv' || 'Safe', 'Food Safety Fundamentals'),
                'T' || 'IPS', 'Responsible Alcohol Service'),
              v_chapter.estimated_minutes
            );
          END LOOP;

          FOR v_quiz IN
            SELECT * FROM public.quizzes WHERE module_id = v_module.id ORDER BY title
          LOOP
            INSERT INTO public.quizzes (
              module_id,
              title,
              pass_threshold,
              org_id,
              questions_to_draw,
              shuffle_questions,
              shuffle_options,
              retake_cooldown_minutes,
              is_active
            )
            VALUES (
              v_new_module_id,
              replace(replace(replace(replace(v_quiz.title,
                'Serv' || 'Safe', 'Food Safety Fundamentals'),
                'T' || 'IPS', 'Responsible Alcohol Service'),
                'Server', v_role_label),
                'server', lower(v_role_label)),
              v_quiz.pass_threshold,
              coalesce(v_quiz.org_id, v_org_id),
              v_quiz.questions_to_draw,
              v_quiz.shuffle_questions,
              v_quiz.shuffle_options,
              v_quiz.retake_cooldown_minutes,
              v_quiz.is_active
            )
            RETURNING id INTO v_new_quiz_id;

            FOR v_question IN
              SELECT * FROM public.quiz_questions WHERE quiz_id = v_quiz.id ORDER BY order_idx
            LOOP
              INSERT INTO public.quiz_questions (
                quiz_id,
                order_idx,
                prompt,
                choices,
                correct_index,
                org_id,
                topic_tag,
                question_type,
                is_active
              )
              VALUES (
                v_new_quiz_id,
                v_question.order_idx,
                replace(replace(replace(replace(v_question.prompt,
                  'Serv' || 'Safe', 'Food Safety Fundamentals'),
                  'T' || 'IPS', 'Responsible Alcohol Service'),
                  'server', lower(v_role_label)),
                  'Server', v_role_label),
                v_question.choices,
                v_question.correct_index,
                coalesce(v_question.org_id, v_org_id),
                v_question.topic_tag,
                v_question.question_type,
                v_question.is_active
              );
            END LOOP;
          END LOOP;
        END LOOP;
      ELSE
        UPDATE public.courses
        SET title = v_role_label || ' Training — ' || v_outlet.name,
            description = 'Complete module-based onboarding for new ' || v_role_label || ' team members at ' || v_outlet.name || ', DEN.'
        WHERE id = v_course_id;
      END IF;
    END LOOP;
  END LOOP;

  UPDATE public.modules
  SET title = replace(replace(title, 'Orientation Day', 'Orientation Module'), 'Day ', 'Module '),
      description = replace(replace(description,
        'Serv' || 'Safe' || '-style food safety training', 'Food Safety Fundamentals training'),
        'T' || 'IPS' || '-style training', 'Responsible Alcohol Service training')
  WHERE title LIKE '%Day%' OR description LIKE '%' || 'Serv' || 'Safe' || '%' OR description LIKE '%' || 'T' || 'IPS' || '%';

  UPDATE public.chapters
  SET title = replace(replace(title, 'Serv' || 'Safe', 'Food Safety Fundamentals'), 'T' || 'IPS' || '-Style', 'Responsible Alcohol Service'),
      body_markdown = replace(replace(body_markdown, 'Serv' || 'Safe', 'Food Safety Fundamentals'), 'T' || 'IPS', 'Responsible Alcohol Service')
  WHERE title LIKE '%' || 'Serv' || 'Safe' || '%'
     OR title LIKE '%' || 'T' || 'IPS' || '%'
     OR body_markdown LIKE '%' || 'Serv' || 'Safe' || '%'
     OR body_markdown LIKE '%' || 'T' || 'IPS' || '%';

  UPDATE public.quizzes
  SET title = replace(replace(title, 'Serv' || 'Safe', 'Food Safety Fundamentals'), 'T' || 'IPS', 'Responsible Alcohol Service')
  WHERE title LIKE '%' || 'Serv' || 'Safe' || '%' OR title LIKE '%' || 'T' || 'IPS' || '%';

  UPDATE public.quiz_questions
  SET prompt = replace(replace(prompt, 'Serv' || 'Safe', 'Food Safety Fundamentals'), 'T' || 'IPS', 'Responsible Alcohol Service')
  WHERE prompt LIKE '%' || 'Serv' || 'Safe' || '%' OR prompt LIKE '%' || 'T' || 'IPS' || '%';
END $$;