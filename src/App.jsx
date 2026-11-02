
import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5001/api';

function App() {
    const [connection, setConnection] = useState({
        loading: true,
        connected: false,
        hubId: null,
        expiresAt: null
    });

    const [message, setMessage] = useState('');
    const [processing, setProcessing] = useState(false);

    const checkConnection = async () => {
        try {
            const response = await fetch(
                `${API_URL}/auth/status`,
                { credentials: 'include' }
            );

            const data = await response.json();

            setConnection({
                loading: false,
                connected: data.connected,
                hubId: data.hubId,
                expiresAt: data.expiresAt
            });
        } catch (error) {
            console.error(error);

            setConnection({
                loading: false,
                connected: false,
                hubId: null,
                expiresAt: null
            });
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        if (params.get('hubspot') === 'connected') {
            setMessage('HubSpot connected successfully!');
        } else if (params.get('hubspot') === 'error') {
            setMessage('HubSpot connection failed.');
        } else if (params.get('hubspot') === 'denied') {
            setMessage('HubSpot authorization was denied.');
        }

        checkConnection();

        if (params.has('hubspot')) {
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
    }, []);

    const connectHubSpot = () => {
        window.location.assign(`${API_URL}/auth/hubspot`);
    };

    const refreshToken = async () => {
        setProcessing(true);
        setMessage('');

        try {
            const response = await fetch(
                `${API_URL}/auth/refresh`,
                {
                    method: 'POST',
                    credentials: 'include'
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setMessage(data.message);
            await checkConnection();

        } catch (error) {
            setMessage(error.message);
        } finally {
            setProcessing(false);
        }
    };

    const disconnectHubSpot = async () => {
        setProcessing(true);
        setMessage('');

        try {
            const response = await fetch(
                `${API_URL}/auth/disconnect`,
                {
                    method: 'POST',
                    credentials: 'include'
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setMessage(data.message);
            await checkConnection();

        } catch (error) {
            setMessage(error.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div style={{ padding: '40px', fontFamily: 'Arial' }}>
            <h1>HubSpot Integration Practice</h1>

            <h2>OAuth 2.0 Authentication</h2>

            {message && <p>{message}</p>}

            {connection.loading ? (
                <p>Checking connection...</p>
            ) : connection.connected ? (
                <div>
                    <p style={{ color: 'green' }}>
                        Connected to HubSpot
                    </p>

                    <p>Hub ID: {connection.hubId}</p>

                    <p>
                        Token expires:{' '}
                        {connection.expiresAt
                            ? new Date(
                                connection.expiresAt
                            ).toLocaleString()
                            : 'Unknown'}
                    </p>

                    <button
                        onClick={refreshToken}
                        disabled={processing}
                    >
                        Refresh Access Token
                    </button>

                    {' '}

                    <button
                        onClick={disconnectHubSpot}
                        disabled={processing}
                    >
                        Disconnect HubSpot
                    </button>
                </div>
            ) : (
                <button onClick={connectHubSpot}>
                    Connect HubSpot
                </button>
            )}
        </div>
    );
}

export default App;
