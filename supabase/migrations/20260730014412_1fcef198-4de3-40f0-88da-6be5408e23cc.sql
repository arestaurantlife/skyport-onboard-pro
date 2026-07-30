UPDATE public.quizzes
SET title = replace(title, 'Day ', 'Module ')
WHERE title LIKE 'Day %';