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
import React, { Component, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useLocation, NavLink } from "react-router-dom";

import { Nav, Collapse } from "react-bootstrap";

import logo from "assets/img/reactlogo.png";

function Sidebar({ color, image, routes }) {
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState({});
  
  const activeRoute = (routeName) => {
    return location.pathname.indexOf(routeName) > -1 ? "active" : "";
  };

  const toggleDropdown = (section) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isDropdownActive = (section) => {
    return routes.some(route => 
      route.section === section && 
      !route.heading && 
      activeRoute(route.layout + route.path) === "active"
    );
  };
  return (
    <div className="sidebar" data-image={image} data-color={color}>
      <div
        className="sidebar-background"
        style={{
          backgroundImage: "url(" + image + ")"
        }}
      />
      <div className="sidebar-wrapper">
        {/* Mobile close button */}
        <button 
          className="btn btn-sm btn-outline-light d-lg-none sidebar-close-btn"
          onClick={() => {
            document.documentElement.classList.remove("nav-open");
            const element = document.getElementById("bodyClick");
            if (element) {
              element.parentNode.removeChild(element);
            }
          }}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 5,
            borderRadius: '50%',
            width: '35px',
            height: '35px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.2)'
          }}
        >
          <i className="fas fa-times" style={{ fontSize: '14px' }}></i>
        </button>
        
        <div className="logo d-flex align-items-center justify-content-start">
          <a
            href="https://freelancesoutions.vercel.app/?ref=lbd-sidebar"
            className="simple-text logo-mini mx-1"
          >
            <div className="logo-img">
              <img src={require("assets/img/reactlogo.png")} alt="..." />
            </div>
          </a>
          <a className="simple-text" href="https://freelancesoutions.vercel.app/">
            Freelance Solutions
          </a>
        </div>
        <Nav>
          {routes.map((prop, key) => {
            // Handle section headings with dropdown capability ONLY for MANAGEMENT
            if (prop.heading) {
              // Check if this is the MANAGEMENT section and if it has dropdown items
              if (prop.section === "management") {
                const hasDropdownItems = routes.some(route => 
                  route.section === prop.section && !route.heading && !route.redirect
                );
                
                if (hasDropdownItems) {
                  return (
                    <React.Fragment key={key}>
                      <li className={`nav-section-heading ${isDropdownActive(prop.section) ? 'active' : ''}`}>
                        <div 
                          className="section-header dropdown-toggle" 
                          onClick={() => toggleDropdown(prop.section)}
                          style={{ cursor: 'pointer' }}
                        >
                          <i className={prop.icon} />
                          <span className="section-title">{prop.name}</span>
                          <i className={`nc-icon nc-minimal-${openDropdowns[prop.section] ? 'up' : 'down'} dropdown-arrow`} />
                        </div>
                      </li>
                      <Collapse in={openDropdowns[prop.section]}>
                        <div>
                          {routes
                            .filter(route => route.section === prop.section && !route.heading && !route.redirect)
                            .map((subProp, subKey) => (
                              <li
                                className={`nav-dropdown-item ${activeRoute(subProp.layout + subProp.path)}`}
                                key={`${key}-${subKey}`}
                              >
                                <NavLink
                                  to={subProp.layout + subProp.path}
                                  className="nav-link nav-dropdown-link"
                                  activeClassName="active"
                                >
                                  {subProp.name === "Account" ? (
                                    <span style={{ display: 'flex', alignItems: 'center' }}>
                                      <FaUserCircle size={22} style={{ marginRight: 8, color: '#007bff', transition: 'transform 0.2s' }} className="sidebar-profile-icon" />
                                      <span title="Your Account" style={{ fontWeight: 600, color: '#007bff' }}>{subProp.name}</span>
                                    </span>
                                  ) : (
                                    <>
                                      <i className={subProp.icon} />
                                      <p>{subProp.name}</p>
                                    </>
                                  )}
                                </NavLink>
                              </li>
                            ))
                          }
                        </div>
                      </Collapse>
                    </React.Fragment>
                  );
                }
              }
              
              // For all other sections, use the original heading style
              return (
                <li key={key} className="nav-section-heading">
                  <div className="section-header">
                    <i className={prop.icon} />
                    <span className="section-title">{prop.name}</span>
                  </div>
                </li>
              );
            }
            
            // Handle regular navigation items
            if (!prop.redirect && !prop.heading) {
              // Only hide items if they belong to the MANAGEMENT section (since it has dropdown)
              if (prop.section === "management") {
                return null; // These will be rendered in the dropdown
              }
              
              // For all other sections, show items normally
              return (
                <li
                  className={
                    prop.upgrade
                      ? "active active-pro"
                      : activeRoute(prop.layout + prop.path)
                  }
                  key={key}
                >
                  <NavLink
                    to={prop.layout + prop.path}
                    className="nav-link"
                    activeClassName="active"
                  >
                    <i className={prop.icon} />
                    <p>{prop.name}</p>
                  </NavLink>
                </li>
              );
            }
            return null;
          })}
        </Nav>
      </div>
    </div>
  );
}

export default Sidebar;
