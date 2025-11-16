import React, { useState } from 'react';
import './DirectionsForm.css';

const DirectionsForm = ({ onSubmit, isLoading }) => {
  const [directions, setDirections] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (directions.trim()) {
      onSubmit(directions);
    }
  };

  const handleClear = () => {
    setDirections('');
  };

  return (
    <div className="directions-form-container">
      <h2>请写出路线 (Write the directions)</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={directions}
          onChange={(e) => setDirections(e.target.value)}
          placeholder="例如：从这里一直往前走，到路口向右拐..."
          rows="6"
          disabled={isLoading}
          className="directions-input"
        />
        <div className="button-group">
          <button
            type="submit"
            disabled={!directions.trim() || isLoading}
            className="submit-button"
          >
            {isLoading ? '评分中...' : '提交 (Submit)'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="clear-button"
          >
            清除 (Clear)
          </button>
        </div>
      </form>
    </div>
  );
};

export default DirectionsForm;
