import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import "react-responsive-carousel/lib/styles/carousel.min.css";


// components
import Shops from "./components/Shops.jsx";
import ShopDetail from "./components/ShopDetail.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import Checkout from "./components/Checkout.jsx";
import OrderSuccess from "./components/OrderSuccess.jsx";

// Context providers
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Admin
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import ShopsAdmin from "./components/admin/ShopsAdmin";
import PromosAdmin from "./components/admin/PromosAdmin";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Shops /> },
      { path: "/shops/:id", element: <ShopDetail /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/order/success", element: <OrderSuccess /> },

      //  ADMIN ROUTES
      {
        path: "/admin",
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
        children: [
          { path: "shops", element: <ShopsAdmin /> },
          { path: "promos", element: <PromosAdmin /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/*  MUST BE AuthProvider (correct spelling) */}
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);
