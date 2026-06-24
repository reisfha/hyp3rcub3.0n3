export default function NotFound() {
  return (
    <div className="page not-found-page">
      <div className="not-found-container">
        <div className="not-found-gif">
          <img 
            src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZG1qcjR6dnU4NWZjdHBmNzJhc3k4ZDQwOHhvcTYzbnZtcWd5d3ZmdCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/DZR39sOOQWP8A7UoVs/giphy.gif"
            alt="404 Error"
            className="gif-404"
          />
        </div>
        <div className="not-found-content">
          <h1 className="error-code">404</h1>
          <h2>Page Not Found</h2>
          <p className="error-message">
            Looks like you've ventured into uncharted territory in the digital realm.
          </p>
          <p className="error-hint">
            This page doesn't exist, but there are plenty of games waiting for you!
          </p>
          <div className="not-found-actions">
            <a href="/" className="btn-primary">🏠 Return Home</a>
            <a href="/games" className="btn-secondary">🎮 Browse Games</a>
          </div>
        </div>
      </div>
    </div>
  );
}
