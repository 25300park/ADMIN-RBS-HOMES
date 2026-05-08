import { Button, Tag, Space, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

export interface Popup {
  id: number;
  title: string;
  content: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: number;
  useOverlay: boolean;
  isActive: boolean;
  priority: number;
  targetAudience: string | null;
  targetConditions: any;
  buttonText: string | null;
  buttonAction: string | null;
  images: string | null;
  popupType: number;
  triggerType: number;
  triggerValue: string | null;
  showFrequency: number;
  createdBy?: {
    id: number;
    email: string;
    name: string | null;
  };
}

interface PopupColumnsProps {
  onPreview: (popup: Popup) => void;
  onEdit?: (record: Popup) => void;
  onDelete?: (id: number) => void;
  onToggleStatus?: (id: number) => void;
}

export const getPopupColumns = ({ 
  onPreview, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: PopupColumnsProps): ColumnsType<Popup> => {
  
  // 이미지 파싱
  const parseImages = (imagesJson: string | null): string[] => {
    if (!imagesJson) return [];
    try {
      const images = JSON.parse(imagesJson);
      return Array.isArray(images) ? images.map(img => img.url || img) : [];
    } catch (e) {
      console.error("Error parsing image JSON:", e);
      return [];
    }
  };

  // 팝업 타입 포맷
  const formatPopupType = (type: number) => {
    const types = ['Modal', 'Banner', 'Notification', 'Fullscreen'];
    return types[type] || `Type ${type}`;
  };

  // 트리거 타입 포맷
  const formatTriggerType = (type: number) => {
    const triggers = ['Page Load', 'Time Delay', 'Scroll', 'Exit Intent'];
    return triggers[type] || `Trigger ${type}`;
  };

  // 표시 빈도 포맷
  const formatShowFrequency = (frequency: number) => {
    const frequencies = ['Always', 'Once', 'Daily'];
    return frequencies[frequency] || `Frequency ${frequency}`;
  };

  // 날짜 포맷
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: (a, b) => a.priority - b.priority,
      render: (priority) => (
        <Tag color={priority <= 5 ? 'red' : priority <= 10 ? 'orange' : 'default'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.content && (
            <div className="text-xs text-gray-500 truncate max-w-32">
              {record.content.length > 30 ? `${record.content.substring(0, 30)}...` : record.content}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'popupType',
      key: 'popupType',
      width: 120,
      render: (type) => {
        const colors = ['blue', 'green', 'orange', 'purple'];
        return (
          <Tag color={colors[type] || 'default'}>
            {formatPopupType(type)}
          </Tag>
        );
      },
      filters: [
        { text: 'Modal', value: 0 },
        { text: 'Banner', value: 1 },
        { text: 'Notification', value: 2 },
        { text: 'Fullscreen', value: 3 },
      ],
      onFilter: (value, record) => record.popupType === value,
    },
    {
      title: 'Trigger',
      dataIndex: 'triggerType',
      key: 'triggerType',
      width: 120,
      render: (type, record) => (
        <Tooltip title={record.triggerValue || 'No specific value'}>
          <Tag color="cyan">
            {formatTriggerType(type)}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Target',
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      width: 100,
      render: (audience) => (
        <Tag color="geekblue">
          {audience || 'All'}
        </Tag>
      ),
    },
    {
      title: 'Preview',
      key: 'preview',
      width: 120,
      render: (_, record) => {
        const images = parseImages(record.images);
        return (
          <div className="flex items-center space-x-2">
            {images.length > 0 ? (
              <div 
                className="h-12 w-16 rounded overflow-hidden cursor-pointer border"
                onClick={() => onPreview(record)}
              >
                <img
                  src={images[0]}
                  alt="Popup preview"
                  className="object-cover w-full h-full"
                />
                {images.length > 1 && (
                  <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded-tl">
                    +{images.length - 1}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-12 w-16 bg-gray-100 flex items-center justify-center text-gray-400 text-xs border rounded">
                No image
              </div>
            )}
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => onPreview(record)}
            >
              Preview
            </Button>
          </div>
        );
      },
    },
    {
      title: 'Schedule',
      key: 'schedule',
      width: 140,
      render: (_, record) => (
        <div className="text-xs">
          <div>Start: {formatDate(record.startDate)}</div>
          <div>End: {formatDate(record.endDate)}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive, record) => (
        <div className="space-y-1">
          <Tag color={isActive ? 'success' : 'default'}>
            {isActive ? 'Active' : 'Inactive'}
          </Tag>
          <Tag className="text-xs text-gray-500">
            {formatShowFrequency(record.showFrequency)}
          </Tag>
          {record.useOverlay && (
            <Tag color="cyan">Overlay</Tag>
          )}
        </div>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Created',
      key: 'created',
      width: 140,
      render: (_, record) => (
        <div className="text-xs">
          <div>{formatDate(record.createdAt)}</div>
          {record.createdBy && (
            <div className="text-gray-500">
              by {record.createdBy.name || record.createdBy.email}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Toggle Status">
            <Button 
              size="small"
              type={record.isActive ? 'default' : 'primary'}
              onClick={() => onToggleStatus && onToggleStatus(record.id)}
            >
              {record.isActive ? 'Disable' : 'Enable'}
            </Button>
          </Tooltip>
          {onEdit && (
            <Tooltip title="Edit">
              <Button 
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <Button 
              danger 
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onDelete && onDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];
};