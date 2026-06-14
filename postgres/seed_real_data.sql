-- Seed realistic categories and products for catalog schema
-- Run: docker exec -i retail_container psql -U admin -d omni_retail_core < seed_real_data.sql

BEGIN;

-- Clean test data
DELETE FROM catalog.products;
DELETE FROM catalog.categories;

-- ============================================================
-- CATEGORIES (with realistic hierarchy)
-- ============================================================
INSERT INTO catalog.categories (id, code, name, description, parent_id, slug, active, sort_order) VALUES
(1, 'electronics', 'Электроника', 'Смартфоны, ноутбуки, планшеты и аксессуары', NULL, 'electronics', true, 1),
(2, 'smartphones', 'Смартфоны', 'Мобильные телефоны и смартфоны', 1, 'smartphones', true, 10),
(3, 'laptops', 'Ноутбуки', 'Ноутбуки и ультрабуки', 1, 'laptops', true, 20),
(4, 'tablets', 'Планшеты', 'Планшетные компьютеры', 1, 'tablets', true, 30),
(5, 'audio', 'Аудио', 'Наушники, колонки, микрофоны', 1, 'audio', true, 40),
(6, 'wearables', 'Носимые устройства', 'Умные часы и фитнес-браслеты', 1, 'wearables', true, 50),
(7, 'accessories', 'Аксессуары', 'Чехлы, зарядки, кабели', 1, 'accessories', true, 60),
(8, 'home-appliances', 'Бытовая техника', 'Техника для дома и кухни', NULL, 'home-appliances', true, 2),
(9, 'kitchen', 'Техника для кухни', 'Микроволновки, блендеры, чайники', 8, 'kitchen', true, 10),
(10, 'cleaning', 'Техника для уборки', 'Пылесосы, роботы-пылесосы', 8, 'cleaning', true, 20),
(11, 'gaming', 'Игры и развлечения', 'Игровые консоли, геймпады, VR', NULL, 'gaming', true, 3),
(12, 'consoles', 'Игровые консоли', 'PlayStation, Xbox, Nintendo', 11, 'consoles', true, 10),
(13, 'peripherals', 'Игровые аксессуары', 'Геймпады, клавиатуры, мыши', 11, 'peripherals', true, 20);

-- Reset sequence
SELECT setval('catalog.categories_id_seq', (SELECT MAX(id) FROM catalog.categories));

-- ============================================================
-- PRODUCTS (realistic names, prices, SKUs)
-- ============================================================
INSERT INTO catalog.products (id, code, name, description, category_id, price, cost, sku, active, created_at, updated_at) VALUES
-- Smartphones (cat 2)
(1, 'iphone-15-pro-max', 'iPhone 15 Pro Max 256GB', 'Смартфон Apple с чипом A17 Pro, камера 48 Мп, титановый корпус', 2, 189990.00, 140000.00, 'APL-IP15PM-256', true, now(), now()),
(2, 'iphone-15-pro', 'iPhone 15 Pro 128GB', 'Компактный флагман Apple с A17 Pro и Dynamic Island', 2, 149990.00, 110000.00, 'APL-IP15P-128', true, now(), now()),
(3, 'samsung-s24-ultra', 'Samsung Galaxy S24 Ultra 256GB', 'Флагман на Snapdragon 8 Gen 3, S Pen, камера 200 Мп', 2, 139990.00, 100000.00, 'SAM-S24U-256', true, now(), now()),
(4, 'samsung-s24', 'Samsung Galaxy S24 128GB', 'Компактный флагман Samsung с AI-функциями', 2, 89990.00, 65000.00, 'SAM-S24-128', true, now(), now()),
(5, 'xiaomi-14', 'Xiaomi 14 256GB', 'Флагман Xiaomi с Leica камерой и Snapdragon 8 Gen 3', 2, 69990.00, 48000.00, 'XMI-14-256', true, now(), now()),
(6, 'pixel-8-pro', 'Google Pixel 8 Pro 128GB', 'Смартфон Google с лучшей камерой и чистым Android', 2, 79990.00, 55000.00, 'GOO-P8P-128', true, now(), now()),
(7, 'oneplus-12', 'OnePlus 12 256GB', 'Быстрый флагман с зарядкой 100W и Hasselblad камерой', 2, 64990.00, 45000.00, 'ONE-12-256', true, now(), now()),

-- Laptops (cat 3)
(8, 'macbook-pro-14-m3', 'MacBook Pro 14" M3 Pro 18GB/512GB', 'Ноутбук Apple с чипом M3 Pro, дисплей Liquid Retina XDR', 3, 249990.00, 180000.00, 'APL-MBP14-M3', true, now(), now()),
(9, 'macbook-pro-16-m3', 'MacBook Pro 16" M3 Max 36GB/1TB', 'Максимальная мощность Apple для профессионалов', 3, 399990.00, 290000.00, 'APL-MBP16-M3M', true, now(), now()),
(10, 'macbook-air-15-m3', 'MacBook Air 15" M3 16GB/256GB', 'Тонкий и лёгкий ноутбук Apple с большим экраном', 3, 179990.00, 130000.00, 'APL-MBA15-M3', true, now(), now()),
(11, 'asus-rog-strix-g16', 'ASUS ROG Strix G16 RTX 4070', 'Игровой ноутбук с RTX 4070 и 240Hz экраном', 3, 189990.00, 140000.00, 'ASU-ROGG16-4070', true, now(), now()),
(12, 'dell-xps-15', 'Dell XPS 15 OLED i7/32GB/1TB', 'Премиальный ноутбук с 3.5K OLED дисплеем', 3, 219990.00, 160000.00, 'DEL-XPS15-OLED', true, now(), now()),
(13, 'lenovo-thinkpad-x1', 'Lenovo ThinkPad X1 Carbon Gen 11', 'Бизнес-ноутбук с клавиатурой мирового класса', 3, 199990.00, 145000.00, 'LEN-X1C-G11', true, now(), now()),

-- Tablets (cat 4)
(14, 'ipad-pro-12-m4', 'iPad Pro 12.9" M4 256GB Wi-Fi', 'Самый мощный планшет Apple с дисплеем tandem OLED', 4, 149990.00, 110000.00, 'APL-IPP12-M4', true, now(), now()),
(15, 'ipad-air-m2', 'iPad Air 11" M2 128GB Wi-Fi', 'Универсальный планшет Apple для работы и творчества', 4, 79990.00, 58000.00, 'APL-IPA11-M2', true, now(), now()),
(16, 'samsung-tab-s9-ultra', 'Samsung Galaxy Tab S9 Ultra 256GB', 'Премиальный Android-планшет с 14.6" AMOLED', 4, 129990.00, 95000.00, 'SAM-TS9U-256', true, now(), now()),

-- Audio (cat 5)
(17, 'airpods-pro-2', 'Apple AirPods Pro 2 (USB-C)', 'TWS наушники с ANC и адаптивным звуком', 5, 24990.00, 16000.00, 'APL-APP2-USBC', true, now(), now()),
(18, 'airpods-max', 'Apple AirPods Max', 'Полноразмерные наушники Apple с лучшим ANC', 5, 69990.00, 48000.00, 'APL-APMAX', true, now(), now()),
(19, 'sony-wh1000xm5', 'Sony WH-1000XM5', 'Лучшие беспроводные наушники с шумоподавлением', 5, 34990.00, 24000.00, 'SNY-WH5', true, now(), now()),
(20, 'sony-wf1000xm5', 'Sony WF-1000XM5', 'Компактные TWS с лучшим в классе шумоподавлением', 5, 27990.00, 19000.00, 'SNY-WF5', true, now(), now()),
(21, 'bose-qc-ultra', 'Bose QuietComfort Ultra', 'Премиальные наушники с иммерсивным звуком', 5, 39990.00, 27000.00, 'BSE-QCU', true, now(), now()),
(22, 'jbl-charge-5', 'JBL Charge 5', 'Портативная Bluetooth колонка с защитой IP67', 5, 14990.00, 9000.00, 'JBL-CH5', true, now(), now()),

-- Wearables (cat 6)
(23, 'apple-watch-ultra-2', 'Apple Watch Ultra 2 49mm', 'Самые прочные и функциональные часы Apple', 6, 89990.00, 65000.00, 'APL-AWU2-49', true, now(), now()),
(24, 'apple-watch-series-9', 'Apple Watch Series 9 45mm', 'Умные часы Apple с жестом двойного касания', 6, 49990.00, 35000.00, 'APL-AWS9-45', true, now(), now()),
(25, 'samsung-watch-6-classic', 'Samsung Galaxy Watch 6 Classic', 'Классические смарт-часы Samsung с безелем', 6, 39990.00, 28000.00, 'SAM-W6C', true, now(), now()),
(26, 'garmin-fenix-7', 'Garmin Fenix 7 Sapphire Solar', 'Мультиспортивные часы с солнечной подзарядкой', 6, 74990.00, 52000.00, 'GAR-F7SS', true, now(), now()),

-- Accessories (cat 7)
(27, 'magsafe-charger', 'Apple MagSafe Charger', 'Беспроводная зарядка для iPhone', 7, 4990.00, 2500.00, 'APL-MSCHG', true, now(), now()),
(28, 'usbc-hub-7in1', 'USB-C Hub 7-in-1 Satechi', 'Хаб с HDMI 4K, USB 3.0, SD card reader', 7, 6990.00, 4000.00, 'SAT-HUB7', true, now(), now()),
(29, 'anker-powerbank-20k', 'Anker PowerCore 20000mAh', 'Портативный аккумулятор с быстрой зарядкой', 7, 4490.00, 2800.00, 'ANK-PC20K', true, now(), now()),
(30, 'iphone-15-case', 'Силиконовый чехол iPhone 15 Pro', 'Оригинальный силиконовый чехол Apple с MagSafe', 7, 5990.00, 3000.00, 'APL-CS15P', true, now(), now()),

-- Kitchen appliances (cat 9)
(31, 'xiaomi-air-fryer', 'Xiaomi Smart Air Fryer 3.5L', 'Умная аэрогриль с управлением через приложение', 9, 8990.00, 5500.00, 'XMI-AF35', true, now(), now()),
(32, 'bosh-mqm3050', 'Bosch MMB3050 блендер', 'Стационарный блендер 800W с Tritan чашей', 9, 6490.00, 4000.00, 'BSH-MMB3050', true, now(), now()),
(33, 'kettle-bosch', 'Bosch TWK8613 чайник', 'Электрический чайник с поддержанием температуры', 9, 7990.00, 5000.00, 'BSH-TWK8613', true, now(), now()),

-- Cleaning (cat 10)
(34, 'roborock-s8-pro', 'Roborock S8 Pro Ultra', 'Робот-пылесос с самоочисткой и влажной уборкой', 10, 79990.00, 55000.00, 'RBR-S8PU', true, now(), now()),
(35, 'dyson-v15', 'Dyson V15 Detect', 'Беспроводной пылесос с лазерной подсветкой пыли', 10, 69990.00, 48000.00, 'DYS-V15D', true, now(), now()),
(36, 'dreame-l20-ultra', 'Dreame L20 Ultra', 'Робот-пылесос с выдвижной шваброй', 10, 89990.00, 62000.00, 'DRM-L20U', true, now(), now()),

-- Consoles (cat 12)
(37, 'ps5-slim', 'Sony PlayStation 5 Slim', 'Игровая консоль нового поколения Sony', 12, 54990.00, 40000.00, 'SNY-PS5S', true, now(), now()),
(38, 'xbox-series-x', 'Microsoft Xbox Series X 1TB', 'Самая мощная консоль Microsoft', 12, 49990.00, 36000.00, 'MSF-XSX-1TB', true, now(), now()),
(39, 'steam-oled-1tb', 'Valve Steam Deck OLED 1TB', 'Портативный ПК для игр', 12, 69990.00, 50000.00, 'VLV-SDOLED', true, now(), now()),
(40, 'nintendo-switch-oled', 'Nintendo Switch OLED', 'Гибридная консоль Nintendo с OLED экраном', 12, 34990.00, 25000.00, 'NTD-SWOLED', true, now(), now()),

-- Gaming peripherals (cat 13)
(41, 'dualsense-edge', 'Sony DualSense Edge', 'Профессиональный геймпад для PS5', 13, 19990.00, 13000.00, 'SNY-DSE', true, now(), now()),
(42, 'xbox-elite-s2', 'Xbox Elite Controller Series 2', 'Профессиональный геймпад Xbox', 13, 15990.00, 10000.00, 'MSF-ES2', true, now(), now()),
(43, 'logitech-g-pro-x', 'Logitech G Pro X Superlight 2', 'Ультралёгкая игровая мышь 60g', 13, 12990.00, 8000.00, 'LOG-GPXS2', true, now(), now()),
(44, 'razer-huntsman-v3', 'Razer Huntsman V3 Pro', 'Игровая клавиатура с аналоговыми переключателями', 13, 24990.00, 16000.00, 'RZR-HV3P', true, now(), now());

-- Reset sequence
SELECT setval('catalog.products_id_seq', (SELECT MAX(id) FROM catalog.products));

COMMIT;
