import React, { useState } from 'react';
import { Play, Database, Code, Copy, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useProfileSQL } from '../hooks/useProfileSQL';

interface SQLQueryPanelProps {
  onDataUpdate?: (data: any) => void;
}

const SQLQueryPanel: React.FC<SQLQueryPanelProps> = ({ onDataUpdate }) => {
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const { executeSQL } = useProfileSQL();

  // 预设的SQL查询示例（更新为新的表结构）
  const presetQueries = [
    {
      name: '获取所有表数据',
      sql: `SELECT 
  'viewpoint' as table_name, id, content, keywords, created_time, updated_time FROM viewpoint
UNION ALL
SELECT 
  'insight' as table_name, id, content, keywords, created_time, updated_time FROM insight
UNION ALL
SELECT 
  'focus' as table_name, id, content, keywords, created_time, updated_time FROM focus
UNION ALL
SELECT 
  'goal' as table_name, id, content, keywords, created_time, updated_time FROM goal
UNION ALL
SELECT 
  'preference' as table_name, id, content, keywords, created_time, updated_time FROM preference
UNION ALL
SELECT 
  'methodology' as table_name, id, content, keywords, created_time, updated_time FROM methodology
UNION ALL
SELECT 
  'prediction' as table_name, id, content, keywords, created_time, updated_time FROM prediction
UNION ALL
SELECT 
  'memory' as table_name, id, content, keywords, created_time, updated_time FROM memory
ORDER BY table_name, created_time DESC`
    },
    {
      name: '获取表统计信息',
      sql: `SELECT 
  'viewpoint' as table_name, '观点' as description, COUNT(*) as total_records FROM viewpoint
UNION ALL
SELECT 
  'insight' as table_name, '洞察' as description, COUNT(*) as total_records FROM insight
UNION ALL
SELECT 
  'focus' as table_name, '关注点' as description, COUNT(*) as total_records FROM focus
UNION ALL
SELECT 
  'goal' as table_name, '目标' as description, COUNT(*) as total_records FROM goal
UNION ALL
SELECT 
  'preference' as table_name, '偏好' as description, COUNT(*) as total_records FROM preference
UNION ALL
SELECT 
  'methodology' as table_name, '方法论' as description, COUNT(*) as total_records FROM methodology
UNION ALL
SELECT 
  'prediction' as table_name, '预测' as description, COUNT(*) as total_records FROM prediction
UNION ALL
SELECT 
  'memory' as table_name, '记忆' as description, COUNT(*) as total_records FROM memory`
    },
    {
      name: '获取最近7天的记录',
      sql: `SELECT 
  'viewpoint' as table_name, id, content, keywords, created_time, updated_time 
FROM viewpoint 
WHERE created_time >= datetime('now', '-7 days')
UNION ALL
SELECT 
  'insight' as table_name, id, content, keywords, created_time, updated_time 
FROM insight 
WHERE created_time >= datetime('now', '-7 days')
UNION ALL
SELECT 
  'focus' as table_name, id, content, keywords, created_time, updated_time 
FROM focus 
WHERE created_time >= datetime('now', '-7 days')
UNION ALL
SELECT 
  'goal' as table_name, id, content, keywords, created_time, updated_time 
FROM goal 
WHERE created_time >= datetime('now', '-7 days')
UNION ALL
SELECT 
  'preference' as table_name, id, content, keywords, created_time, updated_time 
FROM preference 
WHERE created_time >= datetime('now', '-7 days')
UNION ALL
SELECT 
  'methodology' as table_name, id, content, keywords, created_time, updated_time 
FROM methodology 
WHERE created_time >= datetime('now', '-7 days')
UNION ALL
SELECT 
  'prediction' as table_name, id, content, keywords, created_time, updated_time 
FROM prediction 
WHERE created_time >= datetime('now', '-7 days')
UNION ALL
SELECT 
  'memory' as table_name, id, content, keywords, created_time, updated_time 
FROM memory 
WHERE created_time >= datetime('now', '-7 days')
ORDER BY created_time DESC LIMIT 10`
    },
    {
      name: '搜索包含特定关键词的记录',
      sql: `SELECT 
  'insight' as table_name, id, content, keywords, created_time, updated_time 
FROM insight 
WHERE content LIKE '%AI%' OR keywords LIKE '%AI%'
ORDER BY created_time DESC LIMIT 20`
    },
    {
      name: '获取用户画像信息',
      sql: `SELECT * FROM persona WHERE id = 1`
    },
    {
      name: '获取分类体系',
      sql: `SELECT * FROM category WHERE is_active = 1 ORDER BY first_level, second_level`
    }
  ];

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      alert('请输入SQL查询语句');
      return;
    }

    setIsExecuting(true);
    try {
      const result = await executeSQL(sqlQuery);
      setQueryResult(result);
      
      if (onDataUpdate && result?.data) {
        onDataUpdate(result.data);
      }
    } catch (error) {
      console.error('执行SQL查询失败:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResult = () => {
    if (!queryResult) return;
    
    const dataStr = JSON.stringify(queryResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sql_query_result_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-gray-900/5 p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-gray-900" />
          <h2 className="text-2xl font-light text-gray-900">SQL 查询面板</h2>
        </div>
        <p className="text-gray-500 font-light">
          直接执行SQL查询来获取和分析数据，支持所有SQLite语法
        </p>
      </div>

      {/* 预设查询 */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">预设查询</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presetQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => setSqlQuery(query.sql)}
              className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">{query.name}</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">
                {query.sql.split('\n')[0]}...
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* SQL输入区域 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-900">SQL 查询语句</label>
          <button
            onClick={() => copyToClipboard(sqlQuery)}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <Copy className="w-4 h-4" />
            复制
          </button>
        </div>
        <textarea
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          placeholder="输入您的SQL查询语句..."
          className="w-full h-32 p-4 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-400 font-mono text-sm"
        />
      </div>

      {/* 执行按钮 */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={executeQuery}
          disabled={isExecuting || !sqlQuery.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className={`w-5 h-5 ${isExecuting ? 'animate-spin' : ''}`} />
          {isExecuting ? '执行中...' : '执行查询'}
        </button>
        
        {queryResult && (
          <button
            onClick={downloadResult}
            className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <Download className="w-5 h-5" />
            下载结果
          </button>
        )}
      </div>

      {/* 查询结果 */}
      {queryResult && (
        <div className="border-t border-gray-100 pt-8">
          <div className="flex items-center gap-3 mb-4">
            {queryResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <h3 className="text-lg font-medium text-gray-900">查询结果</h3>
          </div>

          {queryResult.success ? (
            <div>
              {queryResult.data && queryResult.data.length > 0 ? (
                <div className="bg-gray-50 rounded-xl p-4 overflow-auto">
                  <div className="text-sm text-gray-600 mb-3">
                    共 {queryResult.data.length} 条记录
                  </div>
                  <pre className="text-sm text-gray-900 font-mono whitespace-pre-wrap">
                    {JSON.stringify(queryResult.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <p className="text-gray-500">查询执行成功，但没有返回数据</p>
                  {queryResult.rowcount !== undefined && (
                    <p className="text-sm text-gray-400 mt-2">
                      影响行数: {queryResult.rowcount}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-red-800 font-medium">查询执行失败</p>
              <p className="text-red-600 text-sm mt-1">{queryResult.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SQLQueryPanel; 