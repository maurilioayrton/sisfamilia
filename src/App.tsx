
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './router'

// Declarar __BASE_PATH__ como variável global
declare const __BASE_PATH__: string;

function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
