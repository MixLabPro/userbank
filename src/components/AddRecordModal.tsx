import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Tag } from 'lucide-react';
import { addRecord } from '../services/MCP';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeTable: string;
  tableDescription: string;
}

const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  activeTable,
  tableDescription
}) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const relatedTags = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const success = await addRecord(
        activeTable,
        content.trim(),
        relatedTags.length > 0 ? relatedTags : undefined
      );

      if (success) {
        setContent('');
        setTags('');
        onSuccess();
        onClose();
      } else {
        alert(t('toast.addRecordFailed'));
      }
    } catch (error) {
      console.error('添加记录失败:', error);
      alert(t('toast.addRecordFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-light text-gray-900">{t('modal.addRecord')}</h2>
            <p className="text-gray-500 mt-1">{t('modal.addToTable', { table: tableDescription })}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* 内容输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('modal.content')} *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('modal.contentPlaceholder', { table: tableDescription })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 resize-none"
                required
              />
            </div>

            {/* 标签输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Tag className="w-4 h-4 inline mr-2" />
                {t('modal.tagsOptional')}
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t('modal.tagsPlaceholder')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200"
              />
              <p className="text-xs text-gray-500 mt-2">
                {t('modal.tagsHelp')}
              </p>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('modal.adding')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {t('modal.addRecord')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRecordModal; 