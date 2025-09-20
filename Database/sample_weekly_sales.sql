-- Sample SQL to insert 4 weeks of sales data for ML testing
-- Adjust item_name/category as needed for your schema

INSERT INTO order_items (order_id, item_name, category, quantity, price, unit_price, total_price, created_at)
VALUES
-- Week 1 (4 weeks ago)
(1001, 'Chicken Adobo', 'Rice Toppings', 10, 120, 120, 1200, NOW() - INTERVAL '28 days'),
(1002, 'Pork Sisig', 'Sizzlers', 8, 130, 130, 1040, NOW() - INTERVAL '27 days'),
-- Week 2 (3 weeks ago)
(1003, 'Chicken Adobo', 'Rice Toppings', 12, 120, 120, 1440, NOW() - INTERVAL '21 days'),
(1004, 'Pork Sisig', 'Sizzlers', 9, 130, 130, 1170, NOW() - INTERVAL '20 days'),
-- Week 3 (2 weeks ago)
(1005, 'Chicken Adobo', 'Rice Toppings', 11, 120, 120, 1320, NOW() - INTERVAL '14 days'),
(1006, 'Pork Sisig', 'Sizzlers', 10, 130, 130, 1300, NOW() - INTERVAL '13 days'),
-- Week 4 (1 week ago)
(1007, 'Chicken Adobo', 'Rice Toppings', 13, 120, 120, 1560, NOW() - INTERVAL '7 days'),
(1008, 'Pork Sisig', 'Sizzlers', 7, 130, 130, 910, NOW() - INTERVAL '6 days');
