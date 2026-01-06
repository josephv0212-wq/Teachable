const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // SQLite constraint error (UNIQUE constraint violation)
  if (err.code === 'SQLITE_CONSTRAINT' || err.message?.includes('UNIQUE constraint')) {
    return res.status(400).json({ 
      error: 'Duplicate entry', 
      details: err.message 
    });
  }

  // SQLite foreign key constraint error
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err.message?.includes('FOREIGN KEY constraint')) {
    return res.status(400).json({ 
      error: 'Invalid reference', 
      details: 'The referenced record does not exist' 
    });
  }

  // Validation error (custom)
  if (err.name === 'ValidationError' || err.status === 400) {
    return res.status(400).json({ 
      error: err.message || 'Validation error', 
      details: err.details 
    });
  }

  // Not found error
  if (err.status === 404) {
    return res.status(404).json({ 
      error: err.message || 'Resource not found' 
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

