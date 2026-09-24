import { Route, BrowserRouter, Routes } from 'react-router-dom'
import NavBar from './layout/NavBar'
import PageShell from './layout/PageShell'
import Home from './routes/Home'
import NotFound from './routes/NotFound'
import DreamJournalPage from './routes/journal/DreamJournalPage'
import DreamWeb from './routes/web/DreamWeb'
import RegisterPage from './routes/auth/RegisterPage'
import LoginPage from './routes/auth/LoginPage'
import DreamFeed from './routes/dreams/DreamFeed'
import NewDreamPage from './routes/dreams/NewDreamPage'
import DreamDetailPage from './routes/dreams/DreamDetailPage'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { DreamPostProvider } from './context/DreamPostContext'

function App() {
  return (
    <AuthProvider>
      <DreamPostProvider>
        {/* BASE_URL is "/<repo-name>/" on GitHub Pages (see vite.config.ts) and "/" locally. */}
        <BrowserRouter basename={import.meta.env.BASE_URL}>
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
              <Route path="/dreams/:id" element={<DreamDetailPage />} />
              <Route
                path="/journal"
                element={
                  <ProtectedRoute>
                    <DreamJournalPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/web" element={<DreamWeb />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageShell>
        </BrowserRouter>
      </DreamPostProvider>
    </AuthProvider>
  )
}

export default App
