import { Route, BrowserRouter, Routes } from 'react-router-dom'
import NavBar from './layout/NavBar'
import PageShell from './layout/PageShell'
import Home from './routes/Home'
import LearnHome from './routes/learn/LearnHome'
import LessonPage from './routes/learn/LessonPage'
import ForumHome from './routes/forum/ForumHome'
import NewThreadPage from './routes/forum/NewThreadPage'
import ThreadPage from './routes/forum/ThreadPage'
import JournalHome from './routes/journal/JournalHome'
import GamesHome from './routes/games/GamesHome'
import DreamSignQuiz from './routes/games/DreamSignQuiz'
import DreamStreakGame from './routes/games/DreamStreakGame'
import ReflexRift from './routes/games/ReflexRift'
import MemoryFold from './routes/games/MemoryFold'
import DreamWalk from './routes/games/DreamWalk'
import DreamAtlas from './routes/atlas/DreamAtlas'
import DreamWeb from './routes/web/DreamWeb'
import RegisterPage from './routes/auth/RegisterPage'
import LoginPage from './routes/auth/LoginPage'
import DreamFeed from './routes/dreams/DreamFeed'
import NewDreamPage from './routes/dreams/NewDreamPage'
import ProtectedRoute from './components/ProtectedRoute'
import { ProgressProvider } from './context/ProgressContext'
import { ForumProvider } from './context/ForumContext'
import { DreamStreakProvider } from './context/DreamStreakContext'
import { MetaProgressProvider } from './context/MetaProgressContext'
import { AuthProvider } from './context/AuthContext'
import { DreamPostProvider } from './context/DreamPostContext'

function App() {
  return (
    <AuthProvider>
      <DreamPostProvider>
        <ProgressProvider>
          <ForumProvider>
            <DreamStreakProvider>
              <MetaProgressProvider>
                <BrowserRouter>
                  <NavBar />
                  <PageShell>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/dreams" element={<DreamFeed />} />
                      <Route
                        path="/dreams/new"
                        element={
                          <ProtectedRoute>
                            <NewDreamPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/learn" element={<LearnHome />} />
                      <Route path="/learn/:slug" element={<LessonPage />} />
                      <Route path="/journal" element={<JournalHome />} />
                      <Route path="/forum" element={<ForumHome />} />
                      <Route path="/forum/new" element={<NewThreadPage />} />
                      <Route path="/forum/:threadId" element={<ThreadPage />} />
                      <Route path="/games" element={<GamesHome />} />
                      <Route path="/games/dream-sign-quiz" element={<DreamSignQuiz />} />
                      <Route path="/games/dream-streak" element={<DreamStreakGame />} />
                      <Route path="/games/reflex-rift" element={<ReflexRift />} />
                      <Route path="/games/memory-fold" element={<MemoryFold />} />
                      <Route path="/games/dream-walk" element={<DreamWalk />} />
                      <Route path="/atlas" element={<DreamAtlas />} />
                      <Route path="/web" element={<DreamWeb />} />
                    </Routes>
                  </PageShell>
                </BrowserRouter>
              </MetaProgressProvider>
            </DreamStreakProvider>
          </ForumProvider>
        </ProgressProvider>
      </DreamPostProvider>
    </AuthProvider>
  )
}

export default App
