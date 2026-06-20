import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/calendar", { replace: true });
  }, [navigate]);

  return <div className="flex"></div>;
};

export default AdminPage;
