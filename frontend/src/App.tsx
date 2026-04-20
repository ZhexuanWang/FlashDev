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
                <Route path="/contact"       element={<ContactPage />} />
                <Route path="/login"         element={<LoginPage />} />
                <Route
                    path="/permissions"
                    element={
                        <RequireRole role="COMPANY">
                            <PermissionsPage />
                        </RequireRole>
                    }
                />            </Routes>
        </>
    )
}