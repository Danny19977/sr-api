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
import { Container } from "react-bootstrap";

class Footer extends Component {
  render() {
    return (
      <footer className="footer px-0 px-lg-3">
        <Container fluid>
          <nav>
            {/* Footer menu removed as requested */}
            <p className="copyright text-center">
              © {new Date().getFullYear()}{" "}
              <a href="#">Creative Team</a>, made by FREELANCE_SOLUTIONS
            </p>
          </nav>
        </Container>
      </footer>
    );
  }
}

export default Footer;
