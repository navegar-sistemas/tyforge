import React, { useState } from 'react';
import styles from './styles.module.css';

interface ApiTesterProps {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  description?: string;
  responses?: ResponseScenario[];
}

interface ResponseScenario {
  status: number;
  description: string;
  body: any;
  headers?: Record<string, string>;
}

type TabType = 'body' | 'headers' | 'raw' | 'preview';

export default function ApiTester({
  method = 'GET',
  endpoint,
  headers = {},
  body = null,
  description,
  responses = [],
}: ApiTesterProps) {
  const [response, setResponse] = useState<string>('');
  const [responseHeaders, setResponseHeaders] = useState<
    Record<string, string>
  >({});
  const [rawResponse, setRawResponse] = useState<string>('');
  const [statusCode, setStatusCode] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [customHeaders, setCustomHeaders] = useState(
    JSON.stringify(headers, null, 2),
  );
  const [customBody, setCustomBody] = useState(JSON.stringify(body, null, 2));
  const [customEndpoint, setCustomEndpoint] = useState(endpoint);
  const [activeTab, setActiveTab] = useState<TabType>('body');
  const [activeScenario, setActiveScenario] = useState<number>(0);
  const [showMockResponse, setShowMockResponse] = useState(false);

  const executeRequest = async () => {
    setLoading(true);
    setError('');
    setResponse('');
    setResponseHeaders({});
    setRawResponse('');
    setStatusCode(0);
    setShowMockResponse(false);

    try {
      const parsedHeaders = JSON.parse(customHeaders);
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders,
        },
      };

      if (method !== 'GET' && customBody) {
        options.body = customBody;
      }

      const res = await fetch(customEndpoint, options);
      const contentType = res.headers.get('content-type');

      // Capture status code
      setStatusCode(res.status);

      // Capture headers
      const headersObj: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      setResponseHeaders(headersObj);

      // Capture raw response
      const text = await res.text();
      setRawResponse(text);

      // Parse response based on content type
      let data;
      try {
        if (contentType && contentType.includes('application/json')) {
          data = JSON.parse(text);
          setResponse(JSON.stringify(data, null, 2));
        } else {
          setResponse(text);
        }
      } catch {
        setResponse(text);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao executar requisição');
    } finally {
      setLoading(false);
    }
  };

  const showScenario = (index: number) => {
    setActiveScenario(index);
    setShowMockResponse(true);
    setError(''); // Clear any previous errors
    const scenario = responses[index];
    setStatusCode(scenario.status);
    setResponse(JSON.stringify(scenario.body, null, 2));
    setResponseHeaders(scenario.headers || {});
    setRawResponse(JSON.stringify(scenario.body));
  };

  const renderTabContent = () => {
    if (error && !showMockResponse) {
      return <div className={styles.error}>{error}</div>;
    }

    switch (activeTab) {
      case 'body':
        return <pre className={styles.response}>{response}</pre>;
      case 'headers':
        return (
          <pre className={styles.response}>
            {JSON.stringify(responseHeaders, null, 2)}
          </pre>
        );
      case 'raw':
        return <pre className={styles.response}>{rawResponse}</pre>;
      case 'preview':
        if (
          rawResponse.includes('<html') ||
          rawResponse.includes('<!DOCTYPE')
        ) {
          return (
            <iframe
              className={styles.preview}
              srcDoc={rawResponse}
              title="Preview"
            />
          );
        }
        return <pre className={styles.response}>{response}</pre>;
      default:
        return null;
    }
  };

  return (
    <div className={styles.apiTester}>
      {description && <p className={styles.description}>{description}</p>}

      {responses.length > 0 && (
        <>
          <div className={styles.scenarioHeader}>
            <h3 className={styles.scenarioTitle}>Exemplos de Resposta</h3>
          </div>
          <div className={styles.scenarioTabs}>
            {responses.map((scenario, index) => (
              <button
                key={index}
                className={`${styles.scenarioTab} ${activeScenario === index && showMockResponse ? styles.active : ''}`}
                onClick={() => showScenario(index)}
              >
                <span
                  className={`${styles.scenarioStatus} ${scenario.status >= 200 && scenario.status < 300 ? styles.success : scenario.status >= 400 ? styles.error : styles.warning}`}
                >
                  {scenario.status}
                </span>
              </button>
            ))}
          </div>
          {showMockResponse && (
            <div className={styles.scenarioDescriptionBar}>
              <span className={styles.activeDescription}>
                {responses[activeScenario].description}
              </span>
            </div>
          )}
        </>
      )}

      <div className={styles.requestSection}>
        <div className={styles.methodEndpoint}>
          <span className={`${styles.method} ${styles[method.toLowerCase()]}`}>
            {method}
          </span>
          <input
            type="text"
            className={styles.endpointInput}
            value={customEndpoint}
            onChange={(e) => setCustomEndpoint(e.target.value)}
            placeholder="Endpoint URL"
          />
          <button
            className={styles.executeButton}
            onClick={executeRequest}
            disabled={loading}
          >
            {loading ? 'Executando...' : 'Executar'}
          </button>
        </div>

        <div className={styles.headers}>
          <h4>Headers</h4>
          <textarea
            className={styles.codeEditor}
            value={customHeaders}
            onChange={(e) => setCustomHeaders(e.target.value)}
            rows={5}
            placeholder='{"Authorization": "Bearer token"}'
          />
        </div>

        {method !== 'GET' && (
          <div className={styles.body}>
            <h4>Request Body</h4>
            <textarea
              className={styles.codeEditor}
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              rows={10}
              placeholder='{"key": "value"}'
            />
          </div>
        )}
      </div>

      {(response || error || showMockResponse) && (
        <div className={styles.responseSection}>
          <div className={styles.responseHeader}>
            <h4>Resposta</h4>
            {statusCode > 0 && (
              <span
                className={`${styles.statusCode} ${statusCode >= 200 && statusCode < 300 ? styles.success : statusCode >= 400 ? styles.error : styles.warning}`}
              >
                {statusCode}
              </span>
            )}
          </div>

          {!error && (
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'body' ? styles.active : ''}`}
                onClick={() => setActiveTab('body')}
              >
                Body
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'headers' ? styles.active : ''}`}
                onClick={() => setActiveTab('headers')}
              >
                Headers
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'raw' ? styles.active : ''}`}
                onClick={() => setActiveTab('raw')}
              >
                Raw
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'preview' ? styles.active : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Preview
              </button>
            </div>
          )}

          <div className={styles.tabContent}>{renderTabContent()}</div>
        </div>
      )}
    </div>
  );
}
