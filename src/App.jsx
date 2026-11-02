
import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5001/api';

function App() {
    const [connection, setConnection] = useState({
        loading: true,
        connected: false,
        hubId: null
    });

    const [message, setMessage] = useState('');

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
                hubId: data.hubId
            });
        } catch (error) {
            console.error(error);

            setConnection({
                loading: false,
                connected: false,
                hubId: null
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

        // Remove OAuth query parameters
        if (params.has('hubspot')) {
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
    }, []);

    const connectHubSpot = () => {
        window.location.assign(
            `${API_URL}/auth/hubspot`
        );
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
