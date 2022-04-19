import { createRoot } from 'react-dom/client'
import App from '../App'

const root = createRoot(global.document.getElementById('app'))

root.render(<App />)
