import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import RootPage from "./pages/Root/Root";
import Dashboard from "./pages/Dashboard/Dashboard";
import SettingsPage from "./pages/Settings/Settings";
import ProductsPage from "./pages/products/Products";
import LoginPage from "./pages/Login/Login";
import Categories from "./pages/Categories/Categories";
import CustomersPage from "./pages/Customers/Customers";
import SuppliersPage from "./pages/Suppliers/Suppliers";
import PruchasesPage from "./pages/Purchases/Purchases";
import OrdersPage from "./pages/Orders/Orders";

const router = createBrowserRouter([
  {path: '/',element: <RootPage />,children: [
    {index: true,element: <Dashboard />},
    {path: 'settings', element: <SettingsPage />},
    {path: 'products', element: <ProductsPage />},
    {path: 'categories', element: <Categories />},
    {path: 'customers', element: <CustomersPage />},
    {path: 'suppliers', element: <SuppliersPage />},
    {path: 'purchases', element: <PruchasesPage />},
    {path: 'orders', element: <OrdersPage />},
  ]},
  {path: 'login',element: <LoginPage />}
])

function App() {
  return(
    <>
      <RouterProvider router={router}/>
      <ToastContainer />
    </>
  )
}

export default App;