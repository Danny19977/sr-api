/*!

=========================================================
* TeamOnSite (TOS) - Login Page
=========================================================

* Login component for authentication with backend API
* Connects to the Go Fiber backend authentication system

=========================================================

*/
import React, { useState } from "react";
import { 
  Button, 
  Card, 
  Form, 
  Container, 
  Row, 
  Col, 
  Alert,
  Spinner 
} from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../assets/css/login.css';

function Login() {
  // State management for form data and UI states
  const [formData, setFormData] = useState({
    identifier: "", // This can be email or phone (as per your backend model)
    password: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const history = useHistory();
  const { login } = useAuth();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Basic validation
      if (!formData.identifier || !formData.password) {
        throw new Error("Veuillez remplir tous les champs");
      }

      // Call the login API through auth context
      console.log("🔐 Attempting login with:", { identifier: formData.identifier });
      
      const response = await login({
        identifier: formData.identifier,
        password: formData.password
      });

      console.log("✅ Login successful:", response);

      // JWT token is now stored in localStorage by authService
      // Token expires after 72 hours (3 days)
      
      // Show success toast with user name
      const userName = response.user?.name || response.user?.email || "Utilisateur";
      toast.success(`Bienvenue dans TOS, ${userName}!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: '#28a745',
          color: 'white'
        }
      });
      
      // Redirect to dashboard after a short delay to show the toast
      setTimeout(() => {
        history.push('/admin/dashboard');
      }, 1000);
      
    } catch (err) {
      console.error("❌ Login error:", err);
      
      // Show error toast in French
      let errorMessage = "Email ou téléphone ou mot de passe incorrect";
      
      // Check for specific error messages
      if (err.message?.includes("network") || err.message?.includes("Network")) {
        errorMessage = "Erreur de connexion réseau";
      } else if (err.message?.includes("timeout")) {
        errorMessage = "Délai d'attente dépassé";
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          backgroundColor: '#dc3545',
          color: 'white'
        }
      });
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Container fluid>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col md="6" lg="4">
            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                {/* Logo/Header Section */}
                <div className="text-center mb-4">
                  <img 
                    src={require("assets/img/new_logo.png")} 
                    alt="TeamOnSite Logo" 
                    style={{ maxHeight: "80px", marginBottom: "20px" }}
                  />
                  <h2 className="text-center mb-2">Bienvenue</h2>
                  <p className="text-muted">Connectez-vous à votre compte MyPG</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="mb-3">
                    <i className="nc-icon nc-bell-55 mr-2"></i>
                    {error}
                  </Alert>
                )}

                {/* Login Form */}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email ou Téléphone</Form.Label>
                    <Form.Control
                      type="text"
                      name="identifier"
                      value={formData.identifier}
                      onChange={handleChange}
                      placeholder="Entrez votre email ou numéro de téléphone"
                      disabled={isLoading}
                      required
                    />
                    <Form.Text className="text-muted">
                      Vous pouvez utiliser votre adresse email ou votre numéro de téléphone
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Mot de passe</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Entrez votre mot de passe"
                        disabled={isLoading}
                        required
                      />
                      <Button
                        variant="link"
                        className="position-absolute"
                        style={{ 
                          right: "10px", 
                          top: "50%", 
                          transform: "translateY(-50%)",
                          border: "none",
                          background: "none",
                          padding: "0",
                          color: "#6c757d"
                        }}
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                        disabled={isLoading}
                      >
                        <i className={`nc-icon ${showPassword ? 'nc-zoom-split' : 'nc-circle-10'}`}></i>
                      </Button>
                    </div>
                  </Form.Group>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    variant="info"
                    className="w-100 mb-3"
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="mr-2"
                        />
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <i className="nc-icon nc-key-25 mr-2"></i>
                        Se connecter
                      </>
                    )}
                  </Button>

                  {/* Forgot Password Link */}
                  <div className="text-center">
                    <Button
                      variant="link"
                      className="text-muted p-0"
                      onClick={() => {
                        // You can implement forgot password functionality here
                        toast.info("La fonctionnalité de mot de passe oublié sera bientôt disponible!", {
                          position: "top-right",
                          autoClose: 3000,
                          style: {
                            backgroundColor: '#17a2b8',
                            color: 'white'
                          }
                        });
                      }}
                      disabled={isLoading}
                    >
                      Mot de passe oublié?
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default Login;
