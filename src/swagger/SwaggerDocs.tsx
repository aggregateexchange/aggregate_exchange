import React, { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import './SwaggerDocs.css';

const SwaggerDocs: React.FC = () => {
  const [swaggerSpec, setSwaggerSpec] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/openapi.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => setSwaggerSpec(data))
      .catch(error => {
        console.error(error);
        setError(error.message);
      });
  }, []);

  if (error) {
    return <div>Error loading Swagger spec: {error}</div>;
  }

  return (
    <div className="swagger-container">
      {swaggerSpec ? <SwaggerUI spec={swaggerSpec} /> : <div>Loading...</div>}
    </div>
  );
};

export default SwaggerDocs;
