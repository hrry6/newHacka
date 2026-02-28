CREATE EXTENSION IF NOT EXISTS "pgcrypto";
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS payment_type_enum;

CREATE TYPE payment_type_enum AS ENUM (
    'CREDIT',
    'DEBIT',
    'VA',
    'QRIS',
    'E_WALLET',
    'BANK TRANSFER'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    share_enabled BOOLEAN DEFAULT FALSE,
    share_id UUID UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(18,2) NOT NULL,
    payment_type payment_type_enum NOT NULL,
    message TEXT,
    encrypted_payload TEXT NOT NULL,
    cid VARCHAR(255),
    blockchain_tx_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (company_name, email, password, share_enabled)
VALUES
(
  'Nexora Dynamics',
  'contact@nexora.com',
  crypt('Secure123', gen_salt('bf')),
  TRUE
),
(
  'Velocita Systems',
  'finance@velocita.com',
  crypt('Secure123', gen_salt('bf')),
  TRUE
),
(
  'Quantaris Labs',
  'admin@quantaris.com',
  crypt('Secure123', gen_salt('bf')),
  FALSE
);

UPDATE users
SET share_id = gen_random_uuid()
WHERE share_enabled = TRUE;

INSERT INTO transactions 
(sender_id, receiver_id, amount, payment_type, message, encrypted_payload, cid, blockchain_tx_hash)
VALUES (
    (SELECT id FROM users WHERE company_name='Nexora Dynamics'),
    (SELECT id FROM users WHERE company_name='Velocita Systems'),
    50000000.00,
    'PROJECT_PAYMENT',
    'Strategic AI infrastructure collaboration',
    'ENC_LOOP_1_2',
    'QmLoopCID12',
    '0xLoopTx12'
);

INSERT INTO transactions 
(sender_id, receiver_id, amount, payment_type, message, encrypted_payload, cid, blockchain_tx_hash)
VALUES (
    (SELECT id FROM users WHERE company_name='Velocita Systems'),
    (SELECT id FROM users WHERE company_name='Quantaris Labs'),
    50250000.00,
    'PROJECT_PAYMENT',
    'Backend system optimization phase',
    'ENC_LOOP_2_3',
    'QmLoopCID23',
    '0xLoopTx23'
);

INSERT INTO transactions 
(sender_id, receiver_id, amount, payment_type, message, encrypted_payload, cid, blockchain_tx_hash)
VALUES (
    (SELECT id FROM users WHERE company_name='Quantaris Labs'),
    (SELECT id FROM users WHERE company_name='Nexora Dynamics'),
    49875000.00,
    'PROJECT_PAYMENT',
    'Infrastructure licensing settlement',
    'ENC_LOOP_3_1',
    'QmLoopCID31',
    '0xLoopTx31'
);

INSERT INTO transactions 
(sender_id, receiver_id, amount, payment_type, message, encrypted_payload, cid, blockchain_tx_hash)
SELECT 
u1.id,
u2.id,
(10000000 + random()*20000000)::numeric(18,2),
'TRANSFER',
'Operational fund allocation #' || generate_series,
'ENC_RANDOM_NEX_' || generate_series,
'QmRandNex' || generate_series,
'0xRandNex' || generate_series
FROM users u1, users u2, generate_series(1,9)
WHERE u1.company_name='Nexora Dynamics'
AND u2.company_name='Velocita Systems';

INSERT INTO transactions 
(sender_id, receiver_id, amount, payment_type, message, encrypted_payload, cid, blockchain_tx_hash)
SELECT 
u1.id,
u2.id,
(20000000 + random()*15000000)::numeric(18,2),
'INVOICE',
'Quarterly system maintenance invoice #' || generate_series,
'ENC_RANDOM_VEL_' || generate_series,
'QmRandVel' || generate_series,
'0xRandVel' || generate_series
FROM users u1, users u2, generate_series(1,9)
WHERE u1.company_name='Velocita Systems'
AND u2.company_name='Nexora Dynamics';

INSERT INTO transactions 
(sender_id, receiver_id, amount, payment_type, message, encrypted_payload, cid, blockchain_tx_hash)
SELECT 
u1.id,
u2.id,
(30000000 + random()*10000000)::numeric(18,2),
'SUBSCRIPTION',
'Cloud analytics subscription #' || generate_series,
'ENC_RANDOM_QUA_' || generate_series,
'QmRandQua' || generate_series,
'0xRandQua' || generate_series
FROM users u1, users u2, generate_series(1,9)
WHERE u1.company_name='Quantaris Labs'
AND u2.company_name='Velocita Systems';