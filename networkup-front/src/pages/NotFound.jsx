import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mb-4">Page not found</p>
      <Link to="/" className="text-blue-600 underline">
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">Go Home</button>
      </Link>
    </div>
  )
}