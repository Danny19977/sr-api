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
import React, { Component } from "react";
import { useLocation, Route, Switch } from "react-router-dom";

import AdminNavbar from "components/Navbars/AdminNavbar";
import Footer from "components/Footer/Footer";
import Sidebar from "components/Sidebar/Sidebar";
import FixedPlugin from "components/FixedPlugin/FixedPlugin.js";
import ResponsiveTestIndicator from "components/ResponsiveTestIndicator";

import routes from "routes.js";

import sidebarImage from "assets/img/sidebar-3.jpg";
import InstallPWAButton from "components/InstallPWAButton";

function Admin() {
  const [image, setImage] = React.useState(sidebarImage);
  const [color, setColor] = React.useState("black");
  const [hasImage, setHasImage] = React.useState(true);
  const location = useLocation();
  const mainPanel = React.useRef(null);
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route
            path={prop.layout + prop.path}
            render={(props) => <prop.component {...props} />}
            key={key}
          />
        );
      } else {
        return null;
      }
    });
  };
  React.useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    mainPanel.current.scrollTop = 0;
    if (
      window.innerWidth < 993 &&
      document.documentElement.className.indexOf("nav-open") !== -1
    ) {
      document.documentElement.classList.toggle("nav-open");
      var element = document.getElementById("bodyClick");
      element.parentNode.removeChild(element);
    }
  }, [location]);
  return (
    <>
      {/* Test indicator to show responsive status */}
      <ResponsiveTestIndicator />
      
      <div className="wrapper">
        {/* Mobile menu toggle button - only visible on small screens */}
        <button 
          className="btn btn-primary d-lg-none mobile-menu-toggle"
          onClick={() => {
            document.documentElement.classList.toggle("nav-open");
            var node = document.createElement("div");
            node.id = "bodyClick";
            node.onclick = function () {
              this.parentElement.removeChild(this);
              document.documentElement.classList.toggle("nav-open");
            };
            document.body.appendChild(node);
          }}
          style={{
            position: 'fixed',
            top: '15px',
            left: '15px',
            zIndex: 9999,
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <i className="fas fa-bars"></i>
        </button>
        
        <Sidebar color={color} image={hasImage ? image : ""} routes={routes} />
        <div className="main-panel" ref={mainPanel}>
          <AdminNavbar />
          <div className="content">
            <Switch>{getRoutes(routes)}</Switch>
          </div>
          <Footer />
        </div>
      </div>
      <FixedPlugin
        hasImage={hasImage}
        setHasImage={() => setHasImage(!hasImage)}
        color={color}
        setColor={(color) => setColor(color)}
        image={image}
        setImage={(image) => setImage(image)}
      />
    <InstallPWAButton />
    </>
  );
}

export default Admin;
