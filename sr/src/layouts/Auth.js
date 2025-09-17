/*!

=========================================================
* TeamOnSite (TOS) - Auth Layout
=========================================================

* Layout component for authentication pages (login, register, etc.)
* This layout doesn't include sidebar or main navigation

=========================================================

*/
import React from "react";
import { Route, Switch } from "react-router-dom";

// Import auth-specific styles
import "../assets/css/login.css";

// Import auth pages
import Login from "views/Login";

function AuthLayout() {
  return (
    <div className="auth-layout">
      <Switch>
        <Route path="/auth/login" component={Login} />
        {/* Add other auth routes here like register, forgot-password */}
        <Route path="/" component={Login} />
      </Switch>
    </div>
  );
}

export default AuthLayout;
