-- Seed orders with multi-items + addresses linked
BEGIN;

DELETE FROM sales.order_status_history;
DELETE FROM sales.order_items;
DELETE FROM sales.orders;
ALTER SEQUENCE sales.orders_id_seq RESTART WITH 1;
ALTER SEQUENCE sales.order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE sales.order_status_history_id_seq RESTART WITH 1;

-- Orders: (id, user_id, days_ago, status, total, payment, delivery, promo, discount, channel, comment, tracking, addr_id)
INSERT INTO sales.orders (id, user_id, order_date, status, total_amount, payment_method_code, delivery_type_code, promo_code, discount_amount, source_channel, comments, tracking_number, currency_code, address_id, created_at, updated_at)
SELECT
  id_val, user_val, CURRENT_DATE - days_ago, status_val, total_val,
  pay_val, del_val, promo_val, disc_val, ch_val, comment_val, trk_val,
  'RUB', addr_val, now(), now()
FROM (VALUES
  (1,  53, 0,  'processing', 234980, 'card',            'courier_express',   NULL,      0,    'web',    'Доставка с 10:00 до 14:00',   'TRK-2026-001', 1),
  (2,  54, 1,  'confirmed',  94980,  'tinkoff_pay',     'courier_standard',  'SALE10',  7499, 'mobile', '',                          'TRK-2026-002', 2),
  (3,  55, 1,  'pending',    59980,  'apple_pay',       'pickup_point',      NULL,      0,    'web',    'Пункт выдачи ТЦ Мега',       'TRK-2026-003', 3),
  (4,  56, 2,  'shipped',    284980, 'sbp',             'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-004', 4),
  (5,  57, 2,  'delivered',  39980,  'card',            'courier_standard',  NULL,      0,    'mobile', 'Оставить у двери',           'TRK-2026-005', 5),
  (6,  59, 3,  'delivered',  84980,  'sberbank_online', 'courier_next_day',  'WINTER',  5000, 'web',    '',                           'TRK-2026-006', 6),
  (7,  60, 3,  'delivered',  27980,  'yoomoney',        'pickup_point',      NULL,      0,    'mobile', 'Самовывоз',                  'TRK-2026-007', 7),
  (8,  63, 4,  'cancelled',  139980, 'card',            'courier_standard',  NULL,      0,    'web',    'Клиент отменил — передумал', NULL,           8),
  (9,  64, 4,  'delivered',  30980,  'qiwi',            'post_standard',     NULL,      0,    'mobile', '',                           'TRK-2026-009', 9),
  (10, 65, 5,  'delivered',  274980, 'card',            'courier_express',   NULL,      0,    'web',    'Подарочная упаковка',        'TRK-2026-010', 10),
  (11, 66, 5,  'delivered',  89980,  'sbp',             'courier_standard',  'NEWYEAR', 3000, 'web',    '',                           'TRK-2026-011', 11),
  (12, 67, 6,  'delivered',  64980,  'tinkoff_pay',     'courier_next_day',  NULL,      0,    'mobile', '',                           'TRK-2026-012', 12),
  (13, 68, 6,  'processing', 109980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-013', 13),
  (14, 70, 7,  'delivered',  49980,  'apple_pay',       'pickup_point',      NULL,      0,    'mobile', '',                           'TRK-2026-014', 14),
  (15, 71, 7,  'delivered',  189980, 'card',            'courier_standard',  NULL,      0,    'web',    '',                           'TRK-2026-015', 15),
  (16, 74, 8,  'delivered',  119980, 'sbp',             'courier_express',   'SALE10',  7999, 'web',    '',                           'TRK-2026-016', 16),
  (17, 75, 8,  'delivered',  94980,  'card',            'courier_standard',  NULL,      0,    'mobile', '',                           'TRK-2026-017', 17),
  (18, 76, 9,  'delivered',  29980,  'qiwi',            'post_registered',   NULL,      0,    'web',    '',                           'TRK-2026-018', 18),
  (19, 77, 10, 'delivered',  179980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-019', 19),
  (20, 78, 10, 'delivered',  64980,  'tinkoff_pay',     'pickup_point',      NULL,      0,    'mobile', '',                           'TRK-2026-020', 20),
  (21, 79, 11, 'delivered',  84980,  'card',            'courier_standard',  'WINTER',  5000, 'web',    '',                           'TRK-2026-021', 21),
  (22, 81, 12, 'delivered',  55980,  'apple_pay',       'courier_next_day',  NULL,      0,    'mobile', '',                           'TRK-2026-022', 22),
  (23, 82, 12, 'delivered',  234980, 'sbp',             'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-023', 23),
  (24, 85, 13, 'delivered',  164980, 'card',            'courier_standard',  NULL,      0,    'web',    '',                           'TRK-2026-024', 24),
  (25, 86, 14, 'delivered',  84980,  'yoomoney',        'courier_standard',  NULL,      0,    'mobile', '',                           'TRK-2026-025', 25),
  (26, 87, 15, 'delivered',  39980,  'card',            'pickup_point',      NULL,      0,    'web',    '',                           'TRK-2026-026', 26),
  (27, 88, 16, 'delivered',  129980, 'tinkoff_pay',     'courier_express',   'SALE10',  8999, 'mobile', '',                           'TRK-2026-027', 27),
  (28, 89, 17, 'delivered',  104980, 'card',            'courier_standard',  NULL,      0,    'web',    '',                           'TRK-2026-028', 28),
  (29, 90, 18, 'delivered',  30980,  'qiwi',            'post_standard',     NULL,      0,    'web',    '',                           'TRK-2026-029', 29),
  (30, 92, 19, 'delivered',  424980, 'card',            'courier_express',   NULL,      0,    'web',    'VIP — личная доставка',     'TRK-2026-030', 30),
  (31, 93, 20, 'delivered',  74980,  'apple_pay',       'courier_next_day',  NULL,      0,    'mobile', '',                           'TRK-2026-031', 31),
  (32, 8,  21, 'delivered',  94980,  'sbp',             'courier_standard',  NULL,      0,    'web',    '',                           'TRK-2026-032', 32),
  (33, 30, 22, 'delivered',  174980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-033', 33),
  (34, 31, 23, 'delivered',  59980,  'tinkoff_pay',     'pickup_point',      NULL,      0,    'mobile', '',                           'TRK-2026-034', 34),
  (35, 32, 24, 'delivered',  104980, 'card',            'courier_standard',  'NEWYEAR', 5000, 'web',    '',                           'TRK-2026-035', 35),
  (36, 33, 25, 'delivered',  39980,  'apple_pay',       'courier_next_day',  NULL,      0,    'mobile', '',                           'TRK-2026-036', 36),
  (37, 34, 26, 'delivered',  249980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-037', 37),
  (38, 35, 27, 'delivered',  27980,  'qiwi',            'post_standard',     NULL,      0,    'web',    '',                           'TRK-2026-038', 38),
  (39, 37, 28, 'delivered',  159980, 'sbp',             'courier_standard',  NULL,      0,    'mobile', '',                           'TRK-2026-039', 39),
  (40, 38, 29, 'delivered',  114980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-040', 40),
  (41, 41, 30, 'delivered',  69980,  'tinkoff_pay',     'courier_standard',  NULL,      0,    'web',    '',                           'TRK-2026-041', 41),
  (42, 42, 32, 'delivered',  84980,  'card',            'courier_next_day',  NULL,      0,    'mobile', '',                           'TRK-2026-042', 42),
  (43, 43, 34, 'delivered',  49980,  'apple_pay',       'pickup_point',      NULL,      0,    'web',    '',                           'TRK-2026-043', 43),
  (44, 44, 36, 'delivered',  189980, 'card',            'courier_express',   'SALE10',  14999,'web',    '',                           'TRK-2026-044', 44),
  (45, 45, 38, 'delivered',  54980,  'sbp',             'courier_standard',  NULL,      0,    'mobile', '',                           'TRK-2026-045', 45),
  (46, 46, 40, 'delivered',  114980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-046', 46),
  (47, 48, 42, 'delivered',  64980,  'tinkoff_pay',     'courier_standard',  NULL,      0,    'web',    '',                           'TRK-2026-047', 47),
  (48, 49, 45, 'delivered',  229980, 'card',            'courier_express',   NULL,      0,    'web',    '',                           'TRK-2026-048', 48),
  (49, 52, 50, 'delivered',  104980, 'apple_pay',       'courier_standard',  NULL,      0,    'mobile', '',                           'TRK-2026-049', 49),
  (50, 8,  55, 'delivered',  64980,  'sbp',             'pickup_point',      NULL,      0,    'web',    '',                           'TRK-2026-050', 32)
) AS t(id_val, user_val, days_ago, status_val, total_val, pay_val, del_val, promo_val, disc_val, ch_val, comment_val, trk_val, addr_val);

SELECT setval('sales.orders_id_seq', (SELECT MAX(id) FROM sales.orders));

-- Order items (id, order_id, product_id, qty, price)
-- Multi-item orders: 2-3 items each
INSERT INTO sales.order_items (id, order_id, product_id, quantity, price, created_at) VALUES
  (1,  1,  1,  1, 189990, now()),  (2,  1,  17, 1, 24990,  now()),  (3,  1,  30, 1, 5990,   now()),
  (4,  2,  26, 1, 74990,  now()),  (5,  2,  22, 1, 14990,  now()),
  (6,  3,  40, 1, 34990,  now()),  (7,  3,  17, 1, 24990,  now()),
  (8,  4,  12, 1, 219990, now()),  (9,  4,  7,  1, 64990,  now()),
  (10, 5,  17, 1, 24990,  now()),  (11, 5,  22, 1, 14990,  now()),
  (12, 6,  5,  1, 69990,  now()),  (13, 6,  22, 1, 14990,  now()),
  (14, 7,  29, 1, 12990,  now()),  (15, 7,  22, 1, 14990,  now()),
  (16, 8,  23, 1, 89990,  now()),  (17, 8,  24, 1, 49990,  now()),
  (18, 9,  42, 1, 15990,  now()),  (19, 9,  22, 1, 14990,  now()),
  (20, 10, 9,  1, 249990, now()),  (21, 10, 17, 1, 24990,  now()),
  (22, 11, 7,  1, 64990,  now()),  (23, 11, 17, 1, 24990,  now()),
  (24, 12, 24, 1, 49990,  now()),  (25, 12, 22, 1, 14990,  now()),
  (26, 13, 34, 1, 89990,  now()),  (27, 13, 28, 1, 6990,   now()),
  (28, 14, 40, 1, 34990,  now()),  (29, 14, 22, 1, 14990,  now()),
  (30, 15, 2,  1, 149990, now()),  (31, 15, 25, 1, 39990,  now()),
  (32, 16, 6,  1, 79990,  now()),  (33, 16, 25, 1, 39990,  now()),
  (34, 17, 5,  1, 69990,  now()),  (35, 17, 17, 1, 24990,  now()),
  (36, 18, 22, 1, 14990,  now()),  (37, 18, 29, 1, 4490,   now()),
  (38, 19, 3,  1, 139990, now()),  (39, 19, 25, 1, 39990,  now()),
  (40, 20, 25, 1, 39990,  now()),  (41, 20, 17, 1, 24990,  now()),
  (42, 21, 24, 1, 49990,  now()),  (43, 21, 40, 1, 34990,  now()),
  (44, 22, 20, 1, 27990,  now()),  (45, 22, 41, 1, 19990,  now()),
  (46, 23, 1,  1, 189990, now()),  (47, 23, 21, 1, 39990,  now()),
  (48, 24, 16, 1, 129990, now()),  (49, 24, 40, 1, 34990,  now()),
  (50, 25, 37, 1, 54990,  now()),  (51, 25, 41, 1, 19990,  now()),
  (52, 26, 17, 1, 24990,  now()),  (53, 26, 22, 1, 14990,  now()),
  (54, 27, 34, 1, 89990,  now()),  (55, 27, 25, 1, 39990,  now()),
  (56, 28, 6,  1, 79990,  now()),  (57, 28, 17, 1, 24990,  now()),
  (58, 29, 43, 1, 12990,  now()),  (59, 29, 28, 1, 6990,   now()),
  (60, 30, 9,  1, 399990, now()),  (61, 30, 17, 1, 24990,  now()),
  (62, 31, 24, 1, 49990,  now()),  (63, 31, 17, 1, 24990,  now()),
  (64, 32, 5,  1, 69990,  now()),  (65, 32, 17, 1, 24990,  now()),
  (66, 33, 2,  1, 149990, now()),  (67, 33, 17, 1, 24990,  now()),
  (68, 34, 40, 1, 34990,  now()),  (69, 34, 17, 1, 24990,  now()),
  (70, 35, 6,  1, 79990,  now()),  (71, 35, 17, 1, 24990,  now()),
  (72, 36, 17, 1, 24990,  now()),  (73, 36, 22, 1, 14990,  now()),
  (74, 37, 8,  1, 249990, now()),
  (75, 38, 22, 1, 12990,  now()),  (76, 38, 29, 1, 4490,   now()),
  (77, 39, 3,  1, 129990, now()),  (78, 39, 40, 1, 29990,  now()),
  (79, 40, 34, 1, 89990,  now()),  (80, 40, 17, 1, 24990,  now()),
  (81, 41, 37, 1, 54990,  now()),  (82, 41, 22, 1, 14990,  now()),
  (83, 42, 5,  1, 69990,  now()),  (84, 42, 22, 1, 14990,  now()),
  (85, 43, 17, 1, 24990,  now()),  (86, 43, 17, 1, 24990,  now()),
  (87, 44, 2,  1, 149990, now()),  (88, 44, 25, 1, 39990,  now()),
  (89, 45, 25, 1, 39990,  now()),  (90, 45, 22, 1, 14990,  now()),
  (91, 46, 34, 1, 89990,  now()),  (92, 46, 17, 1, 24990,  now()),
  (93, 47, 24, 1, 49990,  now()),  (94, 47, 22, 1, 14990,  now()),
  (95, 48, 1,  1, 189990, now()),  (96, 48, 25, 1, 39990,  now()),
  (97, 49, 6,  1, 79990,  now()),  (98, 49, 17, 1, 24990,  now()),
  (99,  50, 40, 1, 34990,  now()),  (100, 50, 25, 1, 29990, now());

SELECT setval('sales.order_items_id_seq', (SELECT MAX(id) FROM sales.order_items));

-- Status history
INSERT INTO sales.order_status_history (id, order_id, old_status, new_status, change_source, change_time) VALUES
  (1,  1,  NULL,       'pending',     'system',     now() - interval '2 hours'),
  (2,  1,  'pending',  'confirmed',   'admin',      now() - interval '1 hour'),
  (3,  1,  'confirmed','processing',  'warehouse',  now() - interval '30 min'),
  (4,  2,  NULL,       'pending',     'system',     now() - interval '5 hours'),
  (5,  2,  'pending',  'confirmed',   'admin',      now() - interval '2 hours'),
  (6,  3,  NULL,       'pending',     'system',     now() - interval '1 hour'),
  (7,  4,  NULL,       'pending',     'system',     now() - interval '1 day'),
  (8,  4,  'pending',  'confirmed',   'admin',      now() - interval '20 hours'),
  (9,  4,  'confirmed','processing',  'warehouse',  now() - interval '12 hours'),
  (10, 4,  'processing','shipped',    'logistics',  now() - interval '4 hours'),
  (11, 5,  NULL,       'pending',     'system',     now() - interval '2 days'),
  (12, 5,  'pending',  'confirmed',   'admin',      now() - interval '1.8 days'),
  (13, 5,  'confirmed','processing',  'warehouse',  now() - interval '1.5 days'),
  (14, 5,  'processing','shipped',    'logistics',  now() - interval '1 day'),
  (15, 5,  'shipped',  'delivered',   'courier',    now() - interval '0.5 days'),
  (16, 8,  NULL,       'pending',     'system',     now() - interval '3 days'),
  (17, 8,  'pending',  'confirmed',   'admin',      now() - interval '2.8 days'),
  (18, 8,  'confirmed','cancelled',   'customer',   now() - interval '1 day'),
  (19, 13, NULL,       'pending',     'system',     now() - interval '8 hours'),
  (20, 13, 'pending',  'confirmed',   'admin',      now() - interval '6 hours'),
  (21, 13, 'confirmed','processing',  'warehouse',  now() - interval '2 hours'),
  (22, 30, NULL,       'pending',     'system',     now() - interval '3 days'),
  (23, 30, 'pending',  'confirmed',   'admin',      now() - interval '2.9 days'),
  (24, 30, 'confirmed','processing',  'warehouse',  now() - interval '2.5 days'),
  (25, 30, 'processing','shipped',    'logistics',  now() - interval '1.5 days'),
  (26, 30, 'shipped',  'delivered',   'courier',    now() - interval '0.3 days');

SELECT setval('sales.order_status_history_id_seq', (SELECT MAX(id) FROM sales.order_status_history));

COMMIT;
