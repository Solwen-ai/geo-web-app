import { useEffect, useState } from 'react';
import { useReports } from '../hooks/useReports';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Report, SSEMessage } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const ReportPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const { data: reportsData, isLoading, error, refetch } = useReports();

  const connectSSE = () => {
    // Close existing connection if any
    if (eventSource) {
      eventSource.close();
    }

    const newEventSource = new EventSource(`${API_BASE_URL}/api/sse`);

    newEventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
    };

    newEventSource.onmessage = event => {
      console.log('Received SSE message:', event.data);
      try {
        const data: SSEMessage = JSON.parse(event.data);
        
        // If we receive a report status update, refetch the reports
        if (data.type === 'report_status_update') {
          console.log('Report status update received, refetching reports...');
          refetch();
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    newEventSource.onerror = error => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
    };

    setEventSource(newEventSource);
  };
  

  const disconnectSSE = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setIsConnected(false);
    }
  };

  const handleReconnect = () => {
    disconnectSSE();
    connectSSE();
  };

  useEffect(() => {
    connectSSE();

    return () => {
      disconnectSSE();
    };
  }, []);

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'running':
        return '執行中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失敗';
      default:
        return '未知';
    }
  };

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="md" />
              <span className="text-gray-600">載入報告中...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="text-red-600 text-lg font-semibold mb-2">
                載入報告失敗
              </div>
              <div className="text-gray-600">
                {error.message || '發生未知錯誤'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            報告頁面
          </h1>

          {/* Connection Status */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {isConnected ? '已連接到即時更新服務' : '未連接到即時更新服務'}
                </span>
              </div>
              {!isConnected && (
                <button
                  onClick={handleReconnect}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  重新連接
                </button>
              )}
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              報告列表：
            </h2>
            
            {!reportsData || reportsData.reports.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg mb-2">尚無報告</div>
                <div className="text-gray-400 text-sm">
                  請在首頁生成問題並開始執行以產生報告
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {reportsData.reports.map((report) => (
                  <div
                    key={report.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getStatusIcon(report.status)}</span>
                        <div>
                          <div className="font-semibold text-gray-800">
                            {report.fileName}
                          </div>
                          <div className="text-sm text-gray-500">
                            報告 ID: {report.id}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                            report.status
                          )}`}
                        >
                          {getStatusText(report.status)}
                        </span>
                        
                        {report.status === 'completed' && (
                          <a
                            href={`${API_BASE_URL}/api/download/${report.fileName}`}
                            download={report.fileName}
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            📥 下載
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">建立時間：</span>
                        {new Date(report.createdAt).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">更新時間：</span>
                        {new Date(report.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    
                    {report.error && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="text-red-800 text-sm">
                          <span className="font-medium">錯誤：</span>
                          {report.error}
                        </div>
                      </div>
                    )}
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
