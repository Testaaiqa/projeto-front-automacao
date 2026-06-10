import React, { useState } from 'react';

function ProgressiveBar() {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState('normal');

  const speeds = {
    slow: 100,
    normal: 50,
    fast: 20,
  };

  const startProgress = () => {
    setIsRunning(true);
    setProgress(0);
  };

  const resetProgress = () => {
    setProgress(0);
    setIsRunning(false);
  };

  React.useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsRunning(false);
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, speeds[selectedSpeed]);

    return () => clearInterval(interval);
  }, [isRunning, selectedSpeed]);

  return (
    <div className="progressive-bar-page" data-testid="progressive-bar-page">
      <div className="page-header">
        <h2 data-testid="progressive-bar-title">Barra de Progresso</h2>
        <p className="page-description">
          Teste componentes com barra de progresso animada
        </p>
      </div>

      <div className="pb-container">
        <section className="pb-section">
          <h3 data-testid="pb-demo-title">Demo - Barra de Progresso</h3>

          <div className="pb-controls">
            <div className="control-group">
              <label data-testid="speed-label">Velocidade:</label>
              <div className="speed-buttons">
                <button
                  className={`speed-btn ${selectedSpeed === 'slow' ? 'active' : ''}`}
                  onClick={() => setSelectedSpeed('slow')}
                  disabled={isRunning}
                  data-testid="speed-slow-btn"
                >
                  Lenta
                </button>
                <button
                  className={`speed-btn ${selectedSpeed === 'normal' ? 'active' : ''}`}
                  onClick={() => setSelectedSpeed('normal')}
                  disabled={isRunning}
                  data-testid="speed-normal-btn"
                >
                  Normal
                </button>
                <button
                  className={`speed-btn ${selectedSpeed === 'fast' ? 'active' : ''}`}
                  onClick={() => setSelectedSpeed('fast')}
                  disabled={isRunning}
                  data-testid="speed-fast-btn"
                >
                  Rápida
                </button>
              </div>
            </div>

            <div className="control-group">
              <button
                className="primary-action"
                onClick={startProgress}
                disabled={isRunning}
                data-testid="start-progress-btn"
              >
                {isRunning ? 'Em andamento...' : 'Iniciar'}
              </button>
              <button
                className="secondary-action"
                onClick={resetProgress}
                data-testid="reset-progress-btn"
              >
                Resetar
              </button>
            </div>
          </div>

          <div className="pb-display">
            <div className="pb-info">
              <span data-testid="progress-value">{Math.round(progress)}%</span>
            </div>
            <div className="pb-bar-container">
              <div
                className="pb-bar"
                style={{ width: `${progress}%` }}
                data-testid="progress-bar"
              ></div>
            </div>
          </div>
        </section>

        <section className="pb-section">
          <h3 data-testid="pb-examples-title">Exemplos de Uso</h3>
          <div className="pb-examples">
            <div className="example">
              <p>Exemplo 1: Progresso indeterminado</p>
              <div className="pb-bar-container">
                <div className="pb-bar indeterminate"></div>
              </div>
            </div>

            <div className="example">
              <p>Exemplo 2: Progresso com cores</p>
              <div className="pb-bar-container">
                <div className="pb-bar warning" style={{ width: '45%' }}></div>
              </div>
              <div className="pb-bar-container">
                <div className="pb-bar success" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="example">
              <p>Exemplo 3: Multi-progresso</p>
              <div className="pb-bar-container multi">
                <div className="pb-bar primary" style={{ width: '30%' }}></div>
                <div className="pb-bar warning" style={{ width: '30%' }}></div>
                <div className="pb-bar success" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProgressiveBar;
