import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/user/events", { replace: true });
  }, [navigate]);

  return <div className="flex"></div>;
};

export default UserPage;
