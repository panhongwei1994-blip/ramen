-- Migration to add payment_method to orders table
ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'card';
