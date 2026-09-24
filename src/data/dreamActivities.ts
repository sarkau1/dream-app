export interface DreamActivity {
  title: string
  description: string
}

export const dreamActivities: DreamActivity[] = [
  {
    title: 'Count your fingers',
    description: 'Every time you walk through a door today, count your fingers. In dreams they often blur, merge, or come out as six.',
  },
  {
    title: 'Read it twice',
    description: 'Pick a sign, label, or screen five times today: read it, look away, read it again. Dream text rarely stays the same.',
  },
  {
    title: 'Pinch-nose breath',
    description: 'Pinch your nose shut and try to breathe through it at least ten times today. If air still flows, you are dreaming.',
  },
  {
    title: 'Write before you move',
    description: 'Tomorrow morning, write down whatever you remember before you check your phone or even sit up.',
  },
  {
    title: 'Set a dream intention',
    description: 'As you fall asleep tonight, repeat: "Next time I am dreaming, I will realise I am dreaming."',
  },
  {
    title: 'Hunt for your dream signs',
    description: 'Reread your last three dreams and circle anything that repeats: a place, a person, a feeling.',
  },
  {
    title: 'Wake back to bed',
    description: 'Set an alarm for about five hours after you fall asleep. Stay up for 20 quiet minutes, then go back to sleep thinking about lucidity.',
  },
  {
    title: 'Light switch test',
    description: 'Flip a light switch and actually watch the room. In dreams, lights often fail to change or behave strangely.',
  },
  {
    title: 'Screen-free last hour',
    description: 'Put screens away an hour before bed tonight. Deeper, steadier sleep makes for longer REM periods late in the night.',
  },
  {
    title: 'Name the emotion',
    description: 'Whenever you feel a strong emotion today, pause and ask: "Could this be a dream?" Intense feelings are a common trigger.',
  },
  {
    title: 'Sketch a dream',
    description: 'Draw one scene from a recent dream, however rough. Visual recall often brings back details that words miss.',
  },
  {
    title: 'The hand-through-wall check',
    description: 'Press a finger against your palm or a wall and expect it to go through. The expectation is what makes it work in a dream.',
  },
  {
    title: 'Retell a dream out loud',
    description: 'Tell someone, or just the room, about a dream you had. Saying it aloud strengthens the memory of dreaming.',
  },
  {
    title: 'Hourly awareness chime',
    description: 'Set a quiet hourly reminder today. Each time it goes off, stop and genuinely ask whether you are awake.',
  },
  {
    title: 'Plan your lucid goal',
    description: 'Decide exactly what you will do in your next lucid dream: fly, find someone, visit a place. Clear goals help you stay lucid.',
  },
  {
    title: 'Look at your feet',
    description: 'Glance down at your feet a few times today and ask how you got here. Dreams rarely have a clear beginning.',
  },
  {
    title: 'Time check',
    description: 'Check a clock, look away, and check again. Did the time jump, or does it make no sense? That is a dream sign.',
  },
  {
    title: 'Morning stillness',
    description: 'When you wake tomorrow, stay completely still with your eyes closed for a minute and let the dream come back to you.',
  },
  {
    title: 'Revisit a dream',
    description: 'Before sleep, replay a recent dream in your head, and imagine noticing a dream sign and becoming lucid in it.',
  },
  {
    title: 'Mirror glance',
    description: 'Look into a mirror today and study your reflection. In dreams, reflections often distort or behave oddly.',
  },
]

/** Changes once a day, the same for everyone. Offset from the fact-of-the-day so they don't move in lockstep. */
export function activityIndexForToday() {
  const now = new Date()
  const dayNumber = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000,
  )
  return (dayNumber * 7 + 3) % dreamActivities.length
}
