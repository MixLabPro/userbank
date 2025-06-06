import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Calendar, Tag, BarChart3, Plus, Edit2, Trash2, RefreshCw, AlertCircle, Database, Table, X, Check, Settings, Folder, FileText } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useProfileSQL } from '../hooks/useProfileSQL';
import { useSidecar } from '../hooks/useSidecar';
import { 
  TABLE_DESCRIPTIONS, 
  formatTime, 
  getTagColor, 
  filterRecords, 
  getAllTags,
  createEmptyProfileData 
} from '../utils/dataTransform';
import AddRecordModal from '../components/AddRecordModal';
import EditRecordModal from '../components/EditRecordModal';
import SQLQueryPanel from '../components/SQLQueryPanel';
import { resourceDir, join } from '@tauri-apps/api/path';
import { readTextFile, exists } from '@tauri-apps/plugin-fs';

type ViewMode = 'table' | 'sql';

const Index = () => {
  const [activeTable, setActiveTable] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [deletingRecord, setDeletingRecord] = useState<any>(null);
  const [deletedRecords, setDeletedRecords] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [resourceDirPath, setResourceDirPath] = useState<string>('');
  const [configData, setConfigData] = useState<any>(null);
  const [configError, setConfigError] = useState<string>('');
  
  // 启动 sidecar 服务
  const { isRunning: sidecarRunning, error: sidecarError } = useSidecar();

  // 获取资源目录路径和配置文件
  useEffect(() => {
    const getResourceDirAndConfig = async () => {
      try {
        const path = await resourceDir();
        setResourceDirPath(path);
        
        // 读取配置文件
        const configPath = await join(path, 'config.json');
        const configExists = await exists(configPath);

        console.log("configPath", configPath);
        
        if (configExists) {
          const configContent = await readTextFile(configPath);
          const parsedConfig = JSON.parse(configContent);
          console.log("parsedConfig", parsedConfig);
          setConfigData(parsedConfig);
          setConfigError('');
        } else {
          setConfigError('配置文件不存在');
        }
      } catch (error) {
        console.error('获取资源目录路径或读取配置文件失败:', error);
        setResourceDirPath('获取路径失败');
        setConfigError(`读取配置文件失败: ${error}`);
      }
    };
    
    getResourceDirAndConfig();
  }, []);
  
  // 使用 MCP 服务获取数据
  const { data: profileData, loading, error, refreshData } = useProfile();
  
  // 使用 SQL 查询获取数据
  const { 
    data: sqlData, 
    loading: sqlLoading, 
    error: sqlError, 
    refreshData: refreshSQLData,
    updateRecord,
    deleteRecord
  } = useProfileSQL();
  
  // 根据视图模式选择数据源
  const tableData = useMemo(() => {
    if (viewMode === 'sql' && sqlData) {
      return sqlData;
    }
    return profileData || createEmptyProfileData();
  }, [viewMode, sqlData, profileData]);

  // 获取所有表格名称和统计信息
  const tableStats = useMemo(() => {
    const stats = Object.entries(TABLE_DESCRIPTIONS).map(([key, description]) => {
      const tableInfo = tableData[key as keyof typeof tableData];
      const count = tableInfo && typeof tableInfo === 'object' && 'stats' in tableInfo 
        ? tableInfo.stats.total_records 
        : 0;
      
      return {
        key,
        name: description,
        count
      };
    });
    
    // 添加"全部"选项
    const totalCount = stats.reduce((sum, stat) => sum + stat.count, 0);
    return [
      { key: 'all', name: '全部', count: totalCount },
      ...stats
    ];
  }, [tableData]);

  // 获取当前激活表格的数据
  const currentTableData = useMemo(() => {
    if (activeTable === 'all') {
      // 如果选择了"全部"，合并所有表格的记录
      const allRecords: any[] = [];
      Object.entries(TABLE_DESCRIPTIONS).forEach(([tableKey, tableName]) => {
        const tableInfo = tableData[tableKey as keyof typeof tableData];
        if (tableInfo && typeof tableInfo === 'object' && 'records' in tableInfo) {
          tableInfo.records.forEach((record: any) => {
            allRecords.push({
              ...record,
              uniqueKey: `${tableKey}-${record.id}`,
              sourceTable: tableKey,
              sourceTableName: tableName
            });
          });
        }
      });
      
      return {
        description: '全部记录',
        records: allRecords,
        stats: { total_records: allRecords.length }
      };
    }
    
    const tableInfo = tableData[activeTable as keyof typeof tableData];
    if (tableInfo && typeof tableInfo === 'object' && 'records' in tableInfo) {
      return tableInfo;
    }
    
    return { 
      description: TABLE_DESCRIPTIONS[activeTable as keyof typeof TABLE_DESCRIPTIONS] || '未知表格',
      records: [], 
      stats: { total_records: 0 }
    };
  }, [tableData, activeTable]);

  // 获取所有标签
  const allTags = useMemo(() => {
    return getAllTags(tableData);
  }, [tableData]);

  // 过滤记录
  const filteredRecords = useMemo(() => {
    return filterRecords(currentTableData.records, searchTerm, selectedTag, deletedRecords);
  }, [currentTableData.records, searchTerm, selectedTag, deletedRecords]);

  // 处理SQL查询结果更新
  const handleSQLDataUpdate = (sqlResults: any[]) => {
    console.log('SQL查询结果更新:', sqlResults);
  };

  // 获取当前状态信息
  const getCurrentStatus = () => {
    if ((viewMode as ViewMode) === 'sql') {
      return {
        loading: sqlLoading,
        error: sqlError,
        hasData: !!sqlData,
        statusText: sqlError ? 'SQL查询失败' : sqlData ? 'SQL数据已加载' : '使用本地数据'
      };
    } else {
      return {
        loading,
        error,
        hasData: !!profileData,
        statusText: error ? 'MCP连接失败' : profileData ? 'MCP已连接' : '使用本地数据'
      };
    }
  };

  const currentStatus = getCurrentStatus();

  // 处理编辑记录
  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  // 处理删除记录
  const handleDeleteRecord = async (record: any) => {
    setDeletingRecord(record);
  };

  // 确认删除记录
  const confirmDeleteRecord = async () => {
    if (!deletingRecord) return;

    try {
      const targetTableName = deletingRecord.sourceTable || activeTable;
      
      const success = await deleteRecord(targetTableName, deletingRecord.id);
      
      if (success) {
        console.log('记录删除成功');
        const recordKey = deletingRecord.uniqueKey || deletingRecord.id.toString();
        setDeletedRecords(prevDeletedRecords => {
          const newDeletedRecords = new Set(prevDeletedRecords);
          newDeletedRecords.add(recordKey);
          return newDeletedRecords;
        });
      } else {
        console.error('删除记录失败');
      }
    } catch (error) {
      console.error('删除记录出错:', error);
    } finally {
      setDeletingRecord(null);
    }
  };

  // 取消删除
  const cancelDeleteRecord = () => {
    setDeletingRecord(null);
  };

  // 处理更新记录
  const handleUpdateRecord = async (tableName: string, recordId: number, content: string, related: string[]) => {
    try {
      const success = await updateRecord(tableName, recordId, content, related);
      return success;
    } catch (error) {
      console.error('更新记录出错:', error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-12">
        {/* 页面标题 - 科技感设计 */}
        <div className="mb-16">
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 tracking-tight">
                  UserBank
                  <span className="block text-2xl md:text-3xl lg:text-4xl font-thin text-gray-600 mt-2">
                    数据管理面板
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {/* 统一状态指示器 - 优先显示 Sidecar 状态，成功时显示 MCP 状态 */}
                <div className="flex items-center gap-2">
                  {sidecarError ? (
                    <>
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm text-gray-500">Sidecar 错误</span>
                    </>
                  ) : !sidecarRunning ? (
                    <>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-gray-500">Sidecar 启动中</span>
                    </>
                  ) : (
                    <>
                      <div className={`w-3 h-3 rounded-full ${currentStatus.error ? 'bg-red-500' : currentStatus.hasData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className="text-sm text-gray-500">
                        {currentStatus.statusText}
                      </span>
                    </>
                  )}
                </div>
                {/* 刷新按钮 */}
                <button
                  onClick={viewMode === 'sql' ? refreshSQLData : refreshData}
                  disabled={currentStatus.loading}
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${currentStatus.loading ? 'animate-spin' : ''}`} />
                </button>
                {/* 设置按钮 */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  
                  {/* 设置浮层 */}
                  {showSettings && (
                    <>
                      {/* 背景遮罩 */}
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowSettings(false)}
                      />
                      {/* 设置面板 */}
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl shadow-gray-900/20 border border-gray-100 z-50 transform transition-all duration-200 scale-100 opacity-100">
                        <div className="p-6">
                          {/* 设置标题 */}
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">设置</h3>
                            <button
                              onClick={() => setShowSettings(false)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* 资源目录路径 */}
                          <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <Folder className="w-5 h-5 text-gray-600" />
                                <h4 className="text-sm font-medium text-gray-900">资源目录路径</h4>
                              </div>
                              <div className="bg-white rounded-md p-3 border border-gray-200">
                                <code className="text-sm text-gray-700 break-all">
                                  {resourceDirPath || '正在获取...'}
                                </code>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                应用程序资源文件的存储位置
                              </p>
                            </div>

                            {/* 配置文件内容 */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <FileText className="w-5 h-5 text-gray-600" />
                                <h4 className="text-sm font-medium text-gray-900">配置文件 (config.json)</h4>
                              </div>
                              <div className="bg-white rounded-md p-3 border border-gray-200 max-h-64 overflow-y-auto">
                                {configError ? (
                                  <div className="text-red-600 text-sm">
                                    {configError}
                                  </div>
                                ) : configData ? (
                                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {JSON.stringify(configData, null, 2)}
                                  </pre>
                                ) : (
                                  <div className="text-gray-500 text-sm">
                                    正在读取配置文件...
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                应用程序配置信息
                              </p>
                            </div>
                          </div>
      
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute -left-2 top-0 w-1 h-full bg-gradient-to-b from-gray-900 via-gray-600 to-transparent rounded-full"></div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-lg font-light max-w-2xl">
              管理和查看您的个人知识库数据，探索思维的数字化足迹
            </p>
            {currentStatus.error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{currentStatus.error}</span>
              </div>
            )}
          </div>
        </div>

        {/* 视图模式切换 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-lg shadow-gray-900/5 w-fit">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'table'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Table className="w-4 h-4" />
              表格视图
            </button>
            <button
              onClick={() => setViewMode('sql')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'sql'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Database className="w-4 h-4" />
              SQL查询
            </button>
          </div>
        </div>

        {/* 根据视图模式显示不同内容 */}
        {viewMode === 'sql' ? (
          /* SQL查询面板 */
          <SQLQueryPanel onDataUpdate={handleSQLDataUpdate} />
        ) : (
          /* 原有的表格视图 */
          <>
            {/* 统计卡片 - 未来感无边框设计 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-4 mb-16">
              {tableStats.map((stat) => (
                <div
                  key={stat.key}
                  onClick={() => setActiveTable(stat.key)}
                  className={`group relative p-6 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    activeTable === stat.key
                      ? 'bg-gray-900 text-white shadow-2xl shadow-gray-900/20'
                      : 'bg-white hover:bg-gray-50 shadow-lg shadow-gray-900/5 hover:shadow-xl hover:shadow-gray-900/10'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-2xl md:text-3xl font-light mb-2 ${
                      activeTable === stat.key ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stat.count}
                    </div>
                    <div className={`text-sm font-light tracking-wide ${
                      activeTable === stat.key ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {stat.name}
                    </div>
                  </div>
                  {activeTable === stat.key && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-10"></div>
                  )}
                </div>
              ))}
            </div>

            {/* 搜索和过滤区域 - 极简设计 */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-900/5 p-8 mb-12">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* 搜索框 */}
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-gray-900 transition-colors" />
                  <input
                    type="text"
                    placeholder={activeTable === 'all' ? "搜索内容、标签或表格名称..." : "搜索内容或标签..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* 标签过滤 */}
                <div className="relative w-full lg:min-w-64 lg:w-auto group">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-gray-900 transition-colors" />
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:outline-none transition-all duration-200 text-gray-900 appearance-none cursor-pointer"
                  >
                    <option value="">所有标签</option>
                    {allTags.map((tag: string) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 当前表格信息 */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    <span className="font-light">
                      当前表格: <span className="text-gray-900 font-medium">{currentTableData.description}</span>
                    </span>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <span className="font-light">
                      总记录数: <span className="text-gray-900 font-medium">{currentTableData.stats.total_records}</span>
                    </span>
                    <span className="font-light">
                      显示记录数: <span className="text-gray-900 font-medium">{filteredRecords.length}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 数据列表 - 卡片式无边框设计 */}
            <div className="space-y-6">
              {currentStatus.loading ? (
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-900/5 p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-3">加载中...</h3>
                  <p className="text-gray-500 font-light max-w-md mx-auto">
                    正在从 {(viewMode as ViewMode) === 'sql' ? 'SQL查询' : 'MCP服务'} 获取数据
                  </p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-900/5 p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-3">暂无数据</h3>
                  <p className="text-gray-500 font-light max-w-md mx-auto">
                    {currentTableData.records.length === 0 
                      ? `${currentTableData.description}表格暂无记录` 
                      : '没有找到匹配的记录，请尝试调整搜索条件'
                    }
                  </p>
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <div 
                    key={record.uniqueKey || record.id} 
                    className="group bg-white rounded-2xl shadow-lg shadow-gray-900/5 hover:shadow-xl hover:shadow-gray-900/10 transition-all duration-300 p-8"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        {/* 记录内容 */}
                        <div className="mb-6">
                          <p className="text-gray-900 leading-relaxed text-lg font-light break-words">
                            {record.content}
                          </p>
                        </div>

                        {/* 标签 - 彩色渐变设计 */}
                        {record.keywords && record.keywords.length > 0 && (
                          <div className="mb-6">
                            <div className="flex flex-wrap gap-3">
                              {record.keywords.map((tag: string, tagIndex: number) => (
                                <span
                                  key={`${record.uniqueKey || record.id}-tag-${tagIndex}-${tag}`}
                                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 ${getTagColor(tag)}`}
                                >
                                  <Tag className="w-4 h-4 mr-2" />
                                  <span>{tag}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-400 font-light">
                          {/* 表格来源标识 - 仅在"全部"视图中显示 */}
                          {activeTable === 'all' && record.sourceTable && (
                            <div className="flex items-center">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600`}
                              >
                                <Database className="w-3 h-3 mr-1" />
                                {record.sourceTableName}
                              </span>
                            </div>
                          )}

                          {/* 时间信息 */}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">创建: {formatTime(record.created_time)}</span>
                          </div>
                          {record.updated_time && record.updated_time !== record.created_time && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">更新: {formatTime(record.updated_time)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={() => handleEditRecord(record)}
                          className="p-3 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRecord(record)}
                          className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 添加按钮 - 未来感设计 */}
            {activeTable !== 'all' && (
              <div className="fixed bottom-8 right-8">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="group bg-gray-900 hover:bg-black text-white p-4 rounded-2xl shadow-2xl shadow-gray-900/25 hover:shadow-3xl transition-all duration-300 transform hover:scale-110"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
            )}

            {/* 添加记录模态框 */}
            <AddRecordModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSuccess={(viewMode as ViewMode) === 'sql' ? refreshSQLData : refreshData}
              activeTable={activeTable}
              tableDescription={currentTableData.description}
            />

            {/* 编辑记录模态框 */}
            <EditRecordModal
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false);
                setEditingRecord(null);
              }}
              onSuccess={() => {
                if ((viewMode as ViewMode) === 'sql') {
                  refreshSQLData();
                } else {
                  refreshData();
                }
              }}
              record={editingRecord}
              tableName={activeTable}
              tableDescription={currentTableData.description}
              onUpdate={handleUpdateRecord}
            />

            {/* 删除确认对话框 */}
            {deletingRecord && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-300 scale-100">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      确认删除记录
                    </h3>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      您确定要删除这条记录吗？此操作不可撤销。
                    </p>
                    
                    {/* 显示要删除的记录内容预览 */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {deletingRecord.content}
                      </p>
                      {deletingRecord.keywords && deletingRecord.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {deletingRecord.keywords.slice(0, 3).map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-200 text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                          {deletingRecord.keywords.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{deletingRecord.keywords.length - 3} 更多
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={cancelDeleteRecord}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                        取消
                      </button>
                      <button
                        onClick={confirmDeleteRecord}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200"
                      >
                        <Check className="w-4 h-4" />
                        确认删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
