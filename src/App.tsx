import { Route, BrowserRouter, Routes } from 'react-router-dom'
import NavBar from './layout/NavBar'
import PageShell from './layout/PageShell'
import Home from './routes/Home'
import LearnHome from './routes/learn/LearnHome'
import LessonPage from './routes/learn/LessonPage'
import ForumHome from './routes/forum/ForumHome'
import NewThreadPage from './routes/forum/NewThreadPage'
import ThreadPage from './routes/forum/ThreadPage'
import GamesHome from './routes/games/GamesHome'
import DreamSignQuiz from './routes/games/DreamSignQuiz'
import { ProgressProvider } from './context/ProgressContext'
import { ForumProvider } from './context/ForumContext'

function App() {
  return (
    <ProgressProvider>
      <ForumProvider>
        <BrowserRouter>
          <NavBar />
          <PageShell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/learn" element={<LearnHome />} />
              <Route path="/learn/:slug" element={<LessonPage />} />
              <Route path="/forum" element={<ForumHome />} />
              <Route path="/forum/new" element={<NewThreadPage />} />
              <Route path="/forum/:threadId" element={<ThreadPage />} />
              <Route path="/games" element={<GamesHome />} />
              <Route path="/games/dream-sign-quiz" element={<DreamSignQuiz />} />
            </Routes>
          </PageShell>
        </BrowserRouter>
      </ForumProvider>
    </ProgressProvider>
  )
}

export default App
