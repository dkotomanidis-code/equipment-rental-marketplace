import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Home.css';

export default function Home({ language }) {
  const navigate = useNavigate();
  const [featuredEquipment, setFeaturedEquipment] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 'earthmoving',
      en: { name: 'Earthmoving Equipment', desc: 'Digging, excavation and moving soil.', items: 'Excavators, mini excavators, bulldozers, backhoe loaders, wheel loaders, skid-steer loaders' },
      ka: { name: 'მიწის ამოკვეთის აღჭურვილობა', desc: 'დამთხვევა, ორმოს გაღრმავება და მიწის გადაადგილება.', items: 'ექსკავატორები, მინი ექსკავატორები, ბულდოზერები' },
      ru: { name: 'Оборудование для земляных работ', desc: 'Копание, экскавация и перемещение грунта.', items: 'Экскаваторы, мини-экскаваторы, бульдозеры' }
    },
    {
      id: 'lifting',
      en: { name: 'Lifting & Hoisting Equipment', desc: 'Lifting heavy materials and equipment.', items: 'Tower cranes, mobile cranes, truck-mounted cranes, telehandlers, forklifts, hoists' },
      ka: { name: 'აწევის და ამაღლების აღჭურვილობა', desc: 'მძიმე მასალებისა და აღჭურვილობის აწევა.', items: 'კოშკი კრანები, მობილური კრანები, ტრალებით დამონტაჟებული კრანები' },
      ru: { name: 'Грузоподъемное оборудование', desc: 'Подъем тяжелых материалов и оборудования.', items: 'Башенные краны, мобильные краны, автокраны' }
    },
    {
      id: 'road',
      en: { name: 'Road Construction Equipment', desc: 'Road building, paving and ground compaction.', items: 'Road rollers, asphalt pavers, milling machines, motor graders, road sweepers' },
      ka: { name: 'საბაზო სამშენებლო აღჭურვილობა', desc: 'გზის აგება, დაფენა და ნიადაგის შეკუმშვა.', items: 'გზის როლერები, ასფალტის დამსახვევები, მილირების მანქანები' },
      ru: { name: 'Дорожное строительное оборудование', desc: 'Строительство дорог, мощение и уплотнение грунта.', items: 'Дорожные катки, асфальтоукладчики, фрезы' }
    },
    {
      id: 'concrete',
      en: { name: 'Concrete Equipment', desc: 'Mixing, pouring and finishing concrete.', items: 'Concrete mixer trucks, concrete pumps, stationary mixers, batching plants, power trowels' },
      ka: { name: 'ბეტონის აღჭურვილობა', desc: 'ბეტონის შერევა, ჩამოსხმა და გამოსწორება.', items: 'ბეტონის მიქსერი მანქანები, ბეტონის ტუმბოები, სტაციონარული მიქსერები' },
      ru: { name: 'Бетонное оборудование', desc: 'Смешивание, заливка и отделка бетона.', items: 'Бетономешалки, бетононасосы, стационарные миксеры' }
    },
    {
      id: 'power',
      en: { name: 'Power & Electrical Equipment', desc: 'Supplying electricity and power on-site.', items: 'Diesel generators, compressors, transformers, welding machines, distribution boards' },
      ka: { name: 'ელექტროენერგიის აღჭურვილობა', desc: 'ელექტროენერგიის მიწოდება საიკიდან.', items: 'დიზელის გენერატორები, კომპრესორები, ტრანსფორმატორები' },
      ru: { name: 'Электрооборудование', desc: 'Обеспечение электроэнергией на объекте.', items: 'Дизельные генераторы, компрессоры, трансформаторы' }
    },
    {
      id: 'drilling',
      en: { name: 'Drilling & Demolition Equipment', desc: 'Breaking structures and drilling into the ground.', items: 'Hydraulic breakers, jackhammers, rock drills, drilling rigs, demolition robots' },
      ka: { name: 'ბურვის და დემოლიციის აღჭურვილობა', desc: 'სტრუქტურების დაშლა და ნიადაგში ბურვა.', items: 'ჰიდრავლიკური მუტლები, ჩაკნა რეცი, კალი რეცი' },
      ru: { name: 'Буровое и демонтажное оборудование', desc: 'Разрушение конструкций и бурение грунта.', items: 'Гидромолоты, отбойные молотки, буровые установки' }
    },
    {
      id: 'compaction',
      en: { name: 'Compaction Equipment', desc: 'Compressing soil, gravel and other surfaces.', items: 'Plate compactors, rammers, trench rollers, single-drum and double-drum rollers' },
      ka: { name: 'შეკუმშვის აღჭურვილობა', desc: 'ნიადაგის, კენჭის და სხვა ზედაპირების შეკუმშვა.', items: 'ფიქალი შეკუმშავები, რეცი, თხრობის როლერები' },
      ru: { name: 'Оборудование уплотнения', desc: 'Уплотнение грунта, щебня и других поверхностей.', items: 'Виброплиты, трамбовки, катки' }
    },
    {
      id: 'scaffolding',
      en: { name: 'Scaffolding & Formwork', desc: 'Temporary structures for building work.', items: 'Scaffolding systems, formwork panels, props, shoring systems, access towers' },
      ka: { name: 'განაჭიკი და ფორმა', desc: 'დროებითი სტრუქტურები სამშენებლო სამუშაოებისთვის.', items: 'განაჭიკი სისტემები, ფორმის პანელები, საყრდენი' },
      ru: { name: 'Леса и опалубка', desc: 'Временные конструкции для строительства.', items: 'Системы лесов, опалубочные панели, подпорки' }
    },
    {
      id: 'transport',
      en: { name: 'Transport & Haulage', desc: 'Transporting materials and machinery.', items: 'Dump trucks, articulated haulers, tipper trucks, low-loader trailers, flatbed trucks' },
      ka: { name: 'ტრანსპორტი და გადაზიდვა', desc: 'მასალების და მეშინერიის გადაზიდვა.', items: 'თხილის მანქანები, იკატი ტრალები, კიდურის მანქანები' },
      ru: { name: 'Транспорт и перевозки', desc: 'Перевозка материалов и оборудования.', items: 'Самосвалы, тягачи, тросовые грузовики' }
    },
    {
      id: 'pumps',
      en: { name: 'Pumps & Water Management', desc: 'Removing water and managing site drainage.', items: 'Dewatering pumps, submersible pumps, slurry pumps, drainage pumps, water tank systems' },
      ka: { name: 'ტუმბოები და წყლის მართვა', desc: 'წყლის აღმოფხვრა და საიკიდო დრენაჟის მართვა.', items: 'წყლის აღმოფხვრის ტუმბოები, ჩაწვდომილი ტუმბოები' },
      ru: { name: 'Насосы и управление водой', desc: 'Откачка воды и управление дренажем объекта.', items: 'Дренажные насосы, погружные насосы, илососы' }
    },
    {
      id: 'attachments',
      en: { name: 'Attachments & Accessories', desc: 'Tools that attach to larger machines.', items: 'Excavator buckets, hydraulic breakers, grapples, augers, forks, quick couplers' },
      ka: { name: 'დაკავშირებული საშუა-ლო და აქსესუარები', desc: 'ინსტრუმენტები რომელიც იკრავა დიდი მანქანებზე.', items: 'ექსკავატორის ვედრო, ჰიდრავლიკური მუტლები, გადამჭერი' },
      ru: { name: 'Навески и аксессуары', desc: 'Инструменты, которые крепятся к крупным машинам.', items: 'Ковши экскаватора, гидромолоты, грейферы' }
    },
    {
      id: 'smallTools',
      en: { name: 'Small Tools & Site Equipment', desc: 'Smaller equipment used for everyday construction.', items: 'Concrete cutters, angle grinders, drills, welding tools, tile cutters, laser levels' },
      ka: { name: 'მცირე ხელსაწყოები და საიკიდო აღჭურვილობა', desc: 'უფრო მცირე აღჭურვილობა რომელიც გამოიყენება ყოველდღე.', items: 'ბეტონის საჭრელი, კუთხური აკვილი, მჯდელი' },
      ru: { name: 'Малые инструменты и оборудование', desc: 'Меньшее оборудование, используемое ежедневно.', items: 'Пилы по бетону, углошлифовальные машины, дрели' }
    }
  ];

  const translations = {
    en: {
      tagline: 'Premium Construction Equipment Rental & Sales',
      subtitle: 'Reliable, Professional-Grade Equipment for Every Project',
      searchPlaceholder: 'Search equipment by name or type...',
      search: 'Search',
      browseAll: 'Browse All Equipment',
      featured: 'Featured Equipment',
      categoriesTitle: 'Equipment Categories',
      viewDetails: 'View Details',
      price: 'Price per Day',
      why: 'Why Choose Us',
      reliable: 'Reliable Equipment',
      reliableDesc: 'All equipment is regularly maintained and inspected',
      competitive: 'Competitive Pricing',
      competitiveDesc: 'Best rates in the market without compromising quality',
      professional: 'Professional Support',
      professionalDesc: '24/7 customer support and equipment assistance',
      easy: 'Easy Booking',
      easyDesc: 'Simple, transparent booking process with no hidden fees',
      contact: 'Contact Us',
      phone: '+995 123 456 789',
      email: 'info@equipmentrental.ge',
    },
    ka: {
      tagline: 'პრემიუმ სამშენებლო აღჭურვილობის ქირავება და გაყიდვა',
      subtitle: 'საიმედო, პროფესიონალური აღჭურვილობა ყველა პროექტისთვის',
      searchPlaceholder: 'აღჭურვილობის ძებნა სახელით ან ტიპით...',
      search: 'ძებნა',
      browseAll: 'ყველა აღჭურვილობის დათვალიერება',
      featured: 'პოპულარული აღჭურვილობა',
      categoriesTitle: 'აღჭურვილობის კატეგორიები',
      viewDetails: 'დეტალების ნახვა',
      price: 'ფასი დღეში',
      why: 'რატომ აირჩიოთ ჩვენ',
      reliable: 'საიმედო აღჭურვილობა',
      reliableDesc: 'ყველა აღჭურვილობა რეგულარულად მოვლენილია და შემოწმებულია',
      competitive: 'კონკურენტული ფასები',
      competitiveDesc: 'საუკეთესო ფასები ბაზარზე ხარისხის შეცვლის გარეშე',
      professional: 'პროფესიონალური სერვისი',
      professionalDesc: '24/7 კლიენტების მხარდაჭერა და აღჭურვილობის დახმარება',
      easy: 'ადვილი დაჯავშნა',
      easyDesc: 'მარტივი, გამჭვირვალე დაჯავშნის პროცესი ფარული გადასახადების გარეშე',
      contact: 'დაგვიკავშირდით',
      phone: '+995 123 456 789',
      email: 'info@equipmentrental.ge',
    },
    ru: {
      tagline: 'Аренда и продажа премиум строительного оборудования',
      subtitle: 'Надежное профессиональное оборудование для любого проекта',
      searchPlaceholder: 'Поиск оборудования по названию или типу...',
      search: 'Поиск',
      browseAll: 'Просмотреть все оборудование',
      featured: 'Рекомендуемое оборудование',
      categoriesTitle: 'Категории оборудования',
      viewDetails: 'Подробнее',
      price: 'Цена в день',
      why: 'Почему мы',
      reliable: 'Надежное оборудование',
      reliableDesc: 'Все оборудование регулярно обслуживается и проверяется',
      competitive: 'Конкурентные цены',
      competitiveDesc: 'Лучшие цены на рынке без ущерба качеству',
      professional: 'Профессиональная поддержка',
      professionalDesc: 'Поддержка 24/7 и помощь с оборудованием',
      easy: 'Легкое бронирование',
      easyDesc: 'Простой и прозрачный процесс бронирования без скрытых платежей',
      contact: 'Свяжитесь с нами',
      phone: '+995 123 456 789',
      email: 'info@equipmentrental.ge',
    },
  };

  const t = translations[language];

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await axios.get('/api/equipment?limit=6');
        setFeaturedEquipment(response.data || []);
      } catch (err) {
        console.error('Error fetching equipment:', err);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/equipment?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/equipment?category=${categoryId}`);
  };

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-flag">
          <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="240" fill="white"/>
            <rect x="0" y="90" width="400" height="60" fill="#CE1126"/>
            <rect x="170" y="0" width="60" height="240" fill="#CE1126"/>
            <g transform="translate(60, 40)">
              <rect x="-5" y="-20" width="10" height="40" fill="#CE1126"/>
              <rect x="-20" y="-5" width="40" height="10" fill="#CE1126"/>
            </g>
            <g transform="translate(340, 40)">
              <rect x="-5" y="-20" width="10" height="40" fill="#CE1126"/>
              <rect x="-20" y="-5" width="40" height="10" fill="#CE1126"/>
            </g>
            <g transform="translate(60, 200)">
              <rect x="-5" y="-20" width="10" height="40" fill="#CE1126"/>
              <rect x="-20" y="-5" width="40" height="10" fill="#CE1126"/>
            </g>
            <g transform="translate(340, 200)">
              <rect x="-5" y="-20" width="10" height="40" fill="#CE1126"/>
              <rect x="-20" y="-5" width="40" height="10" fill="#CE1126"/>
            </g>
          </svg>
        </div>

        <div className="hero-content">
          <h1>{t.tagline}</h1>
          <p className="hero-subtitle">{t.subtitle}</p>

          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">{t.search}</button>
          </form>

          <Link to="/equipment" className="browse-btn">{t.browseAll}</Link>
        </div>
      </section>

      <section className="categories-section">
        <h2>{t.categoriesTitle}</h2>
        <div className="categories-grid">
          {categories.map((cat) => {
            const catLang = cat[language] || cat.en;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="category-card"
              >
                <h3>{catLang.name}</h3>
                <p className="category-desc">{catLang.desc}</p>
                <p className="category-items">{catLang.items}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="featured-section">
        <h2>{t.featured}</h2>
        <div className="equipment-grid">
          {featuredEquipment.length > 0 ? (
            featuredEquipment.map(eq => (
              <div key={eq.id} className="equipment-card">
                <img src={eq.image_url || '/placeholder.jpg'} alt={eq.name} />
                <div className="equipment-info">
                  <h3>{eq.name}</h3>
                  <p className="location">{eq.location}</p>
                  <p className="price">${eq.daily_price} <span>/{t.price.toLowerCase()}</span></p>
                  <Link to={`/equipment/${eq.id}`} className="details-link">{t.viewDetails}</Link>
                </div>
              </div>
            ))
          ) : (
            <p>Loading equipment...</p>
          )}
        </div>
      </section>

      <section className="why-section">
        <h2>{t.why}</h2>
        <div className="benefits-grid">
          {[
            { title: t.reliable, desc: t.reliableDesc },
            { title: t.professional, desc: t.professionalDesc },
            { title: t.competitive, desc: t.competitiveDesc },
            { title: t.easy, desc: t.easyDesc },
          ].map((benefit, idx) => (
            <div key={idx} className="benefit-card">
              <div className="benefit-icon">◆</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="contact-section">
        <h2>{t.contact}</h2>
        <div className="contact-info">
          <p><strong>Phone:</strong> {t.phone}</p>
          <p><strong>Email:</strong> {t.email}</p>
        </div>
      </section>
    </main>
  );
}