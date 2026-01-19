import { Routes, Route } from 'react-router-dom'
import { CareerPathPage } from '@/pages/CareerPathPage'
import { RoleRequirementPage } from '@/pages/RoleRequirementPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/career-paths" element={<CareerPathPage />} />
        <Route path="/career-paths/:roleId" element={<RoleRequirementPage />} />
      </Routes>
    </div>
  )
}

function HomePage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold">SpringAIS</h1>
      <p className="text-lg mt-4">AI-powered talent mobility platform</p>
    </div>
  )
}

function LoginPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold">Login</h1>
    </div>
  )
}

export default App
