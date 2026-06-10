import React, { useEffect, useMemo, useState } from 'react';

const SPEED_OPTIONS = {
  slow: {
    label: 'Lenta',
    interval: 220,
    step: 1,
  },
  normal: {
    label: 'Normal',
    interval: 140,
    step: 2,
  },
  fast: {
    label: 'Rapida',
    interval: 80,
    step: 3,
  },
};

const STATUS_LABELS = {
  idle: 'Pronto',
  running: 'Executando',
  paused: 'Pausado',
  completed: 'Concluido',
};

function ProgressiveBar() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [selectedSpeed, setSelectedSpeed] = useState('normal');
  const [workload, setWorkload] = useState(50);
  const [cycles, setCycles] = useState(0);

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = progress >= 100;
  const roundedProgress = Math.min(100, Math.round(progress));
  const remainingProgress = Math.max(0, 100 - roundedProgress);

  const currentSpeed = SPEED_OPTIONS[selectedSpeed];
  const workloadImpact = useMemo(() => Math.max(1, Math.round(workload / 25)), [workload]);

  function startProgress() {
    if (isCompleted) {
      setProgress(0);
      setCycles(0);
    }

    setStatus('running');
  }

  function pauseProgress() {
    setStatus('paused');
  }

  function resumeProgress() {
    setStatus('running');
  }

  function restartProgress() {
    setProgress(0);
    setCycles(0);
    setStatus('idle');
  }

  function handleWorkloadChange(event) {
    setWorkload(Number(event.target.value));
  }

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const interval = setInterval(() => {
      setProgress((currentProgress) => {
        const nextProgress = Math.min(100, currentProgress + currentSpeed.step + workloadImpact);

        if (nextProgress >= 100) {
          setStatus('completed');
        }

        return nextProgress;
      });

      setCycles((currentCycles) => currentCycles + 1);
    }, currentSpeed.interval);

    return () => clearInterval(interval);
  }, [currentSpeed.interval, currentSpeed.step, isRunning, workloadImpact]);

  const milestones = [25, 50, 75, 100].map((value) => ({
    value,
    done: roundedProgress >= value,
  }));

  return (
    <div className="progressive-bar-page" data-testid="progressive-bar-page">
      <div className="page-header">
        <div>
          <h2 data-testid="progressive-bar-title">Barra de Progresso</h2>
          <p className="page-description">Controle uma execucao com inicio, pausa, retomada e recomeco.</p>
        </div>
      </div>

      <div className="pb-container">
        <section className="pb-section pb-main-panel" data-testid="pb-main-panel">
          <div className="pb-panel-heading">
            <div>
              <h3 data-testid="pb-demo-title">Execucao da Barra</h3>
              <span className={`pb-status ${status}`} data-testid="progress-status">
                {STATUS_LABELS[status]}
              </span>
            </div>
            <div className="pb-counter" data-testid="progress-value">
              {roundedProgress}%
            </div>
          </div>

          <div className="pb-display">
            <div className="pb-bar-container" aria-label={`Progresso em ${roundedProgress}%`}>
              <div
                className={`pb-bar ${status}`}
                style={{ width: `${roundedProgress}%` }}
                data-testid="progress-bar"
              />
            </div>
            <div className="pb-progress-meta">
              <span data-testid="remaining-progress">Faltam {remainingProgress}%</span>
              <span data-testid="cycle-counter">{cycles} ciclos</span>
            </div>
          </div>

          <div className="pb-controls">
            <div className="control-group pb-actions" data-testid="progress-actions">
              <button
                className="primary-action"
                onClick={startProgress}
                disabled={isRunning}
                data-testid="start-progress-btn"
              >
                {isCompleted ? 'Iniciar novamente' : progress > 0 ? 'Continuar' : 'Start'}
              </button>
              <button
                className="secondary-action"
                onClick={isPaused ? resumeProgress : pauseProgress}
                disabled={!progress || isCompleted}
                data-testid="pause-progress-btn"
              >
                {isPaused ? 'Continuar' : 'Pausar'}
              </button>
              <button className="secondary-action" onClick={restartProgress} data-testid="reset-progress-btn">
                Recomecar
              </button>
            </div>

            <div className="control-group">
              <label data-testid="speed-label">Velocidade</label>
              <div className="speed-buttons" role="group" aria-label="Velocidade da barra">
                {Object.entries(SPEED_OPTIONS).map(([key, option]) => (
                  <button
                    key={key}
                    className={`speed-btn ${selectedSpeed === key ? 'active' : ''}`}
                    onClick={() => setSelectedSpeed(key)}
                    disabled={isRunning}
                    data-testid={`speed-${key}-btn`}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="pb-slider-control" data-testid="workload-label">
              Volume de carga
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={workload}
                onChange={handleWorkloadChange}
                disabled={isRunning}
                data-testid="workload-slider"
              />
              <span data-testid="workload-value">{workload}%</span>
            </label>
          </div>
        </section>

        <section className="pb-section" data-testid="pb-milestones-section">
          <h3 data-testid="pb-examples-title">Marcos da Execucao</h3>
          <div className="pb-milestones">
            {milestones.map((milestone) => (
              <div
                key={milestone.value}
                className={`pb-milestone ${milestone.done ? 'done' : ''}`}
                data-testid={`milestone-${milestone.value}`}
              >
                <span>{milestone.value}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-section">
          <h3>Indicadores de Volume</h3>
          <div className="pb-volume-grid">
            <div className="pb-volume-item">
              <span className="pb-volume-label">Carga processada</span>
              <strong data-testid="processed-load">{Math.round((roundedProgress * workload) / 100)} unidades</strong>
            </div>
            <div className="pb-volume-item">
              <span className="pb-volume-label">Capacidade maxima</span>
              <strong>{workload} unidades</strong>
            </div>
            <div className="pb-volume-item">
              <span className="pb-volume-label">Passo atual</span>
              <strong>{currentSpeed.step + workloadImpact}% por ciclo</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProgressiveBar;
