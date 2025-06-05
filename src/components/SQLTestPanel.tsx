import React, { useState } from 'react';
import { executeCustomSQL } from '../services/MCP';
import { transformSQLToProfileData, generateGetAllTablesSQL } from '../utils/dataTransform';

const SQLTestPanel: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSQL = async () => {
    setLoading(true);
    try {
      // 测试获取所有表数据的SQL
      const sql = generateGetAllTablesSQL();
      console.log('测试SQL:', sql);
      
      const sqlResult = await executeCustomSQL(sql);
      console.log('SQL执行结果:', sqlResult);
      
              if (sqlResult && sqlResult.success && (sqlResult.results || sqlResult.data)) {
          const profileData = transformSQLToProfileData(sqlResult.results || sqlResult.data);
        console.log('转换后的数据:', profileData);
        setResult({ sqlResult, profileData });
      } else {
        setResult({ error: '查询失败', sqlResult });
      }
    } catch (error) {
      console.error('测试失败:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">SQL功能测试</h3>
      
      <button
        onClick={testSQL}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '测试中...' : '测试SQL查询'}
      </button>
      
      {result && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">测试结果:</h4>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SQLTestPanel; 