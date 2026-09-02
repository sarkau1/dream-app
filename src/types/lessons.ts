export interface LessonSection {
  heading: string
  body: string
}

export interface Lesson {
  slug: string
  title: string
  summary: string
  sections: LessonSection[]
  tips: string[]
}
