import React from 'react';
import { Navigate } from 'react-router-dom';

export const AuthRoleGateway = () => {
  return <Navigate to="/staff/login" replace />;
};
