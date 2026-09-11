import React from 'react';
import { Filter, X } from 'lucide-react';
import { TaskStatus, TaskPriority } from '../types';

interface FilterBarProps {
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  search: string;
  onFilterChange: (filters: {
    status?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  status,
  priority,
  startDate,
  endDate,
  search,
  onFilterChange,
  onReset,
}) => {
  const hasActiveFilters = Boolean(status || priority || startDate || endDate || search);

  return (
    <div className="glass-card filter-bar">
      <div className="filter-group">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <Filter size={15} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Filters:</span>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search task title..."
          value={search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          style={{ width: '180px' }}
        />

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priority}
          onChange={(e) => onFilterChange({ priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        {/* Due Date Range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onFilterChange({ startDate: e.target.value })}
            title="Start Due Date"
            style={{ width: '130px' }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onFilterChange({ endDate: e.target.value })}
            title="End Due Date"
            style={{ width: '130px' }}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button
          className="btn-sm btn-secondary"
          onClick={onReset}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          <X size={13} /> Reset Filters
        </button>
      )}
    </div>
  );
};
