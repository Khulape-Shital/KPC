import React from 'react';

const PageHeader = ({ title, subtitle, icon: Icon, titleStyle = {}, subtitleStyle = {}, className = '' }) => {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: 700, 
        color: 'var(--text-dark)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        margin: 0,
        ...titleStyle 
      }}>
        {Icon && <Icon size={24} color="var(--primary-blue)" />}
        {title}
      </h1>
      {subtitle && (
        <p style={{ color: 'var(--text-gray)', margin: 0, fontSize: '14px', ...subtitleStyle }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default PageHeader;
