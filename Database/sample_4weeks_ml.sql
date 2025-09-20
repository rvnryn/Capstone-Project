-- Insert 4+ weeks of sales data for ML chart testing
-- Make sure matching order_id exists in orders table first!

-- Orders
INSERT INTO orders (order_id, total_amount, order_status, order_date, payment_status, payment_method, created_at, updated_at, customer_name, order_type, subtotal)
VALUES
(2001, 1200, 'Completed', NOW() - INTERVAL '28 days', 'Paid', 'Cash', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', 'Walk-in Customer', 'Dining', 1200),
(2002, 1040, 'Completed', NOW() - INTERVAL '21 days', 'Paid', 'Cash', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', 'Walk-in Customer', 'Dining', 1040),
(2003, 1440, 'Completed', NOW() - INTERVAL '14 days', 'Paid', 'Cash', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', 'Walk-in Customer', 'Dining', 1440),
(2004, 1170, 'Completed', NOW() - INTERVAL '7 days', 'Paid', 'Cash', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'Walk-in Customer', 'Dining', 1170);

-- Order Items
INSERT INTO order_items (order_id, item_name, category, quantity, price, unit_price, total_price, created_at)
VALUES
(2001, 'Chicken Adobo', 'Rice Toppings', 10, 120, 120, 1200, NOW() - INTERVAL '28 days'),
(2002, 'Pork Sisig', 'Sizzlers', 8, 130, 130, 1040, NOW() - INTERVAL '21 days'),
(2003, 'Chicken Adobo', 'Rice Toppings', 12, 120, 120, 1440, NOW() - INTERVAL '14 days'),
(2004, 'Pork Sisig', 'Sizzlers', 9, 130, 130, 1170, NOW() - INTERVAL '7 days');
