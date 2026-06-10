import React, { useMemo, useState } from 'react';

const INITIAL_ROWS = [
  {
    id: 'QA-1001',
    client: 'Acme Bank',
    owner: 'Marina Costa',
    category: 'Regression',
    priority: 'Alta',
    status: 'Em execucao',
    coverage: 87,
    defects: 3,
    updatedAt: '2026-06-09',
  },
  {
    id: 'QA-1002',
    client: 'Nova Retail',
    owner: 'Pedro Lima',
    category: 'Checkout',
    priority: 'Critica',
    status: 'Bloqueado',
    coverage: 52,
    defects: 9,
    updatedAt: '2026-06-08',
  },
  {
    id: 'QA-1003',
    client: 'Health Plus',
    owner: 'Bianca Alves',
    category: 'API',
    priority: 'Media',
    status: 'Concluido',
    coverage: 100,
    defects: 0,
    updatedAt: '2026-06-07',
  },
  {
    id: 'QA-1004',
    client: 'Educa Lab',
    owner: 'Rafael Nunes',
    category: 'Mobile',
    priority: 'Baixa',
    status: 'Planejado',
    coverage: 18,
    defects: 1,
    updatedAt: '2026-06-06',
  },
  {
    id: 'QA-1005',
    client: 'Seguro Max',
    owner: 'Camila Rocha',
    category: 'Security',
    priority: 'Critica',
    status: 'Em execucao',
    coverage: 73,
    defects: 5,
    updatedAt: '2026-06-05',
  },
  {
    id: 'QA-1006',
    client: 'LogiTrack',
    owner: 'Andre Santos',
    category: 'Performance',
    priority: 'Alta',
    status: 'Concluido',
    coverage: 96,
    defects: 2,
    updatedAt: '2026-06-04',
  },
  {
    id: 'QA-1007',
    client: 'Food Express',
    owner: 'Lais Martins',
    category: 'Checkout',
    priority: 'Media',
    status: 'Planejado',
    coverage: 34,
    defects: 0,
    updatedAt: '2026-06-03',
  },
  {
    id: 'QA-1008',
    client: 'Cloud Ops',
    owner: 'Igor Freitas',
    category: 'API',
    priority: 'Alta',
    status: 'Bloqueado',
    coverage: 61,
    defects: 7,
    updatedAt: '2026-06-02',
  },
  {
    id: 'QA-1009',
    client: 'FinPay',
    owner: 'Nadia Melo',
    category: 'Security',
    priority: 'Critica',
    status: 'Em execucao',
    coverage: 81,
    defects: 4,
    updatedAt: '2026-06-01',
  },
  {
    id: 'QA-1010',
    client: 'Market Hub',
    owner: 'Joao Barros',
    category: 'Regression',
    priority: 'Baixa',
    status: 'Concluido',
    coverage: 92,
    defects: 1,
    updatedAt: '2026-05-31',
  },
  {
    id: 'QA-1011',
    client: 'Travel Now',
    owner: 'Sofia Vieira',
    category: 'Mobile',
    priority: 'Media',
    status: 'Em execucao',
    coverage: 66,
    defects: 2,
    updatedAt: '2026-05-30',
  },
  {
    id: 'QA-1012',
    client: 'Data Core',
    owner: 'Lucas Prado',
    category: 'Performance',
    priority: 'Alta',
    status: 'Planejado',
    coverage: 25,
    defects: 0,
    updatedAt: '2026-05-29',
  },
];

const STATUS_OPTIONS = ['Todos', 'Planejado', 'Em execucao', 'Bloqueado', 'Concluido'];
const CATEGORY_OPTIONS = ['Todas', 'Regression', 'Checkout', 'API', 'Mobile', 'Security', 'Performance'];
const PAGE_SIZE_OPTIONS = [5, 8, 12];

function sortRows(rows, sortConfig) {
  return [...rows].sort((first, second) => {
    const firstValue = first[sortConfig.key];
    const secondValue = second[sortConfig.key];

    if (firstValue === secondValue) {
      return 0;
    }

    const result = firstValue > secondValue ? 1 : -1;
    return sortConfig.direction === 'asc' ? result : -result;
  });
}

function Tables() {
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery = [row.id, row.client, row.owner, row.category, row.priority, row.status]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesStatus = statusFilter === 'Todos' || row.status === statusFilter;
      const matchesCategory = categoryFilter === 'Todas' || row.category === categoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, query, rows, statusFilter]);

  const sortedRows = useMemo(() => sortRows(filteredRows, sortConfig), [filteredRows, sortConfig]);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const visibleIds = pageRows.map((row) => row.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const selectedRows = rows.filter((row) => selectedIds.includes(row.id));
  const averageCoverage = rows.length
    ? Math.round(rows.reduce((total, row) => total + row.coverage, 0) / rows.length)
    : 0;
  const openDefects = rows.reduce((total, row) => total + row.defects, 0);

  function resetPage() {
    setCurrentPage(1);
  }

  function updateQuery(event) {
    setQuery(event.target.value);
    resetPage();
  }

  function updateStatusFilter(event) {
    setStatusFilter(event.target.value);
    resetPage();
  }

  function updateCategoryFilter(event) {
    setCategoryFilter(event.target.value);
    resetPage();
  }

  function updatePageSize(event) {
    setPageSize(Number(event.target.value));
    resetPage();
  }

  function changeSort(key) {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  function toggleRowSelection(rowId) {
    setSelectedIds((current) =>
      current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId],
    );
  }

  function toggleVisibleSelection() {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  function updateRowStatus(rowId, nextStatus) {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, status: nextStatus, updatedAt: '2026-06-10' } : row)),
    );
  }

  function applyBulkStatus(nextStatus) {
    setRows((current) =>
      current.map((row) => (selectedIds.includes(row.id) ? { ...row, status: nextStatus, updatedAt: '2026-06-10' } : row)),
    );
  }

  function clearFilters() {
    setQuery('');
    setStatusFilter('Todos');
    setCategoryFilter('Todas');
    setCurrentPage(1);
  }

  function resetTable() {
    setRows(INITIAL_ROWS);
    setSelectedIds([]);
    setExpandedId(null);
    clearFilters();
  }

  return (
    <div className="tables-page" data-testid="tables-page">
      <div className="page-header">
        <div>
          <h2 data-testid="tables-title">Tabelas</h2>
          <p className="page-description">Manipule dados com filtros, ordenacao, paginacao e acoes em lote.</p>
        </div>
      </div>

      <section className="table-kpi-grid" data-testid="table-kpi-grid">
        <div className="table-kpi-card">
          <span>Total de registros</span>
          <strong data-testid="table-total-rows">{rows.length}</strong>
        </div>
        <div className="table-kpi-card">
          <span>Selecionados</span>
          <strong data-testid="table-selected-count">{selectedIds.length}</strong>
        </div>
        <div className="table-kpi-card">
          <span>Cobertura media</span>
          <strong data-testid="table-average-coverage">{averageCoverage}%</strong>
        </div>
        <div className="table-kpi-card">
          <span>Defeitos abertos</span>
          <strong data-testid="table-open-defects">{openDefects}</strong>
        </div>
      </section>

      <section className="data-table-panel">
        <div className="table-toolbar" data-testid="table-toolbar">
          <label>
            Buscar
            <input
              value={query}
              onChange={updateQuery}
              placeholder="Cliente, responsavel, status..."
              data-testid="table-search-input"
            />
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={updateStatusFilter} data-testid="table-status-filter">
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categoria
            <select value={categoryFilter} onChange={updateCategoryFilter} data-testid="table-category-filter">
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            Linhas
            <select value={pageSize} onChange={updatePageSize} data-testid="table-page-size-select">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-action" type="button" onClick={clearFilters} data-testid="table-clear-filters-btn">
            Limpar filtros
          </button>
        </div>

        <div className="bulk-actions" data-testid="table-bulk-actions">
          <span>{selectedIds.length} selecionado(s)</span>
          <button
            className="secondary-action"
            type="button"
            onClick={() => applyBulkStatus('Em execucao')}
            disabled={!selectedIds.length}
            data-testid="bulk-running-btn"
          >
            Marcar em execucao
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={() => applyBulkStatus('Concluido')}
            disabled={!selectedIds.length}
            data-testid="bulk-done-btn"
          >
            Concluir selecionados
          </button>
          <button className="secondary-action" type="button" onClick={resetTable} data-testid="table-reset-btn">
            Restaurar dados
          </button>
        </div>

        <div className="data-table-scroll">
          <table className="data-table" data-testid="qa-data-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleVisibleSelection}
                    aria-label="Selecionar linhas visiveis"
                    data-testid="select-visible-rows"
                  />
                </th>
                {[
                  ['id', 'ID'],
                  ['client', 'Cliente'],
                  ['owner', 'Responsavel'],
                  ['category', 'Categoria'],
                  ['priority', 'Prioridade'],
                  ['status', 'Status'],
                  ['coverage', 'Cobertura'],
                  ['defects', 'Defeitos'],
                  ['updatedAt', 'Atualizado'],
                ].map(([key, label]) => (
                  <th key={key}>
                    <button
                      className="sort-button"
                      type="button"
                      onClick={() => changeSort(key)}
                      data-testid={`sort-${key}-btn`}
                    >
                      {label}
                      <span>{sortConfig.key === key ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}</span>
                    </button>
                  </th>
                ))}
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr data-testid={`table-row-${row.id}`}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleRowSelection(row.id)}
                        aria-label={`Selecionar ${row.id}`}
                        data-testid={`select-row-${row.id}`}
                      />
                    </td>
                    <td>{row.id}</td>
                    <td>{row.client}</td>
                    <td>{row.owner}</td>
                    <td>{row.category}</td>
                    <td>
                      <span className={`priority-badge ${row.priority.toLowerCase()}`}>{row.priority}</span>
                    </td>
                    <td>
                      <select
                        className="status-select"
                        value={row.status}
                        onChange={(event) => updateRowStatus(row.id, event.target.value)}
                        data-testid={`status-select-${row.id}`}
                      >
                        {STATUS_OPTIONS.filter((status) => status !== 'Todos').map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="coverage-cell">
                        <span>{row.coverage}%</span>
                        <div className="coverage-track">
                          <div className="coverage-fill" style={{ width: `${row.coverage}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>{row.defects}</td>
                    <td>{row.updatedAt}</td>
                    <td>
                      <button
                        className="secondary-action compact-action"
                        type="button"
                        onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                        data-testid={`expand-row-${row.id}`}
                      >
                        {expandedId === row.id ? 'Ocultar' : 'Detalhes'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === row.id && (
                    <tr className="expanded-row" data-testid={`expanded-row-${row.id}`}>
                      <td colSpan="11">
                        <div className="expanded-content">
                          <strong>{row.client}</strong>
                          <span>Suite: {row.category}</span>
                          <span>Responsavel: {row.owner}</span>
                          <span>Risco: {row.priority}</span>
                          <span>Resumo: {row.defects} defeito(s), {row.coverage}% de cobertura.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {!pageRows.length && (
                <tr>
                  <td colSpan="11" className="empty-table-state" data-testid="empty-table-state">
                    Nenhum registro encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination" data-testid="table-pagination">
          <span data-testid="table-page-indicator">
            Pagina {safePage} de {totalPages}
          </span>
          <div>
            <button
              className="secondary-action"
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safePage === 1}
              data-testid="previous-page-btn"
            >
              Anterior
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safePage === totalPages}
              data-testid="next-page-btn"
            >
              Proxima
            </button>
          </div>
        </div>
      </section>

      <section className="table-test-hints" data-testid="table-test-hints">
        <h3>Cenarios que este modulo cobre</h3>
        <div>
          <span>Busca textual</span>
          <span>Filtro combinado</span>
          <span>Ordenacao por coluna</span>
          <span>Paginacao</span>
          <span>Selecao em massa</span>
          <span>Alteracao inline</span>
          <span>Estado vazio</span>
          <span>Detalhe expansivel</span>
        </div>
      </section>
    </div>
  );
}

export default Tables;
