export const lessonsOf = (course) => course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title })));

export function lessonForTopic(course, topic) {
  const mod = course.modules.find((m) => m.title === topic);
  return mod ? { ...mod.lessons[0], moduleId: mod.id, moduleTitle: mod.title } : null;
}

export const ytSearchUrl = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export function notesFor(course, lesson) {
  return [
    `# ${lesson.title}`,
    `${course.name} - ${lesson.moduleTitle || ''}`.trim(),
    `Estimated study time: ${lesson.minutes} minutes`,
    '',
    '## Key points',
    ...lesson.points.map((p) => `- ${p}`),
    '',
    '## Check yourself',
    '- Explain this idea in two sentences without looking at the notes.',
    '- Write one exam-style question about it and solve it.',
    '- Ask AptiBot about anything that still feels unclear.',
  ];
}
