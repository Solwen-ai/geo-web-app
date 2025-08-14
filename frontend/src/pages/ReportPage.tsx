import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface SSEMessage {
  type: string;
  message?: string;
  timestamp: string;
  error?: string;
  fileName?: string;
}

export const ReportPage = () => {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/sse`);

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
    };

    eventSource.onmessage = event => {
      console.log('Received SSE message:', event.data);
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
        // Fallback for non-JSON messages
        setMessages(prev => [
          ...prev,
          {
            type: 'raw',
            message: event.data,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };

    eventSource.onerror = error => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            報告頁面
          </h1>

          {/* Connection Status */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></div>
              <span className="text-sm font-medium">
                {isConnected ? '已連接到 SSE 伺服器' : '未連接到 SSE 伺服器'}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              接收到的訊息：
            </h2>
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">等待訊息...</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg ${
                      message.type === 'scraping_error'
                        ? 'bg-red-50 border-red-200'
                        : message.type === 'scraping_completed'
                        ? 'bg-green-50 border-green-200'
                        : message.type === 'scraping_started'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">
                          {message.type === 'scraping_started' && '🚀 開始執行'}
                          {message.type === 'scraping_completed' &&
                            '✅ 執行完成'}
                          {message.type === 'scraping_error' && '❌ 執行失敗'}
                          {message.type === 'connection_established' &&
                            '🔗 連接建立'}
                          {message.type === 'raw' && '📨 訊息'}
                        </div>
                        {message.message && (
                          <div className="text-gray-800 mt-1">
                            {message.message}
                          </div>
                        )}
                        {message.error && (
                          <div className="text-red-600 text-sm mt-1">
                            錯誤: {message.error}
                          </div>
                        )}
                        {message.fileName && (
                          <div className="mt-2">
                            <a
                              href={`${API_BASE_URL}/api/download/${message.fileName}`}
                              download="geo.csv"
                              className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              📥 下載連結
                            </a>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 ml-4">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
