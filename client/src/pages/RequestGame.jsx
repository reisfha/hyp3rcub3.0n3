import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestGame } from '../api/client';

export default function RequestGame() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await requestGame({ url });
      setSubmitted(true);
      setUrl('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request');
    }
  };

  if (!user) {
    return (
      <div className="page request-page">
        <h1>Request a Game</h1>
        <p>Please <a href="/login">log in</a> to request a game.</p>
      </div>
    );
  }

  return (
    <div className="page request-page">
      <h1>Request a Game</h1>
      <p>Submit a URL and we'll consider adding it to our collection.</p>
      {submitted ? (
        <div className="request-success">
          <p>Your request has been submitted! We'll review it soon.</p>
          <button className="btn-primary" onClick={() => setSubmitted(false)}>Submit Another</button>
        </div>
      ) : (
        <form className="request-form" onSubmit={handleSubmit}>
          <input
            type="url"
            placeholder="https://example.com/game"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Submit Request</button>
          {error && <p className="error-text">{error}</p>}
        </form>
      )}
    </div>
  );
}
