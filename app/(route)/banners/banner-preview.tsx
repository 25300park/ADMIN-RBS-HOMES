// components/admin/banners/BannerPreview.tsx
import { Modal } from 'antd';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface BannerPreviewProps {
  visible: boolean;
  images: string[];
  onClose: () => void;
}

const BannerPreview: React.FC<BannerPreviewProps> = ({ visible, images, onClose }) => {
  return (
    <Modal
      open={visible}
      title="Banner Images"
      footer={null}
      onCancel={onClose}
      width={800}
    >
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        className="h-96 w-full mt-4"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="flex items-center justify-center h-full">
              <img 
                src={image} 
                alt={`Banner image ${index + 1}`} 
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </Modal>
  );
};

export default BannerPreview;