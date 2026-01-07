import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
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
