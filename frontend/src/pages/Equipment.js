import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/Browse.css';

/*
 * Category IDs match the Home page links.
 * Type IDs remain the same when the interface language changes.
 * Each type contains English, Georgian and Russian labels.
 */
const CATEGORY_ROWS = [
  {
    id: 'earthmoving',
    names: ['Earthmoving Equipment', 'მიწის სამუშაოების ტექნიკა', 'Землеройная техника'],
    types: [
      ['excavators', 'Excavators', 'ექსკავატორები', 'Экскаваторы'],
      ['mini-excavators', 'Mini excavators', 'მინი ექსკავატორები', 'Мини-экскаваторы'],
      ['bulldozers', 'Bulldozers', 'ბულდოზერები', 'Бульдозеры'],
      ['backhoe-loaders', 'Backhoe loaders', 'ექსკავატორ-დამტვირთველები', 'Экскаваторы-погрузчики'],
      ['wheel-loaders', 'Wheel loaders', 'ბორბლიანი დამტვირთველები', 'Колёсные погрузчики'],
      ['skid-steer-loaders', 'Skid-steer loaders', 'მინი დამტვირთველები', 'Мини-погрузчики'],
      ['graders', 'Graders', 'გრეიდერები', 'Грейдеры'],
      ['trenchers', 'Trenchers', 'ტრანშეის მთხრელები', 'Траншеекопатели'],
    ],
  },
  {
    id: 'lifting',
    names: ['Lifting & Hoisting Equipment', 'ამწე და ამწევი ტექნიკა', 'Грузоподъёмная техника'],
    types: [
      ['tower-cranes', 'Tower cranes', 'კოშკურა ამწეები', 'Башенные краны'],
      ['mobile-cranes', 'Mobile cranes', 'მობილური ამწეები', 'Мобильные краны'],
      ['truck-mounted-cranes', 'Truck-mounted cranes', 'ავტომობილზე დამონტაჟებული ამწეები', 'Краны на автомобильном шасси'],
      ['telehandlers', 'Telehandlers', 'ტელესკოპური დამტვირთველები', 'Телескопические погрузчики'],
      ['forklifts', 'Forklifts', 'ჩანგლიანი დამტვირთველები', 'Вилочные погрузчики'],
      ['hoists', 'Hoists', 'ტალები', 'Тали'],
      ['material-lifts', 'Material lifts', 'მასალების ამწეები', 'Подъёмники для материалов'],
    ],
  },
  {
    id: 'road',
    names: ['Road Construction Equipment', 'საგზაო სამშენებლო ტექნიკა', 'Дорожно-строительная техника'],
    types: [
      ['road-rollers', 'Road rollers', 'საგზაო სატკეპნები', 'Дорожные катки'],
      ['asphalt-pavers', 'Asphalt pavers', 'ასფალტდამგებები', 'Асфальтоукладчики'],
      ['milling-machines', 'Milling machines', 'საგზაო ფრეზები', 'Дорожные фрезы'],
      ['motor-graders', 'Motor graders', 'ავტოგრეიდერები', 'Автогрейдеры'],
      ['road-sweepers', 'Road sweepers', 'გზის საწმენდი მანქანები', 'Дорожные подметальные машины'],
      ['asphalt-distributors', 'Asphalt distributors', 'ბიტუმის გამანაწილებლები', 'Автогудронаторы'],
    ],
  },
  {
    id: 'concrete',
    names: ['Concrete Equipment', 'ბეტონის სამუშაოების ტექნიკა', 'Оборудование для бетона'],
    types: [
      ['concrete-mixer-trucks', 'Concrete mixer trucks', 'ავტობეტონმრევები', 'Автобетоносмесители'],
      ['concrete-pumps', 'Concrete pumps', 'ბეტონის ტუმბოები', 'Бетононасосы'],
      ['stationary-mixers', 'Stationary mixers', 'სტაციონარული ბეტონმრევები', 'Стационарные бетономешалки'],
      ['batching-plants', 'Batching plants', 'ბეტონის საწარმოო დანადგარები', 'Бетонные заводы'],
      ['power-trowels', 'Power trowels', 'ბეტონის მოსაპრიალებელი მანქანები', 'Затирочные машины'],
      ['concrete-vibrators', 'Concrete vibrators', 'ბეტონის ვიბრატორები', 'Вибраторы для бетона'],
    ],
  },
  {
    id: 'power',
    names: ['Power & Electrical Equipment', 'ენერგეტიკული და ელექტროაღჭურვილობა', 'Энергетическое и электрооборудование'],
    types: [
      ['diesel-generators', 'Diesel generators', 'დიზელის გენერატორები', 'Дизельные генераторы'],
      ['compressors', 'Compressors', 'კომპრესორები', 'Компрессоры'],
      ['transformers', 'Transformers', 'ტრანსფორმატორები', 'Трансформаторы'],
      ['welding-machines', 'Welding machines', 'შედუღების აპარატები', 'Сварочные аппараты'],
      ['distribution-boards', 'Distribution boards', 'გამანაწილებელი ფარები', 'Распределительные щиты'],
      ['lighting-towers', 'Lighting towers', 'განათების კოშკები', 'Осветительные мачты'],
    ],
  },
  {
    id: 'drilling',
    names: ['Drilling & Demolition Equipment', 'საბურღი და სადემონტაჟო ტექნიკა', 'Буровая и демонтажная техника'],
    types: [
      ['hydraulic-breakers', 'Hydraulic breakers', 'ჰიდრავლიკური ჩაქუჩები', 'Гидромолоты'],
      ['jackhammers', 'Jackhammers', 'სანგრევი ჩაქუჩები', 'Отбойные молотки'],
      ['rock-drills', 'Rock drills', 'კლდის საბურღი დანადგარები', 'Бурильные машины для скальных пород'],
      ['drilling-rigs', 'Drilling rigs', 'საბურღი დანადგარები', 'Буровые установки'],
      ['demolition-robots', 'Demolition robots', 'სადემონტაჟო რობოტები', 'Демонтажные роботы'],
      ['crushers', 'Crushers', 'დამქუცმაცებლები', 'Дробилки'],
    ],
  },
  {
    id: 'compaction',
    names: ['Compaction Equipment', 'დატკეპნის ტექნიკა', 'Уплотняющая техника'],
    types: [
      ['plate-compactors', 'Plate compactors', 'ვიბროფილები', 'Виброплиты'],
      ['rammers', 'Rammers', 'ვიბროსატკეპნები', 'Вибротрамбовки'],
      ['trench-rollers', 'Trench rollers', 'ტრანშეის სატკეპნები', 'Траншейные катки'],
      ['single-drum-rollers', 'Single-drum rollers', 'ერთდოლიანი სატკეპნები', 'Одновальцовые катки'],
      ['double-drum-rollers', 'Double-drum rollers', 'ორდოლიანი სატკეპნები', 'Двухвальцовые катки'],
    ],
  },
  {
    id: 'scaffolding',
    names: ['Scaffolding & Formwork', 'სამშენებლო ხარაჩოები და ყალიბები', 'Строительные леса и опалубка'],
    types: [
      ['scaffolding-systems', 'Scaffolding systems', 'ხარაჩოების სისტემები', 'Системы строительных лесов'],
      ['formwork-panels', 'Formwork panels', 'ყალიბის პანელები', 'Опалубочные щиты'],
      ['props', 'Props', 'საყრდენი დგარები', 'Опорные стойки'],
      ['shoring-systems', 'Shoring systems', 'დროებითი საყრდენი სისტემები', 'Подпорные системы'],
      ['access-towers', 'Access towers', 'ხარაჩო-კოშკები', 'Вышки-туры'],
      ['safety-platforms', 'Safety platforms', 'უსაფრთხოების პლატფორმები', 'Защитные платформы'],
    ],
  },
  {
    id: 'transport',
    names: ['Transport & Haulage', 'ტრანსპორტი და გადაზიდვა', 'Транспорт и перевозки'],
    types: [
      ['dump-trucks', 'Dump trucks', 'თვითმცლელები', 'Самосвалы'],
      ['articulated-haulers', 'Articulated haulers', 'სახსრიანი თვითმცლელები', 'Сочленённые самосвалы'],
      ['tipper-trucks', 'Tipper trucks', 'თვითმცლელი სატვირთოები', 'Самосвальные грузовики'],
      ['low-loader-trailers', 'Low-loader trailers', 'დაბალპლატფორმიანი მისაბმელები', 'Низкорамные прицепы'],
      ['flatbed-trucks', 'Flatbed trucks', 'პლატფორმიანი სატვირთოები', 'Бортовые грузовики'],
      ['water-tankers', 'Water tankers', 'წყლის ცისტერნები', 'Автоцистерны для воды'],
    ],
  },
  {
    id: 'pumps',
    names: ['Pumps & Water Management', 'ტუმბოები და წყლის მართვა', 'Насосы и водоотведение'],
    types: [
      ['dewatering-pumps', 'Dewatering pumps', 'წყალშემკრები ტუმბოები', 'Водоотливные насосы'],
      ['submersible-pumps', 'Submersible pumps', 'ჩაძირული ტუმბოები', 'Погружные насосы'],
      ['slurry-pumps', 'Slurry pumps', 'შლამის ტუმბოები', 'Шламовые насосы'],
      ['drainage-pumps', 'Drainage pumps', 'სადრენაჟო ტუმბოები', 'Дренажные насосы'],
      ['water-tank-systems', 'Water tank systems', 'წყლის ავზების სისტემები', 'Системы водяных резервуаров'],
    ],
  },
  {
    id: 'attachments',
    names: ['Attachments & Accessories', 'მისამაგრებელი მოწყობილობები და აქსესუარები', 'Навесное оборудование и аксессуары'],
    types: [
      ['excavator-buckets', 'Excavator buckets', 'ექსკავატორის ციცხვები', 'Экскаваторные ковши'],
      ['hydraulic-breakers', 'Hydraulic breakers', 'ჰიდრავლიკური ჩაქუჩები', 'Гидромолоты'],
      ['grapples', 'Grapples', 'მომჭერები', 'Грейферы'],
      ['augers', 'Augers', 'შნეკური ბურღები', 'Шнековые буры'],
      ['forks', 'Forks', 'ჩანგლები', 'Вилы'],
      ['quick-couplers', 'Quick couplers', 'სწრაფი შემაერთებლები', 'Быстросъёмные соединения'],
      ['demolition-shears', 'Demolition shears', 'სადემონტაჟო მაკრატლები', 'Демонтажные ножницы'],
    ],
  },
  {
    id: 'smallTools',
    names: ['Small Tools & Site Equipment', 'მცირე ხელსაწყოები და სამშენებლო აღჭურვილობა', 'Малый инструмент и оборудование площадки'],
    types: [
      ['concrete-cutters', 'Concrete cutters', 'ბეტონის საჭრელები', 'Резчики бетона'],
      ['angle-grinders', 'Angle grinders', 'კუთხსახეხები', 'Угловые шлифмашины'],
      ['drills', 'Drills', 'ელექტრობურღები', 'Дрели'],
      ['welding-tools', 'Welding tools', 'შედუღების ხელსაწყოები', 'Сварочный инструмент'],
      ['tile-cutters', 'Tile cutters', 'ფილების საჭრელები', 'Плиткорезы'],
      ['laser-levels', 'Laser levels', 'ლაზერული ნიველირები', 'Лазерные уровни'],
      ['scaffolding-accessories', 'Scaffolding accessories', 'ხარაჩოების აქსესუარები', 'Аксессуары для строительных лесов'],
      ['compact-mixers', 'Compact mixers', 'კომპაქტური ბეტონმრევები', 'Компактные бетономешалки'],
    ],
  },
];

const TEXT = {
  en: {
    eyebrow: 'CONSTRUCTION EQUIPMENT',
    title: 'The right equipment. A clearer choice.',
    subtitle: 'Explore construction machinery and site equipment. Narrow your search by category, type, location and daily rental price or total sale price.',
    search: 'Search equipment',
    searchHint: 'Name, equipment type or keyword',
    filters: 'Refine your search',
    reset: 'Clear filters',
    category: 'Category',
    allCategories: 'All categories',
    type: 'Equipment type',
    allTypes: 'All equipment types',
    location: 'Location',
    locationHint: 'City or area',
    priceType: 'Price type',
    rental: 'Rental (per day)',
    sale: 'For sale (total)',
    budget: 'Price range',
    minimum: 'Minimum',
    maximum: 'Maximum',
    available: 'Available listings only',
    availabilityHint: 'Listing status only; booking dates must be checked separately.',
    results: 'Results',
    listings: 'listings',
    sort: 'Sort by',
    newest: 'Newest first',
    low: 'Price: low to high',
    high: 'Price: high to low',
    name: 'Name: A–Z',
    grid: 'Grid view',
    list: 'List view',
    loading: 'Loading equipment…',
    failed: 'We could not load the equipment.',
    failedHint: 'Check that the backend is running, then try again.',
    retry: 'Try again',
    empty: 'No matching equipment',
    emptyHint: 'Try a broader search or clear your filters. If there are no listings yet, publish the first one.',
    publish: 'List your equipment',
    details: 'View details',
    perDay: '/ day',
    totalPrice: 'Total price',
    onRequest: 'Price on request',
    noImage: 'Image not provided',
    noLocation: 'Location not provided',
    availableLabel: 'Available',
    unavailableLabel: 'Unavailable',
    unknownLabel: 'Availability unconfirmed',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    remove: 'Remove filter',
    invalidBudget: 'Maximum price must be greater than or equal to minimum price.',
    other: 'Uncategorised',
    unknownType: 'Type not specified',
    currencyNote: 'Price filters use the backend\'s existing USD values.',
  },
  ka: {
    eyebrow: 'სამშენებლო ტექნიკა',
    title: 'სწორი ტექნიკა. მარტივი არჩევანი.',
    subtitle: 'დაათვალიერეთ სამშენებლო ტექნიკა და აღჭურვილობა. მოძებნეთ კატეგორიის, ტიპის, მდებარეობისა და დღიური ქირის ან მთლიანი ფასის მიხედვით.',
    search: 'ტექნიკის ძებნა',
    searchHint: 'დასახელება, ტექნიკის ტიპი ან საკვანძო სიტყვა',
    filters: 'ძიების დაზუსტება',
    reset: 'ფილტრების გასუფთავება',
    category: 'კატეგორია',
    allCategories: 'ყველა კატეგორია',
    type: 'ტექნიკის ტიპი',
    allTypes: 'ყველა ტიპი',
    location: 'მდებარეობა',
    locationHint: 'ქალაქი ან რაიონი',
    priceType: 'ფასის ტიპი',
    rental: 'ქირავება (დღეში)',
    sale: 'გასაყიდლად (მთლიანი)',
    budget: 'ფასის დიაპაზონი',
    minimum: 'მინიმალური',
    maximum: 'მაქსიმალური',
    available: 'მხოლოდ ხელმისაწვდომი განცხადებები',
    availabilityHint: 'ეს მხოლოდ განცხადების სტატუსია; დაჯავშნის თარიღები ცალკე უნდა შემოწმდეს.',
    results: 'შედეგები',
    listings: 'განცხადება',
    sort: 'დალაგება',
    newest: 'ჯერ ახალი',
    low: 'ფასი: ზრდადობით',
    high: 'ფასი: კლებადობით',
    name: 'დასახელების მიხედვით',
    grid: 'ბადის ხედი',
    list: 'სიის ხედი',
    loading: 'ტექნიკა იტვირთება…',
    failed: 'ტექნიკის ჩატვირთვა ვერ მოხერხდა.',
    failedHint: 'შეამოწმეთ, გაშვებულია თუ არა სერვერი და სცადეთ ხელახლა.',
    retry: 'ხელახლა ცდა',
    empty: 'შესაბამისი ტექნიკა ვერ მოიძებნა',
    emptyHint: 'შეცვალეთ საძიებო სიტყვა ან გაასუფთავეთ ფილტრები. თუ განცხადებები ჯერ არ არის, დაამატეთ პირველი.',
    publish: 'ტექნიკის დამატება',
    details: 'დეტალების ნახვა',
    perDay: '/ დღე',
    totalPrice: 'მთლიანი ფასი',
    onRequest: 'ფასი შეთანხმებით',
    noImage: 'სურათი არ არის',
    noLocation: 'მდებარეობა მითითებული არ არის',
    availableLabel: 'ხელმისაწვდომია',
    unavailableLabel: 'მიუწვდომელია',
    unknownLabel: 'ხელმისაწვდომობა დაუდასტურებელია',
    previous: 'წინა',
    next: 'შემდეგი',
    page: 'გვერდი',
    of: '/',
    remove: 'ფილტრის წაშლა',
    invalidBudget: 'მაქსიმალური ფასი მინიმალურზე ნაკლები არ უნდა იყოს.',
    other: 'კატეგორია მითითებული არ არის',
    unknownType: 'ტიპი მითითებული არ არის',
    currencyNote: 'ფასის ფილტრები იყენებს სერვერზე არსებულ ფასებს აშშ დოლარში.',
  },
  ru: {
    eyebrow: 'СТРОИТЕЛЬНАЯ ТЕХНИКА',
    title: 'Нужная техника. Понятный выбор.',
    subtitle: 'Выбирайте строительную технику и оборудование. Уточняйте поиск по категории, типу, местоположению и стоимости аренды в день или общей цене продажи.',
    search: 'Поиск техники',
    searchHint: 'Название, тип техники или ключевое слово',
    filters: 'Уточнить поиск',
    reset: 'Сбросить фильтры',
    category: 'Категория',
    allCategories: 'Все категории',
    type: 'Тип техники',
    allTypes: 'Все типы техники',
    location: 'Местоположение',
    locationHint: 'Город или район',
    priceType: 'Тип цены',
    rental: 'Аренда (в день)',
    sale: 'Для продажи (итого)',
    budget: 'Диапазон цен',
    minimum: 'Минимум',
    maximum: 'Максимум',
    available: 'Только доступные объявления',
    availabilityHint: 'Это статус объявления; доступность на даты бронирования проверяется отдельно.',
    results: 'Результаты',
    listings: 'объявлений',
    sort: 'Сортировка',
    newest: 'Сначала новые',
    low: 'Цена: по возрастанию',
    high: 'Цена: по убыванию',
    name: 'По названию',
    grid: 'Плитки',
    list: 'Список',
    loading: 'Загрузка техники…',
    failed: 'Не удалось загрузить технику.',
    failedHint: 'Проверьте, запущен ли сервер, и повторите попытку.',
    retry: 'Повторить',
    empty: 'Подходящая техника не найдена',
    emptyHint: 'Измените запрос или сбросьте фильтры. Если объявлений пока нет, добавьте первое.',
    publish: 'Разместить технику',
    details: 'Подробнее',
    perDay: '/ день',
    totalPrice: 'Итоговая цена',
    onRequest: 'Цена по запросу',
    noImage: 'Изображение отсутствует',
    noLocation: 'Местоположение не указано',
    availableLabel: 'Доступно',
    unavailableLabel: 'Недоступно',
    unknownLabel: 'Доступность не подтверждена',
    previous: 'Назад',
    next: 'Далее',
    page: 'Страница',
    of: 'из',
    remove: 'Удалить фильтр',
    invalidBudget: 'Максимальная цена не должна быть меньше минимальной.',
    other: 'Без категории',
    unknownType: 'Тип не указан',
    currencyNote: 'Фильтры используют текущие цены на сервере в долларах США.',
  },
};

const normalize = (value) => String(value ?? '').trim().toLowerCase();

function findCategory(value) {
  const key = normalize(value);
  return CATEGORY_ROWS.find(
    (category) =>
      normalize(category.id) === key ||
      category.names.some((name) => normalize(name) === key)
  );
}

function findType(category, value) {
  const key = normalize(value);
  if (!key) return undefined;
  const types = category
    ? category.types
    : CATEGORY_ROWS.flatMap((entry) => entry.types);
  return types.find((row) => row.some((label) => normalize(label) === key));
}

function normalizeItem(item) {
  const category = findCategory(item.categoryId ?? item.category);
  const type = findType(
    category,
    item.equipmentType ?? item.equipment_type ?? item.type
  );
  
  // Check for rental price
  const rawRentalPrice = item.pricePerDay ?? item.price_per_day ?? item.daily_price;
  const rentalPrice = rawRentalPrice === '' || rawRentalPrice == null ? NaN : Number(rawRentalPrice);
  
  // Check for sale price
  const rawSalePrice = item.salePrice ?? item.sale_price ?? item.total_price;
  const salePrice = rawSalePrice === '' || rawSalePrice == null ? NaN : Number(rawSalePrice);
  
  // Determine listing type
  let listingType = null; // 'rental', 'sale', or null
  if (Number.isFinite(rentalPrice) && rentalPrice >= 0) listingType = 'rental';
  if (Number.isFinite(salePrice) && salePrice >= 0) listingType = 'sale';
  
  const rawAvailability = item.availabilityStatus ?? item.availability_status;
  let available = null;
  if ([true, 1, '1', 'true'].includes(rawAvailability)) available = true;
  if ([false, 0, '0', 'false'].includes(rawAvailability)) available = false;

  return {
    ...item,
    name: String(item.name ?? ''),
    description: String(item.description ?? ''),
    location: String(item.location ?? ''),
    categoryId: category?.id ?? '',
    typeId: type?.[0] ?? '',
    rentalPrice: Number.isFinite(rentalPrice) && rentalPrice >= 0 ? rentalPrice : null,
    salePrice: Number.isFinite(salePrice) && salePrice >= 0 ? salePrice : null,
    listingType,
    image: item.imageUrl ?? item.image_url ?? '',
    available,
    timestamp: new Date(item.createdAt ?? item.created_at ?? 0).getTime() || 0,
  };
}

function EquipmentImage({ source, name, fallback }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [source]);

  if (!source || failed) {
    return (
      <div className="br-image-placeholder">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <rect x="8" y="10" width="32" height="28" rx="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M9 33l10-10 8 8 5-5 8 8" />
        </svg>
        <span>{fallback}</span>
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function Equipment({ language = 'en' }) {
  const lang = Object.prototype.hasOwnProperty.call(TEXT, language)
    ? language
    : 'en';
  const labelIndex = { en: 0, ka: 1, ru: 2 }[lang];
  const t = TEXT[lang];

  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');
  const [reload, setReload] = useState(0);

  const search = params.get('search') || '';
  const categoryId = params.get('category') || '';
  const typeId = params.get('type') || '';
  const location = params.get('location') || '';
  const priceType = params.get('priceType') || ''; // 'rental', 'sale', or empty for both
  const minimum = params.get('min') || '';
  const maximum = params.get('max') || '';
  const onlyAvailable = params.get('available') === '1';
  const sort = params.get('sort') || 'newest';
  const view = params.get('view') === 'list' ? 'list' : 'grid';

  const requestedPage = Number(params.get('page'));
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const currentCategory = findCategory(categoryId);
  const allTypes = CATEGORY_ROWS.flatMap((category) => category.types);
  const uniqueTypes = Array.from(
    new Map(allTypes.map((row) => [row[0], row])).values()
  );
  const visibleTypes = currentCategory?.types ?? uniqueTypes;

  const currentType = visibleTypes.find((row) => row[0] === typeId);
  const locale = { en: 'en-US', ka: 'ka-GE', ru: 'ru-RU' }[lang];
  const money = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });

  function changeFilters(changes) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === '' || value == null) next.delete(key);
        else next.set(key, String(value));
      });
      if (!Object.prototype.hasOwnProperty.call(changes, 'page')) {
        next.delete('page');
      }
      return next;
    }, { replace: true });
  }

  function resetFilters() {
    const next = new URLSearchParams();
    if (view === 'list') next.set('view', 'list');
    setParams(next, { replace: true });
  }

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadEquipment() {
      setStatus('loading');
      try {
        const base = (
          process.env.REACT_APP_API_URL || '/api'
        ).replace(/\/+$/, '');

        const response = await axios.get(`${base}/equipment`, {
          signal: controller.signal,
        });

        if (!Array.isArray(response.data)) {
          throw new Error('Unexpected equipment response');
        }

        if (active) {
          setItems(response.data.map(normalizeItem));
          setStatus('ready');
        }
      } catch (error) {
        if (active) {
          setItems([]);
          setStatus('error');
        }
      }
    }

    loadEquipment();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reload]);

  const invalidBudget =
    minimum !== '' &&
    maximum !== '' &&
    Number(minimum) > Number(maximum);

  const filtered = useMemo(() => {
    const query = normalize(search);
    const place = normalize(location);

    const result = items.filter((item) => {
      const category = findCategory(item.categoryId);
      const type = findType(category, item.typeId);

      // Search translated category/type labels as well as listing text.
      const searchable = normalize([
        item.name,
        item.description,
        item.location,
        ...(category?.names ?? []),
        ...(type?.slice(1) ?? []),
      ].join(' '));

      if (query && !searchable.includes(query)) return false;
      if (categoryId && item.categoryId !== categoryId) return false;
      if (typeId && item.typeId !== typeId) return false;
      if (place && !normalize(item.location).includes(place)) return false;
      if (onlyAvailable && item.available !== true) return false;
      
      // Price type filter
      if (priceType === 'rental' && item.listingType !== 'rental') return false;
      if (priceType === 'sale' && item.listingType !== 'sale') return false;
      
      // Price range filter
      const price = priceType === 'sale' ? item.salePrice : item.rentalPrice;
      if (minimum !== '' && (price == null || price < Number(minimum))) return false;
      if (maximum !== '' && (price == null || price > Number(maximum))) return false;
      
      return true;
    });

    result.sort((a, b) => {
      if (sort === 'low' || sort === 'high') {
        const priceA = priceType === 'sale' ? a.salePrice : a.rentalPrice;
        const priceB = priceType === 'sale' ? b.salePrice : b.rentalPrice;
        if (priceA == null && priceB == null) return 0;
        if (priceA == null) return 1;
        if (priceB == null) return -1;
        return sort === 'low' ? priceA - priceB : priceB - priceA;
      }
      if (sort === 'name') return a.name.localeCompare(b.name, locale);
      return b.timestamp - a.timestamp;
    });

    return result;
  }, [
    items, search, categoryId, typeId, location, priceType,
    minimum, maximum, onlyAvailable, sort, locale,
  ]);

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pageNumber, totalPages);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const chips = [
    search && { key: 'search', text: `${t.search}: ${search}` },
    categoryId && {
      key: 'category',
      text: currentCategory?.names[labelIndex] ?? categoryId,
    },
    typeId && { key: 'type', text: currentType?.[labelIndex + 1] ?? typeId },
    location && { key: 'location', text: `${t.location}: ${location}` },
    priceType && { key: 'priceType', text: priceType === 'rental' ? t.rental : t.sale },
    minimum !== '' && { key: 'min', text: `${t.minimum}: ${money.format(Number(minimum))}` },
    maximum !== '' && { key: 'max', text: `${t.maximum}: ${money.format(Number(maximum))}` },
    onlyAvailable && { key: 'available', text: t.available },
  ].filter(Boolean);

  return (
    <main className="br-page" lang={lang}>
      <header className="br-intro">
        <p className="br-eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p className="br-subtitle">{t.subtitle}</p>

        <div className="br-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <label className="br-sr-only" htmlFor="br-search">{t.search}</label>
          <input
            id="br-search"
            type="search"
            placeholder={t.searchHint}
            value={search}
            onChange={(event) => changeFilters({ search: event.target.value })}
          />
        </div>
      </header>

      <div className="br-layout">
        <aside className="br-sidebar" aria-label={t.filters}>
          <div className="br-sidebar-heading">
            <h2>{t.filters}</h2>
            <button type="button" className="br-text-button" onClick={resetFilters}>
              {t.reset}
            </button>
          </div>

          <div className="br-field">
            <label htmlFor="br-category">{t.category}</label>
            <select
              id="br-category"
              value={categoryId}
              onChange={(event) => changeFilters({
                category: event.target.value,
                type: '',
              })}
            >
              <option value="">{t.allCategories}</option>
              {CATEGORY_ROWS.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.names[labelIndex]}
                </option>
              ))}
            </select>
          </div>

          <div className="br-field">
            <label htmlFor="br-type">{t.type}</label>
            <select
              id="br-type"
              value={typeId}
              onChange={(event) => changeFilters({ type: event.target.value })}
            >
              <option value="">{t.allTypes}</option>
              {visibleTypes.map((row) => (
                <option key={row[0]} value={row[0]}>
                  {row[labelIndex + 1]}
                </option>
              ))}
            </select>
          </div>

          <div className="br-field">
            <label htmlFor="br-location">{t.location}</label>
            <input
              id="br-location"
              placeholder={t.locationHint}
              value={location}
              onChange={(event) => changeFilters({ location: event.target.value })}
            />
          </div>

          <div className="br-field">
            <label htmlFor="br-priceType">{t.priceType}</label>
            <select
              id="br-priceType"
              value={priceType}
              onChange={(event) => changeFilters({ priceType: event.target.value })}
            >
              <option value="">All</option>
              <option value="rental">{t.rental}</option>
              <option value="sale">{t.sale}</option>
            </select>
          </div>

          <fieldset className="br-budget">
            <legend>{t.budget} · USD</legend>
            <div className="br-price-fields">
              <div className="br-field">
                <label htmlFor="br-min">{t.minimum}</label>
                <input
                  id="br-min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={minimum}
                  onChange={(event) => changeFilters({ min: event.target.value })}
                />
              </div>
              <div className="br-field">
                <label htmlFor="br-max">{t.maximum}</label>
                <input
                  id="br-max"
                  type="number"
                  min="0"
                  step="0.01"
                  value={maximum}
                  onChange={(event) => changeFilters({ max: event.target.value })}
                />
              </div>
            </div>
            {invalidBudget && <p className="br-validation" role="alert">{t.invalidBudget}</p>}
            <p className="br-help">{t.currencyNote}</p>
          </fieldset>

          <label className="br-checkbox">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(event) => changeFilters({
                available: event.target.checked ? '1' : '',
              })}
            />
            <span>{t.available}</span>
          </label>
          <p className="br-help">{t.availabilityHint}</p>

          <Link className="br-publish" to="/list-equipment">
            {t.publish}
          </Link>
        </aside>

        <section className="br-results" aria-label={t.results}>
          <div className="br-toolbar">
            <div className="br-result-count" role="status">
              <strong>{status === 'ready' ? filtered.length : '—'}</strong>
              <span>{t.listings}</span>
            </div>

            <div className="br-toolbar-controls">
              <label className="br-sr-only" htmlFor="br-sort">{t.sort}</label>
              <select
                id="br-sort"
                value={sort}
                onChange={(event) => changeFilters({ sort: event.target.value })}
              >
                <option value="newest">{t.newest}</option>
                <option value="low">{t.low}</option>
                <option value="high">{t.high}</option>
                <option value="name">{t.name}</option>
              </select>

              <div className="br-view-switch">
                <button
                  type="button"
                  aria-label={t.grid}
                  title={t.grid}
                  aria-pressed={view === 'grid'}
                  onClick={() => changeFilters({ view: 'grid' })}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label={t.list}
                  title={t.list}
                  aria-pressed={view === 'list'}
                  onClick={() => changeFilters({ view: 'list' })}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 5h16M4 12h16M4 19h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="br-chips">
              {chips.map((chip) => (
                <button
                  type="button"
                  key={chip.key}
                  aria-label={`${t.remove}: ${chip.text}`}
                  onClick={() => changeFilters(
                    chip.key === 'category'
                      ? { category: '', type: '' }
                      : { [chip.key]: '' }
                  )}
                >
                  {chip.text}<span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}

          {status === 'loading' && (
            <div className="br-state" role="status">
              <div className="br-loading-line" />
              <h2>{t.loading}</h2>
            </div>
          )}

          {status === 'error' && (
            <div className="br-state" role="alert">
              <h2>{t.failed}</h2>
              <p>{t.failedHint}</p>
              <button className="br-button" onClick={() => setReload((value) => value + 1)}>
                {t.retry}
              </button>
            </div>
          )}

          {status === 'ready' && pageItems.length === 0 && (
            <div className="br-state">
              <span className="br-empty-line" aria-hidden="true" />
              <h2>{t.empty}</h2>
              <p>{t.emptyHint}</p>
              <div className="br-state-actions">
                <button className="br-button" onClick={resetFilters}>{t.reset}</button>
                <Link className="br-outline-button" to="/list-equipment">{t.publish}</Link>
              </div>
            </div>
          )}

          {status === 'ready' && pageItems.length > 0 && (
            <>
              <div className={`br-cards br-cards--${view}`}>
                {pageItems.map((item) => {
                  const category = findCategory(item.categoryId);
                  const type = findType(category, item.typeId);
                  const availability = item.available === true
                    ? t.availableLabel
                    : item.available === false
                      ? t.unavailableLabel
                      : t.unknownLabel;

                  return (
                    <article className="br-card" key={item.id}>
                      <Link
                        to={`/equipment/${item.id}`}
                        className="br-card-image"
                        aria-label={`${t.details}: ${item.name}`}
                      >
                        <EquipmentImage
                          source={item.image}
                          name={item.name}
                          fallback={t.noImage}
                        />
                      </Link>

                      <div className="br-card-body">
                        <div className="br-card-topline">
                          <span className="br-card-category">
                            {category?.names[labelIndex] ?? t.other}
                          </span>
                          <span className={`br-status ${
                            item.available === true ? 'br-status--available' : ''
                          }`}>
                            {availability}
                          </span>
                        </div>

                        <h2>
                          <Link to={`/equipment/${item.id}`}>{item.name}</Link>
                        </h2>

                        <p className="br-card-type">
                          {type?.[labelIndex + 1] ?? t.unknownType}
                        </p>
                        <p className="br-card-description">{item.description}</p>
                        <p className="br-card-location">
                          {item.location || t.noLocation}
                        </p>

                        <div className="br-card-footer">
                          <p className="br-card-price">
                            {item.listingType === 'rental' && (
                              <>
                                {item.rentalPrice == null ? t.onRequest : money.format(item.rentalPrice)}
                                {item.rentalPrice != null && <span>{t.perDay}</span>}
                              </>
                            )}
                            {item.listingType === 'sale' && (
                              <>
                                {item.salePrice == null ? t.onRequest : money.format(item.salePrice)}
                                {item.salePrice != null && <span>{t.totalPrice}</span>}
                              </>
                            )}
                            {!item.listingType && t.onRequest}
                          </p>
                          <Link className="br-details" to={`/equipment/${item.id}`}>
                            {t.details}
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <nav className="br-pagination" aria-label={t.page}>
                  <button
                    disabled={page <= 1}
                    onClick={() => changeFilters({ page: page - 1 })}
                  >
                    {t.previous}
                  </button>
                  <span>{t.page} {page} {t.of} {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => changeFilters({ page: page + 1 })}
                  >
                    {t.next}
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}