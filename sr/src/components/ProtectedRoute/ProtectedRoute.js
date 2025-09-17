/*!

=========================================================
* TeamOnSite (TOS) - Protected Route
=========================================================

* Component to protect routes that require authentication
* Redirects to login if user is not authenticated

=========================================================

*/
import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, Container, Row, Col } from 'react-bootstrap';

const ProtectedRoute = ({ component: Component, ...rest }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Container fluid className="d-flex align-items-center justify-content-center min-vh-100">
        <Row>
          <Col className="text-center">
            <Spinner animation="border" variant="info" className="mb-3" />
            <p className="text-muted">Checking authentication...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
};

export default ProtectedRoute;
