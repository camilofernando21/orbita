import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import Catalogo from './pages/Catalogo';
import Observatorio from './pages/Observatorio';
import DetalheEstrela from './pages/DetalheEstrela';
import NovaEstrela from './pages/NovaEstrela';
import EditarEstrela from './pages/EditarEstrela';
import NaoEncontrada from './pages/NaoEncontrada';

// Rotas da aplicação
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Inicio /> },
      { path: 'catalogo', element: <Catalogo /> },
      { path: 'observatorio', element: <Observatorio /> },
      { path: 'nova', element: <NovaEstrela /> },
      { path: 'estrela/:id', element: <DetalheEstrela /> },
      { path: 'estrela/:id/editar', element: <EditarEstrela /> },
      { path: '*', element: <NaoEncontrada /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
