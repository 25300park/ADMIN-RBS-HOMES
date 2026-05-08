'use client'
import React from 'react';

// 일반 매물 미리보기 (rent/buy)
export const RegularUnitPreview = ({ formData }: any) => {
  return (
    <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left', width: '142%' }}>
      {/* Hero Section */}
      <div style={{ position: 'relative', height: '250px', background: '#f0f0f0' }}>
        {formData?.mainImage && (
          <img 
            src={formData.mainImage} 
            alt="Main image"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          color: 'white',
          padding: '20px'
        }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
            {formData.title || 'Unit Title'}
          </h1>
          <p style={{ color: 'white', margin: '4px 0 0', fontSize: '14px' }}>
            {formData.fullAddress || 'Location'}
          </p>
        </div>
      </div>
    </div>
  );
};

// 업데이트된 프리세일 미리보기 - 새로운 저장 데이터 구조에 맞게 수정
export const PreSaleUnitPreview = ({ formData }: any) => {
  // URL에서 파일명 추출 함수
  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      return decodeURIComponent(fileName);
    } catch (error) {
      return 'Unknown file';
    }
  };

  // 파일 확장자에 따른 아이콘 반환
  const getFileIcon = (url: string): string => {
    const fileName = getFileNameFromUrl(url);
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'txt': return '📃';
      default: return '📎';
    }
  };

  // 캐러셀 아이템 파싱 (새 구조)
  const getCarouselItems = () => {
    if (!formData.carouselImagesContent && !formData.carouselItems) return [];
    
    try {
      // 폼 데이터에서 직접 가져오기 (편집 모드)
      if (formData.carouselItems && Array.isArray(formData.carouselItems)) {
        return formData.carouselItems;
      }
      
      // DB에서 가져온 JSON 문자열 파싱
      if (formData.carouselImagesContent) {
        if (typeof formData.carouselImagesContent === 'string') {
          return JSON.parse(formData.carouselImagesContent);
        }
        return formData.carouselImagesContent;
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing carousel items:', error);
      return [];
    }
  };

  // 비디오 아이템 파싱 (새 구조)
  const getVideoItems = () => {
    if (!formData.videos && !formData.videoItems) return [];
    
    try {
      // 폼 데이터에서 직접 가져오기 (편집 모드)
      if (formData.videoItems && Array.isArray(formData.videoItems)) {
        return formData.videoItems;
      }
      
      // DB에서 가져온 JSON 문자열 파싱
      if (formData.videos) {
        if (typeof formData.videos === 'string') {
          return JSON.parse(formData.videos);
        }
        return formData.videos;
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing video items:', error);
      return [];
    }
  };

  // 첨부파일 아이템 파싱 (새 구조)
  const getFileItems = () => {
    if (!formData.attachments && !formData.fileItems) return [];
    
    try {
      // 폼 데이터에서 직접 가져오기 (편집 모드)
      if (formData.fileItems && Array.isArray(formData.fileItems)) {
        return formData.fileItems;
      }
      
      // DB에서 가져온 JSON 문자열 파싱
      if (formData.attachments) {
        if (typeof formData.attachments === 'string') {
          return JSON.parse(formData.attachments);
        }
        return formData.attachments;
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing file items:', error);
      return [];
    }
  };

  const carouselItems = getCarouselItems();
  const videoItems = getVideoItems();
  const fileItems = getFileItems();

  return (
    <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left', width: '142%' }}>
      {/* Hero Section */}
      <div style={{ position: 'relative', height: '350px', background: '#f0f0f0' }}>
        {formData.mainImage && (
          <img 
            src={formData.mainImage} 
            alt="Main image"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
        
        {/* Left Side - Editor Content */}
        <div style={{ flex: '2', minWidth: '0' }}>
          {/* Project Basic Info */}
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>
              {formData.title || 'Project Title'}
            </h1>
            <p style={{ paddingBottom: "10px", fontSize: '14px', borderBottom: '1px solid #d6d6d6' }}>
              {formData.fullAddress || 'Project Location'}
            </p>
          </div>

          {/* Project Description Section */}
          <div style={{ 
            background: '#fff',
            marginBottom: '24px',
          }}>
            <div 
              style={{ 
                fontSize: '14px', 
                lineHeight: '1.6',
                color: '#333'
              }}
              dangerouslySetInnerHTML={{ 
                __html: formData.editorContent || '<p>No project description available.</p>'
              }}
            />
          </div>

          {/* Dynamic Carousel Sections */}
          {carouselItems && carouselItems.length > 0 && carouselItems.map((carousel: any, carouselIndex: number) => (
            <div key={carousel.id || carouselIndex} style={{ 
              background: '#fff',
              marginBottom: '24px',
            }}>
              {/* 캐러셀 제목 */}
              {carousel.title && (
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333', paddingBottom: '8px' }}>
                  {carousel.title}
                </h3>
              )}
              

              
              {/* 이미지 그리드 */}
              {carousel.images && carousel.images.length > 0 && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '12px' 
                }}>
                  {carousel.images.map((imageUrl: string, index: number) => (
                    <div key={index} style={{ 
                      border: '1px solid #e8e8e8', 
                      borderRadius: '8px', 
                      overflow: 'hidden',
                      background: '#fff'
                    }}>
                      <img 
                        src={imageUrl} 
                        alt={`${carousel.title || 'Gallery'} image ${index + 1}`}
                        style={{ 
                          width: '100%', 
                          height: '150px', 
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    </div>
                  ))}
                </div>
              )}

                            {/* 캐러셀 설명 */}
              {carousel.description && (
                <div 
                  style={{ 
                    fontSize: '14px', 
                    lineHeight: '1.6',
                    color: '#333',
                    marginBottom: '20px'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: carousel.description
                  }}
                />
              )}
            </div>
          ))}

          {/* Video Sections */}
          {videoItems && videoItems.length > 0 && videoItems.map((video: any, videoIndex: number) => (
            <div key={video.id || videoIndex} style={{ 
              background: '#fff',
              marginBottom: '24px',
            }}>
              {/* 비디오 제목 */}
              {video.title && (
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333', paddingBottom: '8px' }}>
                  {video.title}
                </h3>
              )}
              
              {/* 비디오 설명 */}
              {video.description && (
                <div 
                  style={{ 
                    fontSize: '14px', 
                    lineHeight: '1.6',
                    color: '#333',
                    marginBottom: '20px'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: video.description
                  }}
                />
              )}
              
              {/* 비디오 플레이어 */}
              {video.videoUrl && (
                <div style={{ 
                  border: '1px solid #e8e8e8', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  background: '#fff'
                }}>
                  <video 
                    controls 
                    style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                    poster="/api/placeholder/600/300"
                  >
                    <source src={video.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>
          ))}

          {/* File Sections */}
          {fileItems && fileItems.length > 0 && fileItems.map((file: any, fileIndex: number) => (
            <div key={file.id || fileIndex} style={{ 
              background: '#fff',
              marginBottom: '24px',
            }}>
              {/* 파일 제목 */}
              {file.title && (
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333', paddingBottom: '8px' }}>
                  {file.title}
                </h3>
              )}
              
              {/* 파일 설명 */}
              {file.description && (
                <div 
                  style={{ 
                    fontSize: '14px', 
                    lineHeight: '1.6',
                    color: '#333',
                    marginBottom: '20px'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: file.description
                  }}
                />
              )}
              
              {/* 파일 다운로드 링크 */}
              {file.fileUrl && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                  background: '#fafafa',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: '#b6b6b6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      marginRight: '12px',
                      fontSize: '16px'
                    }}>
                      {getFileIcon(file.fileUrl)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        {file.fileName || getFileNameFromUrl(file.fileUrl)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {file.mimeType && `${file.mimeType} • `}
                        {file.size && `${(file.size / 1024 / 1024).toFixed(2)}MB • `}
                        Click to download
                      </div>
                    </div>
                  </div>
                  <button
                    style={{
                      padding: '8px 16px',
                      background: '#ff9318',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background 0.3s ease'
                    }}
                    onClick={() => window.open(file.fileUrl, '_blank')}
                  >
                    Download
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {/* 에디터 콘텐츠에 표 스타일 적용을 위한 CSS */}
          <style jsx>{`
            div :global(table) {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              background: #fff;
            }
            div :global(table td),
            div :global(table th) {
              border: 1px solid #e8e8e8;
              padding: 8px 12px;
              text-align: left;
              vertical-align: top;
            }
            div :global(table th) {
              background-color: #f9f9f9;
              font-weight: bold;
              color: #333;
            }
            div :global(table tr:nth-child(even)) {
              background-color: #fafafa;
            }
            div :global(table tr:hover) {
              background-color: #f5f5f5;
            }
            div :global(img) {
              max-width: 100%;
              height: auto;
              border-radius: 4px;
              margin: 8px 0;
            }
            div :global(p) {
              margin: 12px 0;
            }
            div :global(h1), div :global(h2), div :global(h3), div :global(h4), div :global(h5), div :global(h6) {
              margin: 16px 0 8px 0;
              color: #333;
            }
            div :global(ul), div :global(ol) {
              margin: 12px 0;
              padding-left: 24px;
            }
            div :global(li) {
              margin: 4px 0;
            }
          `}</style>
        </div>

        {/* Right Side - Contact & Recommendations */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          {/* Price Information */}
          {formData.price && (
            <div style={{ 
              background: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h4 style={{ 
                margin: '0 0 16px 0', 
                fontSize: '16px', 
                color: '#333',
                borderBottom: '1px solid #f0f0f0',
                paddingBottom: '8px'
              }}>
                Price Information
              </h4>
              
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
                ₱ {formData.price}
              </div>
              
              {/* {formData.area && (
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                  Area: {formData.area}
                </div>
              )}
              
              {formData.bed && formData.bath && (
                <div style={{ fontSize: '14px', color: '#666' }}>
                  🛏️ {formData.bed} • 🚿 {formData.bath}
                </div>
              )} */}
            </div>
          )}

          {/* Contact Information */}
          <div style={{ 
            background: '#fff',
            border: '1px solid #e8e8e8',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h4 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '16px', 
              color: '#333',
              borderBottom: '1px solid #f0f0f0',
              paddingBottom: '8px'
            }}>
              Contact Information
            </h4>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Email Address
              </label>
              <input 
                type="email" 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} 
                placeholder="Enter your email"
              />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Phone Number
              </label>
              <input 
                type="tel" 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} 
                placeholder="Enter your phone number"
              />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Full Name
              </label>
              <input 
                type="text" 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }} 
                placeholder="Enter your full name"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Message
              </label>
              <textarea 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '60px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }} 
                placeholder="Tell us about your requirements"
              />
            </div>
            
            <button style={{
              width: '100%',
              padding: '12px',
              background: '#ff7a00',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              Send Inquiry
            </button>
          </div>

          {/* Recommended Units */}
          <div>
            <h4 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '16px', 
              color: '#333'
            }}>
              Related Projects
            </h4>
            
            {/* Sample Recommended Unit */}
            <div style={{ 
              border: '1px solid #f0f0f0',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div style={{ 
                height: '120px', 
                background: '#f5f5f5',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                <span style={{ fontSize: '12px' }}>Property Image</span>
              </div>
              
              <div style={{ padding: '12px' }}>
                <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#333' }}>
                  Similar Project Name
                </h5>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
                  Location, City, Metro Manila
                </p>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff', marginBottom: '4px' }}>
                  ₱ 120,000,000
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <span>🛏️ 2-3 bed</span> • <span>🚿 1-2 bath</span> • <span>📐 80-120 sqm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};