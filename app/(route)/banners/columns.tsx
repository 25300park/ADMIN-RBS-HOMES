// components/admin/banners/BannerColumns.tsx
import { Button, Tag, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export interface Banner {
  id: number;
  matchType: string;
  matchValue: string;
  priority: number;
  title: string | null;
  description: string | null;
  images: string;
  isActive: boolean;
  createdAt: string;
}

interface BannerColumnsProps {
  onPreview: (images: string[]) => void;
  onEdit?: (record: Banner) => void;
  onDelete?: (id: number) => void;
}

export const getBannerColumns = ({ onPreview, onEdit, onDelete }: BannerColumnsProps): ColumnsType<Banner> => {
  const parseImages = (imagesJson: string): string[] => {
    try {
      const images = JSON.parse(imagesJson);
      return Array.isArray(images) ? images.map(img => img.url) : [];
    } catch (e) {
      console.error("Error parsing image JSON:", e);
      return [];
    }
  };

  // 매치 타입 표시 형식
  const formatMatchType = (type: string) => {
    switch (type) {
      case 'city':
        return 'City';
      case 'exact_address':
        return 'Specific Location';
      default:
        return type;
    }
  };

  return [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      sorter: (a, b) => a.priority - b.priority,
    },
    {
      title: 'Type',
      dataIndex: 'matchType',
      key: 'matchType',
      width: 150,
      render: (text) => formatMatchType(text),
      filters: [
        { text: 'City', value: 'city' },
        { text: 'Specific Location', value: 'exact_address' },
      ],
      onFilter: (value, record) => record.matchType === value,
    },
    {
      title: 'Location',
      dataIndex: 'matchValue',
      key: 'matchValue',
      ellipsis: true,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text) => text || '-',
      ellipsis: true,
    },
    {
      title: 'Preview',
      key: 'preview',
      width: 120,
      render: (_, record) => {
        const images = parseImages(record.images);
        return images.length > 0 ? (
          <div 
            className="h-16 w-24 rounded overflow-hidden cursor-pointer" 
            onClick={() => onPreview(images)}
          >
            <img
              src={images[0]}
              alt="Banner preview"
              className="object-cover w-full h-full"
            />
            {images.length > 1 && (
              <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded-tl">
                +{images.length - 1}
              </div>
            )}
          </div>
        ) : (
          <div className="h-16 w-24 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          {/* <Button 
            type="primary" 
            size="small"
            onClick={() => onEdit && onEdit(record)}
          >
            Edit
          </Button> */}
          <Button 
            danger 
            size="small"
            onClick={() => onDelete && onDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];
};