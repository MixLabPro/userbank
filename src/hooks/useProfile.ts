import { useState, useEffect, useCallback } from 'react';
import { ProfileData, MCPSettings } from '@/types';
import { getAllTableContents } from '@/services/MCP';
import { MCP_CONFIG } from '@/config/mcp';

export const useProfile = (settings?: MCPSettings) => {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mcpSettings = settings || MCP_CONFIG;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAllTableContents(mcpSettings);
      console.log('Profile data result:', result);
      if (result) {
        setData(result);
      } else {
        setError('获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [mcpSettings]);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refreshData
  };
}; 