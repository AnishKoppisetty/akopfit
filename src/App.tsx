import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Nutrition from './pages/Nutrition'
import Training from './pages/Training'
import Progress from './pages/Progress'
import CheckIn from './pages/CheckIn'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/training" element={<Training />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  )
}
