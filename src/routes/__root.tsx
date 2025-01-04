import {
  Link,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { AuthContext } from "../hooks/useAuth";

type RouterContext = {
  authentication: AuthContext;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <h1>My App</h1>
      <ul>
        <li>
          <Link to="/">
            Home
          </Link>
        </li>
  
        <li>
          <Link to="/login" >
            Login
          </Link>
        </li>

  
      </ul>
      <Outlet />
    </>
  ),
});