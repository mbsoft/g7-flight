

DO $$
    BEGIN
        BEGIN
            ALTER TABLE travelers ADD COLUMN processed boolean;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column processed already exists in travelers table - ALTER not performed';
        END;
    END;
$$;
UPDATE travelers SET processed = false;
