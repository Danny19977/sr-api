import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, Spinner } from 'react-bootstrap';
import { territoryService } from '../services/apiServices';

const ApiDebugger = () => {
  const [apiStatus, setApiStatus] = useState({
    loading: true,
    connected: false,
    error: null,
    data: null
  });

  const testApiConnection = async () => {
    setApiStatus({ loading: true, connected: false, error: null, data: null });
    
    try {
      console.log('Testing API connection to:', process.env.REACT_APP_API_BASE_URL);
      
      // Test the countries endpoint
      const response = await territoryService.countries.getAllPaginated(1, 5);
      
      setApiStatus({
        loading: false,
        connected: true,
        error: null,
        data: response
      });
      
      console.log('API Response:', response);
    } catch (error) {
      console.error('API Error:', error);
      
      setApiStatus({
        loading: false,
        connected: false,
        error: error.message,
        data: null
      });
    }
  };

  useEffect(() => {
    testApiConnection();
  }, []);

  return (
    <Card className="mb-3">
      <Card.Header>
        <h5>🔧 API Connection Debug</h5>
        <small className="text-muted">
          API Base URL: {process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api'}
        </small>
      </Card.Header>
      <Card.Body>
        {apiStatus.loading && (
          <div className="text-center">
            <Spinner animation="border" size="sm" className="mr-2" />
            Testing API connection...
          </div>
        )}
        
        {!apiStatus.loading && apiStatus.connected && (
          <Alert variant="success">
            ✅ API connection successful!
            <br />
            <small>Countries found: {apiStatus.data?.data?.length || 0}</small>
            <br />
            <details>
              <summary style={{cursor: 'pointer', color: '#007bff'}}>🔍 Show API Response Data</summary>
              <pre style={{fontSize: '11px', marginTop: '10px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', maxHeight: '200px', overflow: 'auto'}}>
                {JSON.stringify(apiStatus.data, null, 2)}
              </pre>
            </details>
          </Alert>
        )}
        
        {!apiStatus.loading && !apiStatus.connected && (
          <Alert variant="danger">
            ❌ API connection failed!
            <br />
            <strong>Error:</strong> {apiStatus.error}
            <br />
            <br />
            <strong>Possible solutions:</strong>
            <ul className="mb-0">
              <li>Make sure your backend server is running on port 8000</li>
              <li>Check if the API base URL in .env is correct</li>
              <li>Verify CORS settings on your backend</li>
              <li>Check if authentication is required</li>
            </ul>
          </Alert>
        )}
        
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={testApiConnection}
          disabled={apiStatus.loading}
        >
          🔄 Test Again
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ApiDebugger;
