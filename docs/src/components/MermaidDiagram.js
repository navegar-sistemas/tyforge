import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

const MermaidDiagram = ({ chart, title, height = '400px' }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      maxTextSize: 50000,
    });
  }, []);

  useEffect(() => {
    if (chart) {
      setIsLoading(true);
      setError(null);
      const renderDiagram = async () => {
        try {
          const id =
            'mermaid-diagram-' + Math.random().toString(36).substr(2, 9);
          const { svg } = await mermaid.render(id, chart);
          setSvgContent(svg);
          setIsLoading(false);
        } catch (error) {
          setError(error.message);
          setIsLoading(false);
        }
      };
      renderDiagram();
    }
  }, [chart]);

  useEffect(() => {
    if (svgContent && containerRef.current) {
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.cursor = 'grab';
        svgElement.style.userSelect = 'none';
        svgElement.style.width = '100%';
        svgElement.style.height = '100%';
      }
    }
  }, [svgContent]);

  // ESC fecha o fullscreen overlay e atalhos de zoom (agora usando Alt)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFullscreen) return;
      // Reset: Alt + '0'
      if (e.altKey && e.key === '0') {
        e.preventDefault();
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
      // Sair do fullscreen: ESC (sem Alt)
      else if (!e.altKey && e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Alt + scroll do mouse para zoom in/out
  useEffect(() => {
    if (!isFullscreen) return;
    const handleWheel = (e) => {
      if (e.altKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setScale((prev) => Math.min(prev * 1.2, 3)); // Zoom in
        } else if (e.deltaY > 0) {
          setScale((prev) => Math.max(prev / 1.2, 0.3)); // Zoom out
        }
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel, { passive: false });
    };
  }, [isFullscreen]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.2, 0.3));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  const handleFullscreen = () => setIsFullscreen(true);
  const handleDownload = async () => {
    try {
      if (!svgContent) return;
      const svgElement = containerRef.current?.querySelector('svg');
      if (!svgElement) return;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const svgUrl = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = svgUrl;
      link.download = `${title || 'diagrama'}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(svgUrl);
    } catch (error) {
      console.warn('Erro ao fazer download do diagrama:', error);
    }
  };
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      e.preventDefault();
    }
  };
  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handleMouseUp = () => setIsDragging(false);
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Renderização principal
  const diagramContent = (
    <div
      ref={containerRef}
      style={{
        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
        transformOrigin: 'top left',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
        width: '100%',
        height: '100%',
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isLoading ? 0.6 : 1,
        transition: 'opacity 0.3s ease',
        background: 'transparent',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => setIsFullscreen((f) => !f)}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontSize: 14,
          }}
        >
          Carregando diagrama...
        </div>
      )}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ef4444',
            fontSize: 14,
            padding: 20,
          }}
        >
          <div style={{ marginBottom: 8 }}>❌ Erro ao renderizar diagrama</div>
          <small style={{ color: '#666' }}>{error}</small>
        </div>
      )}
      {!isLoading && !error && svgContent && (
        <div
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      )}
    </div>
  );

  // Overlay fullscreen
  if (isFullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          background: 'rgba(255,255,255,1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden', // <-- garantir que o overlay nunca tenha scroll
        }}
      >
        {/* Título */}
        {title && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              zIndex: 100001,
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 3H5a2 2 0 0 0-2 2v4" />
              <path d="M19 3h4v4" />
              <path d="M21 19v-4" />
              <path d="M3 19v-4" />
              <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
              <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
              <path d="M15 3h4a2 2 0 0 1 2 2v4" />
            </svg>
            {title}
          </div>
        )}
        {/* Controles */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 100001,
            display: 'flex',
            gap: 6,
            background: 'rgba(0,0,0,0.8)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12,
            padding: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          <button
            onClick={handleZoomIn}
            style={{
              width: 36,
              height: 36,
              border: 'none',
              borderRadius: 8,
              background: 'rgba(59,130,246,0.2)',
              color: '#60a5fa',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            style={{
              width: 36,
              height: 36,
              border: 'none',
              borderRadius: 8,
              background: 'rgba(59,130,246,0.2)',
              color: '#60a5fa',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            -
          </button>
          <button
            onClick={handleReset}
            style={{
              width: 36,
              height: 36,
              border: 'none',
              borderRadius: 8,
              background: 'rgba(16,185,129,0.2)',
              color: '#34d399',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ⟳
          </button>
          <button
            onClick={() => setIsFullscreen(false)}
            style={{
              width: 36,
              height: 36,
              border: 'none',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.2)',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ⤫
          </button>
          <button
            onClick={handleDownload}
            style={{
              width: 36,
              height: 36,
              border: 'none',
              borderRadius: 8,
              background: 'rgba(34,197,94,0.2)',
              color: '#4ade80',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ⇩
          </button>
        </div>
        {/* Indicador de zoom */}
        {scale !== 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              zIndex: 100001,
              background: 'rgba(0,0,0,0.8)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {Math.round(scale * 100)}%
          </div>
        )}
        {/* Diagrama */}
        <div
          style={{
            width: '100vw',
            height: '100vh',
            background: 'transparent',
            borderRadius: 0,
            overflow: 'auto', // <-- só aqui pode ter scroll
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {diagramContent}
        </div>
      </div>
    );
  }

  // Renderização normal
  return (
    <div
      className="mermaid-diagram-container"
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        backgroundColor: 'white',
        margin: '20px 0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      {title && (
        <div
          style={{
            marginBottom: 16,
            fontWeight: 600,
            fontSize: 18,
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 3H5a2 2 0 0 0-2 2v4" />
            <path d="M19 3h4v4" />
            <path d="M21 19v-4" />
            <path d="M3 19v-4" />
            <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
            <path d="M15 21h4a2 2 0 0 0 2-2v-4" />
            <path d="M15 3h4a2 2 0 0 1 2 2v4" />
          </svg>
          {title}
        </div>
      )}
      <div
        style={{
          position: 'relative',
          height: height,
          overflow: 'hidden',
          borderRadius: 8,
          border: '1px solid #f3f4f6',
          backgroundColor: '#fafafa',
        }}
      >
        {/* Indicador de Zoom */}
        {scale !== 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              zIndex: 1000,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
              opacity: 0.9,
            }}
          >
            {Math.round(scale * 100)}%
          </div>
        )}
        {/* Botões de Controle */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1000,
            display: 'flex',
            gap: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: 8,
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s ease',
          }}
        >
          <button
            onClick={handleZoomIn}
            style={{
              width: 36,
              height: 36,
              border: 'none',
              borderRadius: 8,
              backgroundColor: 'rgba(59,130,246,0.1)',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            style={{
              width: 36,
              height: 36,
              border: 'none',
              borderRadius: 8,
              background: 'rgba(59,130,246,0.1)',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            -
          </button>
          <button
            onClick={handleReset}
            style={{
              width: 36,
              height: 36,
              border: 'none',
              borderRadius: 8,
              background: 'rgba(16,185,129,0.1)',
              color: '#10b981',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ⟳
          </button>
          <button
            onClick={handleFullscreen}
            style={{
              width: 36,
              height: 36,
              border: 'none',
              borderRadius: 8,
              backgroundColor: 'rgba(139,92,246,0.1)',
              color: '#8b5cf6',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ⤢
          </button>
          <button
            onClick={handleDownload}
            style={{
              width: 36,
              height: 36,
              border: 'none',
              borderRadius: 8,
              backgroundColor: 'rgba(34,197,94,0.1)',
              color: '#22c55e',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ⇩
          </button>
        </div>
        {diagramContent}
      </div>
    </div>
  );
};

export default MermaidDiagram;
