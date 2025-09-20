-- Custom holidays table for manual/override holidays and special events
CREATE TABLE IF NOT EXISTS custom_holidays (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT
);
