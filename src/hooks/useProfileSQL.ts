import { useState, useEffect, useCallback } from 'react';
import { ProfileData, MCPSettings,  QueryParams } from '../types';
import { executeCustomSQL, queryRecords, saveRecord } from '../services/MCP';
import { MCP_CONFIG } from '../config/mcp';

export const useProfileSQL = (settings?: MCPSettings) => {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mcpSettings = settings || MCP_CONFIG;

  // 获取所有表数据
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 定义所有表名
      const tableNames = ['viewpoint', 'insight', 'focus', 'goal', 'preference', 'methodology', 'prediction', 'memory'];
      
      // 并行获取所有表的数据
      const tablePromises = tableNames.map(async (tableName) => {
        const result = await queryRecords(tableName, { limit: 100 }, mcpSettings);
        return {
          tableName,
          data: result
        };
      });
      
      const tableResults = await Promise.all(tablePromises);
      
      // 构建ProfileData
      const profileData: ProfileData = {
        viewpoint: { description: '观点', records: [], stats: { total_records: 0 } },
        insight: { description: '洞察', records: [], stats: { total_records: 0 } },
        focus: { description: '关注点', records: [], stats: { total_records: 0 } },
        goal: { description: '目标', records: [], stats: { total_records: 0 } },
        preference: { description: '偏好', records: [], stats: { total_records: 0 } },
        methodology: { description: '方法论', records: [], stats: { total_records: 0 } },
        prediction: { description: '预测', records: [], stats: { total_records: 0 } },
        memory: { description: '记忆', records: [], stats: { total_records: 0 } }
      };
      
      // 填充数据
      tableResults.forEach(({ tableName, data }) => {
        if (data && profileData[tableName as keyof ProfileData]) {
          const tableData = profileData[tableName as keyof ProfileData] as any;
          if (tableData && typeof tableData === 'object' && 'records' in tableData) {
            tableData.records = data.records;
            tableData.stats.total_records = data.total_count;
          }
        }
      });
      
      setData(profileData);
      console.log('SQL模式数据加载完成:', profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [mcpSettings]);

  // 搜索记录
  const searchRecords = useCallback(async (
    tableName: string,
    keyword?: string,
    relatedTopic?: string,
    limit: number = 20,
    offset: number = 0
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const filter: any = {};
      
      if (keyword) {
        filter.content_contains = keyword;
      }
      
      if (relatedTopic) {
        filter.keywords_contain_any = [relatedTopic];
      }
      
      const params: QueryParams = {
        filter,
        limit,
        offset
      };
      
      const result = await queryRecords(tableName, params, mcpSettings);
      
      if (result) {
        return result.records;
      } else {
        setError('搜索失败');
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索出错');
      return [];
    } finally {
      setLoading(false);
    }
  }, [mcpSettings]);

  // 获取最近记录
  const getRecentRecords = useCallback(async (days: number = 7, limit: number = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const sql = `
        SELECT 'viewpoint' as table_name, id, content, created_time FROM viewpoint WHERE created_time >= datetime('now', '-${days} days')
        UNION ALL
        SELECT 'insight' as table_name, id, content, created_time FROM insight WHERE created_time >= datetime('now', '-${days} days')
        UNION ALL
        SELECT 'focus' as table_name, id, content, created_time FROM focus WHERE created_time >= datetime('now', '-${days} days')
        UNION ALL
        SELECT 'goal' as table_name, id, content, created_time FROM goal WHERE created_time >= datetime('now', '-${days} days')
        UNION ALL
        SELECT 'preference' as table_name, id, content, created_time FROM preference WHERE created_time >= datetime('now', '-${days} days')
        UNION ALL
        SELECT 'methodology' as table_name, id, content, created_time FROM methodology WHERE created_time >= datetime('now', '-${days} days')
        UNION ALL
        SELECT 'prediction' as table_name, id, content, created_time FROM prediction WHERE created_time >= datetime('now', '-${days} days')
        UNION ALL
        SELECT 'memory' as table_name, id, content, created_time FROM memory WHERE created_time >= datetime('now', '-${days} days')
        ORDER BY created_time DESC
        LIMIT ${limit}
      `;
      
      const result = await executeCustomSQL(sql, [], true, mcpSettings);
      
      if (result && result.success && (result.results || result.data)) {
        return result.results || result.data;
      } else {
        setError(result?.message || '获取最近记录失败');
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取最近记录出错');
      return [];
    } finally {
      setLoading(false);
    }
  }, [mcpSettings]);

  // 获取表统计信息
  const getTableStats = useCallback(async () => {
    try {
      const sql = `
        SELECT 'viewpoint' as table_name, '观点' as description, COUNT(*) as total_records FROM viewpoint
        UNION ALL
        SELECT 'insight' as table_name, '洞察' as description, COUNT(*) as total_records FROM insight
        UNION ALL
        SELECT 'focus' as table_name, '关注点' as description, COUNT(*) as total_records FROM focus
        UNION ALL
        SELECT 'goal' as table_name, '目标' as description, COUNT(*) as total_records FROM goal
        UNION ALL
        SELECT 'preference' as table_name, '偏好' as description, COUNT(*) as total_records FROM preference
        UNION ALL
        SELECT 'methodology' as table_name, '方法论' as description, COUNT(*) as total_records FROM methodology
        UNION ALL
        SELECT 'prediction' as table_name, '预测' as description, COUNT(*) as total_records FROM prediction
        UNION ALL
        SELECT 'memory' as table_name, '记忆' as description, COUNT(*) as total_records FROM memory
      `;
      
      const result = await executeCustomSQL(sql, [], true, mcpSettings);
      
      if (result && result.success && (result.results || result.data)) {
        return result.results || result.data;
      } else {
        console.error('获取表统计失败:', result?.message);
        return [];
      }
    } catch (err) {
      console.error('获取表统计出错:', err);
      return [];
    }
  }, [mcpSettings]);

  // 执行自定义SQL
  const executeSQL = useCallback(async (sql: string, params?: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('执行自定义SQL:', sql, '参数:', params);
      
      const result = await executeCustomSQL(sql, params, true, mcpSettings);
      
      if (result && result.success) {
        return result;
      } else {
        setError(result?.message || 'SQL执行失败');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SQL执行出错');
      return null;
    } finally {
      setLoading(false);
    }
  }, [mcpSettings]);

  // 更新记录
  const updateRecord = useCallback(async (
    tableName: string,
    recordId: number,
    content?: string,
    related?: string[]
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const record: any = {
        id: recordId
      };
      
      if (content) record.content = content;
      if (related) record.keywords = related;
      
      const success = await saveRecord(tableName, record, mcpSettings);
      
      if (success) {
        // 更新成功后刷新数据
        await fetchAllData();
        return true;
      } else {
        setError('更新记录失败');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新记录出错');
      return false;
    } finally {
      setLoading(false);
    }
  }, [mcpSettings, fetchAllData]);

  // 删除记录
  const deleteRecord = useCallback(async (
    tableName: string,
    recordId: number
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const sql = `DELETE FROM ${tableName} WHERE id = ?`;
      const result = await executeCustomSQL(sql, [recordId.toString()], false, mcpSettings);
      
      if (result && result.success) {
        // 删除成功后刷新数据
        await fetchAllData();
        return true;
      } else {
        setError(result?.message || '删除记录失败');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除记录出错');
      return false;
    } finally {
      setLoading(false);
    }
  }, [mcpSettings, fetchAllData]);

  // 获取单条记录
  const getRecord = useCallback(async (
    tableName: string,
    recordId: number
  ) => {
    try {
      const sql = `SELECT * FROM ${tableName} WHERE id = ?`;
      const result = await executeCustomSQL(sql, [recordId.toString()], true, mcpSettings);
      
      if (result && result.success) {
        const data = result.results || result.data;
        if (data && data.length > 0) {
          return data[0];
        }
      }
      
      {
        setError(result?.message || '获取记录失败');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取记录出错');
      return null;
    }
  }, [mcpSettings]);

  const refreshData = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    data,
    loading,
    error,
    refreshData,
    searchRecords,
    getRecentRecords,
    getTableStats,
    executeSQL,
    updateRecord,
    deleteRecord,
    getRecord
  };
}; 