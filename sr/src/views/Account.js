import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userLogsService } from '../services/apiServices';
import { Card, CardBody, CardTitle, CardText, Table } from 'reactstrap';
import { FaUserCircle } from 'react-icons/fa';

const Account = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function fetchLogs() {
      if (user && user.uuid) {
        try {
          const res = await userLogsService.getByUserUUID(user.uuid, { limit: 20 });
          setLogs(res.data || []);
        } catch (err) {
          setLogs([]);
        }
      }
    }
    fetchLogs();
  }, [user]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="account-page">
      <Card className="mb-4">
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FaUserCircle size={64} style={{ marginRight: 16 }} />
            <div>
              <CardTitle tag="h3">{user.name || user.username}</CardTitle>
              <CardText>Email: {user.email}</CardText>
              <CardText>Role: {user.role}</CardText>
              {/* Add more user info as needed */}
            </div>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <CardTitle tag="h4">Activity Log</CardTitle>
          <Table responsive>
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan="3">No activity found.</td></tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={idx}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.action}</td>
                    <td>{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
};

export default Account;
