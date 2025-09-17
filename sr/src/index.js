/*!

=========================================================
* Light Bootstrap Dashboard React - v2.0.1
=========================================================

* Product Page: https://www.freelance-solutions.com/product/light-bootstrap-dashboard-react
* Copyright 2022 Freelance Solutions (https://www.freelance-solutions.com)
* Licensed under MIT (https://github.com/creativetimofficial/light-bootstrap-dashboard-react/blob/master/LICENSE.md)

* Coded by Freelance Solutions

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/css/animate.min.css";
import "./assets/scss/light-bootstrap-dashboard-react.scss?v=2.0.0";
import "./assets/css/demo.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./assets/css/mobile-navbar-fix.css"; // Load mobile fixes last to override other styles

import AdminLayout from "layouts/Admin.js";
import AuthLayout from "layouts/Auth.js";
import { AuthProvider } from "contexts/AuthContext";
import ProtectedRoute from "components/ProtectedRoute/ProtectedRoute";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <AuthProvider>
    <BrowserRouter>
      <Switch>
        <ProtectedRoute path="/admin" component={AdminLayout} />
        <Route path="/auth" render={(props) => <AuthLayout {...props} />} />
        <Route path="/login" render={(props) => <AuthLayout {...props} />} />
        <Redirect from="/" to="/login" />
      </Switch>
    </BrowserRouter>
  </AuthProvider>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful:', registration);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}
