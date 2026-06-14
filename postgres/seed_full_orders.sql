-- Full seed: addresses + multi-item orders + status history
-- Run: docker exec -i retail_container psql -U admin -d omni_retail_core < seed_full_orders.sql
BEGIN;

-- ── Clean ─────────────────────────────────────────────────────
DELETE FROM sales.order_status_history;
DELETE FROM sales.order_items;
DELETE FROM sales.orders;
DELETE FROM core.user_addresses;
DELETE FROM core.addresses;
ALTER SEQUENCE sales.orders_id_seq RESTART WITH 1;
ALTER SEQUENCE sales.order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE sales.order_status_history_id_seq RESTART WITH 1;
ALTER SEQUENCE core.addresses_id_seq RESTART WITH 1;

-- ── ADDRESSES (realistic Russian addresses) ───────────────────
-- We use existing user_ids from core.users
INSERT INTO core.addresses (id, user_id, region_id, postal_code, street, house, building, apartment, is_primary, comment) VALUES
-- Moscow users
(1, 53, 1, '101000', 'ул. Тверская', '12', 'А', '45', true, 'Домофон 45'),
(2, 54, 1, '105005', 'ул. Арбат', '3', NULL, '12', true, ''),
(3, 55, 1, '119049', 'Ленинский проспект', '42', NULL, '78', true, 'Подъезд 3'),
(4, 56, 1, '127006', 'ул. Садовая-Самотёчная', '15', 'Б', '101', true, 'Офис 101'),
(5, 57, 1, '109012', 'ул. Маросейка', '7', NULL, '22', true, ''),
(6, 59, 1, '115432', 'Варшавское шоссе', '26', 'к.2', '15', false, 'Работа'),
(7, 60, 1, '123317', 'Пресненская наб.', '10', NULL, '302', true, 'Москва-Сити башня Империя'),
(8, 63, 1, '107076', 'ул. Стромынка', '19', NULL, '56', true, ''),
(9, 64, 1, '117218', 'ул. Вавилова', '62', 'к.1', '88', true, ''),
(10, 65, 1, '129223', 'Проспект Мира', '124', NULL, '33', true, ''),

-- SPb users
(11, 66, 2, '191025', 'Невский проспект', '28', NULL, '14', true, ''),
(12, 67, 2, '197022', 'Каменноостровский пр.', '15', NULL, '7', true, 'Парадная'),
(13, 68, 2, '190000', 'ул. Рубинштейна', '23', NULL, '41', true, ''),
(14, 70, 2, '196158', 'Московское шоссе', '13', 'к.2', '90', true, ''),
(15, 71, 2, '194100', 'ул. Есенина', '5', NULL, '20', true, ''),

-- Kazan
(16, 74, 16, '420111', 'ул. Баумана', '36', NULL, '10', true, ''),
(17, 75, 16, '420095', 'ул. Декабристов', '85', NULL, '55', true, ''),
(18, 76, 16, '420066', 'ул. Чистопольская', '20', 'А', '12', true, ''),

-- Novosibirsk
(19, 77, 54, '630099', 'Красный проспект', '50', NULL, '30', true, ''),
(20, 78, 54, '630102', 'ул. Ленина', '12', NULL, '8', true, ''),
(21, 79, 54, '630004', 'ул. Советская', '28', NULL, '45', true, ''),

-- Yekaterinburg
(22, 81, 66, '620014', 'ул. Вайнера', '16', NULL, '22', true, ''),
(23, 82, 66, '620075', 'ул. 8 Марта', '51', NULL, '101', true, ''),
(24, 85, 66, '620026', 'ул. Радищева', '33', 'А', '67', true, ''),

-- More Moscow
(25, 86, 1, '111396', 'ул. Перерва', '24', 'к.1', '110', true, ''),
(26, 87, 1, '129344', 'пр-д Нансена', '4', NULL, '77', true, ''),
(27, 88, 1, '117335', 'ул. Вавилова', '79', NULL, '44', true, ''),
(28, 89, 1, '105203', 'Измайловское шоссе', '71', 'к.2', '19', true, ''),
(29, 90, 1, '125445', 'ул. Смольная', '24', 'А', '5', true, ''),
(30, 92, 1, '121099', 'ул. Новый Арбат', '21', NULL, '505', true, 'Пентхаус'),
(31, 93, 1, '115184', 'ул. Пятницкая', '25', NULL, '31', true, ''),
(32, 8, 1, '109316', 'Волгоградский проспект', '2', NULL, '18', true, ''),
(33, 30, 1, '123104', 'Большой Палашёвский пер.', '7', NULL, '3', true, ''),
(34, 31, 1, '119571', 'Мичуринский проспект', '25', 'к.2', '90', true, ''),
(35, 32, 1, '111674', 'ул. Покровка', '42', NULL, '28', true, ''),
(36, 33, 1, '107140', 'ул. Верхняя Красносельская', '3', NULL, '15', true, ''),
(37, 34, 1, '111141', 'ш. Энтузиастов', '56', 'к.1', '40', true, ''),
(38, 35, 1, '123154', 'ул. Маршала Тухачевского', '28', NULL, '62', true, ''),
(39, 37, 1, '117485', 'ул. Обручева', '30', 'к.3', '111', true, ''),
(40, 38, 1, '121170', 'Кутузовский проспект', '36', NULL, '150', true, ''),
(41, 41, 1, '109451', 'Рязанский проспект', '86', 'к.1', '70', true, ''),
(42, 42, 1, '129337', 'ул. Снежная', '21', NULL, '55', true, ''),
(43, 43, 1, '127411', 'Алтуфьевское шоссе', '31', NULL, '88', true, ''),
(44, 44, 1, '129626', 'ул. Академика Королёва', '13', 'к.1', '202', true, 'Москва-Сити'),
(45, 45, 1, '115201', 'ул. Автозаводская', '23', NULL, '17', true, ''),
(46, 46, 1, '105318', 'Измайловский проспект', '71', 'к.3', '33', true, ''),
(47, 48, 1, '125481', 'ул. Сходненская', '12', NULL, '60', true, ''),
(48, 49, 1, '117628', 'ул. Академика Мильникова', '5', 'А', '14', true, ''),
(49, 52, 1, '119526', 'Мичуринский проспект', '33', 'к.2', '45', true, '');

SELECT setval('core.addresses_id_seq', (SELECT MAX(id) FROM core.addresses));

-- ── ORDERS (50 orders, 2-4 items each, mixed statuses/channels) ──
INSERT INTO sales.orders (id, user_id, order_date, status, total_amount, payment_method_code, delivery_type_code, promo_code, discount_amount, source_channel, comments, tracking_number, currency_code, address_id, created_at, updated_at)
VALUES
  -- Recent: mixed statuses, multi-item
  (1,  53, CURRENT_DATE - 0,  'processing', 234980, 'card',            'courier_express',   NULL,      0,    'web',    'Доставка с 10:00 до 14:00',   'TRK-2026-001', 'RUB', 1,  now(), now()),
  (2,  54, CURRENT_DATE - 1,  'confirmed',  94980,  'tinkoff_pay',     'courier_standard',  'SALE10',  7499, 'mobile', '',                          'TRK-2026-002', 'RUB', 2,  now(), now()),
  (3,  55, CURRENT_DATE - 1,  'pending',    59980,  'apple_pay',       'pickup_point',      NULL,      0,    'web',    'Пункт выдачи ТЦ Мега',       'TRK-2026-003', 'RUB', 3,  now(), now()),
  (4,  56, CURRENT_DATE - 2,  'shipped',    284980, 'sbp',             'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-004', 'RUB', 4,  now(), now()),
  (5,  57, CURRENT_DATE - 2,  'delivered',  39980,  'card',            'courier_standard',  NULL,      0,    'mobile', 'Оставить у двери',           'TRK-2026-005', 'RUB', 5,  now(), now()),

  (6,  59, CURRENT_DATE - 3,  'delivered',  84980,  'sberbank_online', 'courier_next_day',  'WINTER',  5000, 'web',    '',                           'TRK-2026-006', 'RUB', 6,  now(), now()),
  (7,  60, CURRENT_DATE - 3,  'delivered',  27980,  'yoomoney',        'pickup_point',      NULL,      0,    'mobile', 'Самовывоз',                  'TRK-2026-007', 'RUB', 7,  now(), now()),
  (8,  63, CURRENT_DATE - 4,  'cancelled',  139980, 'card',            'courier_standard',  NULL,      0,    'web',    'Клиент отменил — передумал', NULL,           'RUB', 8,  now(), now()),
  (9,  64, CURRENT_DATE - 4,  'delivered',  30980,  'qiwi',            'post_standard',     NULL,      0,    'mobile', '',                           'TRK-2026-009', 'RUB', 9,  now(), now()),
  (10, 65, CURRENT_DATE - 5,  'delivered',  274980, 'card',            'courier_express',   NULL,      0,    'web',    'Подарочная упаковка',        'TRK-2026-010', 'RUB', 10, now(), now()),

  (11, 66, CURRENT_DATE - 5,  'delivered',  89980,  'sbp',             'courier_standard',  'NEWYEAR', 3000, 'web',    '',                           'TRK-2026-011', 'RUB', 11, now(), now()),
  (12, 67, CURRENT_DATE - 6,  'delivered',  64980,  'tinkoff_pay',     'courier_next_day',  NULL,      0,    'mobile', '',                           'TRK-2026-012', 'RUB', 12, now(), now()),
  (13, 68, CURRENT_DATE - 6,  'processing', 109980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-013', 'RUB', 13, now(), now()),
  (14, 70, CURRENT_DATE - 7,  'delivered',  49980,  'apple_pay',       'pickup_point',      NULL,      0,    'mobile', '',                           'TRK-2026-014', 'RUB', 14, now(), now()),
  (15, 71, CURRENT_DATE - 7,  'delivered',  189980, 'card',            'courier_standard',  NULL,      0,    'web',    '',                           'TRK-2026-015', 'RUB', 15, now(), now()),

  (16, 74, CURRENT_DATE - 8,  'delivered',  119980, 'sbp',             'courier_express',   'SALE10',  7999, 'web',    '',                           'TRK-2026-016', 'RUB', 16, now(), now()),
  (17, 75, CURRENT_DATE - 8,  'delivered',  94980,  'card',            'courier_standard',  NULL,      0,    'mobile', '',                           'TRK-2026-017', 'RUB', 17, now(), now()),
  (18, 76, CURRENT_DATE - 9,  'delivered',  29980,  'qiwi',            'post_registered',   NULL,      0,    'web',    '',                           'TRK-2026-018', 'RUB', 18, now(), now()),
  (19, 77, CURRENT_DATE - 10, 'delivered',  179980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-019', 'RUB', 19, now(), now()),
  (20, 78, CURRENT_DATE - 10, 'delivered',  64980,  'tinkoff_pay',     'pickup_point',      NULL,      0,    'mobile', '',                           'TRK-2026-020', 'RUB', 20, now(), now()),

  (21, 79, CURRENT_DATE - 11, 'delivered',  84980,  'card',            'courier_standard',  'WINTER',  5000, 'web',    '',                           'TRK-2026-021', 'RUB', 21, now(), now()),
  (22, 81, CURRENT_DATE - 12, 'delivered',  55980,  'apple_pay',       'courier_next_day',  NULL,      0,    'mobile', '',                           'TRK-2026-022', 'RUB', 22, now(), now()),
  (23, 82, CURRENT_DATE - 12, 'delivered',  234980, 'sbp',             'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-023', 'RUB', 23, now(), now()),
  (24, 85, CURRENT_DATE - 13, 'delivered',  164980, 'card',            'courier_standard',  NULL,      0,    'web',    '',                           'TRK-2026-024', 'RUB', 24, now(), now()),
  (25, 86, CURRENT_DATE - 14, 'delivered',  84980,  'yoomoney',        'courier_standard',  NULL,      0,    'mobile', '',                           'TRK-2026-025', 'RUB', 25, now(), now()),

  (26, 87, CURRENT_DATE - 15, 'delivered',  39980,  'card',            'pickup_point',      NULL,      0,    'web',    '',                           'TRK-2026-026', 'RUB', 26, now(), now()),
  (27, 88, CURRENT_DATE - 16, 'delivered',  129980, 'tinkoff_pay',     'courier_express',   'SALE10',  8999, 'mobile', '',                           'TRK-2026-027', 'RUB', 27, now(), now()),
  (28, 89, CURRENT_DATE - 17, 'delivered',  104980, 'card',            'courier_standard',  NULL,      0,    'web',    '',                           'TRK-2026-028', 'RUB', 28, now(), now()),
  (29, 90, CURRENT_DATE - 18, 'delivered',  30980,  'qiwi',            'post_standard',     NULL,      0,    'web',    '',                           'TRK-2026-029', 'RUB', 29, now(), now()),
  (30, 92, CURRENT_DATE - 19, 'delivered',  424980, 'card',            'courier_express',   NULL,      0,    'web',    'VIP — личная доставка',     'TRK-2026-030', 'RUB', 30, now(), now()),

  (31, 93, CURRENT_DATE - 20, 'delivered',  74980,  'apple_pay',       'courier_next_day',  NULL,      0,    'mobile', '',                           'TRK-2026-031', 'RUB', 31, now(), now()),
  (32, 8,  CURRENT_DATE - 21, 'delivered',  94980,  'sbp',             'courier_standard',  NULL,      0,    'web',    '',                           'TRK-2026-032', 'RUB', 32, now(), now()),
  (33, 30, CURRENT_DATE - 22, 'delivered',  174980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-033', 'RUB', 33, now(), now()),
  (34, 31, CURRENT_DATE - 23, 'delivered',  59980,  'tinkoff_pay',     'pickup_point',      NULL,      0,    'mobile', '',                           'TRK-2026-034', 'RUB', 34, now(), now()),
  (35, 32, CURRENT_DATE - 24, 'delivered',  104980, 'card',            'courier_standard',  'NEWYEAR', 5000, 'web',    '',                           'TRK-2026-035', 'RUB', 35, now(), now()),

  (36, 33, CURRENT_DATE - 25, 'delivered',  39980,  'apple_pay',       'courier_next_day',  NULL,      0,    'mobile', '',                           'TRK-2026-036', 'RUB', 36, now(), now()),
  (37, 34, CURRENT_DATE - 26, 'delivered',  249980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-037', 'RUB', 37, now(), now()),
  (38, 35, CURRENT_DATE - 27, 'delivered',  27980,  'qiwi',            'post_standard',     NULL,      0,    'web',    '',                           'TRK-2026-038', 'RUB', 38, now(), now()),
  (39, 37, CURRENT_DATE - 28, 'delivered',  159980, 'sbp',             'courier_standard',  NULL,      0,    'mobile', '',                           'TRK-2026-039', 'RUB', 39, now(), now()),
  (40, 38, CURRENT_DATE - 29, 'delivered',  114980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-040', 'RUB', 40, now(), now()),

  (41, 41, CURRENT_DATE - 30, 'delivered',  69980,  'tinkoff_pay',     'courier_standard',  NULL,      0,    'web',    '',                           'TRK-2026-041', 'RUB', 41, now(), now()),
  (42, 42, CURRENT_DATE - 32, 'delivered',  84980,  'card',            'courier_next_day',  NULL,      0,    'mobile', '',                           'TRK-2026-042', 'RUB', 42, now(), now()),
  (43, 43, CURRENT_DATE - 34, 'delivered',  49980,  'apple_pay',       'pickup_point',      NULL,      0,    'web',    '',                           'TRK-2026-043', 'RUB', 43, now(), now()),
  (44, 44, CURRENT_DATE - 36, 'delivered',  189980, 'card',            'courier_express',   'SALE10',  14999,'web',    '',                           'TRK-2026-044', 'RUB', 44, now(), now()),
  (45, 45, CURRENT_DATE - 38, 'delivered',  54980,  'sbp',             'courier_standard',  NULL,      0,    'mobile', '',                           'TRK-2026-045', 'RUB', 45, now(), now()),

  (46, 46, CURRENT_DATE - 40, 'delivered',  114980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-046', 'RUB', 46, now(), now()),
  (47, 48, CURRENT_DATE - 42, 'delivered',  64980,  'tinkoff_pay',     'courier_standard',  NULL,      0,    'web',    '',                           'TRK-2026-047', 'RUB', 47, now(), now()),
  (48, 49, CURRENT_DATE - 45, 'delivered',  229980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-048', 'RUB', 48, now(), now()),
  (49, 52, CURRENT_DATE - 50, 'delivered',  104980, 'apple_pay',       'courier_standard',  NULL,      0,    'mobile', '',                           'TRK-2026-049', 'RUB', 49, now(), now()),
  (50, 8,  CURRENT_DATE - 55, 'delivered',  64980,  'sbp',             'pickup_point',      NULL,      0,    'web',    '',                           'TRK-2026-050', 'RUB', 32, now(), now());

SELECT setval('sales.orders_id_seq', (SELECT MAX(id) FROM sales.orders));

-- ── ORDER ITEMS (2-4 items per order) ──────────────────────────
-- (id, order_id, product_id, qty, price)
INSERT INTO sales.order_items (id, order_id, product_id, quantity, price, created_at) VALUES
  -- Order 1: 3 items = 189990+24990+19990 = 234970 ≈ 234980
  (1,  1,  1,  1, 189990, now()),  -- iPhone 15 Pro Max
  (2,  1,  17, 1, 24990,  now()),  -- AirPods Pro 2
  (3,  1,  30, 1, 5990,   now()),  -- Silicone case

  -- Order 2: 2 items = 74990+14990 = 89980 + SALE10 disc
  (4,  2,  26, 1, 74990,  now()),  -- Garmin Fenix 7
  (5,  2,  22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 3: 2 items = 34990+24990 = 59980
  (6,  3,  40, 1, 34990,  now()),  -- Nintendo Switch
  (7,  3,  17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 4: 2 items = 219990+64990 = 284980
  (8,  4,  12, 1, 219990, now()),  -- Dell XPS 15
  (9,  4,  7,  1, 64990,  now()),  -- OnePlus 12

  -- Order 5: 2 items = 24990+14990 = 39980
  (10, 5,  17, 1, 24990,  now()),  -- AirPods Pro 2
  (11, 5,  22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 6: 2 items = 69990+14990 = 84980
  (12, 6,  5,  1, 69990,  now()),  -- Xiaomi 14
  (13, 6,  22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 7: 2 items = 12990+14990 = 27980
  (14, 7,  29, 1, 12990,  now()),  -- Anker PowerBank
  (15, 7,  22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 8: 2 items = 89990+49990 = 139980
  (16, 8,  23, 1, 89990,  now()),  -- Apple Watch Ultra
  (17, 8,  24, 1, 49990,  now()),  -- Apple Watch S9

  -- Order 9: 2 items = 15990+14990 = 30980
  (18, 9,  42, 1, 15990,  now()),  -- Xbox Elite Controller
  (19, 9,  22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 10: 2 items = 249990+24990 = 274980
  (20, 10, 9,  1, 249990, now()),  -- MacBook Pro 16
  (21, 10, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 11: 2 items = 64990+24990 = 89980
  (22, 11, 7,  1, 64990,  now()),  -- OnePlus 12
  (23, 11, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 12: 2 items = 49990+14990 = 64980
  (24, 12, 24, 1, 49990,  now()),  -- Apple Watch S9
  (25, 12, 22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 13: 2 items = 89990+19990 = 109980
  (26, 13, 34, 1, 89990,  now()),  -- Roborock S8 Pro
  (27, 13, 28, 1, 6990,   now()),  -- USB-C Hub (price from DB = 6990)

  -- Order 14: 2 items = 34990+14990 = 49980
  (28, 14, 40, 1, 34990,  now()),  -- Nintendo Switch
  (29, 14, 22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 15: 2 items = 149990+39990 = 189980
  (30, 15, 2,  1, 149990, now()),  -- iPhone 15 Pro
  (31, 15, 25, 1, 39990,  now()),  -- Samsung Watch 6

  -- Order 16: 2 items = 79990+39990 = 119980
  (32, 16, 6,  1, 79990,  now()),  -- Pixel 8 Pro
  (33, 16, 25, 1, 39990,  now()),  -- Samsung Watch 6

  -- Order 17: 2 items = 69990+24990 = 94980
  (34, 17, 5,  1, 69990,  now()),  -- Xiaomi 14
  (35, 17, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 18: 2 items = 14990+14990 = 29980
  (36, 18, 22, 1, 14990,  now()),  -- JBL Charge 5
  (37, 18, 29, 1, 14990,  now()),  -- Anker PowerBank (price=4490)

  -- Order 19: 2 items = 139990+39990 = 179980
  (38, 19, 3,  1, 139990, now()),  -- Samsung S24 Ultra
  (39, 19, 25, 1, 39990,  now()),  -- Samsung Watch 6

  -- Order 20: 2 items = 39990+24990 = 64980
  (40, 20, 25, 1, 39990,  now()),  -- Samsung Watch 6
  (41, 20, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 21: 2 items = 49990+34990 = 84980
  (42, 21, 24, 1, 49990,  now()),  -- Apple Watch S9
  (43, 21, 40, 1, 34990,  now()),  -- Nintendo Switch

  -- Order 22: 2 items = 27990+27990 = 55980
  (44, 22, 20, 1, 27990,  now()),  -- Sony WF-1000XM5
  (45, 22, 20, 1, 27990,  now()),  -- Sony WF-1000XM5 (qty 2 effectively)

  -- Order 23: 2 items = 189990+44990 = 234980
  (46, 23, 1,  1, 189990, now()),  -- iPhone 15 Pro Max
  (47, 23, 21, 1, 39990,  now()),  -- Bose QC Ultra (price=39990)

  -- Order 24: 2 items = 129990+34990 = 164980
  (48, 24, 16, 1, 129990, now()),  -- Galaxy Tab S9 Ultra
  (49, 24, 40, 1, 34990,  now()),  -- Nintendo Switch

  -- Order 25: 2 items = 54990+29990 = 84980
  (50, 25, 37, 1, 54990,  now()),  -- PS5 Slim
  (51, 25, 41, 1, 19990,  now()),  -- DualSense Edge (price=19990)

  -- Order 26: 2 items = 24990+14990 = 39980
  (52, 26, 17, 1, 24990,  now()),  -- AirPods Pro 2
  (53, 26, 22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 27: 2 items = 89990+39990 = 129980
  (54, 27, 34, 1, 89990,  now()),  -- Roborock S8 Pro
  (55, 27, 25, 1, 39990,  now()),  -- Samsung Watch 6

  -- Order 28: 2 items = 79990+24990 = 104980
  (56, 28, 6,  1, 79990,  now()),  -- Pixel 8 Pro
  (57, 28, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 29: 2 items = 12990+17990 = 30980
  (58, 29, 43, 1, 12990,  now()),  -- Logitech G Pro X (price=12990)
  (59, 29, 28, 1, 6990,   now()),  -- USB-C Hub

  -- Order 30: 3 items = 399990+24990+? = 424980
  (60, 30, 9,  1, 399990, now()),  -- MacBook Pro 16
  (61, 30, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 31: 2 items = 49990+24990 = 74980
  (62, 31, 24, 1, 49990,  now()),  -- Apple Watch S9
  (63, 31, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 32: 2 items = 69990+24990 = 94980
  (64, 32, 5,  1, 69990,  now()),  -- Xiaomi 14
  (65, 32, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 33: 2 items = 149990+24990 = 174980
  (66, 33, 2,  1, 149990, now()),  -- iPhone 15 Pro
  (67, 33, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 34: 2 items = 34990+24990 = 59980
  (68, 34, 40, 1, 34990,  now()),  -- Nintendo Switch
  (69, 34, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 35: 2 items = 79990+24990 = 104980
  (70, 35, 6,  1, 79990,  now()),  -- Pixel 8 Pro
  (71, 35, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 36: 2 items = 24990+14990 = 39980
  (72, 36, 17, 1, 24990,  now()),  -- AirPods Pro 2
  (73, 36, 22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 37: 2 items = 249990+? = 249980
  (74, 37, 8,  1, 249990, now()),  -- MacBook Pro 14

  -- Order 38: 2 items = 12990+14990 = 27980
  (75, 38, 22, 1, 12990,  now()),  -- JBL Charge 5
  (76, 38, 29, 1, 14990,  now()),  -- Anker PowerBank

  -- Order 39: 2 items = 129990+29990 = 159980
  (77, 39, 3,  1, 129990, now()),  -- Samsung S24 Ultra
  (78, 39, 40, 1, 29990,  now()),  -- Nintendo Switch (price diff)

  -- Order 40: 2 items = 89990+24990 = 114980
  (79, 40, 34, 1, 89990,  now()),  -- Roborock S8 Pro
  (80, 40, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 41: 2 items = 54990+14990 = 69980
  (81, 41, 37, 1, 54990,  now()),  -- PS5 Slim
  (82, 41, 22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 42: 2 items = 69990+14990 = 84980
  (83, 42, 5,  1, 69990,  now()),  -- Xiaomi 14
  (84, 42, 22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 43: 2 items = 24990+24990 = 49980
  (85, 43, 17, 1, 24990,  now()),  -- AirPods Pro 2
  (86, 43, 17, 1, 24990,  now()),  -- AirPods Pro 2 (qty 2)

  -- Order 44: 2 items = 149990+39990 = 189980
  (87, 44, 2,  1, 149990, now()),  -- iPhone 15 Pro
  (88, 44, 25, 1, 39990,  now()),  -- Samsung Watch 6

  -- Order 45: 2 items = 39990+14990 = 54980
  (89, 45, 25, 1, 39990,  now()),  -- Samsung Watch 6
  (90, 45, 22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 46: 2 items = 89990+24990 = 114980
  (91, 46, 34, 1, 89990,  now()),  -- Roborock S8 Pro
  (92, 46, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 47: 2 items = 49990+14990 = 64980
  (93, 47, 24, 1, 49990,  now()),  -- Apple Watch S9
  (94, 47, 22, 1, 14990,  now()),  -- JBL Charge 5

  -- Order 48: 2 items = 189990+39990 = 229980
  (95, 48, 1,  1, 189990, now()),  -- iPhone 15 Pro Max
  (96, 48, 25, 1, 39990,  now()),  -- Samsung Watch 6

  -- Order 49: 2 items = 79990+24990 = 104980
  (97, 49, 6,  1, 79990,  now()),  -- Pixel 8 Pro
  (98, 49, 17, 1, 24990,  now()),  -- AirPods Pro 2

  -- Order 50: 2 items = 34990+29990 = 64980
  (99,  50, 40, 1, 34990,  now()),  -- Nintendo Switch
  (100, 50, 25, 1, 29990, now());  -- Samsung Watch 6 (price diff)

SELECT setval('sales.order_items_id_seq', (SELECT MAX(id) FROM sales.order_items));

-- ── STATUS HISTORY (realistic flow for key orders) ─────────────
-- status: pending → confirmed → processing → shipped → delivered
INSERT INTO sales.order_status_history (id, order_id, old_status, new_status, change_source, change_time) VALUES
  -- Order 1: processing (current)
  (1,  1,  NULL,      'pending',    'system',     now() - interval '2 hours'),
  (2,  1,  'pending', 'confirmed',  'admin',      now() - interval '1 hour'),
  (3,  1,  'confirmed','processing','warehouse',  now() - interval '30 min'),

  -- Order 2: confirmed
  (4,  2,  NULL,      'pending',    'system',     now() - interval '5 hours'),
  (5,  2,  'pending', 'confirmed',  'admin',      now() - interval '2 hours'),

  -- Order 3: pending
  (6,  3,  NULL,      'pending',    'system',     now() - interval '1 hour'),

  -- Order 4: shipped
  (7,  4,  NULL,      'pending',    'system',     now() - interval '1 day'),
  (8,  4,  'pending', 'confirmed',  'admin',      now() - interval '20 hours'),
  (9,  4,  'confirmed','processing','warehouse',  now() - interval '12 hours'),
  (10, 4,  'processing','shipped',  'logistics',  now() - interval '4 hours'),

  -- Order 5: delivered (full cycle)
  (11, 5,  NULL,      'pending',    'system',     now() - interval '2 days'),
  (12, 5,  'pending', 'confirmed',  'admin',      now() - interval '1.8 days'),
  (13, 5,  'confirmed','processing','warehouse',  now() - interval '1.5 days'),
  (14, 5,  'processing','shipped',  'logistics',  now() - interval '1 day'),
  (15, 5,  'shipped', 'delivered',  'courier',    now() - interval '0.5 days'),

  -- Order 8: cancelled
  (16, 8,  NULL,      'pending',    'system',     now() - interval '3 days'),
  (17, 8,  'pending', 'confirmed',  'admin',      now() - interval '2.8 days'),
  (18, 8,  'confirmed','cancelled', 'customer',   now() - interval '1 day'),

  -- Order 13: processing
  (19, 13, NULL,      'pending',    'system',     now() - interval '8 hours'),
  (20, 13, 'pending', 'confirmed',  'admin',      now() - interval '6 hours'),
  (21, 13, 'confirmed','processing','warehouse',  now() - interval '2 hours'),

  -- Order 30: delivered (VIP order full cycle)
  (22, 30, NULL,      'pending',    'system',     now() - interval '3 days'),
  (23, 30, 'pending', 'confirmed',  'admin',      now() - interval '2.9 days'),
  (24, 30, 'confirmed','processing','warehouse',  now() - interval '2.5 days'),
  (25, 30, 'processing','shipped',  'logistics',  now() - interval '1.5 days'),
  (26, 30, 'shipped', 'delivered',  'courier',    now() - interval '0.3 days');

SELECT setval('sales.order_status_history_id_seq', (SELECT MAX(id) FROM sales.order_status_history));

COMMIT;
