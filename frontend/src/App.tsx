import { Routes, Route, Navigate } from 'react-router-dom'
import { EditorToolbar }  from './components/editor/EditorToolbar'
import SplashPage         from './pages/SplashPage'
import HomePage           from './pages/HomePage'
import ProjectsPage       from './pages/ProjectsPage'
import ProjectDetailPage  from './pages/ProjectDetailPage'
import ContactPage        from './pages/ContactPage'
import LoginPage          from './pages/LoginPage'
import ServicesPage       from './pages/ServicesPage'
import TeamPage           from './pages/TeamPage'
import BlogsPage          from './pages/BlogsPage'
import BlogDetailPage     from './pages/BlogDetailPage'
import MarketPage         from './pages/MarketPage'
import ForumPage          from './pages/ForumPage'
import ForumDetailPage    from './pages/ForumDetailPage'
import ProfilePage        from './pages/ProfilePage'
import PermissionsPage from './pages/PermissionsPage'
import RequireRole from './components/RequireRole'
import { useTheme } from './hooks/useTheme'

export default function App() {
    useTheme()

    return (
        <>
            <EditorToolbar />
            <Routes>
                <Route path="/"              element={<Navigate to="/splash" replace />} />
                <Route path="/splash"        element={<SplashPage />} />
                <Route path="/home"          element={<HomePage />} />
                <Route path="/projects"      element={<ProjectsPage />} />
                <Route path="/projects/:id"  element={<ProjectDetailPage />} />
                <Route path="/services"      element={<ServicesPage />} />
                <Route path="/team"          element={<TeamPage />} />
                <Route path="/blogs"         element={<BlogsPage />} />
                <Route path="/blogs/:id"     element={<BlogDetailPage />} />
                <Route path="/market"         element={<MarketPage />} />
                <Route path="/forum"         element={<ForumPage />} />
                <Route path="/forum/posts/:id" element={<ForumDetailPage />} />
                <Route path="/contact"       element={<ContactPage />} />
                <Route path="/login"         element={<LoginPage />} />
                <Route path="/profile"        element={<ProfilePage />} />
                <Route
                    path="/permissions"
                    element={
                        <RequireRole role="COMPANY">
                            <PermissionsPage />
                        </RequireRole>
                    }
                />
            </Routes>
        </>
    )
}