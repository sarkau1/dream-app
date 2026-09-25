import { lazy, Suspense } from 'react'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import NavBar from './layout/NavBar'
import PageShell from './layout/PageShell'
import Home from './routes/Home'
import NotFound from './routes/NotFound'
import DreamJournalPage from './routes/journal/DreamJournalPage'
import DreamFeed from './routes/dreams/DreamFeed'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { DreamPostProvider } from './context/DreamPostContext'

// Home, the journal and the feed are where people land, so they ship in the main bundle. Every
// other page is downloaded the first time it's opened, keeping the first load small on phones.
const DreamWeb = lazy(() => import('./routes/web/DreamWeb'))
const ProfilePage = lazy(() => import('./routes/profile/ProfilePage'))
const RegisterPage = lazy(() => import('./routes/auth/RegisterPage'))
const LoginPage = lazy(() => import('./routes/auth/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./routes/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./routes/auth/ResetPasswordPage'))
const NewDreamPage = lazy(() => import('./routes/dreams/NewDreamPage'))
const DreamDetailPage = lazy(() => import('./routes/dreams/DreamDetailPage'))

function App() {
  return (
    <AuthProvider>
      <DreamPostProvider>
        {/* BASE_URL is "/<repo-name>/" on GitHub Pages (see vite.config.ts) and "/" locally. */}
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <NavBar />
          <PageShell>
            {/* Shown only for the moment a lazily loaded page is downloading. */}
            <Suspense fallback={<p className="text-moon-400">Loading...</p>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
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
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </PageShell>
        </BrowserRouter>
      </DreamPostProvider>
    </AuthProvider>
  )
}

export default App
