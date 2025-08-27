import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
  return (props) => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(null); // null = not checked yet

    useEffect(() => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
      } else {
        setIsAuthenticated(true);
      }
    }, [navigate]);

    if (isAuthenticated === null) {
      // You can return a loader/spinner here if you want
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
