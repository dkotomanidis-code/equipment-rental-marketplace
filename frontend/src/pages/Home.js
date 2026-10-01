import React from 'react';
import { Link } from 'react-router-dom';

function Home({ language, setLanguage }) {
  const translations = {
    en: {
      title: 'Construction Equipment Rental & Buy',
      subtitle: 'Rent or Buy Heavy Machinery for Your Project',
      equipment: ['Excavators', 'Bulldozers', 'Cranes', 'Concrete Mixers', 'Scaffolding', 'Compressors', 'Generators', 'Forklifts'],
      browse: 'Browse All Equipment',
      whyChoose: 'Why Choose Us?',
      easy: 'Easy Booking',
      easyDesc: 'Simple and fast rental process',
      affordable: 'Affordable Prices',
      affordableDesc: 'Best rates in the market',
      trusted: 'Trusted Platform',
      trustedDesc: 'Thousands of verified equipment owners',
      support: '24/7 Support',
      supportDesc: 'Always here to help you',
      earnTitle: 'Start Earning Today',
      earnDesc: 'List your equipment and earn passive income',
      listEquipment: 'List Equipment'
    },
    ka: {
      title: 'სამშენებლო აღჭურვილობის ქირაობა და ყიდვა',
      subtitle: 'ქირაობით ან ყიდით მიიღეთ მძიმე მანქანები თქვენი პროექტისთვის',
      equipment: ['ექსკავატორები', 'ბულდოზერები', 'წამწამები', 'ბეტონის მიქსერები', 'შელფი', 'კომპრესორები', 'გენერატორები', 'ამწეები'],
      browse: 'ყველა აღჭურვილობის ნახვა',
      whyChoose: 'რატომ აირჩიეთ ჩვენ?',
      easy: 'ადვილი დაჯავშვა',
      easyDesc: 'მარტივი და სწრაფი ქირაობის პროცესი',
      affordable: 'იაფი ფასები',
      affordableDesc: 'საბაზარო საუკეთესო განაკვეთი',
      trusted: 'სანდო პლატფორმა',
      trustedDesc: 'ათასობით დამოწმებული აღჭურვილობის მფლობელი',
      support: '24/7 მხარდამჭერი',
      supportDesc: 'ყოველთვის თქვენი დაკმარებისთვის',
      earnTitle: 'დაიწყეთ გამომუშავება დღეს',
      earnDesc: 'დაამატეთ თქვენი აღჭურვილობა და გამოიმუშავეთ პასიური შემოსავალი',
      listEquipment: 'აღჭურვილობის დამატება'
    },
    ru: {
      title: 'Аренда и покупка строительного оборудования',
      subtitle: 'Арендуйте или купите тяжелую технику для вашего проекта',
      equipment: ['Экскаваторы', 'Бульдозеры', 'Краны', 'Бетономешалки', 'Леса', 'Компрессоры', 'Генераторы', 'Погрузчики'],
      browse: 'Просмотреть всё оборудование',
      whyChoose: 'Почему выбирают нас?',
      easy: 'Легкое бронирование',
      easyDesc: 'Простой и быстрый процесс аренды',
      affordable: 'Доступные цены',
      affordableDesc: 'Лучшие тарифы на рынке',
      trusted: 'Надежная платформа',
      trustedDesc: 'Тысячи проверенных владельцев оборудования',
      support: 'Поддержка 24/7',
      supportDesc: 'Всегда готовы вам помочь',
      earnTitle: 'Начните зарабатывать сегодня',
      earnDesc: 'Добавьте своё оборудование и получайте пассивный доход',
      listEquipment: 'Добавить оборудование'
    }
  };

  const t = translations[language];

  return (
    <div className="home">
      {/* Georgian Flag Logo */}
      <div className="geo-logo">
        <svg className="geo-flag-svg" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
          {/* White background */}
          <rect width="900" height="600" fill="white"/>
          
          {/* Red cross (horizontal and vertical through center) */}
          <rect x="0" y="225" width="900" height="150" fill="#CE1126"/>
          <rect x="375" y="0" width="150" height="600" fill="#CE1126"/>
          
          {/* Top-left small cross */}
          <rect x="50" y="50" width="40" height="120" fill="#CE1126"/>
          <rect x="30" y="90" width="80" height="40" fill="#CE1126"/>
          
          {/* Top-right small cross */}
          <rect x="810" y="50" width="40" height="120" fill="#CE1126"/>
          <rect x="790" y="90" width="80" height="40" fill="#CE1126"/>
          
          {/* Bottom-left small cross */}
          <rect x="50" y="430" width="40" height="120" fill="#CE1126"/>
          <rect x="30" y="430" width="80" height="40" fill="#CE1126"/>
          
          {/* Bottom-right small cross */}
          <rect x="810" y="430" width="40" height="120" fill="#CE1126"/>
          <rect x="790" y="430" width="80" height="40" fill="#CE1126"/>
        </svg>
        <span className="geo-text">GeoEquip</span>
      </div>

      {/* Hero Section */}
      <section className="hero-modern">
        <div className="hero-content-modern">
          <h1>{t.title}</h1>
          <p className="hero-subtitle-modern">{t.subtitle}</p>
          <p className="equipment-list-modern">
            {t.equipment.join(' • ')}
          </p>
          <Link to="/equipment" className="btn btn-primary btn-large-modern">{t.browse}</Link>
        </div>
        <div className="hero-decoration"></div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-section">
        <div className="why-choose-container">
          <h2>{t.whyChoose}</h2>
          
          <div className="features-grid">
            <div className="feature-card-modern">
              <div className="feature-icon-modern" style={{background: 'linear-gradient(135deg, #3b82f6, #1e40af)'}}>
                ⚡
              </div>
              <h3>{t.easy}</h3>
              <p>{t.easyDesc}</p>
            </div>

            <div className="feature-card-modern">
              <div className="feature-icon-modern" style={{background: 'linear-gradient(135deg, #10b981, #059669)'}}>
                💰
              </div>
              <h3>{t.affordable}</h3>
              <p>{t.affordableDesc}</p>
            </div>

            <div className="feature-card-modern">
              <div className="feature-icon-modern" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>
                ✓
              </div>
              <h3>{t.trusted}</h3>
              <p>{t.trustedDesc}</p>
            </div>

            <div className="feature-card-modern">
              <div className="feature-icon-modern" style={{background: 'linear-gradient(135deg, #ef4444, #dc2626)'}}>
                🎯
              </div>
              <h3>{t.support}</h3>
              <p>{t.supportDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Earn Section */}
      <section className="earn-section">
        <div className="earn-content">
          <h2>{t.earnTitle}</h2>
          <p>{t.earnDesc}</p>
          {localStorage.getItem('token') ? (
            <Link to="/list-equipment" className="btn btn-secondary-modern">{t.listEquipment}</Link>
          ) : (
            <Link to="/signup" className="btn btn-secondary-modern">{t.listEquipment}</Link>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;