import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";

const linkClass = ({ isActive }) =>
  `text-sm font-medium ${isActive ? "text-indigo-600" : "text-gray-600 hover:text-gray-900"}`;

export default function Navbar() {
  const { user, isAdmin, logout, loading } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-indigo-600">
          MERN Store
        </Link>

        <div className="flex items-center gap-5">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>

          <NavLink to="/products" className={linkClass}>
            Products
          </NavLink>

          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}

          <Link
            to="/cart"
            className="relative text-sm font-medium text-gray-600 hover:text-gray-900"
            aria-label={`Cart, ${itemCount} items`}
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-4 -top-2 rounded-full bg-indigo-600 px-1.5 text-xs text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {!loading &&
            (user ? (
              <>
                <NavLink to="/orders" className={linkClass}>
                  My orders
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  {user.name}Profile
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Login
                </NavLink>
                <Link
                  to="/register"
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Sign up
                </Link>
              </>
            ))}
        </div>
      </nav>
    </header>
  );
}
